import type { Unit } from "../../lib/course/types.ts";

export const unit05: Unit = {
  id: "a1-u05", level: "a1", order: 5, title: "Home & neighbours", titleDe: "Wohnen & Nachbarn", emoji: "🏠",
  canDo: ["Describe your flat", "Talk to neighbours and ask for help", "Report a problem at home"],
  partner: { name: "Frau Schmidt", role: "Your neighbour" },
  conversations: ["apartment", "viewing", "heating", "laundry", "recycling", "parcel", "internet", "rent"],
  items: [
    { id: "w.wohnung", kind: "word", de: "die Wohnung", en: "the flat; the apartment", gender: "f", plural: "die Wohnungen", emoji: "🏢", example: { de: "Meine Wohnung hat drei Zimmer.", en: "My flat has three rooms." } },
    { id: "w.zimmer", kind: "word", de: "das Zimmer", en: "the room", gender: "n", plural: "die Zimmer", emoji: "🚪", example: { de: "Mein Zimmer ist hell.", en: "My room is bright." } },
    { id: "w.kueche", kind: "word", de: "die Küche", en: "the kitchen", gender: "f", plural: "die Küchen", emoji: "🍳", example: { de: "Die Küche ist klein.", en: "The kitchen is small." } },
    { id: "w.bad", kind: "word", de: "das Bad", en: "the bathroom", gender: "n", plural: "die Bäder", emoji: "🛁", example: { de: "Das Bad ist neu.", en: "The bathroom is new." } },
    { id: "w.balkon", kind: "word", de: "der Balkon", en: "the balcony", gender: "m", plural: "die Balkone", emoji: "🌿", example: { de: "Mein Zimmer hat einen Balkon.", en: "My room has a balcony." } },
    { id: "w.nachbar", kind: "word", de: "der Nachbar", en: "the neighbour (male)", gender: "m", plural: "die Nachbarn", emoji: "🧑", example: { de: "Ich bin Ihr neuer Nachbar.", en: "I'm your new neighbour." } },
    { id: "w.nachbarin", kind: "word", de: "die Nachbarin", en: "the neighbour (female)", gender: "f", plural: "die Nachbarinnen", emoji: "👩", example: { de: "Die Nachbarin ist sehr nett.", en: "The neighbour is very nice." } },
    { id: "p.entschuldigung", kind: "phrase", de: "Entschuldigung!", en: "Excuse me! / Sorry!", emoji: "🙇" },
    { id: "w.helfen", kind: "word", de: "helfen", en: "to help", emoji: "🤲", example: { de: "Können Sie mir helfen?", en: "Can you help me?" } },
    { id: "w.leise", kind: "word", de: "leise", en: "quiet", emoji: "🤫", example: { de: "Bitte sei leise!", en: "Please be quiet!" } },
    { id: "w.heizung", kind: "word", de: "die Heizung", en: "the heating", gender: "f", plural: "die Heizungen", emoji: "🔥", example: { de: "Die Heizung funktioniert nicht.", en: "The heating doesn't work." } },
    { id: "w.vermieter", kind: "word", de: "der Vermieter", en: "the landlord", gender: "m", plural: "die Vermieter", emoji: "🔑", example: { de: "Ich muss den Vermieter anrufen.", en: "I have to call the landlord." } },
    { id: "p.funktioniert-nicht", kind: "phrase", de: "funktioniert nicht", en: "doesn't work", emoji: "🚫" },
    { id: "w.anrufen", kind: "word", de: "anrufen", en: "to call (on the phone)", emoji: "📞", example: { de: "Ich rufe morgen an.", en: "I'll call tomorrow." } },
    { id: "w.dringend", kind: "word", de: "dringend", en: "urgent", emoji: "⚠️", example: { de: "Es ist dringend.", en: "It is urgent." } },
    { id: "w.muell", kind: "word", de: "der Müll", en: "the rubbish", gender: "m", emoji: "🗑️", example: { de: "Der Müll kommt in die Tonne.", en: "The rubbish goes in the bin." } },
    { id: "w.paket", kind: "word", de: "das Paket", en: "the parcel", gender: "n", plural: "die Pakete", emoji: "📦", example: { de: "Ich habe ein Paket für Sie.", en: "I have a parcel for you." } },
    { id: "w.schluessel", kind: "word", de: "der Schlüssel", en: "the key", gender: "m", plural: "die Schlüssel", emoji: "🗝️", example: { de: "Wo ist mein Schlüssel?", en: "Where is my key?" } },
    { id: "w.keller", kind: "word", de: "der Keller", en: "the cellar; the basement", gender: "m", plural: "die Keller", emoji: "🪜", example: { de: "Die Waschmaschine ist im Keller.", en: "The washing machine is in the basement." } },
    { id: "w.waschen", kind: "word", de: "waschen", en: "to wash", emoji: "🧺", example: { de: "Ich wasche im Keller.", en: "I do the washing in the basement." } },
  ],
  lessons: [
    {
      id: "a1-u05-l1", title: "My flat", goal: "Describe your home", pattern: "g.possessive",
      newItems: ["w.wohnung", "w.zimmer", "w.kueche", "w.bad", "w.balkon"],
      sentences: [
        { de: "Meine Wohnung hat drei Zimmer.", en: "My flat has three rooms." },
        { de: "Die Küche ist klein.", en: "The kitchen is small.", gap: "Küche", distractors: ["Bad", "Balkon"] },
        { de: "Mein Zimmer hat einen Balkon.", en: "My room has a balcony." },
      ],
      dialogue: [
        { line: "Wie ist deine Wohnung?", lineEn: "What's your flat like?", task: "Say your flat is small but nice (schön).", accepted: ["Meine Wohnung ist klein, aber schön.", "Sie ist klein, aber schön.", "Klein, aber schön."], note: "aber = but." },
        { line: "Hast du einen Balkon?", lineEn: "Do you have a balcony?", task: "Say yes, you have a balcony.", accepted: ["Ja, ich habe einen Balkon.", "Ja, habe ich.", "Ja."] },
      ],
    },
    {
      id: "a1-u05-l2", title: "Neighbours", goal: "Introduce yourself to neighbours and ask for help",
      newItems: ["w.nachbar", "w.nachbarin", "p.entschuldigung", "w.helfen", "w.leise"],
      sentences: [
        { de: "Können Sie mir helfen?", en: "Can you help me?" },
        { de: "Entschuldigung, ich bin Ihr neuer Nachbar.", en: "Excuse me, I'm your new neighbour.", gap: "Nachbar", distractors: ["Wohnung", "Zimmer"] },
        { de: "Es ist hier sehr leise.", en: "It's very quiet here.", alt: ["Hier ist es sehr leise."] },
      ],
      dialogue: [
        { line: "Guten Abend! Sind Sie neu hier?", lineEn: "Good evening! Are you new here?", task: "Say yes, you're new here.", accepted: ["Ja, ich bin neu hier.", "Ja, ich bin der neue Nachbar.", "Ja, ich bin die neue Nachbarin.", "Ja."] },
        { line: "Willkommen! Brauchen Sie Hilfe?", lineEn: "Welcome! Do you need help?", task: "Say thank you, that's very kind (nett).", accepted: ["Danke, das ist sehr nett.", "Vielen Dank, das ist sehr nett.", "Danke, sehr nett."] },
      ],
    },
    {
      id: "a1-u05-l3", title: "Something's broken", goal: "Report a problem at home", pattern: "g.modal-muessen",
      newItems: ["w.heizung", "w.vermieter", "p.funktioniert-nicht", "w.anrufen", "w.dringend"],
      sentences: [
        { de: "Die Heizung funktioniert nicht.", en: "The heating doesn't work." },
        { de: "Ich muss den Vermieter anrufen.", en: "I have to call the landlord.", gap: "muss", distractors: ["musst", "müssen"] },
        { de: "Die Heizung ist kaputt. Es ist dringend.", en: "The heating is broken. It's urgent." },
      ],
      dialogue: [
        { line: "Hausverwaltung Müller, guten Tag.", lineEn: "Müller property management, hello.", task: "Say the heating doesn't work.", accepted: ["Die Heizung funktioniert nicht.", "Guten Tag, die Heizung funktioniert nicht.", "Meine Heizung funktioniert nicht."] },
        { line: "Oh. Seit wann?", lineEn: "Oh. Since when?", task: "Say since yesterday (seit gestern).", accepted: ["Seit gestern.", "Seit gestern Abend."] },
      ],
    },
    {
      id: "a1-u05-l4", title: "Around the building", goal: "Handle parcels, keys and rubbish",
      newItems: ["w.muell", "w.paket", "w.schluessel", "w.keller", "w.waschen"],
      sentences: [
        { de: "Das Paket ist bei der Nachbarin.", en: "The parcel is at the neighbour's." },
        { de: "Ich wasche im Keller.", en: "I do the washing in the basement.", gap: "Keller", distractors: ["Balkon", "Müll"] },
        { de: "Wo ist mein Schlüssel?", en: "Where is my key?" },
      ],
      dialogue: [
        { line: "Hallo! Ich habe ein Paket für Sie.", lineEn: "Hello! I have a parcel for you.", task: "Say thank you very much.", accepted: ["Vielen Dank!", "Danke schön!", "Danke!", "Vielen Dank, das ist nett."] },
        { line: "Kein Problem. Schönen Abend!", lineEn: "No problem. Have a nice evening!", task: "Wish them the same (Ihnen auch).", accepted: ["Ihnen auch!", "Danke, Ihnen auch!", "Gleichfalls!"] },
      ],
    },
  ],
};
