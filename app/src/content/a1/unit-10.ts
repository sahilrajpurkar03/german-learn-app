import type { Unit } from "../../lib/course/types.ts";

export const unit10: Unit = {
  id: "a1-u10", level: "a1", order: 10, title: "Free time", titleDe: "Freizeit", emoji: "🎨",
  canDo: ["Talk about hobbies and what you like", "Make and answer invitations", "Say what you did at the weekend"],
  partner: { name: "Sofia", role: "Your friend" },
  conversations: ["invitation", "gym"],
  items: [
    { id: "w.hobby", kind: "word", de: "das Hobby", en: "the hobby", gender: "n", plural: "die Hobbys", emoji: "🎨", example: { de: "Was sind deine Hobbys?", en: "What are your hobbies?" } },
    { id: "w.lesen", kind: "word", de: "lesen", en: "to read", emoji: "📖", example: { de: "Ich lese gern.", en: "I like reading." }, note: "du liest, er liest." },
    { id: "w.kochen", kind: "word", de: "kochen", en: "to cook", emoji: "👩‍🍳", example: { de: "Ich koche gern.", en: "I like cooking." } },
    { id: "w.schwimmen", kind: "word", de: "schwimmen", en: "to swim", emoji: "🏊", example: { de: "Wir schwimmen am Samstag.", en: "We go swimming on Saturday." } },
    { id: "w.spielen", kind: "word", de: "spielen", en: "to play", emoji: "⚽", example: { de: "Ich spiele Fußball.", en: "I play football." } },
    { id: "w.einladen", kind: "word", de: "einladen", en: "to invite", emoji: "💌", example: { de: "Ich lade dich zu meiner Party ein.", en: "I'm inviting you to my party." } },
    { id: "w.party", kind: "word", de: "die Party", en: "the party", gender: "f", plural: "die Partys", emoji: "🎉", example: { de: "Die Party beginnt um acht.", en: "The party starts at eight." } },
    { id: "w.zeit", kind: "word", de: "die Zeit", en: "the time", gender: "f", emoji: "⏰", example: { de: "Hast du am Samstag Zeit?", en: "Do you have time on Saturday?" } },
    { id: "p.ja-gern", kind: "phrase", de: "Ja, gern!", en: "Yes, I'd love to!", emoji: "😀", alt: ["Ja, gerne!"] },
    { id: "p.leider-kann-ich-nicht", kind: "phrase", de: "Leider kann ich nicht.", en: "Unfortunately I can't.", emoji: "😔" },
    { id: "w.wetter", kind: "word", de: "das Wetter", en: "the weather", gender: "n", emoji: "🌤️", example: { de: "Wie ist das Wetter?", en: "What's the weather like?" } },
    { id: "w.sonne", kind: "word", de: "die Sonne", en: "the sun", gender: "f", emoji: "☀️", example: { de: "Heute scheint die Sonne.", en: "The sun is shining today." } },
    { id: "w.regen", kind: "word", de: "der Regen", en: "the rain", gender: "m", emoji: "🌧️", example: { de: "Morgen gibt es Regen.", en: "There will be rain tomorrow." } },
    { id: "w.kalt", kind: "word", de: "kalt", en: "cold", emoji: "🥶", example: { de: "Es ist sehr kalt.", en: "It's very cold." } },
    { id: "w.warm", kind: "word", de: "warm", en: "warm", emoji: "🌡️", example: { de: "Im Sommer ist es warm.", en: "It's warm in summer." } },
    { id: "p.was-hast-du-gemacht", kind: "phrase", de: "Was hast du gemacht?", en: "What did you do?", emoji: "🤔" },
    { id: "w.gestern", kind: "word", de: "gestern", en: "yesterday", emoji: "⏪", example: { de: "Gestern habe ich gekocht.", en: "Yesterday I cooked." } },
    { id: "w.besuchen", kind: "word", de: "besuchen", en: "to visit", emoji: "🏡", example: { de: "Ich besuche meine Freunde.", en: "I'm visiting my friends." } },
    { id: "p.ich-war", kind: "phrase", de: "ich war", en: "I was", emoji: "🕰️" },
    { id: "w.kino", kind: "word", de: "das Kino", en: "the cinema", gender: "n", plural: "die Kinos", emoji: "🎬", example: { de: "Ich war im Kino.", en: "I was at the cinema." } },
  ],
  lessons: [
    {
      id: "a1-u10-l1", title: "Hobbies", goal: "Say what you like doing", pattern: "g.gern",
      newItems: ["w.hobby", "w.lesen", "w.kochen", "w.schwimmen", "w.spielen"],
      sentences: [
        { de: "Ich koche gern.", en: "I like cooking." },
        { de: "Am Wochenende lese ich gern.", en: "At the weekend I like reading.", gap: "gern", distractors: ["gut", "viel"] },
        { de: "Was sind deine Hobbys?", en: "What are your hobbies?" },
      ],
      dialogue: [
        { line: "Was machst du gern in deiner Freizeit?", lineEn: "What do you like doing in your free time?", task: "Say you like cooking and reading.", accepted: ["Ich koche und lese gern.", "Ich koche gern und lese gern.", "Ich koche gern und ich lese gern.", "Ich lese und koche gern."] },
        { line: "Cool! Ich schwimme gern.", lineEn: "Cool! I like swimming.", task: "Ask how often she swims.", accepted: ["Wie oft schwimmst du?", "Wie oft gehst du schwimmen?"] },
      ],
    },
    {
      id: "a1-u10-l2", title: "An invitation", goal: "Invite someone and reply",
      newItems: ["w.einladen", "w.party", "w.zeit", "p.ja-gern", "p.leider-kann-ich-nicht"],
      sentences: [
        { de: "Ich lade dich zu meiner Party ein.", en: "I'm inviting you to my party." },
        { de: "Hast du am Samstag Zeit?", en: "Do you have time on Saturday?", gap: "Zeit", distractors: ["Party", "Hobby"] },
        { de: "Leider habe ich heute keine Zeit.", en: "Unfortunately I don't have time today." },
      ],
      dialogue: [
        { line: "Ich mache am Samstag eine Party. Kommst du?", lineEn: "I'm having a party on Saturday. Are you coming?", task: "Say yes, you'd love to.", accepted: ["Ja, gern!", "Ja, gerne!", "Ja, ich komme gern."] },
        { line: "Super! Um acht Uhr bei mir.", lineEn: "Great! At eight at my place.", task: "Ask if you should bring something (Soll ich etwas mitbringen?).", accepted: ["Soll ich etwas mitbringen?", "Kann ich etwas mitbringen?"] },
      ],
    },
    {
      id: "a1-u10-l3", title: "The weather", goal: "Talk about the weather", pattern: "g.es",
      newItems: ["w.wetter", "w.sonne", "w.regen", "w.kalt", "w.warm"],
      sentences: [
        { de: "Heute scheint die Sonne.", en: "The sun is shining today.", alt: ["Die Sonne scheint heute."] },
        { de: "Es ist sehr kalt.", en: "It is very cold.", gap: "kalt", distractors: ["warm", "teuer"] },
        { de: "Morgen gibt es Regen.", en: "There will be rain tomorrow." },
      ],
      dialogue: [
        { line: "Wie ist das Wetter bei euch?", lineEn: "What's the weather like where you are?", task: "Say it's cold and raining (es regnet).", accepted: ["Es ist kalt und es regnet.", "Es ist kalt und regnet.", "Kalt, und es regnet."] },
        { line: "Hier scheint die Sonne!", lineEn: "The sun is shining here!", task: "Say: Lucky you! (Du hast Glück!)", accepted: ["Du hast Glück!", "Du hast aber Glück!"] },
      ],
    },
    {
      id: "a1-u10-l4", title: "The weekend", goal: "Say what you did", pattern: "g.perfekt-intro",
      newItems: ["p.was-hast-du-gemacht", "w.gestern", "w.besuchen", "p.ich-war", "w.kino"],
      sentences: [
        { de: "Am Wochenende habe ich meine Freunde besucht.", en: "At the weekend I visited my friends.", alt: ["Ich habe am Wochenende meine Freunde besucht."] },
        { de: "Gestern habe ich gekocht.", en: "Yesterday I cooked.", gap: "habe", distractors: ["bin", "hat"] },
        { de: "Ich war im Kino.", en: "I was at the cinema." },
      ],
      dialogue: [
        { line: "Na, was hast du am Wochenende gemacht?", lineEn: "So, what did you do at the weekend?", task: "Say you visited friends.", accepted: ["Ich habe Freunde besucht.", "Ich habe meine Freunde besucht."] },
        { line: "Schön! Und gestern?", lineEn: "Nice! And yesterday?", task: "Say you were at the cinema.", accepted: ["Ich war im Kino.", "Gestern war ich im Kino."] },
      ],
    },
  ],
};
