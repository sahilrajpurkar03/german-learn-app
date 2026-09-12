import type { ChapterBlueprint, ChapterInput, PersonalChapter } from "./personal-chapters.ts";

export const sampleInput: ChapterInput = {
  transcript: "I need to change our meeting. Tomorrow does not work for me. Could we meet on Friday instead? I can come at ten. Thank you for your help.",
  focus: "Reschedule a meeting politely",
  level: "a2",
  register: "formal",
  consent: true,
};

export function sampleChapter(): ChapterBlueprint {
  const scenario = (variation: boolean): ChapterBlueprint["original"] => ({
    title: variation ? "Friday is unavailable" : "Move our meeting",
    place: "At the university",
    role: "University coordinator",
    challenge: "Rehearse asking for another meeting time without looking at the text.",
    turns: [
      { kind: "listen", line: variation ? "Am Freitag habe ich leider keine Zeit." : "Passt Ihnen morgen um zehn Uhr?", translation: variation ? "Unfortunately I have no time on Friday." : "Does tomorrow at ten work for you?", task: variation ? "Why do you need a different day?" : "What time is being offered?", options: variation ? ["Friday is unavailable", "The room is closed", "The meeting is cancelled"] : ["At ten", "At nine", "At eleven"], words: null, accepted: [variation ? "Friday is unavailable" : "At ten"], note: "Listen for the day and the reason before choosing your reply." },
      { kind: "build", line: "Wann haben Sie Zeit?", translation: "When do you have time?", task: variation ? "Say that you can come on Monday." : "Say that you can come on Friday.", options: null, words: ["kommen.", variation ? "Montag" : "Freitag", "am", "kann", "Ich"], accepted: [variation ? "Ich kann am Montag kommen." : "Ich kann am Freitag kommen."], note: "With kann, the second verb kommen goes at the end." },
      { kind: "choose", line: "Um wie viel Uhr?", translation: "At what time?", task: "Suggest ten o'clock.", options: ["Um zehn Uhr, bitte.", "Am zehn Uhr, bitte.", "Ich bin zehn Uhr."], words: null, accepted: ["Um zehn Uhr, bitte."], note: "Use um for clock times." },
      { kind: "respond", line: "Gut, das passt. Bis dann!", translation: "Good, that works. See you then!", task: "Thank the coordinator for their help.", options: null, words: null, accepted: ["Vielen Dank f\u00fcr Ihre Hilfe.", "Danke f\u00fcr Ihre Hilfe."], note: "Ihre is appropriate when you address someone formally with Sie." },
    ],
  });
  return {
    title: "Rescheduling a university meeting",
    summary: "Ask for a different day and agree on a time.",
    level: "a2",
    register: "formal",
    targets: [
      { text: "am Freitag kommen", meaning: "come on Friday", kind: "verb", note: "With kann, kommen goes at the end of the sentence.", sourceQuote: "come at ten" },
      { text: "Passt Ihnen morgen?", meaning: "Does tomorrow work for you?", kind: "phrase", note: "Ihnen keeps the question polite and formal.", sourceQuote: "Tomorrow does not work" },
      { text: "um zehn Uhr", meaning: "at ten o'clock", kind: "phrase", note: "Use um with a clock time.", sourceQuote: "at ten" },
    ],
    original: scenario(false),
    variation: scenario(true),
  };
}

export function demoPersonalChapter(): PersonalChapter {
  return { id: "11111111-1111-4111-8111-111111111111", created_at: "2026-09-12T00:00:00.000Z", blueprint: sampleChapter(), progress: {} };
}