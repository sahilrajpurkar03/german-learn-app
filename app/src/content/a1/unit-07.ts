import type { Unit } from "../../lib/course/types.ts";

export const unit07: Unit = {
  id: "a1-u07", level: "a1", order: 7, title: "Health", titleDe: "Gesundheit", emoji: "🩺",
  canDo: ["Make a doctor's appointment", "Say what hurts and how you feel", "Get medicine at the pharmacy"],
  partner: { name: "Frau Keller", role: "Doctor's receptionist" },
  conversations: ["appointment", "doctor", "pharmacy", "dentist", "optician", "urgent-help"],
  items: [
    { id: "w.kopf", kind: "word", de: "der Kopf", en: "the head", gender: "m", plural: "die Köpfe", emoji: "🗣️", example: { de: "Mein Kopf tut weh.", en: "My head hurts." } },
    { id: "w.bauch", kind: "word", de: "der Bauch", en: "the stomach; the belly", gender: "m", plural: "die Bäuche", emoji: "🫄", example: { de: "Mein Bauch tut weh.", en: "My stomach hurts." } },
    { id: "w.hals", kind: "word", de: "der Hals", en: "the throat; the neck", gender: "m", plural: "die Hälse", emoji: "🧣", example: { de: "Ich habe Halsschmerzen.", en: "I have a sore throat." } },
    { id: "w.ruecken", kind: "word", de: "der Rücken", en: "the back", gender: "m", plural: "die Rücken", emoji: "🧍", example: { de: "Mein Rücken tut weh.", en: "My back hurts." } },
    { id: "w.arm", kind: "word", de: "der Arm", en: "the arm", gender: "m", plural: "die Arme", emoji: "💪", example: { de: "Mein Arm tut weh.", en: "My arm hurts." } },
    { id: "w.termin", kind: "word", de: "der Termin", en: "the appointment", gender: "m", plural: "die Termine", emoji: "📅", example: { de: "Ich brauche einen Termin.", en: "I need an appointment." } },
    { id: "w.arzt", kind: "word", de: "der Arzt", en: "the doctor (male)", gender: "m", plural: "die Ärzte", emoji: "👨‍⚕️", example: { de: "Ich gehe zum Arzt.", en: "I'm going to the doctor." } },
    { id: "w.aerztin", kind: "word", de: "die Ärztin", en: "the doctor (female)", gender: "f", plural: "die Ärztinnen", emoji: "👩‍⚕️", example: { de: "Die Ärztin ist sehr nett.", en: "The doctor is very nice." } },
    { id: "p.ich-brauche-einen-termin", kind: "phrase", de: "Ich brauche einen Termin.", en: "I need an appointment.", emoji: "🗓️", alt: ["Ich möchte einen Termin."] },
    { id: "w.versichertenkarte", kind: "word", de: "die Versichertenkarte", en: "the health insurance card", gender: "f", plural: "die Versichertenkarten", emoji: "💳", example: { de: "Hier ist meine Versichertenkarte.", en: "Here is my insurance card." } },
    { id: "w.krank", kind: "word", de: "krank", en: "ill; sick", emoji: "🤒", example: { de: "Ich bin krank.", en: "I am ill." } },
    { id: "w.fieber", kind: "word", de: "das Fieber", en: "the fever", gender: "n", emoji: "🌡️", example: { de: "Ich habe Fieber.", en: "I have a fever." } },
    { id: "w.husten", kind: "word", de: "der Husten", en: "the cough", gender: "m", emoji: "😷", example: { de: "Ich habe Husten.", en: "I have a cough." } },
    { id: "w.muede", kind: "word", de: "müde", en: "tired", emoji: "😴", example: { de: "Ich bin sehr müde.", en: "I am very tired." } },
    { id: "w.schlafen", kind: "word", de: "schlafen", en: "to sleep", emoji: "🛌", example: { de: "Ich schlafe schlecht.", en: "I sleep badly." }, note: "du schläfst, er schläft." },
    { id: "w.apotheke", kind: "word", de: "die Apotheke", en: "the pharmacy", gender: "f", plural: "die Apotheken", emoji: "⚕️", example: { de: "Die Apotheke ist am Bahnhof.", en: "The pharmacy is at the station." } },
    { id: "w.tablette", kind: "word", de: "die Tablette", en: "the tablet; the pill", gender: "f", plural: "die Tabletten", emoji: "💊", example: { de: "Nehmen Sie eine Tablette.", en: "Take one tablet." } },
    { id: "w.rezept", kind: "word", de: "das Rezept", en: "the prescription", gender: "n", plural: "die Rezepte", emoji: "📄", example: { de: "Ich habe ein Rezept.", en: "I have a prescription." }, note: "Also means recipe." },
    { id: "w.gegen", kind: "word", de: "gegen", en: "against; for (a symptom)", emoji: "🛡️", example: { de: "Haben Sie etwas gegen Kopfschmerzen?", en: "Do you have something for headaches?" } },
    { id: "p.wie-oft", kind: "phrase", de: "Wie oft?", en: "How often?", emoji: "🔁" },
  ],
  lessons: [
    {
      id: "a1-u07-l1", title: "The body", goal: "Say what hurts", pattern: "g.weh-tun",
      newItems: ["w.kopf", "w.bauch", "w.hals", "w.ruecken", "w.arm"],
      sentences: [
        { de: "Heute tut mein Kopf weh.", en: "My head hurts today.", alt: ["Mein Kopf tut heute weh."] },
        { de: "Mein Rücken tut weh.", en: "My back hurts.", gap: "Rücken", distractors: ["Kopf", "Hals"] },
        { de: "Ich habe Halsschmerzen.", en: "I have a sore throat." },
      ],
      dialogue: [
        { line: "Was fehlt Ihnen?", lineEn: "What's wrong?", task: "Say your head hurts.", accepted: ["Mein Kopf tut weh.", "Ich habe Kopfschmerzen.", "Der Kopf tut weh."] },
        { line: "Seit wann?", lineEn: "Since when?", task: "Say since yesterday.", accepted: ["Seit gestern.", "Seit gestern Abend."] },
      ],
    },
    {
      id: "a1-u07-l2", title: "Seeing a doctor", goal: "Make a doctor's appointment",
      newItems: ["w.termin", "w.arzt", "w.aerztin", "p.ich-brauche-einen-termin", "w.versichertenkarte"],
      sentences: [
        { de: "Ich brauche einen Termin beim Arzt.", en: "I need an appointment with the doctor." },
        { de: "Haben Sie morgen einen Termin frei?", en: "Do you have an appointment free tomorrow?", gap: "Termin", distractors: ["Arzt", "Kopf"] },
        { de: "Hier ist meine Versichertenkarte.", en: "Here is my insurance card." },
      ],
      dialogue: [
        { line: "Praxis Dr. Keller, guten Tag.", lineEn: "Dr Keller's practice, hello.", task: "Say you need an appointment.", accepted: ["Ich brauche einen Termin.", "Guten Tag, ich brauche einen Termin.", "Ich möchte einen Termin."] },
        { line: "Geht es morgen um zehn Uhr?", lineEn: "Does tomorrow at ten work?", task: "Say yes, that works (das geht).", accepted: ["Ja, das geht.", "Ja, das passt.", "Ja, gern."] },
      ],
    },
    {
      id: "a1-u07-l3", title: "Feeling ill", goal: "Describe how you feel", pattern: "g.sein-oder-haben",
      newItems: ["w.krank", "w.fieber", "w.husten", "w.muede", "w.schlafen"],
      sentences: [
        { de: "Ich bin krank.", en: "I am ill." },
        { de: "Ich habe Fieber und Husten.", en: "I have a fever and a cough.", gap: "habe", distractors: ["bin", "ist"] },
        { de: "Ich schlafe schlecht.", en: "I sleep badly." },
      ],
      dialogue: [
        { line: "Wie geht es Ihnen heute?", lineEn: "How are you today?", task: "Say you're ill and have a fever.", accepted: ["Ich bin krank und habe Fieber.", "Ich bin krank. Ich habe Fieber.", "Nicht gut, ich habe Fieber.", "Ich bin krank und ich habe Fieber."] },
        { line: "Dann bleiben Sie zu Hause!", lineEn: "Then stay at home!", task: "Say OK, thank you.", accepted: ["Okay, danke.", "Gut, danke.", "Danke.", "Ok, danke."] },
      ],
    },
    {
      id: "a1-u07-l4", title: "At the pharmacy", goal: "Ask for medicine and understand how to take it",
      newItems: ["w.apotheke", "w.tablette", "w.rezept", "w.gegen", "p.wie-oft"],
      sentences: [
        { de: "Haben Sie etwas gegen Kopfschmerzen?", en: "Do you have something for headaches?" },
        { de: "Nehmen Sie eine Tablette nach dem Essen.", en: "Take one tablet after meals.", gap: "Tablette", distractors: ["Apotheke", "Rezept"] },
        { de: "Ich habe ein Rezept.", en: "I have a prescription." },
      ],
      dialogue: [
        { line: "Guten Tag, was kann ich für Sie tun?", lineEn: "Hello, what can I do for you?", task: "Ask if they have something for a cough.", accepted: ["Haben Sie etwas gegen Husten?", "Ich brauche etwas gegen Husten."] },
        { line: "Ja, diesen Saft hier.", lineEn: "Yes, this syrup here.", task: "Ask how often you have to take it (Wie oft muss ich ihn nehmen?).", accepted: ["Wie oft muss ich ihn nehmen?", "Wie oft?", "Wie oft soll ich ihn nehmen?"] },
      ],
    },
  ],
};
