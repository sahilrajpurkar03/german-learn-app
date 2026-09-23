import { requireLearner } from "@/lib/learning/guard";
import { MotionProvider } from "@/ui/motion";
import { TabBar } from "@/ui/tab-bar";
import { ThemeScript } from "@/ui/theme-script";
import { LegacyImport } from "@/features/shell/legacy-import";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { client, user } = await requireLearner();
  const [due, settings] = await Promise.all([
    client.from("learner_items").select("item_key", { count: "exact", head: true }).eq("user_id", user.id).lte("due_at", new Date().toISOString()),
    client.from("learner_settings").select("legacy_imported_at").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <div className="v2 flex min-h-dvh flex-1 flex-col">
      <ThemeScript />
      <MotionProvider>
        <TabBar due={due.count ?? 0} />
        <div className="v2-pb-tabbar flex flex-1 flex-col md:pl-60">{children}</div>
        <LegacyImport userId={user.id} imported={Boolean(settings.data?.legacy_imported_at) || Boolean(settings.error)} />
      </MotionProvider>
    </div>
  );
}
