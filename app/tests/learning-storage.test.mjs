import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const owner = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
    -- Supabase grants table privileges to these roles by default; the migration must take them back.
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  `);
  for (const file of ["0006_learning_v2.sql", "0007_push_reminders.sql"])
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8"));
  await db.query("insert into auth.users values ($1), ($2)", [owner, other]);
  return db;
}

async function as(db, user) {
  await db.exec("reset role; set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', 'authenticated', false)", [user]);
}

test("learners can read but never write their own XP, memory, streak or event log", async () => {
  const db = await database();
  try {
    await db.exec("set role service_role");
    await db.query("insert into learner_items(user_id,item_key) values ($1,'w.tee'), ($2,'w.kaffee')", [owner, other]);
    await db.query("insert into learner_stats(user_id,xp_total) values ($1, 40)", [owner]);
    await db.query("insert into daily_activity(user_id,local_date,xp) values ($1,'2026-09-01',40)", [owner]);
    await db.query("insert into lesson_progress(user_id,lesson_id,status) values ($1,'a1-u01-l1','completed')", [owner]);
    await db.query("insert into learning_events(attempt_id,user_id,run_id,lesson_id,step_id,exercise_type,verdict,occurred_at) values (gen_random_uuid(),$1,gen_random_uuid(),'a1-u01-l1','a1-u01-l1~match','match','correct',now())", [owner]);

    await as(db, owner);
    assert.deepEqual((await db.query("select item_key from learner_items")).rows, [{ item_key: "w.tee" }]);
    assert.equal((await db.query("select xp_total from learner_stats")).rows[0].xp_total, 40);
    assert.equal((await db.query("select * from learning_events")).rows.length, 1);
    for (const statement of [
      "update learner_stats set xp_total = 99999",
      "insert into learner_items(user_id,item_key) values ('" + owner + "','w.hack')",
      "update learner_items set strength = 1",
      "delete from learner_items",
      "insert into daily_activity(user_id,local_date,xp,goal_met) values ('" + owner + "','2026-09-02',500,true)",
      "update lesson_progress set status = 'completed'",
      "insert into learning_events(attempt_id,user_id,run_id,lesson_id,step_id,exercise_type,verdict,occurred_at) values (gen_random_uuid(),'" + owner + "',gen_random_uuid(),'x','x','type','correct',now())",
      "insert into push_subscriptions(user_id,endpoint,p256dh,auth) values ('" + owner + "','https://push.example/1','k','a')",
    ]) await assert.rejects(() => db.query(statement), /permission denied/, statement);

    await as(db, other);
    assert.deepEqual((await db.query("select item_key from learner_items")).rows, [{ item_key: "w.kaffee" }]);
    assert.equal((await db.query("select * from learner_stats")).rows.length, 0);
    assert.equal((await db.query("select * from learning_events")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("learners own their settings but cannot fake the legacy import marker", async () => {
  const db = await database();
  try {
    await as(db, owner);
    await db.query("insert into learner_settings(user_id,daily_goal_xp,timezone) values ($1,50,'Asia/Kolkata')", [owner]);
    await assert.rejects(() => db.query("insert into learner_settings(user_id) values ($1)", [other]), /row-level security/);
    await assert.rejects(() => db.query("update learner_settings set daily_goal_xp = 1000"), /check constraint/);
    await db.query("update learner_settings set legacy_imported_at = now(), reminder_hour = 19");
    const row = (await db.query("select legacy_imported_at, reminder_hour from learner_settings")).rows[0];
    assert.equal(row.legacy_imported_at, null);
    assert.equal(row.reminder_hour, 19);
    await as(db, other);
    assert.equal((await db.query("select * from learner_settings")).rows.length, 0);
    await db.exec("reset role; set role service_role");
    await db.query("select set_config('request.jwt.claim.role', 'service_role', false)");
    await db.query("update learner_settings set legacy_imported_at = now() where user_id = $1", [owner]);
    assert.notEqual((await db.query("select legacy_imported_at from learner_settings")).rows[0].legacy_imported_at, null);
  } finally {
    await db.close();
  }
});

test("old events are pruned and push endpoints must be https", async () => {
  const db = await database();
  try {
    await db.exec("set role service_role");
    await db.query("insert into learning_events(attempt_id,user_id,run_id,lesson_id,step_id,exercise_type,verdict,occurred_at,received_at) values (gen_random_uuid(),$1,gen_random_uuid(),'x','x','type','correct',now(),now() - interval '91 days'), (gen_random_uuid(),$1,gen_random_uuid(),'x','x','type','correct',now(),now())", [owner]);
    await db.exec("reset role");
    assert.equal((await db.query("select prune_learning_events() as removed")).rows[0].removed, 1);
    await assert.rejects(() => db.query("insert into push_subscriptions(user_id,endpoint,p256dh,auth) values ($1,'http://insecure.example/x','k','a')", [owner]), /check constraint/);
    await as(db, owner);
    await assert.rejects(() => db.query("select prune_learning_events()"), /permission denied/);
  } finally {
    await db.close();
  }
});
