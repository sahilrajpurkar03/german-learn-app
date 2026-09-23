import type { Unit } from "../../lib/course/types.ts";

export const unit02: Unit = {
  id: "a1-u02", level: "a1", order: 2, title: "Numbers & time", titleDe: "Zahlen & Zeit", emoji: "🕐",
  canDo: ["Count and understand prices", "Tell the time and agree on a time", "Name the days of the week"],
  partner: { name: "Tom", role: "Your colleague" },
  conversations: [],
  items: [
    { id: "w.eins", kind: "word", de: "eins", en: "one", emoji: "1️⃣", example: { de: "Zimmer eins, bitte.", en: "Room one, please." } },
    { id: "w.zwei", kind: "word", de: "zwei", en: "two", emoji: "2️⃣", example: { de: "Ich habe zwei Kinder.", en: "I have two children." } },
    { id: "w.drei", kind: "word", de: "drei", en: "three", emoji: "3️⃣", example: { de: "Das kostet drei Euro.", en: "That costs three euros." } },
    { id: "w.vier", kind: "word", de: "vier", en: "four", emoji: "4️⃣", example: { de: "Wir sind vier Personen.", en: "We are four people." } },
    { id: "w.fuenf", kind: "word", de: "fünf", en: "five", emoji: "5️⃣", example: { de: "Ich brauche fünf Minuten.", en: "I need five minutes." } },
    { id: "w.euro", kind: "word", de: "der Euro", en: "the euro", gender: "m", plural: "die Euro", emoji: "💶", example: { de: "Das kostet zehn Euro.", en: "That costs ten euros." }, note: "With prices, Euro stays singular: zehn Euro." },
    { id: "w.zehn", kind: "word", de: "zehn", en: "ten", emoji: "🔟", example: { de: "Es ist zehn Uhr.", en: "It is ten o'clock." } },
    { id: "w.zwanzig", kind: "word", de: "zwanzig", en: "twenty", emoji: "💯", example: { de: "Der Kaffee kostet drei Euro zwanzig.", en: "The coffee costs three euros twenty." } },
    { id: "p.was-kostet-das", kind: "phrase", de: "Was kostet das?", en: "How much is that?", emoji: "🏷️", alt: ["Wie viel kostet das?"] },
    { id: "w.teuer", kind: "word", de: "teuer", en: "expensive", emoji: "💸", example: { de: "Das ist zu teuer.", en: "That is too expensive." } },
    { id: "p.wie-spaet-ist-es", kind: "phrase", de: "Wie spät ist es?", en: "What time is it?", emoji: "🕐", alt: ["Wie viel Uhr ist es?"] },
    { id: "w.uhr", kind: "word", de: "die Uhr", en: "the clock; o'clock", gender: "f", plural: "die Uhren", emoji: "⏰", example: { de: "Es ist drei Uhr.", en: "It is three o'clock." } },
    { id: "p.um-acht-uhr", kind: "phrase", de: "um acht Uhr", en: "at eight o'clock", emoji: "🕗" },
    { id: "w.halb", kind: "word", de: "halb", en: "half (to the next hour)", emoji: "🕧", example: { de: "Es ist halb acht.", en: "It is half past seven." }, note: "halb acht = 7:30. German counts towards the next hour." },
    { id: "w.jetzt", kind: "word", de: "jetzt", en: "now", emoji: "⏱️", example: { de: "Ich habe jetzt Zeit.", en: "I have time now." } },
    { id: "w.montag", kind: "word", de: "der Montag", en: "Monday", gender: "m", plural: "die Montage", emoji: "📅", example: { de: "Am Montag arbeite ich.", en: "On Monday I work." }, note: "All days are masculine: der Montag, der Dienstag ..." },
    { id: "w.freitag", kind: "word", de: "der Freitag", en: "Friday", gender: "m", plural: "die Freitage", emoji: "🗓️", example: { de: "Am Freitag habe ich Zeit.", en: "On Friday I have time." } },
    { id: "w.wochenende", kind: "word", de: "das Wochenende", en: "the weekend", gender: "n", plural: "die Wochenenden", emoji: "🎉", example: { de: "Am Wochenende bin ich zu Hause.", en: "At the weekend I'm at home." } },
    { id: "w.heute", kind: "word", de: "heute", en: "today", emoji: "📆", example: { de: "Heute habe ich Zeit.", en: "Today I have time." } },
    { id: "w.morgen", kind: "word", de: "morgen", en: "tomorrow", emoji: "🌄", example: { de: "Bis morgen!", en: "See you tomorrow!" }, note: "morgen (small m) = tomorrow; der Morgen = the morning." },
  ],
  lessons: [
    {
      id: "a1-u02-l1", title: "One, two, three", goal: "Count to five and say how many", pattern: "g.haben",
      newItems: ["w.eins", "w.zwei", "w.drei", "w.vier", "w.fuenf"],
      sentences: [
        { de: "Ich habe zwei Kinder.", en: "I have two children." },
        { de: "Das kostet drei Euro.", en: "That costs three euros.", gap: "drei", distractors: ["zwei", "vier"] },
        { de: "Guten Tag, wir sind vier Personen.", en: "Hello, we are four people." },
      ],
      dialogue: [
        { line: "Wie viele Kinder haben Sie?", lineEn: "How many children do you have?", task: "Say you have two children.", accepted: ["Ich habe zwei Kinder.", "Zwei Kinder.", "Zwei."] },
        { line: "Und wie viele Geschwister?", lineEn: "And how many siblings?", task: "Say you have three siblings.", accepted: ["Ich habe drei Geschwister.", "Drei Geschwister.", "Drei."] },
      ],
    },
    {
      id: "a1-u02-l2", title: "How much is it?", goal: "Ask for and understand prices", pattern: "g.numbers-21",
      newItems: ["w.euro", "w.zehn", "w.zwanzig", "p.was-kostet-das", "w.teuer"],
      sentences: [
        { de: "Das kostet zehn Euro.", en: "That costs ten euros." },
        { de: "Der Kaffee kostet drei Euro zwanzig.", en: "The coffee costs three euros twenty.", gap: "zwanzig", distractors: ["zwei", "zehn"] },
        { de: "Das ist zu teuer.", en: "That is too expensive.", alt: ["Das ist mir zu teuer."] },
      ],
      dialogue: [
        { line: "Möchten Sie die Tasche?", lineEn: "Would you like the bag?", task: "Ask how much it costs.", accepted: ["Was kostet das?", "Was kostet die Tasche?", "Wie viel kostet das?", "Wie viel kostet die Tasche?"] },
        { line: "Fünfzig Euro.", lineEn: "Fifty euros.", task: "Say that's too expensive.", accepted: ["Das ist zu teuer.", "Zu teuer.", "Das ist mir zu teuer."] },
      ],
    },
    {
      id: "a1-u02-l3", title: "What time is it?", goal: "Tell the time and say when something happens", pattern: "g.time-prepositions",
      newItems: ["p.wie-spaet-ist-es", "w.uhr", "p.um-acht-uhr", "w.halb", "w.jetzt"],
      sentences: [
        { de: "Es ist drei Uhr.", en: "It is three o'clock." },
        { de: "Der Kurs beginnt um neun Uhr.", en: "The course starts at nine o'clock.", gap: "um", distractors: ["am", "im"] },
        { de: "Es ist halb acht.", en: "It is half past seven." },
      ],
      dialogue: [
        { line: "Entschuldigung, wie spät ist es?", lineEn: "Excuse me, what time is it?", task: "Say it's ten o'clock.", accepted: ["Es ist zehn Uhr.", "Zehn Uhr.", "Es ist zehn."] },
        { line: "Danke! Wann beginnt der Film?", lineEn: "Thanks! When does the film start?", task: "Say at eight o'clock.", accepted: ["Um acht Uhr.", "Der Film beginnt um acht Uhr.", "Um acht."] },
      ],
    },
    {
      id: "a1-u02-l4", title: "The week", goal: "Talk about days and plan a time", pattern: "g.verb-position-2",
      newItems: ["w.montag", "w.freitag", "w.wochenende", "w.heute", "w.morgen"],
      sentences: [
        { de: "Am Montag arbeite ich.", en: "On Monday I work.", alt: ["Ich arbeite am Montag."] },
        { de: "Heute habe ich Zeit.", en: "Today I have time.", gap: "habe", distractors: ["hat", "haben"] },
        { de: "Am Wochenende bin ich zu Hause.", en: "At the weekend I am at home.", alt: ["Ich bin am Wochenende zu Hause."] },
      ],
      dialogue: [
        { line: "Hast du am Freitag Zeit?", lineEn: "Do you have time on Friday?", task: "Say yes, on Friday you have time.", accepted: ["Ja, am Freitag habe ich Zeit.", "Ja, ich habe am Freitag Zeit.", "Ja, ich habe Zeit."] },
        { line: "Super! Um wie viel Uhr?", lineEn: "Great! At what time?", task: "Say at seven o'clock.", accepted: ["Um sieben Uhr.", "Um sieben."], note: "sieben = seven." },
      ],
    },
  ],
};
