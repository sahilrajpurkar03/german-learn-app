import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("private chapter migration enforces ownership, upload reservations, and global quotas", async () => {
  const database = new PGlite();
  try {
    await database.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to authenticated, service_role;
      grant execute on function auth.uid() to authenticated, service_role;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text, owner_id text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated, service_role;
      grant select, insert on storage.objects to authenticated;
    `);
    await database.exec(await readFile(new URL("../../supabase/migrations/0004_personal_chapters.sql", import.meta.url), "utf8"));
    const users = Array.from({ length: 22 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`);
    for (const user of users) await database.query("insert into auth.users values ($1)", [user]);
    const chapterId = "10000000-0000-4000-8000-000000000001";
    await database.query("insert into personal_chapters(id,user_id,blueprint) values($1,$2,'{}')", [chapterId, users[0]]);
    await assert.rejects(() => database.query("insert into personal_chapter_progress(chapter_id,user_id,variant) values($1,$2,'original')", [chapterId, users[1]]), /foreign key/);
    await database.exec("set role authenticated");
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [users[1]]);
    assert.equal((await database.query("select * from personal_chapters")).rows.length, 0);
    await assert.rejects(() => database.query("insert into personal_chapters(id,user_id,blueprint) values(gen_random_uuid(),$1,'{}')", [users[1]]), /permission denied/);
    await assert.rejects(() => database.query("select reserve_personal_chapter_job($1,gen_random_uuid(),'generate',$2,null)", [users[1], "a".repeat(64)]), /permission denied/);
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [users[0]]);
    assert.equal((await database.query("select * from personal_chapters")).rows.length, 1);
    await database.exec("reset role; set role service_role");
    const jobId = "20000000-0000-4000-8000-000000000001";
    const reserve = async (user, job = crypto.randomUUID(), digest = "a".repeat(64)) =>
      (await database.query("select reserve_personal_chapter_job($1,$2,'transcribe',$3,'wav') as status", [user, job, digest])).rows[0].status;
    assert.equal(await reserve(users[0], jobId), "reserved");
    assert.equal(await reserve(users[0], jobId), "existing");
    assert.equal(await reserve(users[1], jobId), "conflict");
    assert.equal(await reserve(users[0]), "reserved");
    assert.equal(await reserve(users[0]), "user_limit");
    for (const user of users.slice(1, 19)) assert.equal(await reserve(user), "reserved");
    assert.equal(await reserve(users[20]), "global_limit");
    const path = `${users[0]}/${jobId}.wav`;
    await database.exec("reset role; set role authenticated");
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [users[1]]);
    await assert.rejects(() => database.query("insert into storage.objects(bucket_id,name) values('personal-chapter-audio',$1)", [path]), /row-level security/);
    await database.query("select set_config('request.jwt.claim.sub', $1, false)", [users[0]]);
    await database.query("insert into storage.objects(bucket_id,name) values('personal-chapter-audio',$1)", [path]);
    await assert.rejects(() => database.query("insert into storage.objects(bucket_id,name) values('personal-chapter-audio',$1)", [`${users[0]}/unreserved.wav`]), /row-level security/);
    await database.exec("reset role; set role service_role");
    await database.query("update personal_chapter_jobs set status='complete' where id=$1", [jobId]);
    await database.exec("reset role; set role authenticated");
    await assert.rejects(() => database.query("insert into storage.objects(bucket_id,name) values('personal-chapter-audio',$1)", [path]), /row-level security/);
  } finally {
    await database.close();
  }
});