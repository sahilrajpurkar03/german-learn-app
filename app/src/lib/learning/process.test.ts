import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { catalog, getLesson } from "../course/catalog.ts";
import { reviewStepId } from "../course/review.ts";
import { REVIEW_LESSON_ID, type Attempt } from "../course/progress.ts";
import { findStep } from "../course/catalog.ts";
import type { Step } from "../course/types.ts";
import { processBatch, type Client } from "./process.ts";

// Runs the real scoring/saving code against a real Postgres (PGlite) that has this repo's
// migrations applied and Supabase's default table grants, connected as service_role.

const USER = "00000000-0000-4000-8000-0000000000aa";
const IDENT = /^[a-z_][a-z0-9_]*$/;

/** A minimal PostgREST-style client (select/eq/in/gte/maybeSingle/upsert) executing real SQL. */
function restClient(db: PGlite): Client {
  const columnTypes = new Map<string, Map<string, string>>();
  async function typesOf(table: string) {
    if (!columnTypes.has(table)) {
      const { rows } = await db.query<{ column_name: string; data_type: string }>("select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1", [table]);
      columnTypes.set(table, new Map(rows.map((row) => [row.column_name, row.data_type])));
    }
    return columnTypes.get(table)!;
  }
  const convert = (value: unknown, type: string | undefined) => {
    if (value instanceof Date) return type === "date" ? value.toISOString().slice(0, 10) : value.toISOString();
    if (typeof value === "string" && (type === "numeric" || type === "bigint")) return Number(value);
    return value;
  };

  class Query implements PromiseLike<{ data: unknown; error: unknown }> {
    private mode: "select" | "upsert" = "select";
    private columns = "*";
    private filters: [string, "=" | "= any" | ">=", unknown][] = [];
    private rows: Record<string, unknown>[] = [];
    private conflict = "";
    private ignore = false;
    private returning = false;
    private single = false;
    private table: string;
    constructor(table: string) { assert.match(table, IDENT); this.table = table; }
    select(columns = "*") { if (this.mode === "upsert") { this.returning = true; this.columns = columns; } else this.columns = columns; return this; }
    eq(column: string, value: unknown) { this.filters.push([column, "=", value]); return this; }
    in(column: string, values: unknown[]) { this.filters.push([column, "= any", values]); return this; }
    gte(column: string, value: unknown) { this.filters.push([column, ">=", value]); return this; }
    maybeSingle() { this.single = true; return this; }
    upsert(rows: Record<string, unknown> | Record<string, unknown>[], options: { onConflict: string; ignoreDuplicates?: boolean }) {
      this.mode = "upsert"; this.rows = Array.isArray(rows) ? rows : [rows]; this.conflict = options.onConflict; this.ignore = Boolean(options.ignoreDuplicates);
      return this;
    }
    then<A, B>(resolve?: (value: { data: unknown; error: unknown }) => A | PromiseLike<A>, reject?: (reason: unknown) => B | PromiseLike<B>) {
      return this.run().then(resolve, reject);
    }
    private async run(): Promise<{ data: unknown; error: unknown }> {
      try {
        const params: unknown[] = [];
        const bind = (value: unknown) => { params.push(value); return `$${params.length}`; };
        const list = this.columns === "*" ? "*" : this.columns.split(",").map((column) => column.trim()).map((column) => { assert.match(column, IDENT); return column; }).join(", ");
        let sql: string;
        if (this.mode === "upsert") {
          const columns = Object.keys(this.rows[0]);
          columns.forEach((column) => assert.match(column, IDENT));
          const values = this.rows.map((row) => `(${columns.map((column) => bind(row[column])).join(", ")})`).join(", ");
          const keys = this.conflict.split(",").map((column) => column.trim());
          const action = this.ignore ? "do nothing" : `do update set ${columns.filter((column) => !keys.includes(column)).map((column) => `${column} = excluded.${column}`).join(", ")}`;
          sql = `insert into public.${this.table} (${columns.join(", ")}) values ${values} on conflict (${keys.join(", ")}) ${action}${this.returning ? ` returning ${list}` : ""}`;
        } else {
          const where = this.filters.map(([column, operator, value]) => { assert.match(column, IDENT); return `${column} ${operator === "= any" ? "= any(" + bind(value) + ")" : `${operator} ${bind(value)}`}`; }).join(" and ");
          sql = `select ${list} from public.${this.table}${where ? ` where ${where}` : ""}`;
        }
        const result = await db.query<Record<string, unknown>>(sql, params);
        const types = await typesOf(this.table);
        const rows = (result.rows ?? []).map((row) => Object.fromEntries(Object.entries(row).map(([column, value]) => [column, convert(value, types.get(column))])));
        if (this.single) return { data: rows[0] ?? null, error: null };
        return { data: this.mode === "upsert" && !this.returning ? null : rows, error: null };
      } catch (error) {
        const failure = error as { code?: string; message?: string };
        return { data: null, error: { code: failure.code, message: failure.message } };
      }
    }
  }
  return { from: (table: string) => new Query(table) } as unknown as Client;
}

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  `);
  for (const file of ["0006_learning_v2.sql", "0007_push_reminders.sql"]) await db.exec(await readFile(new URL(`../../../../supabase/migrations/${file}`, import.meta.url), "utf8"));
  await db.query("insert into auth.users values ($1)", [USER]);
  await db.exec("set role service_role");
  return db;
}

/** The answer a learner who knows everything would give. */
function correctAnswer(step: Step): string {
  if (step.type === "intro" || step.type === "pattern") return "";
  if (step.type === "match") return JSON.stringify(step.pairs);
  return step.accepted[0];
}

const RUN = "11111111-1111-4111-8111-111111111111";
let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;
function playLesson(lessonId: string, steps: Step[], { run = RUN, at = "2026-09-10T10:00:00.000Z", complete = true, wrongFirst = new Set<number>() } = {}): Attempt[] {
  const attempts: Attempt[] = [];
  steps.forEach((step, index) => {
    if (wrongFirst.has(index)) attempts.push({ attemptId: id(), runId: run, lessonId, stepId: step.id, kind: "answer", answer: "zzz", responseMs: 800, occurredAt: at, stepIndex: index });
    attempts.push({ attemptId: id(), runId: run, lessonId, stepId: step.id, kind: "answer", answer: correctAnswer(step), responseMs: 800, occurredAt: at, stepIndex: index });
  });
  if (complete) attempts.push({ attemptId: id(), runId: run, lessonId, stepId: lessonId, kind: "complete", answer: "", responseMs: 0, occurredAt: at, stepIndex: 0 });
  return attempts;
}

test("a finished lesson is scored and stored: events, memory, XP, streak and progress", async () => {
  const db = await database();
  try {
    const client = restClient(db);
    const lesson = getLesson("a1-u01-l1")!;
    const now = new Date("2026-09-10T10:05:00.000Z");
    const result = await processBatch(client, USER, playLesson(lesson.id, lesson.steps), now);

    const graded = lesson.steps.filter((step) => !["intro", "pattern"].includes(step.type)).length;
    assert.equal(result.todayXp, graded * 2 + 10, "2 XP per graded answer + 10 for the lesson");
    assert.equal(result.streak, 1, "30 XP met the default goal on the first day");
    assert.equal(result.xpTotal, result.todayXp);

    const events = await db.query<{ n: number; xp: number }>("select count(*)::int as n, sum(xp)::int as xp from learning_events");
    assert.equal(events.rows[0].n, lesson.steps.length + 1);
    assert.equal(events.rows[0].xp, result.todayXp);
    const items = await db.query<{ item_key: string; repetitions: number; strength: number }>("select item_key, repetitions, strength from learner_items order by item_key");
    assert.ok(items.rows.length >= 5, "every item of the lesson has a memory row");
    assert.ok(items.rows.every((row) => row.strength > 0));
    assert.equal((await db.query<{ status: string }>("select status, completed_count from lesson_progress")).rows[0].status, "completed");
    const day = (await db.query<{ d: string; goal_met: boolean; lessons: number }>("select local_date::text as d, xp, goal_met, lessons from daily_activity")).rows[0];
    assert.deepEqual([day.d, day.goal_met, day.lessons], ["2026-09-10", true, 1]);
    const stats = (await db.query<{ streak_current: number; freeze_progress: number }>("select streak_current, freeze_progress from learner_stats")).rows[0];
    assert.deepEqual([stats.streak_current, stats.freeze_progress], [1, 1]);

    // Sending the same answers again changes nothing.
    const replay = await processBatch(client, USER, playLesson(lesson.id, lesson.steps).map((attempt, index) => ({ ...attempt, attemptId: `00000000-0000-4000-8000-${String(1 + index).padStart(12, "0")}` })), now);
    assert.equal(replay.xpTotal, result.xpTotal);
    assert.equal((await db.query<{ n: number }>("select count(*)::int as n from learning_events")).rows[0].n, lesson.steps.length + 1);
  } finally {
    await db.close();
  }
});

test("a wrong answer costs its XP, is retried for less, and is counted as a lapse candidate", async () => {
  const db = await database();
  try {
    const client = restClient(db);
    const lesson = getLesson("a1-u03-l1")!;
    const choose = lesson.steps.findIndex((step) => step.type === "choose");
    const attempts = playLesson(lesson.id, lesson.steps, { run: "22222222-2222-4222-8222-222222222222", wrongFirst: new Set([choose]) });
    const result = await processBatch(client, USER, attempts, new Date("2026-09-10T10:05:00.000Z"));
    const graded = lesson.steps.filter((step) => !["intro", "pattern"].includes(step.type)).length;
    assert.equal(result.todayXp, (graded - 1) * 2 + 1 + 10, "the retried step earns 1 XP");
    const events = await db.query<{ verdict: string; retry: boolean; xp: number }>("select verdict, retry, xp from learning_events where step_id = $1 order by occurred_at, attempt_id", [lesson.steps[choose].id]);
    assert.deepEqual(events.rows.map((row) => [row.verdict, row.retry, row.xp]), [["wrong", false, 0], ["correct", true, 1]]);
  } finally {
    await db.close();
  }
});

test("a lesson left half-way is remembered as started at the right step", async () => {
  const db = await database();
  try {
    const client = restClient(db);
    const lesson = getLesson("a1-u02-l1")!;
    const partial = playLesson(lesson.id, lesson.steps.slice(0, 7), { run: "33333333-3333-4333-8333-333333333333", complete: false });
    const result = await processBatch(client, USER, partial, new Date("2026-09-10T10:05:00.000Z"));
    assert.ok(result.todayXp > 0 && result.todayXp < 30);
    const progress = (await db.query<{ status: string; step_index: number; last_run_id: string }>("select status, step_index, last_run_id from lesson_progress")).rows[0];
    assert.deepEqual([progress.status, progress.step_index, progress.last_run_id], ["started", 6, "33333333-3333-4333-8333-333333333333"]);
    assert.equal((await db.query<{ n: number }>("select count(*)::int as n from learner_stats where streak_current > 0")).rows[0].n, 0, "no streak until the goal is met");
  } finally {
    await db.close();
  }
});

test("a review session updates memory, earns its bonus and counts as a review", async () => {
  const db = await database();
  try {
    const client = restClient(db);
    const keys = ["w.kaffee", "w.tee", "w.wasser", "w.saft"];
    const steps = keys.map((key) => findStep(reviewStepId(key, "choose", 0))!);
    const attempts = playLesson(REVIEW_LESSON_ID, steps, { run: "44444444-4444-4444-8444-444444444444" });
    const result = await processBatch(client, USER, attempts, new Date("2026-09-10T10:05:00.000Z"));
    assert.equal(result.todayXp, keys.length * 2 + 5);
    assert.equal((await db.query<{ reviews: number }>("select reviews from daily_activity")).rows[0].reviews, 1);
    assert.equal((await db.query<{ n: number }>("select count(*)::int as n from lesson_progress")).rows[0].n, 0, "reviews are not lessons");
    assert.deepEqual((await db.query<{ item_key: string }>("select item_key from learner_items order by item_key")).rows.map((row) => row.item_key), [...keys].sort());
  } finally {
    await db.close();
  }
});

test("XP lands on the learner's own calendar day", async () => {
  const db = await database();
  try {
    await db.query("insert into learner_settings(user_id, timezone, daily_goal_xp) values ($1, 'Asia/Kolkata', 50)", [USER]);
    const client = restClient(db);
    const lesson = getLesson("a1-u01-l2")!;
    // 20:00 UTC on the 10th is 01:30 on the 11th in India.
    const result = await processBatch(client, USER, playLesson(lesson.id, lesson.steps, { run: "55555555-5555-4555-8555-555555555555", at: "2026-09-10T20:00:00.000Z" }), new Date("2026-09-10T20:05:00.000Z"));
    assert.equal(result.goalXp, 50);
    assert.equal((await db.query<{ d: string }>("select local_date::text as d from daily_activity")).rows[0].d, "2026-09-11");
  } finally {
    await db.close();
  }
});

test("the whole course can be played and saved without a database error", async () => {
  const db = await database();
  try {
    const client = restClient(db);
    let run = 0;
    for (const lesson of catalog().lessons.values()) {
      const attempts = playLesson(lesson.id, lesson.steps, { run: `66666666-6666-4666-8666-${String(++run).padStart(12, "0")}` });
      // Real batches are at most 50 answers; the server accepts up to 60.
      for (let start = 0; start < attempts.length; start += 50) await processBatch(client, USER, attempts.slice(start, start + 50), new Date("2026-09-10T10:05:00.000Z"));
    }
    assert.equal((await db.query<{ n: number }>("select count(*)::int as n from lesson_progress where status = 'completed'")).rows[0].n, catalog().lessons.size);
  } finally {
    await db.close();
  }
});
