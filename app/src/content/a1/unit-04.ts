import type { Unit } from "../../lib/course/types.ts";

export const unit04: Unit = {
  id: "a1-u04", level: "a1", order: 4, title: "Shopping", titleDe: "Einkaufen", emoji: "🛒",
  canDo: ["Find things in a shop", "Ask for quantities and sizes", "Return or exchange something"],
  partner: { name: "Herr Yilmaz", role: "Shop assistant" },
  conversations: ["supermarket", "market", "clothes", "shoes", "return", "electronics"],
  items: [
    { id: "w.apfel", kind: "word", de: "der Apfel", en: "the apple", gender: "m", plural: "die Äpfel", emoji: "🍎", example: { de: "Ich kaufe drei Äpfel.", en: "I'm buying three apples." } },
    { id: "w.ei", kind: "word", de: "das Ei", en: "the egg", gender: "n", plural: "die Eier", emoji: "🥚", example: { de: "Ich suche Eier.", en: "I'm looking for eggs." } },
    { id: "w.tomate", kind: "word", de: "die Tomate", en: "the tomato", gender: "f", plural: "die Tomaten", emoji: "🍅", example: { de: "Wo finde ich Tomaten?", en: "Where can I find tomatoes?" } },
    { id: "w.suchen", kind: "word", de: "suchen", en: "to look for", emoji: "🔍", example: { de: "Ich suche Milch.", en: "I'm looking for milk." } },
    { id: "w.kaufen", kind: "word", de: "kaufen", en: "to buy", emoji: "🛍️", example: { de: "Ich kaufe Brot.", en: "I'm buying bread." } },
    { id: "w.kilo", kind: "word", de: "das Kilo", en: "the kilo", gender: "n", plural: "die Kilos", emoji: "⚖️", example: { de: "Ein Kilo Tomaten, bitte.", en: "A kilo of tomatoes, please." }, note: "No 'of' in German: ein Kilo Äpfel." },
    { id: "w.gramm", kind: "word", de: "das Gramm", en: "the gram", gender: "n", emoji: "🧂", example: { de: "Zweihundert Gramm Käse, bitte.", en: "Two hundred grams of cheese, please." } },
    { id: "w.flasche", kind: "word", de: "die Flasche", en: "the bottle", gender: "f", plural: "die Flaschen", emoji: "🍾", example: { de: "Zwei Flaschen Wasser, bitte.", en: "Two bottles of water, please." } },
    { id: "w.packung", kind: "word", de: "die Packung", en: "the packet; the carton", gender: "f", plural: "die Packungen", emoji: "📦", example: { de: "Eine Packung Milch, bitte.", en: "A carton of milk, please." } },
    { id: "w.stueck", kind: "word", de: "das Stück", en: "the piece", gender: "n", plural: "die Stücke", emoji: "🍰", example: { de: "Zwei Stück Kuchen, bitte.", en: "Two pieces of cake, please." }, note: "After a number it stays singular: zwei Stück Kuchen." },
    { id: "w.jacke", kind: "word", de: "die Jacke", en: "the jacket", gender: "f", plural: "die Jacken", emoji: "🧥", example: { de: "Die Jacke ist zu klein.", en: "The jacket is too small." } },
    { id: "w.hose", kind: "word", de: "die Hose", en: "the trousers", gender: "f", plural: "die Hosen", emoji: "👖", example: { de: "Die Hose passt gut.", en: "The trousers fit well." }, note: "One pair of trousers = eine Hose (singular)." },
    { id: "w.schuh", kind: "word", de: "der Schuh", en: "the shoe", gender: "m", plural: "die Schuhe", emoji: "👟", example: { de: "Ich suche Schuhe in Größe 42.", en: "I'm looking for shoes in size 42." } },
    { id: "w.groesse", kind: "word", de: "die Größe", en: "the size", gender: "f", plural: "die Größen", emoji: "📏", example: { de: "Haben Sie die Hose in Größe M?", en: "Do you have the trousers in size M?" } },
    { id: "w.klein", kind: "word", de: "klein", en: "small", emoji: "🐭", example: { de: "Die Jacke ist zu klein.", en: "The jacket is too small." } },
    { id: "w.kassenbon", kind: "word", de: "der Kassenbon", en: "the receipt", gender: "m", plural: "die Kassenbons", emoji: "🧾", example: { de: "Haben Sie den Kassenbon?", en: "Do you have the receipt?" } },
    { id: "p.das-gefaellt-mir", kind: "phrase", de: "Das gefällt mir.", en: "I like that.", emoji: "😍", note: "Used for things you see or wear." },
    { id: "w.umtauschen", kind: "word", de: "umtauschen", en: "to exchange", emoji: "🔄", example: { de: "Ich möchte die Schuhe umtauschen.", en: "I'd like to exchange the shoes." } },
    { id: "w.kaputt", kind: "word", de: "kaputt", en: "broken", emoji: "💔", example: { de: "Der Föhn ist kaputt.", en: "The hairdryer is broken." } },
    { id: "w.geld", kind: "word", de: "das Geld", en: "the money", gender: "n", emoji: "💶", example: { de: "Ich möchte mein Geld zurück.", en: "I'd like my money back." } },
  ],
  lessons: [
    {
      id: "a1-u04-l1", title: "At the supermarket", goal: "Find what you need", pattern: "g.plural",
      newItems: ["w.apfel", "w.ei", "w.tomate", "w.suchen", "w.kaufen"],
      sentences: [
        { de: "Ich suche Eier.", en: "I am looking for eggs." },
        { de: "Ich kaufe drei Äpfel.", en: "I'm buying three apples.", gap: "Äpfel", distractors: ["Apfel", "Äpfeln"] },
        { de: "Wo finde ich Tomaten?", en: "Where can I find tomatoes?", alt: ["Wo sind die Tomaten?"] },
      ],
      dialogue: [
        { line: "Kann ich Ihnen helfen?", lineEn: "Can I help you?", task: "Say you're looking for eggs.", accepted: ["Ich suche Eier.", "Ja, ich suche Eier.", "Wo finde ich Eier?"] },
        { line: "Die Eier sind dort hinten.", lineEn: "The eggs are back there.", task: "Say thank you.", accepted: ["Danke!", "Vielen Dank!", "Danke schön!", "Danke sehr!"] },
      ],
    },
    {
      id: "a1-u04-l2", title: "How much?", goal: "Ask for quantities", pattern: "g.moechten",
      newItems: ["w.kilo", "w.gramm", "w.flasche", "w.packung", "w.stueck"],
      sentences: [
        { de: "Ein Kilo Tomaten, bitte.", en: "A kilo of tomatoes, please." },
        { de: "Ich möchte zwei Flaschen Wasser kaufen.", en: "I'd like to buy two bottles of water.", gap: "kaufen", distractors: ["kaufe", "kauft"] },
        { de: "Eine Packung Milch, bitte.", en: "A carton of milk, please." },
      ],
      dialogue: [
        { line: "Was darf es sein?", lineEn: "What would you like?", task: "Ask for a kilo of apples.", accepted: ["Ein Kilo Äpfel, bitte.", "Ich hätte gern ein Kilo Äpfel.", "Ich möchte ein Kilo Äpfel."] },
        { line: "Noch etwas?", lineEn: "Anything else?", task: "Ask for two pieces of cake.", accepted: ["Zwei Stück Kuchen, bitte.", "Und zwei Stück Kuchen, bitte.", "Ich hätte gern zwei Stück Kuchen."], note: "der Kuchen = the cake." },
      ],
    },
    {
      id: "a1-u04-l3", title: "Clothes", goal: "Ask about sizes and fit", pattern: "g.yes-no-questions",
      newItems: ["w.jacke", "w.hose", "w.schuh", "w.groesse", "w.klein"],
      sentences: [
        { de: "Die Jacke ist zu klein.", en: "The jacket is too small." },
        { de: "Haben Sie die Hose in Größe M?", en: "Do you have the trousers in size M?", gap: "Haben", distractors: ["Hat", "Habe"] },
        { de: "Ich suche Schuhe in Größe 42.", en: "I'm looking for shoes in size 42." },
      ],
      dialogue: [
        { line: "Passt die Jacke?", lineEn: "Does the jacket fit?", task: "Say no, it's too small.", accepted: ["Nein, die Jacke ist zu klein.", "Nein, sie ist zu klein.", "Nein, zu klein."] },
        { line: "Möchten Sie Größe L probieren?", lineEn: "Would you like to try size L?", task: "Say yes, please.", accepted: ["Ja, bitte.", "Ja, gern.", "Ja, gerne."] },
      ],
    },
    {
      id: "a1-u04-l4", title: "Exchanging things", goal: "Return or exchange a purchase", pattern: "g.separable",
      newItems: ["w.kassenbon", "p.das-gefaellt-mir", "w.umtauschen", "w.kaputt", "w.geld"],
      sentences: [
        { de: "Ich möchte die Schuhe umtauschen.", en: "I'd like to exchange the shoes." },
        { de: "Ich tausche die Jacke um.", en: "I'm exchanging the jacket.", gap: "um", distractors: ["an", "auf"] },
        { de: "Der Föhn ist kaputt.", en: "The hairdryer is broken." },
      ],
      dialogue: [
        { line: "Guten Tag, wie kann ich helfen?", lineEn: "Hello, how can I help?", task: "Say the kettle (der Wasserkocher) is broken.", accepted: ["Der Wasserkocher ist kaputt.", "Mein Wasserkocher ist kaputt.", "Guten Tag, der Wasserkocher ist kaputt."] },
        { line: "Haben Sie den Kassenbon?", lineEn: "Do you have the receipt?", task: "Say yes, here it is.", accepted: ["Ja, hier ist er.", "Ja, hier.", "Ja, hier bitte.", "Ja, hier ist der Kassenbon."], note: "der Kassenbon → er (it)." },
      ],
    },
  ],
};
