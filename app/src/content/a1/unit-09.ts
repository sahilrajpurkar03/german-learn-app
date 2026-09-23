import type { Unit } from "../../lib/course/types.ts";

export const unit09: Unit = {
  id: "a1-u09", level: "a1", order: 9, title: "Work & study", titleDe: "Arbeit & Studium", emoji: "💼",
  canDo: ["Say what you do for work", "Talk about your working day and call in sick", "Ask for help in a class"],
  partner: { name: "Lena", role: "Your colleague" },
  conversations: ["first-day", "job-interview", "meeting", "sick-leave", "feedback", "library", "seminar", "exam", "group-project", "professor"],
  items: [
    { id: "w.arbeit", kind: "word", de: "die Arbeit", en: "the work; the job", gender: "f", emoji: "💼", example: { de: "Die Arbeit macht Spaß.", en: "The work is fun." } },
    { id: "w.beruf", kind: "word", de: "der Beruf", en: "the profession", gender: "m", plural: "die Berufe", emoji: "👷", example: { de: "Was sind Sie von Beruf?", en: "What do you do for a living?" } },
    { id: "w.arbeiten", kind: "word", de: "arbeiten", en: "to work", emoji: "🧑‍💻", example: { de: "Ich arbeite in Dortmund.", en: "I work in Dortmund." }, note: "du arbeitest, er arbeitet." },
    { id: "w.kollege", kind: "word", de: "der Kollege", en: "the colleague (male)", gender: "m", plural: "die Kollegen", emoji: "🤝", example: { de: "Mein Kollege heißt Tom.", en: "My colleague is called Tom." } },
    { id: "w.firma", kind: "word", de: "die Firma", en: "the company", gender: "f", plural: "die Firmen", emoji: "🏭", example: { de: "Meine Firma ist in Dortmund.", en: "My company is in Dortmund." } },
    { id: "w.anfangen", kind: "word", de: "anfangen", en: "to start", emoji: "▶️", example: { de: "Ich fange um acht Uhr an.", en: "I start at eight o'clock." } },
    { id: "w.pause", kind: "word", de: "die Pause", en: "the break", gender: "f", plural: "die Pausen", emoji: "☕", example: { de: "Um zwölf mache ich Pause.", en: "At twelve I take a break." } },
    { id: "w.feierabend", kind: "word", de: "der Feierabend", en: "the end of the working day", gender: "m", emoji: "🌇", example: { de: "Um fünf habe ich Feierabend.", en: "I finish work at five." } },
    { id: "w.meeting", kind: "word", de: "das Meeting", en: "the meeting", gender: "n", plural: "die Meetings", emoji: "🗣️", example: { de: "Das Meeting beginnt um zehn.", en: "The meeting starts at ten." } },
    { id: "w.frueh", kind: "word", de: "früh", en: "early", emoji: "🐓", example: { de: "Heute habe ich früh Feierabend.", en: "Today I finish work early." } },
    { id: "w.krankmeldung", kind: "word", de: "die Krankmeldung", en: "the sick note", gender: "f", plural: "die Krankmeldungen", emoji: "📝", example: { de: "Ich schicke Ihnen die Krankmeldung.", en: "I'll send you the sick note." } },
    { id: "p.ich-kann-heute-nicht-kommen", kind: "phrase", de: "Ich kann heute nicht kommen.", en: "I can't come today.", emoji: "🏠" },
    { id: "w.chef", kind: "word", de: "der Chef", en: "the boss (male)", gender: "m", plural: "die Chefs", emoji: "👔", example: { de: "Ich rufe den Chef an.", en: "I'll call the boss." } },
    { id: "w.chefin", kind: "word", de: "die Chefin", en: "the boss (female)", gender: "f", plural: "die Chefinnen", emoji: "👩‍💼", example: { de: "Die Chefin ist im Meeting.", en: "The boss is in a meeting." } },
    { id: "p.gute-besserung", kind: "phrase", de: "Gute Besserung!", en: "Get well soon!", emoji: "💐" },
    { id: "w.kurs", kind: "word", de: "der Kurs", en: "the course; the class", gender: "m", plural: "die Kurse", emoji: "🎓", example: { de: "Der Kurs beginnt um neun.", en: "The class starts at nine." } },
    { id: "w.lernen", kind: "word", de: "lernen", en: "to learn; to study", emoji: "📚", example: { de: "Ich lerne Deutsch.", en: "I'm learning German." } },
    { id: "w.frage", kind: "word", de: "die Frage", en: "the question", gender: "f", plural: "die Fragen", emoji: "❓", example: { de: "Ich habe eine Frage.", en: "I have a question." } },
    { id: "p.koennen-sie-das-wiederholen", kind: "phrase", de: "Können Sie das wiederholen?", en: "Can you repeat that?", emoji: "🔁", alt: ["Können Sie das bitte wiederholen?"] },
    { id: "p.ich-verstehe-das-nicht", kind: "phrase", de: "Ich verstehe das nicht.", en: "I don't understand that.", emoji: "🤷", alt: ["Das verstehe ich nicht."] },
  ],
  lessons: [
    {
      id: "a1-u09-l1", title: "My job", goal: "Say what you do and where you work", pattern: "g.als-beruf",
      newItems: ["w.arbeit", "w.beruf", "w.arbeiten", "w.kollege", "w.firma"],
      sentences: [
        { de: "Ich arbeite als Ingenieur.", en: "I work as an engineer.", alt: ["Ich arbeite als Ingenieurin.", "Ich bin Ingenieur.", "Ich bin Ingenieurin."] },
        { de: "Meine Firma ist in Deutschland.", en: "My company is in Germany.", gap: "Firma", distractors: ["Arbeit", "Kollege"] },
        { de: "Was sind Sie von Beruf?", en: "What do you do for a living?" },
      ],
      dialogue: [
        { line: "Was machen Sie beruflich?", lineEn: "What do you do for work?", task: "Say you work as an engineer.", accepted: ["Ich arbeite als Ingenieur.", "Ich arbeite als Ingenieurin.", "Ich bin Ingenieur.", "Ich bin Ingenieurin."] },
        { line: "Interessant! Wo arbeiten Sie?", lineEn: "Interesting! Where do you work?", task: "Say at a company in Dortmund (bei einer Firma).", accepted: ["Bei einer Firma in Dortmund.", "Ich arbeite bei einer Firma in Dortmund."] },
      ],
    },
    {
      id: "a1-u09-l2", title: "The working day", goal: "Talk about when you work",
      newItems: ["w.anfangen", "w.pause", "w.feierabend", "w.meeting", "w.frueh"],
      sentences: [
        { de: "Ich fange um acht Uhr an.", en: "I start at eight o'clock." },
        { de: "Um zwölf Uhr mache ich Pause.", en: "At twelve I take a break.", gap: "Pause", distractors: ["Arbeit", "Feierabend"] },
        { de: "Heute habe ich früh Feierabend.", en: "Today I finish work early." },
      ],
      dialogue: [
        { line: "Wann fängst du morgens an?", lineEn: "When do you start in the morning?", task: "Say you start at eight.", accepted: ["Ich fange um acht Uhr an.", "Um acht Uhr.", "Um acht.", "Ich fange um acht an."] },
        { line: "Und wann hast du Feierabend?", lineEn: "And when do you finish work?", task: "Say at five o'clock (fünf).", accepted: ["Um fünf Uhr.", "Ich habe um fünf Uhr Feierabend.", "Um fünf."] },
      ],
    },
    {
      id: "a1-u09-l3", title: "Calling in sick", goal: "Tell work you're ill",
      newItems: ["w.krankmeldung", "p.ich-kann-heute-nicht-kommen", "w.chef", "w.chefin", "p.gute-besserung"],
      sentences: [
        { de: "Ich bin krank und kann heute nicht kommen.", en: "I'm ill and can't come today." },
        { de: "Ich schicke Ihnen die Krankmeldung.", en: "I'll send you the sick note.", gap: "Krankmeldung", distractors: ["Pause", "Firma"] },
        { de: "Ich rufe die Chefin an.", en: "I'll call the boss." },
      ],
      dialogue: [
        { line: "Firma Berger, Lena Wolf am Apparat.", lineEn: "Berger company, Lena Wolf speaking.", task: "Say you're ill and can't come today.", accepted: ["Ich bin krank und kann heute nicht kommen.", "Ich bin krank. Ich kann heute nicht kommen.", "Ich kann heute nicht kommen, ich bin krank."] },
        { line: "Oh, gute Besserung! Schicken Sie bitte die Krankmeldung.", lineEn: "Oh, get well soon! Please send the sick note.", task: "Say OK, thank you.", accepted: ["Okay, danke.", "Mache ich, danke.", "Ja, danke.", "Ok, danke."] },
      ],
    },
    {
      id: "a1-u09-l4", title: "In class", goal: "Ask questions when you don't understand",
      newItems: ["w.kurs", "w.lernen", "w.frage", "p.koennen-sie-das-wiederholen", "p.ich-verstehe-das-nicht"],
      sentences: [
        { de: "Ich lerne Deutsch.", en: "I'm learning German." },
        { de: "Ich habe eine Frage.", en: "I have a question.", gap: "Frage", distractors: ["Kurs", "Pause"] },
        { de: "Können Sie bitte langsamer sprechen?", en: "Can you speak more slowly, please?" },
      ],
      dialogue: [
        { line: "Das Perfekt bildet man mit haben oder sein. Alles klar?", lineEn: "You form the perfect tense with haben or sein. All clear?", task: "Say you don't understand that.", accepted: ["Ich verstehe das nicht.", "Nein, ich verstehe das nicht.", "Das verstehe ich nicht."] },
        { line: "Kein Problem. Was ist Ihre Frage?", lineEn: "No problem. What's your question?", task: "Ask them to repeat that.", accepted: ["Können Sie das wiederholen?", "Können Sie das bitte wiederholen?", "Bitte wiederholen Sie das."] },
      ],
    },
  ],
};
