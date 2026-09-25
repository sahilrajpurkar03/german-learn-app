import { hashHex } from "./random.ts";

/** The exact text sent to the voice: markup and ellipses removed. Shared by the app and the audio build script. */
export function speechText(text: string): string {
  return text.replace(/\*\*/g, "").replace(/_{2,}/g, "").replace(/\.\.\.|…/g, "").replace(/\s+/g, " ").trim();
}

export function audioFile(text: string): string {
  return `${hashHex(speechText(text))}.mp3`;
}

/** Every German string in a step that can be played aloud. */
export function stepSpeech(step: { audio?: string; card?: { example?: { de: string } }; patternCard?: { examples: { de: string }[] }; accepted: string[]; type: string; options?: string[] }): string[] {
  const texts = [step.audio, step.card?.example?.de, ...(step.patternCard?.examples.map((example) => example.de) ?? [])];
  if (["type", "respond", "speak", "repeat", "build", "dictation"].includes(step.type)) texts.push(step.accepted[0]);
  if (step.type === "listen_tap") texts.push(...(step.options ?? []));
  return texts.filter((text): text is string => Boolean(text && speechText(text)));
}
