import { tokens } from "./build-lesson.ts";
import { GRADED_TYPES } from "./types.ts";
import type { Lesson, Pattern, Unit } from "./types.ts";

const ARTICLE: Record<string, string> = { m: "der", f: "die", n: "das" };

/** Authoring rules for course content. Every error is a human-readable sentence. */
export function validateCourse(units: Unit[], patterns: Pattern[], lessons: Lesson[], missionIds: Set<string>): string[] {
  const errors: string[] = [];
  const seenItems = new Map<string, string>();
  const patternIds = new Set(patterns.map((pattern) => pattern.id));
  const usedPatterns = new Map<string, string>();
  const usedMissions = new Map<string, string>();

  for (const pattern of patterns) {
    if (!pattern.id.startsWith("g.")) errors.push(`${pattern.id}: pattern ids start with "g."`);
    if (pattern.drills.length < 3) errors.push(`${pattern.id}: needs at least 3 drills`);
    if (pattern.examples.length < 2) errors.push(`${pattern.id}: needs at least 2 examples`);
    pattern.drills.forEach((drill, index) => {
      const where = `${pattern.id} drill ${index + 1}`;
      if (drill.sentence.split("___").length !== 2) errors.push(`${where}: sentence needs exactly one ___ gap`);
      if (!drill.options.includes(drill.answer)) errors.push(`${where}: answer is not among the options`);
      if (new Set(drill.options).size !== drill.options.length) errors.push(`${where}: duplicate options`);
      for (const option of Object.keys(drill.why ?? {})) if (!drill.options.includes(option)) errors.push(`${where}: explanation for "${option}", which is not an option`);
      for (const option of drill.options) if (option !== drill.answer && !drill.why?.[option]) errors.push(`${where}: wrong option "${option}" has no explanation`);
    });
  }

  for (const unit of units) {
    const introduced = new Set<string>();
    for (const item of unit.items) {
      if (seenItems.has(item.id)) errors.push(`${item.id}: defined in both ${seenItems.get(item.id)} and ${unit.id}`);
      seenItems.set(item.id, unit.id);
      if (item.kind === "word" && !item.id.startsWith("w.")) errors.push(`${item.id}: word ids start with "w."`);
      if (item.kind === "phrase" && !item.id.startsWith("p.")) errors.push(`${item.id}: phrase ids start with "p."`);
      if (item.gender && !item.de.startsWith(`${ARTICLE[item.gender]} `)) errors.push(`${item.id}: "${item.de}" should start with ${ARTICLE[item.gender]}`);
      if (!item.gender && /^(der|die|das) [A-ZÄÖÜ]/.test(item.de)) errors.push(`${item.id}: noun "${item.de}" needs a gender`);
      if (item.kind === "word" && !item.example) errors.push(`${item.id}: words need an example sentence`);
    }
    for (const lesson of unit.lessons) {
      if (lesson.newItems.length < 4 || lesson.newItems.length > 6) errors.push(`${lesson.id}: introduce 4–6 new items (has ${lesson.newItems.length})`);
      for (const id of lesson.newItems) {
        if (!unit.items.some((item) => item.id === id)) errors.push(`${lesson.id}: new item ${id} is not defined in ${unit.id}`);
        if (introduced.has(id)) errors.push(`${lesson.id}: ${id} is introduced twice`);
        introduced.add(id);
      }
      if (lesson.pattern) {
        if (!patternIds.has(lesson.pattern)) errors.push(`${lesson.id}: unknown pattern ${lesson.pattern}`);
        if (usedPatterns.has(lesson.pattern)) errors.push(`${lesson.id}: pattern ${lesson.pattern} already taught in ${usedPatterns.get(lesson.pattern)}`);
        usedPatterns.set(lesson.pattern, lesson.id);
      }
      if (lesson.sentences.length < 2) errors.push(`${lesson.id}: needs at least 2 practice sentences`);
      if (lesson.dialogue.length < 1) errors.push(`${lesson.id}: needs a dialogue`);
      for (const turn of lesson.dialogue) if (turn.accepted.length < 2) errors.push(`${lesson.id}: dialogue reply "${turn.task}" needs at least 2 accepted answers`);
      for (const sentence of lesson.sentences) if (sentence.gap && !tokens(sentence.de).includes(sentence.gap)) errors.push(`${lesson.id}: gap "${sentence.gap}" is not a word of "${sentence.de}"`);
    }
    for (const item of unit.items) if (!introduced.has(item.id)) errors.push(`${item.id}: never introduced by a lesson in ${unit.id}`);
    for (const mission of unit.conversations) {
      if (!missionIds.has(mission)) errors.push(`${unit.id}: unknown conversation ${mission}`);
      if (usedMissions.has(mission)) errors.push(`${unit.id}: conversation ${mission} already used in ${usedMissions.get(mission)}`);
      usedMissions.set(mission, unit.id);
    }
  }
  for (const pattern of patterns) if (!usedPatterns.has(pattern.id)) errors.push(`${pattern.id}: not taught in any lesson`);

  // Generated lessons: introduced before tested, recycling, exercise sanity.
  const stepIds = new Set<string>();
  const known = new Set<string>(patternIds);
  const coreLessons = units.flatMap((unit) => unit.lessons.map((spec) => lessons.find((lesson) => lesson.id === spec.id))).filter((lesson): lesson is Lesson => Boolean(lesson));
  coreLessons.forEach((lesson, position) => {
    const current = new Set(lesson.introduces);
    let recycled = false;
    for (const step of lesson.steps) {
      if (stepIds.has(step.id)) errors.push(`${step.id}: duplicate step id`);
      stepIds.add(step.id);
      if (!GRADED_TYPES.has(step.type)) continue;
      for (const key of step.itemKeys) {
        if (!known.has(key) && !current.has(key)) errors.push(`${step.id}: tests ${key} before it is introduced`);
        if (known.has(key) && !key.startsWith("g.")) recycled = true;
      }
    }
    if (position > 0 && !recycled) errors.push(`${lesson.id}: reuses nothing from earlier lessons`);
    for (const id of lesson.introduces) known.add(id);
  });
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      if (lesson.kind !== "core") {
        if (stepIds.has(step.id)) errors.push(`${step.id}: duplicate step id`);
        stepIds.add(step.id);
      }
      if (step.options && step.accepted.length && !step.options.some((option) => step.accepted.includes(option))) errors.push(`${step.id}: no option is correct`);
      if (step.options && new Set(step.options).size !== step.options.length) errors.push(`${step.id}: duplicate options`);
      if (step.type === "build" && lesson.kind !== "conversation" && step.tiles && step.tiles.length < tokens(step.accepted[0]).length + 2) errors.push(`${step.id}: build step needs at least 2 distractor tiles`);
      if (GRADED_TYPES.has(step.type) && step.type !== "match" && !step.accepted.length) errors.push(`${step.id}: nothing is accepted`);
    }
  }
  return errors;
}
