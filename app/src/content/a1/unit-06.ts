import type { Unit } from "../../lib/course/types.ts";

export const unit06: Unit = {
  id: "a1-u06", level: "a1", order: 6, title: "Getting around", titleDe: "Unterwegs", emoji: "🚆",
  canDo: ["Buy a ticket and ask about connections", "Understand delays and platform changes", "Ask for and follow directions"],
  partner: { name: "Jonas", role: "Station staff" },
  conversations: ["station", "bus", "ticket", "directions", "hotel", "cycling"],
  items: [
    { id: "w.zug", kind: "word", de: "der Zug", en: "the train", gender: "m", plural: "die Züge", emoji: "🚆", example: { de: "Der Zug kommt um acht.", en: "The train arrives at eight." } },
    { id: "w.gleis", kind: "word", de: "das Gleis", en: "the platform; the track", gender: "n", plural: "die Gleise", emoji: "🛤️", example: { de: "Der Zug fährt von Gleis drei ab.", en: "The train departs from platform three." } },
    { id: "w.fahrkarte", kind: "word", de: "die Fahrkarte", en: "the ticket", gender: "f", plural: "die Fahrkarten", emoji: "🎫", example: { de: "Eine Fahrkarte nach Köln, bitte.", en: "A ticket to Cologne, please." } },
    { id: "w.bahnhof", kind: "word", de: "der Bahnhof", en: "the station", gender: "m", plural: "die Bahnhöfe", emoji: "🚉", example: { de: "Wo ist der Bahnhof?", en: "Where is the station?" } },
    { id: "w.abfahren", kind: "word", de: "abfahren", en: "to depart", emoji: "🚦", example: { de: "Wann fährt der Zug ab?", en: "When does the train leave?" } },
    { id: "w.verspaetung", kind: "word", de: "die Verspätung", en: "the delay", gender: "f", plural: "die Verspätungen", emoji: "⏳", example: { de: "Der Zug hat zehn Minuten Verspätung.", en: "The train is ten minutes late." } },
    { id: "w.puenktlich", kind: "word", de: "pünktlich", en: "on time", emoji: "✅", example: { de: "Der Bus ist pünktlich.", en: "The bus is on time." } },
    { id: "w.umsteigen", kind: "word", de: "umsteigen", en: "to change (trains, buses)", emoji: "🔀", example: { de: "Ich muss in Hamm umsteigen.", en: "I have to change in Hamm." } },
    { id: "w.minute", kind: "word", de: "die Minute", en: "the minute", gender: "f", plural: "die Minuten", emoji: "⏱️", example: { de: "Ich brauche fünf Minuten.", en: "I need five minutes." } },
    { id: "w.spaet", kind: "word", de: "spät", en: "late", emoji: "🌙", example: { de: "Es ist schon spät.", en: "It's already late." } },
    { id: "p.wie-komme-ich-zum-bahnhof", kind: "phrase", de: "Wie komme ich zum Bahnhof?", en: "How do I get to the station?", emoji: "🗺️" },
    { id: "w.geradeaus", kind: "word", de: "geradeaus", en: "straight ahead", emoji: "⬆️", example: { de: "Gehen Sie geradeaus.", en: "Go straight ahead." } },
    { id: "w.links", kind: "word", de: "links", en: "left", emoji: "⬅️", example: { de: "Dann gehen Sie links.", en: "Then go left." } },
    { id: "w.rechts", kind: "word", de: "rechts", en: "right", emoji: "➡️", example: { de: "Die Post ist rechts.", en: "The post office is on the right." } },
    { id: "w.weit", kind: "word", de: "weit", en: "far", emoji: "📍", example: { de: "Ist es weit?", en: "Is it far?" } },
    { id: "w.bus", kind: "word", de: "der Bus", en: "the bus", gender: "m", plural: "die Busse", emoji: "🚌", example: { de: "Ich fahre mit dem Bus.", en: "I'm going by bus." } },
    { id: "w.haltestelle", kind: "word", de: "die Haltestelle", en: "the stop (bus, tram)", gender: "f", plural: "die Haltestellen", emoji: "🚏", example: { de: "Wo ist die Haltestelle?", en: "Where is the stop?" } },
    { id: "w.fahren", kind: "word", de: "fahren", en: "to go (by vehicle); to drive", emoji: "🚗", example: { de: "Ich fahre nach Köln.", en: "I'm going to Cologne." }, note: "du fährst, er fährt." },
    { id: "w.aussteigen", kind: "word", de: "aussteigen", en: "to get off", emoji: "🚪", example: { de: "Wo muss ich aussteigen?", en: "Where do I have to get off?" } },
    { id: "w.naechste", kind: "word", de: "nächste", en: "next", emoji: "⏭️", example: { de: "Wir steigen an der nächsten Haltestelle aus.", en: "We get off at the next stop." } },
  ],
  lessons: [
    {
      id: "a1-u06-l1", title: "At the station", goal: "Buy a ticket and find your platform",
      newItems: ["w.zug", "w.gleis", "w.fahrkarte", "w.bahnhof", "w.abfahren"],
      sentences: [
        { de: "Der Zug fährt von Gleis drei ab.", en: "The train departs from platform three." },
        { de: "Eine Fahrkarte nach Köln, bitte.", en: "A ticket to Cologne, please.", gap: "Fahrkarte", distractors: ["Gleis", "Bahnhof"] },
        { de: "Wo ist der Bahnhof?", en: "Where is the station?" },
      ],
      dialogue: [
        { line: "Wohin möchten Sie fahren?", lineEn: "Where would you like to travel to?", task: "Say to Cologne (Köln), please.", accepted: ["Nach Köln, bitte.", "Ich möchte nach Köln fahren.", "Nach Köln."] },
        { line: "Hin und zurück?", lineEn: "Return?", task: "Say no, just one way (nur hin).", accepted: ["Nein, nur hin.", "Nur hin, bitte.", "Nein, nur hin, bitte."] },
      ],
    },
    {
      id: "a1-u06-l2", title: "Delays", goal: "Understand delays and changes",
      newItems: ["w.verspaetung", "w.puenktlich", "w.umsteigen", "w.minute", "w.spaet"],
      sentences: [
        { de: "Der Zug hat zehn Minuten Verspätung.", en: "The train is ten minutes late." },
        { de: "Ich muss in Hamm umsteigen.", en: "I have to change in Hamm.", gap: "umsteigen", distractors: ["abfahren", "kaufen"] },
        { de: "Der Bus ist pünktlich.", en: "The bus is on time." },
      ],
      dialogue: [
        { line: "Achtung: Der ICE nach Berlin hat zwanzig Minuten Verspätung.", lineEn: "Attention: the ICE to Berlin is twenty minutes late.", task: "Ask another passenger how late the train is.", accepted: ["Wie viel Verspätung hat der Zug?", "Wie viel Verspätung?", "Wie spät kommt der Zug?"] },
        { line: "Zwanzig Minuten, glaube ich.", lineEn: "Twenty minutes, I think.", task: "Say: Oh no, I have to change trains.", accepted: ["Oh nein, ich muss umsteigen.", "Oh nein! Ich muss umsteigen.", "Ich muss umsteigen."] },
      ],
    },
    {
      id: "a1-u06-l3", title: "Finding the way", goal: "Ask for and follow directions", pattern: "g.imperative-sie",
      newItems: ["p.wie-komme-ich-zum-bahnhof", "w.geradeaus", "w.links", "w.rechts", "w.weit"],
      sentences: [
        { de: "Gehen Sie geradeaus.", en: "Go straight ahead." },
        { de: "Dann gehen Sie links.", en: "Then go left.", gap: "links", distractors: ["rechts", "weit"] },
        { de: "Ist es weit?", en: "Is it far?", alt: ["Ist das weit?"] },
      ],
      dialogue: [
        { line: "Kann ich Ihnen helfen?", lineEn: "Can I help you?", task: "Ask how to get to the station.", accepted: ["Wie komme ich zum Bahnhof?", "Wo ist der Bahnhof?", "Ja, wie komme ich zum Bahnhof?"] },
        { line: "Gehen Sie hier geradeaus und dann rechts.", lineEn: "Go straight ahead here and then right.", task: "Ask if it's far.", accepted: ["Ist es weit?", "Ist das weit?"] },
      ],
    },
    {
      id: "a1-u06-l4", title: "Bus and tram", goal: "Take the right bus and get off at the right stop", pattern: "g.dativ-prep",
      newItems: ["w.bus", "w.haltestelle", "w.fahren", "w.aussteigen", "w.naechste"],
      sentences: [
        { de: "Ich fahre mit dem Bus.", en: "I'm going by bus." },
        { de: "Wir steigen an der nächsten Haltestelle aus.", en: "We get off at the next stop.", gap: "aus", distractors: ["an", "um"] },
        { de: "Welcher Bus fährt zum Bahnhof?", en: "Which bus goes to the station?" },
      ],
      dialogue: [
        { line: "Wohin fahren Sie?", lineEn: "Where are you going?", task: "Say into town (in die Stadt).", accepted: ["In die Stadt.", "Ich fahre in die Stadt."] },
        { line: "Dann nehmen Sie die Linie vier.", lineEn: "Then take line four.", task: "Ask where you have to get off.", accepted: ["Wo muss ich aussteigen?", "Wo steige ich aus?"] },
      ],
    },
  ],
};
