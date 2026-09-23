import type { Unit } from "../../lib/course/types.ts";

export const unit01: Unit = {
  id: "a1-u01", level: "a1", order: 1, title: "Hello!", titleDe: "Hallo!", emoji: "👋",
  canDo: ["Greet people and say goodbye", "Say your name and where you're from", "Ask how someone is"],
  partner: { name: "Anna", role: "Your new neighbour" },
  conversations: ["neighbors"],
  items: [
    { id: "p.hallo", kind: "phrase", de: "Hallo!", en: "Hello!", emoji: "👋", note: "Works with everyone, any time of day." },
    { id: "p.guten-morgen", kind: "phrase", de: "Guten Morgen!", en: "Good morning!", emoji: "🌅", note: "Until about 11 am." },
    { id: "p.guten-tag", kind: "phrase", de: "Guten Tag!", en: "Hello! (formal)", emoji: "☀️", note: "The polite greeting for shops, offices and strangers." },
    { id: "p.tschuess", kind: "phrase", de: "Tschüss!", en: "Bye!", emoji: "🙋", note: "Friendly and very common." },
    { id: "p.auf-wiedersehen", kind: "phrase", de: "Auf Wiedersehen!", en: "Goodbye! (formal)", emoji: "🚪" },
    { id: "p.wie-heissen-sie", kind: "phrase", de: "Wie heißen Sie?", en: "What's your name? (formal)", emoji: "🙂" },
    { id: "p.wie-heisst-du", kind: "phrase", de: "Wie heißt du?", en: "What's your name? (informal)", emoji: "😊" },
    { id: "w.heissen", kind: "word", de: "heißen", en: "to be called", emoji: "🏷️", example: { de: "Ich heiße Ravi.", en: "My name is Ravi." } },
    { id: "p.freut-mich", kind: "phrase", de: "Freut mich!", en: "Nice to meet you!", emoji: "🤝" },
    { id: "w.name", kind: "word", de: "der Name", en: "the name", gender: "m", plural: "die Namen", emoji: "📛", example: { de: "Mein Name ist Ravi.", en: "My name is Ravi." } },
    { id: "p.woher-kommen-sie", kind: "phrase", de: "Woher kommen Sie?", en: "Where are you from? (formal)", emoji: "🌍" },
    { id: "w.kommen", kind: "word", de: "kommen", en: "to come", emoji: "➡️", example: { de: "Ich komme aus Indien.", en: "I come from India." } },
    { id: "p.ich-komme-aus-indien", kind: "phrase", de: "Ich komme aus Indien.", en: "I'm from India.", emoji: "🇮🇳", note: "aus + country: aus Indien, aus Brasilien, aus der Türkei." },
    { id: "w.wohnen", kind: "word", de: "wohnen", en: "to live (somewhere)", emoji: "🏠", example: { de: "Ich wohne in Dortmund.", en: "I live in Dortmund." } },
    { id: "w.deutschland", kind: "word", de: "Deutschland", en: "Germany", emoji: "🇩🇪", example: { de: "Ich wohne in Deutschland.", en: "I live in Germany." } },
    { id: "p.wie-gehts", kind: "phrase", de: "Wie geht's?", en: "How are you? (informal)", emoji: "🤔", alt: ["Wie geht es?", "Wie gehts?"] },
    { id: "p.wie-geht-es-ihnen", kind: "phrase", de: "Wie geht es Ihnen?", en: "How are you? (formal)", emoji: "🎩" },
    { id: "p.gut-danke", kind: "phrase", de: "Gut, danke!", en: "Good, thanks!", emoji: "👍", alt: ["Danke, gut!"] },
    { id: "p.und-ihnen", kind: "phrase", de: "Und Ihnen?", en: "And you? (formal)", emoji: "↩️" },
    { id: "p.nicht-so-gut", kind: "phrase", de: "Nicht so gut.", en: "Not so good.", emoji: "😕" },
  ],
  lessons: [
    {
      id: "a1-u01-l1", title: "Hello and goodbye", goal: "Greet people and say goodbye",
      newItems: ["p.hallo", "p.guten-morgen", "p.guten-tag", "p.tschuess", "p.auf-wiedersehen"],
      sentences: [
        { de: "Guten Morgen, Anna!", en: "Good morning, Anna!" },
        { de: "Guten Tag, Herr Weber!", en: "Hello, Mr Weber!", gap: "Tag", distractors: ["Morgen", "Abend"] },
        { de: "Tschüss, bis morgen!", en: "Bye, see you tomorrow!" },
      ],
      dialogue: [
        { line: "Hallo! Ich bin Anna.", lineEn: "Hello! I'm Anna.", task: "Say hello back.", accepted: ["Hallo!", "Hallo, Anna!", "Guten Tag!", "Guten Tag, Anna!"] },
        { line: "Tschüss, bis bald!", lineEn: "Bye, see you soon!", task: "Say bye.", accepted: ["Tschüss!", "Tschüss, Anna!", "Tschüss, bis bald!", "Auf Wiedersehen!"] },
      ],
    },
    {
      id: "a1-u01-l2", title: "What's your name?", goal: "Say your name and ask for someone's name", pattern: "g.verb-endings",
      newItems: ["p.wie-heissen-sie", "p.wie-heisst-du", "w.heissen", "p.freut-mich", "w.name"],
      sentences: [
        { de: "Ich heiße Maria.", en: "My name is Maria.", alt: ["Mein Name ist Maria."] },
        { de: "Wie heißen Sie?", en: "What is your name? (formal)", gap: "heißen", distractors: ["heißt", "heiße"] },
        { de: "Mein Name ist Ravi.", en: "My name is Ravi.", alt: ["Ich heiße Ravi."] },
      ],
      dialogue: [
        { line: "Guten Tag! Wie heißen Sie?", lineEn: "Hello! What's your name?", task: "Say your name is Sam.", accepted: ["Guten Tag! Ich heiße Sam.", "Ich heiße Sam.", "Mein Name ist Sam.", "Ich bin Sam.", "Hallo, ich heiße Sam."] },
        { line: "Freut mich, Sam!", lineEn: "Nice to meet you, Sam!", task: "Say: Nice to meet you too.", accepted: ["Freut mich auch!", "Mich auch!", "Freut mich!"], note: "auch = too, also." },
      ],
    },
    {
      id: "a1-u01-l3", title: "Where are you from?", goal: "Say where you're from and where you live", pattern: "g.w-questions",
      newItems: ["p.woher-kommen-sie", "w.kommen", "p.ich-komme-aus-indien", "w.wohnen", "w.deutschland"],
      sentences: [
        { de: "Hallo! Ich komme aus Indien.", en: "Hello! I'm from India.", alt: ["Hallo, ich komme aus Indien."] },
        { de: "Ich wohne in Dortmund.", en: "I live in Dortmund.", gap: "wohne", distractors: ["wohnst", "wohnt"] },
        { de: "Woher kommst du?", en: "Where are you from? (informal)" },
      ],
      dialogue: [
        { line: "Woher kommen Sie?", lineEn: "Where are you from?", task: "Say you're from India.", accepted: ["Ich komme aus Indien.", "Aus Indien."] },
        { line: "Und wo wohnen Sie jetzt?", lineEn: "And where do you live now?", task: "Say you live in Dortmund.", accepted: ["Ich wohne in Dortmund.", "In Dortmund.", "Jetzt wohne ich in Dortmund."] },
      ],
    },
    {
      id: "a1-u01-l4", title: "How are you?", goal: "Ask how someone is and answer", pattern: "g.sein",
      newItems: ["p.wie-gehts", "p.wie-geht-es-ihnen", "p.gut-danke", "p.und-ihnen", "p.nicht-so-gut"],
      sentences: [
        { de: "Mir geht es gut, danke.", en: "I'm fine, thank you.", alt: ["Es geht mir gut, danke."] },
        { de: "Ich bin müde.", en: "I am tired.", gap: "bin", distractors: ["ist", "bist"] },
        { de: "Wie geht es Ihnen?", en: "How are you? (formal)" },
      ],
      dialogue: [
        { line: "Hallo! Wie geht es Ihnen?", lineEn: "Hello! How are you?", task: "Say you're good, thanks, and ask back.", accepted: ["Gut, danke! Und Ihnen?", "Danke, gut. Und Ihnen?", "Mir geht es gut, danke. Und Ihnen?", "Sehr gut, danke. Und Ihnen?"] },
        { line: "Auch gut, danke. Tschüss!", lineEn: "Good too, thanks. Bye!", task: "Say goodbye.", accepted: ["Tschüss!", "Auf Wiedersehen!", "Tschüss, bis bald!"] },
      ],
    },
  ],
};
