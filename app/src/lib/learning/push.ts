import "server-only";
import webpush from "web-push";
import { addDays, localDate, visibleStreak } from "../course/activity";
import { reminderKind, reminderMessage } from "../course/reminders";
import { learningAdmin } from "./server";

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

function configure() {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
}

/** Called hourly by a scheduler. Sends each learner at most one reminder per day and one recap per week. */
export async function dispatchReminders(now = new Date()) {
  if (!pushConfigured()) return { sent: 0, skipped: "not configured" };
  configure();
  const db = learningAdmin();
  const subscriptions = await db.from("push_subscriptions").select("*").lt("failures", 5).limit(1000);
  if (subscriptions.error) throw subscriptions.error;
  const userIds = [...new Set((subscriptions.data ?? []).map((row) => row.user_id))];
  if (!userIds.length) return { sent: 0 };
  const [settings, stats, days] = await Promise.all([
    db.from("learner_settings").select("user_id, timezone, reminder_hour, daily_goal_xp").in("user_id", userIds),
    db.from("learner_stats").select("*").in("user_id", userIds),
    db.from("daily_activity").select("user_id, local_date, xp, lessons").in("user_id", userIds).gte("local_date", addDays(localDate(now, "UTC"), -8)),
  ]);
  if (settings.error || stats.error || days.error) throw settings.error ?? stats.error ?? days.error;
  let sent = 0;
  for (const subscription of subscriptions.data ?? []) {
    const setting = settings.data?.find((row) => row.user_id === subscription.user_id);
    if (!setting) continue;
    const today = localDate(now, setting.timezone);
    const own = (days.data ?? []).filter((row) => row.user_id === subscription.user_id);
    const stat = stats.data?.find((row) => row.user_id === subscription.user_id);
    const candidate = {
      timezone: setting.timezone, reminderHour: setting.reminder_hour, goalXp: setting.daily_goal_xp,
      todayXp: own.find((row) => row.local_date === today)?.xp ?? 0,
      streak: stat ? visibleStreak({ current: stat.streak_current, longest: stat.streak_longest, lastDate: stat.streak_last_date, freezes: stat.freezes, freezeProgress: stat.freeze_progress }, today) : 0,
      lastSentOn: subscription.last_sent_on, lastRecapOn: subscription.last_recap_on,
    };
    const kind = reminderKind(candidate, now);
    if (!kind) continue;
    const week = own.filter((row) => row.local_date > addDays(today, -7));
    const message = reminderMessage(kind, candidate, { xp: week.reduce((sum, row) => sum + row.xp, 0), lessons: week.reduce((sum, row) => sum + row.lessons, 0), words: 0 });
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(message), { TTL: 3600 });
      await db.from("push_subscriptions").update(kind === "recap" ? { last_recap_on: today, failures: 0 } : { last_sent_on: today, failures: 0 }).eq("id", subscription.id);
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await db.from("push_subscriptions").delete().eq("id", subscription.id);
      else await db.from("push_subscriptions").update({ failures: subscription.failures + 1 }).eq("id", subscription.id);
    }
  }
  return { sent };
}
