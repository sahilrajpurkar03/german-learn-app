import type { Unit } from "../../lib/course/types.ts";

export const unit03: Unit = {
  id: "a1-u03", level: "a1", order: 3, title: "At the café", titleDe: "Im Café", emoji: "☕",
  canDo: ["Order food and drinks politely", "Say what you eat and don't eat", "Pay and ask for the bill"],
  partner: { name: "Mila", role: "Barista" },
  conversations: ["cafe", "bakery", "restaurant", "vegetarian", "allergy", "bill"],
  items: [
    { id: "w.kaffee", kind: "word", de: "der Kaffee", en: "the coffee", gender: "m", emoji: "☕", example: { de: "Der Kaffee ist heiß.", en: "The coffee is hot." } },
    { id: "w.tee", kind: "word", de: "der Tee", en: "the tea", gender: "m", emoji: "🍵", example: { de: "Ich trinke Tee.", en: "I drink tea." } },
    { id: "w.wasser", kind: "word", de: "das Wasser", en: "the water", gender: "n", emoji: "💧", example: { de: "Das Wasser ist kalt.", en: "The water is cold." } },
    { id: "w.saft", kind: "word", de: "der Saft", en: "the juice", gender: "m", plural: "die Säfte", emoji: "🧃", example: { de: "Der Saft ist frisch.", en: "The juice is fresh." } },
    { id: "w.milch", kind: "word", de: "die Milch", en: "the milk", gender: "f", emoji: "🥛", example: { de: "Ich trinke Tee mit Milch.", en: "I drink tea with milk." } },
    { id: "p.ich-haette-gern", kind: "phrase", de: "Ich hätte gern ...", en: "I'd like ...", emoji: "🙏", note: "The most polite way to order. Add what you want: Ich hätte gern einen Tee." },
    { id: "p.ich-moechte", kind: "phrase", de: "Ich möchte ...", en: "I would like ...", emoji: "😋" },
    { id: "w.bitte", kind: "word", de: "bitte", en: "please", emoji: "🙏", example: { de: "Einen Kaffee, bitte.", en: "A coffee, please." }, note: "Also means 'you're welcome'." },
    { id: "w.danke", kind: "word", de: "danke", en: "thank you", emoji: "💐", example: { de: "Danke schön!", en: "Thank you very much!" } },
    { id: "w.croissant", kind: "word", de: "das Croissant", en: "the croissant", gender: "n", plural: "die Croissants", emoji: "🥐", example: { de: "Ein Croissant, bitte.", en: "A croissant, please." } },
    { id: "w.brot", kind: "word", de: "das Brot", en: "the bread", gender: "n", plural: "die Brote", emoji: "🍞", example: { de: "Das Brot ist sehr lecker.", en: "The bread is very tasty." } },
    { id: "w.kaese", kind: "word", de: "der Käse", en: "the cheese", gender: "m", emoji: "🧀", example: { de: "Ich esse gern Käse.", en: "I like eating cheese." } },
    { id: "w.fleisch", kind: "word", de: "das Fleisch", en: "the meat", gender: "n", emoji: "🥩", example: { de: "Ich esse kein Fleisch.", en: "I don't eat meat." } },
    { id: "w.gemuese", kind: "word", de: "das Gemüse", en: "the vegetables", gender: "n", emoji: "🥦", example: { de: "Ich esse gern Gemüse.", en: "I like eating vegetables." }, note: "Gemüse is singular in German: das Gemüse." },
    { id: "w.lecker", kind: "word", de: "lecker", en: "tasty", emoji: "😋", example: { de: "Das ist lecker!", en: "That's tasty!" } },
    { id: "p.die-rechnung-bitte", kind: "phrase", de: "Die Rechnung, bitte.", en: "The bill, please.", emoji: "🧾", alt: ["Zahlen, bitte."] },
    { id: "w.bar", kind: "word", de: "bar", en: "in cash", emoji: "💵", example: { de: "Ich zahle bar.", en: "I'll pay in cash." } },
    { id: "w.karte", kind: "word", de: "die Karte", en: "the card", gender: "f", plural: "die Karten", emoji: "💳", example: { de: "Kann ich mit Karte zahlen?", en: "Can I pay by card?" } },
    { id: "p.zusammen-oder-getrennt", kind: "phrase", de: "Zusammen oder getrennt?", en: "Together or separately?", emoji: "👥", note: "The waiter's question when you pay as a group." },
    { id: "w.zahlen", kind: "word", de: "zahlen", en: "to pay", emoji: "💰", example: { de: "Wir zahlen getrennt.", en: "We are paying separately." } },
  ],
  lessons: [
    {
      id: "a1-u03-l1", title: "Drinks", goal: "Name drinks with the right article", pattern: "g.articles",
      newItems: ["w.kaffee", "w.tee", "w.wasser", "w.saft", "w.milch"],
      sentences: [
        { de: "Der Kaffee ist heiß.", en: "The coffee is hot." },
        { de: "Das Wasser ist kalt.", en: "The water is cold.", gap: "Das", distractors: ["Der", "Die"] },
        { de: "Der Tee kostet drei Euro.", en: "The tea costs three euros." },
      ],
      dialogue: [
        { line: "Hallo! Was trinken Sie?", lineEn: "Hello! What are you having to drink?", task: "Say you're drinking tea.", accepted: ["Ich trinke Tee.", "Tee, bitte.", "Einen Tee, bitte."] },
        { line: "Mit Milch?", lineEn: "With milk?", task: "Say yes, with milk please.", accepted: ["Ja, mit Milch, bitte.", "Ja, bitte.", "Ja, mit Milch."] },
      ],
    },
    {
      id: "a1-u03-l2", title: "I'd like ...", goal: "Order politely", pattern: "g.akk-den",
      newItems: ["p.ich-haette-gern", "p.ich-moechte", "w.bitte", "w.danke", "w.croissant"],
      sentences: [
        { de: "Ich hätte gern einen Kaffee, bitte.", en: "I'd like a coffee, please.", alt: ["Ich möchte einen Kaffee, bitte."] },
        { de: "Ich möchte einen Tee.", en: "I would like a tea.", gap: "einen", distractors: ["ein", "eine"] },
        { de: "Ein Croissant, bitte.", en: "A croissant, please." },
      ],
      dialogue: [
        { line: "Was darf es sein?", lineEn: "What can I get you?", task: "Order a coffee politely.", accepted: ["Ich hätte gern einen Kaffee, bitte.", "Einen Kaffee, bitte.", "Ich möchte einen Kaffee, bitte.", "Ich hätte gern einen Kaffee."] },
        { line: "Sonst noch etwas?", lineEn: "Anything else?", task: "Order a croissant too.", accepted: ["Ein Croissant, bitte.", "Und ein Croissant, bitte.", "Ich hätte gern ein Croissant.", "Ein Croissant."] },
      ],
    },
    {
      id: "a1-u03-l3", title: "Food", goal: "Say what you eat and don't eat", pattern: "g.negation",
      newItems: ["w.brot", "w.kaese", "w.fleisch", "w.gemuese", "w.lecker"],
      sentences: [
        { de: "Ich esse kein Fleisch.", en: "I don't eat meat." },
        { de: "Das Brot ist sehr lecker.", en: "The bread is very tasty.", gap: "lecker", distractors: ["teuer", "kalt"] },
        { de: "Ich esse gern Gemüse.", en: "I like eating vegetables." },
      ],
      dialogue: [
        { line: "Möchten Sie ein Schnitzel?", lineEn: "Would you like a schnitzel?", task: "Say no, you don't eat meat.", accepted: ["Nein, ich esse kein Fleisch.", "Nein danke, ich esse kein Fleisch.", "Nein, danke. Ich esse kein Fleisch."] },
        { line: "Wir haben auch Käsebrot.", lineEn: "We also have cheese sandwiches.", task: "Say: yes, please!", accepted: ["Ja, bitte!", "Ja, gern!", "Gern!", "Ja, gerne!"] },
      ],
    },
    {
      id: "a1-u03-l4", title: "Paying", goal: "Ask for the bill and pay", pattern: "g.modal-koennen",
      newItems: ["p.die-rechnung-bitte", "w.bar", "w.karte", "p.zusammen-oder-getrennt", "w.zahlen"],
      sentences: [
        { de: "Kann ich mit Karte zahlen?", en: "Can I pay by card?", alt: ["Kann ich mit Karte bezahlen?"] },
        { de: "Ich zahle bar.", en: "I'll pay in cash.", gap: "bar", distractors: ["Karte", "gern"] },
        { de: "Wir zahlen getrennt.", en: "We are paying separately." },
      ],
      dialogue: [
        { line: "Zusammen oder getrennt?", lineEn: "Together or separately?", task: "Say together, please.", accepted: ["Zusammen, bitte.", "Zusammen."] },
        { line: "Das macht elf Euro fünfzig.", lineEn: "That's eleven euros fifty.", task: "Ask if you can pay by card.", accepted: ["Kann ich mit Karte zahlen?", "Kann ich mit Karte bezahlen?", "Kann ich bitte mit Karte zahlen?"] },
      ],
    },
  ],
};
