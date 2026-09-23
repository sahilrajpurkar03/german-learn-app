import type { Unit } from "../../lib/course/types.ts";

export const unit08: Unit = {
  id: "a1-u08", level: "a1", order: 8, title: "Offices & bank", titleDe: "Ämter & Bank", emoji: "🏛️",
  canDo: ["Register your address", "Give your personal details and spell your name", "Open an account and send post"],
  partner: { name: "Herr Becker", role: "Clerk at the citizens' office" },
  conversations: ["registration", "bank", "post", "insurance", "residence"],
  items: [
    { id: "w.anmeldung", kind: "word", de: "die Anmeldung", en: "the registration", gender: "f", plural: "die Anmeldungen", emoji: "📝", example: { de: "Die Anmeldung ist im Bürgeramt.", en: "Registration is at the citizens' office." } },
    { id: "w.formular", kind: "word", de: "das Formular", en: "the form", gender: "n", plural: "die Formulare", emoji: "📋", example: { de: "Füllen Sie bitte das Formular aus.", en: "Please fill in the form." } },
    { id: "w.adresse", kind: "word", de: "die Adresse", en: "the address", gender: "f", plural: "die Adressen", emoji: "🏡", example: { de: "Wie ist Ihre Adresse?", en: "What is your address?" } },
    { id: "w.pass", kind: "word", de: "der Pass", en: "the passport", gender: "m", plural: "die Pässe", emoji: "🛂", example: { de: "Hier ist mein Pass.", en: "Here is my passport." } },
    { id: "w.unterschreiben", kind: "word", de: "unterschreiben", en: "to sign", emoji: "✍️", example: { de: "Unterschreiben Sie bitte hier.", en: "Please sign here." } },
    { id: "w.vorname", kind: "word", de: "der Vorname", en: "the first name", gender: "m", plural: "die Vornamen", emoji: "🪪", example: { de: "Mein Vorname ist Priya.", en: "My first name is Priya." } },
    { id: "w.nachname", kind: "word", de: "der Nachname", en: "the surname", gender: "m", plural: "die Nachnamen", emoji: "🔤", example: { de: "Mein Nachname ist Sharma.", en: "My surname is Sharma." } },
    { id: "w.geburtsdatum", kind: "word", de: "das Geburtsdatum", en: "the date of birth", gender: "n", emoji: "🎂", example: { de: "Wie ist Ihr Geburtsdatum?", en: "What is your date of birth?" } },
    { id: "w.telefonnummer", kind: "word", de: "die Telefonnummer", en: "the phone number", gender: "f", plural: "die Telefonnummern", emoji: "📱", example: { de: "Wie ist Ihre Telefonnummer?", en: "What is your phone number?" } },
    { id: "w.buchstabieren", kind: "word", de: "buchstabieren", en: "to spell", emoji: "🔠", example: { de: "Können Sie das bitte buchstabieren?", en: "Can you spell that, please?" } },
    { id: "w.konto", kind: "word", de: "das Konto", en: "the (bank) account", gender: "n", plural: "die Konten", emoji: "🏦", example: { de: "Ich möchte ein Konto eröffnen.", en: "I'd like to open an account." } },
    { id: "w.bank", kind: "word", de: "die Bank", en: "the bank", gender: "f", plural: "die Banken", emoji: "🏛️", example: { de: "Die Bank ist heute geschlossen.", en: "The bank is closed today." }, note: "die Bank also means bench (plural die Bänke)." },
    { id: "w.eroeffnen", kind: "word", de: "eröffnen", en: "to open (an account, a shop)", emoji: "🔓", example: { de: "Ich möchte ein Konto eröffnen.", en: "I'd like to open an account." } },
    { id: "w.ueberweisen", kind: "word", de: "überweisen", en: "to transfer (money)", emoji: "💸", example: { de: "Ich möchte Geld überweisen.", en: "I'd like to transfer money." } },
    { id: "w.geldautomat", kind: "word", de: "der Geldautomat", en: "the cash machine", gender: "m", plural: "die Geldautomaten", emoji: "🏧", example: { de: "Wo ist der nächste Geldautomat?", en: "Where is the nearest cash machine?" } },
    { id: "w.brief", kind: "word", de: "der Brief", en: "the letter", gender: "m", plural: "die Briefe", emoji: "✉️", example: { de: "Ich schicke einen Brief.", en: "I'm sending a letter." } },
    { id: "w.briefmarke", kind: "word", de: "die Briefmarke", en: "the stamp", gender: "f", plural: "die Briefmarken", emoji: "📮", example: { de: "Eine Briefmarke, bitte.", en: "A stamp, please." } },
    { id: "w.schicken", kind: "word", de: "schicken", en: "to send", emoji: "📤", example: { de: "Ich möchte ein Paket schicken.", en: "I'd like to send a parcel." } },
    { id: "w.post", kind: "word", de: "die Post", en: "the post office; the post", gender: "f", emoji: "🏤", example: { de: "Ich gehe zur Post.", en: "I'm going to the post office." } },
    { id: "w.dauern", kind: "word", de: "dauern", en: "to take (time); to last", emoji: "⌛", example: { de: "Wie lange dauert das?", en: "How long does that take?" } },
  ],
  lessons: [
    {
      id: "a1-u08-l1", title: "Registering", goal: "Register your address", pattern: "g.sie-du",
      newItems: ["w.anmeldung", "w.formular", "w.adresse", "w.pass", "w.unterschreiben"],
      sentences: [
        { de: "Ich möchte mich anmelden.", en: "I would like to register." },
        { de: "Hier ist mein Pass.", en: "Here is my passport.", gap: "Pass", distractors: ["Formular", "Adresse"] },
        { de: "Unterschreiben Sie bitte hier.", en: "Please sign here.", alt: ["Bitte unterschreiben Sie hier."] },
      ],
      dialogue: [
        { line: "Guten Morgen, was kann ich für Sie tun?", lineEn: "Good morning, what can I do for you?", task: "Say you'd like to register.", accepted: ["Ich möchte mich anmelden.", "Guten Morgen, ich möchte mich anmelden."] },
        { line: "Haben Sie Ihren Pass dabei?", lineEn: "Do you have your passport with you?", task: "Say yes, here it is.", accepted: ["Ja, hier ist er.", "Ja, hier.", "Ja, hier ist mein Pass.", "Ja, hier bitte."] },
      ],
    },
    {
      id: "a1-u08-l2", title: "Personal details", goal: "Give your details and spell your name",
      newItems: ["w.vorname", "w.nachname", "w.geburtsdatum", "w.telefonnummer", "w.buchstabieren"],
      sentences: [
        { de: "Mein Vorname ist Priya.", en: "My first name is Priya." },
        { de: "Können Sie das bitte buchstabieren?", en: "Can you spell that, please?", gap: "buchstabieren", distractors: ["unterschreiben", "umsteigen"] },
        { de: "Wie ist Ihre Telefonnummer?", en: "What is your phone number?" },
      ],
      dialogue: [
        { line: "Wie ist Ihr Nachname?", lineEn: "What is your surname?", task: "Say your surname is Sharma.", accepted: ["Mein Nachname ist Sharma.", "Sharma.", "Ich heiße Sharma."] },
        { line: "Können Sie das bitte buchstabieren?", lineEn: "Can you spell that, please?", task: "Spell it: S-H-A-R-M-A.", accepted: ["S-H-A-R-M-A", "S H A R M A"] },
      ],
    },
    {
      id: "a1-u08-l3", title: "At the bank", goal: "Open an account and get cash",
      newItems: ["w.konto", "w.bank", "w.eroeffnen", "w.ueberweisen", "w.geldautomat"],
      sentences: [
        { de: "Ich möchte ein Konto eröffnen.", en: "I would like to open an account." },
        { de: "Wo ist der nächste Geldautomat?", en: "Where is the nearest cash machine?", gap: "Geldautomat", distractors: ["Konto", "Bahnhof"] },
        { de: "Ich möchte Geld überweisen.", en: "I would like to transfer money." },
      ],
      dialogue: [
        { line: "Guten Tag! Wie kann ich Ihnen helfen?", lineEn: "Hello! How can I help you?", task: "Say you'd like to open an account.", accepted: ["Ich möchte ein Konto eröffnen.", "Ich möchte bitte ein Konto eröffnen."] },
        { line: "Gern. Haben Sie eine Meldebescheinigung?", lineEn: "Of course. Do you have a registration certificate?", task: "Say yes, here it is (die Meldebescheinigung → sie).", accepted: ["Ja, hier ist sie.", "Ja, hier.", "Ja, hier bitte."] },
      ],
    },
    {
      id: "a1-u08-l4", title: "At the post office", goal: "Send letters and parcels", pattern: "g.nach-zu",
      newItems: ["w.brief", "w.briefmarke", "w.schicken", "w.post", "w.dauern"],
      sentences: [
        { de: "Ich möchte einen Brief nach Indien schicken.", en: "I'd like to send a letter to India." },
        { de: "Eine Briefmarke, bitte.", en: "A stamp, please.", gap: "Briefmarke", distractors: ["Brief", "Post"] },
        { de: "Wie lange dauert das?", en: "How long does that take?" },
      ],
      dialogue: [
        { line: "Der Nächste, bitte!", lineEn: "Next, please!", task: "Say you'd like to send a parcel to India.", accepted: ["Ich möchte ein Paket nach Indien schicken.", "Ein Paket nach Indien, bitte."] },
        { line: "Das kostet zweiundvierzig Euro.", lineEn: "That costs forty-two euros.", task: "Ask how long it takes.", accepted: ["Wie lange dauert das?", "Wie lange dauert es?"] },
      ],
    },
  ],
};
