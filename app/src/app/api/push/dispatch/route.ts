import { timingSafeEqual } from "node:crypto";
import { privateJson } from "@/lib/chapter-http";
import { dispatchReminders } from "@/lib/learning/push";

// Hourly trigger (Supabase pg_cron + pg_net, see docs/SPRECHEN-V2.md). Authenticated with CRON_SECRET.
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return secret.length >= 32 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function handle(request: Request) {
  if (!authorized(request)) return privateJson({ error: "Unauthorized" }, 401);
  try {
    return privateJson(await dispatchReminders());
  } catch {
    return privateJson({ error: "Dispatch failed." }, 503);
  }
}

export const GET = handle;
export const POST = handle;
