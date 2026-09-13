import type { SessionItem } from "./content";
import type { Mission, MissionTurn } from "./learning-content";
import type { LearningRecord } from "./adaptive-practice.ts";

export function adaptiveReviewItems(items: SessionItem[], record: LearningRecord): SessionItem[] {
  return items.map((item) => {
    const kinds = item.itemType === "vocab" ? ["mcq", "listen_type"] as const : ["word_bank", "speak", "listen_type"] as const;
    const supported = kinds.filter((kind) => {
      if (kind === "mcq" && (item.itemType !== "vocab" || !item.options || item.options.length < 2)) return false;
      const evidence = record[`cloud:${item.itemType}:${item.id}:${kind}`];
      return evidence && !evidence.lastIndependent;
    });
    return { ...item, exercise: supported[0] ?? item.exercise };
  });
}

export const reviewPreviewItems: SessionItem[] = [
  { itemType: "vocab", id: "preview-receipt", exercise: "mcq", lemma: "der Kassenbon", translationEn: "the receipt", exampleDe: null, exampleEn: null, options: ["the receipt", "the platform", "the appointment"] },
  { itemType: "phrase", id: "preview-listen", exercise: "listen_type", deText: "Der Zug kommt später.", enText: "The train is coming later.", situation: "At the station" },
  { itemType: "phrase", id: "preview-build", exercise: "word_bank", deText: "Ich möchte einen Termin vereinbaren.", enText: "I would like to arrange an appointment.", situation: "On the phone" },
  { itemType: "phrase", id: "preview-speak", exercise: "speak", deText: "Könnten Sie das bitte wiederholen?", enText: "Could you repeat that, please?", situation: "Ask for clarification" },
];

export function reviewMission(items: SessionItem[]): Mission {
  const turns: MissionTurn[] = items.map((item) => {
    const german = item.itemType === "vocab" ? item.lemma : item.deText;
    const meaning = item.itemType === "vocab" ? item.translationEn : item.enText;
    if (item.exercise === "mcq") return {
      kind: "choose", line: german, translation: meaning, task: "Choose the meaning",
      options: item.itemType === "vocab" ? item.options ?? [meaning] : [meaning], accepted: [meaning], note: `${german} = ${meaning}`,
    };
    if (item.exercise === "listen_type") return {
      kind: "listen", line: german, translation: meaning, task: "Type the German you hear",
      accepted: [german], note: `${german} = ${meaning}`,
    };
    return {
      kind: item.exercise === "word_bank" ? "build" : "respond",
      line: "Wie sagen Sie das auf Deutsch?", translation: "How do you say this in German?", task: meaning,
      accepted: [german], ...(item.exercise === "word_bank" ? { words: german.split(/\s+/).reverse() } : {}),
      note: `${german} = ${meaning}`,
    };
  });
  return { id: "cloud-review", title: "Recall practice", subtitle: "Your learning history", place: "Recall studio",
    image: "/images/personal-chapter.jpg", partner: "Lena", role: "Your practice partner", skill: "listening", minutes: Math.max(1, items.length), turns,
    challenge: "Use one of today's phrases in a different situation. Come back for your next scheduled recall check." };
}