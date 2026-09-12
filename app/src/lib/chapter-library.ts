import type { Mission } from "./learning-content.ts";
import type { Skill } from "./learning-engine.ts";

export function chapterTopic(mission: Mission): string {
  return mission.topic ?? ({ cafe: "Food", station: "Travel", appointment: "Health", neighbors: "Social" }[mission.id] ?? "Everyday life");
}

export function filterChapters(missions: Mission[], topic: string, query: string, progress: string, completed: Record<string, unknown>) {
  const search = query.trim().toLocaleLowerCase("de");
  return missions.filter((mission) =>
    (topic === "All topics" || chapterTopic(mission) === topic) &&
    (progress === "All chapters" || (progress === "Completed" ? !!completed[mission.id] : !completed[mission.id])) &&
    `${mission.id} ${mission.title} ${mission.place} ${mission.subtitle} ${chapterTopic(mission)} ${mission.turns.map((turn) => `${turn.task} ${turn.line}`).join(" ")}`.toLocaleLowerCase("de").includes(search),
  );
}

export function orderChapters(missions: Mission[], completed: Record<string, unknown>, focus: Skill | undefined, preferred: string) {
  return [...missions].sort((left, right) =>
    Number(!!completed[left.id]) - Number(!!completed[right.id]) ||
    Number(right.skill === focus) - Number(left.skill === focus) ||
    Number(right.id === preferred) - Number(left.id === preferred),
  );
}