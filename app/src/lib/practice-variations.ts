import type { Mission } from "./learning-content.ts";
import type { PracticeTarget } from "./adaptive-practice.ts";

const variations = [
  { source: "cafe", prerequisite: 0, title: "Your first choice is unavailable", line: "Kaffee haben wir leider nicht mehr. Wir haben noch Tee.", translation: "Unfortunately we have no coffee left. We still have tea.", task: "Ask for a tea instead.", answer: "Dann hätte ich gern einen Tee, bitte.", note: "Dann changes your order in response to the new situation." },
  { source: "supermarket", prerequisite: 2, title: "Ask about another alternative", line: "Hafermilch ist ausverkauft. Was suchen Sie noch?", translation: "Oat milk is sold out. What else are you looking for?", task: "Ask whether they also have soy milk.", answer: "Haben Sie auch Sojamilch?", note: "Use the same availability question with a different product." },
  { source: "market", prerequisite: 1, title: "Change the quantity", line: "Ein ganzes Kilo? Die Äpfel sind sehr groß.", translation: "A whole kilo? The apples are very large.", task: "Ask for half a kilo instead.", answer: "Dann hätte ich gern ein halbes Kilo, bitte.", note: "Ein halbes Kilo is half a kilogram." },
  { source: "vegetarian", prerequisite: 2, title: "The side dish has run out", line: "Reis haben wir leider nicht mehr. Brot ist noch da.", translation: "Unfortunately we have no rice left. There is still bread.", task: "Choose bread instead, politely.", answer: "Dann mit Brot, bitte.", note: "Dann marks the change from your original choice." },
  { source: "bill", prerequisite: 1, title: "Change how you pay", line: "Sie wollten getrennt bezahlen. Bleibt es dabei?", translation: "You wanted to pay separately. Is that still the plan?", task: "Say that you would like to pay together after all.", answer: "Wir möchten doch zusammen bezahlen.", note: "Doch signals a change of plan here." },
  { source: "clothes", prerequisite: 1, title: "The other jacket", line: "Die blaue Jacke ist zu klein. Die schwarze ist größer.", translation: "The blue jacket is too small. The black one is larger.", task: "Ask whether you may try on the black jacket.", answer: "Darf ich die schwarze Jacke anprobieren?", note: "Name the jacket explicitly when there are several choices." },
  { source: "shoes", prerequisite: 0, title: "Explain a different fit problem", line: "Wie sitzen die größeren Schuhe?", translation: "How do the larger shoes fit?", task: "Say that these shoes are too wide.", answer: "Diese Schuhe sind zu weit.", note: "Zu weit describes shoes that are too wide, rather than too tight." },
  { source: "return", prerequisite: 3, title: "Choose a replacement", line: "Wir können Ihnen das Geld zurückgeben oder das Gerät ersetzen.", translation: "We can refund your money or replace the appliance.", task: "Say that you would prefer a replacement.", answer: "Ich hätte lieber einen Ersatz.", note: "Lieber expresses your preference between two available options." },
] as const;

export function variationTargets(missions: Mission[]): PracticeTarget[] {
  return variations.flatMap((entry) => {
    const original = missions.find((mission) => mission.id === entry.source);
    if (!original) return [];
    const turn = { kind: "respond" as const, line: entry.line, translation: entry.translation, task: entry.task, accepted: [entry.answer], note: entry.note };
    const mission = { ...original, id: `${original.id}-transfer`, title: entry.title, subtitle: entry.task, turns: [turn] };
    return [{ id: `${mission.id}:0`, mission, turn, index: 0, prerequisite: `${original.id}:${entry.prerequisite}` }];
  });
}