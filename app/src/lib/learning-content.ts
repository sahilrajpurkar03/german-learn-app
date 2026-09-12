import type { AssessmentItem, Skill } from "./learning-engine";
import { EXTRA_CHAPTERS } from "./learning-chapters.ts";

export const ASSESSMENT_BANK: AssessmentItem[] = [
  {
    id: "r1",
    skill: "reading",
    band: "a1",
    prompt: "What should you do?",
    context: "Bitte hier warten.",
    options: ["Wait here", "Pay here", "Come tomorrow"],
    accepted: ["Wait here"],
    explanation: "Warten means to wait; hier means here.",
  },
  {
    id: "r2",
    skill: "reading",
    band: "a1",
    prompt: "When is the shop closed?",
    context: "Montag bis Samstag: 9–18 Uhr. Sonntag geschlossen.",
    options: ["Saturday", "Sunday", "Every morning"],
    accepted: ["Sunday"],
    explanation: "Sonntag geschlossen means closed on Sunday.",
  },
  {
    id: "r3",
    skill: "reading",
    band: "a2",
    prompt: "What is Lea asking you to do?",
    context:
      "Ich komme zehn Minuten später. Bestell bitte schon einen Kaffee für mich.",
    options: [
      "Wait before ordering",
      "Order her a coffee now",
      "Meet her somewhere else",
    ],
    accepted: ["Order her a coffee now"],
    explanation:
      "Schon means already or now in this context. Lea is running late.",
  },
  {
    id: "r4",
    skill: "reading",
    band: "a2",
    prompt: "What must you bring?",
    context:
      "Bitte bringen Sie zum Termin Ihren Ausweis mit. Das Formular können Sie vor Ort ausfüllen.",
    options: ["A completed form", "Your identification", "A photograph"],
    accepted: ["Your identification"],
    explanation:
      "Den Ausweis mitbringen means bring your ID. The form can be completed on site.",
  },
  {
    id: "r5",
    skill: "reading",
    band: "b1",
    prompt: "What happens if you do nothing?",
    context:
      "Ihr Vertrag verlängert sich automatisch, sofern Sie nicht spätestens vier Wochen vor Ablauf kündigen.",
    options: [
      "The contract ends",
      "The price is reduced",
      "The contract renews",
    ],
    accepted: ["The contract renews"],
    explanation:
      "Sofern ... nicht introduces an exception: unless you cancel at least four weeks before expiry.",
  },
  {
    id: "r6",
    skill: "reading",
    band: "b1",
    prompt: "Why is a different appointment offered?",
    context:
      "Da die Ärztin kurzfristig verhindert ist, bieten wir Ihnen stattdessen einen Termin am Donnerstag an.",
    options: [
      "The doctor is unexpectedly unavailable",
      "You missed your appointment",
      "Thursday appointments cost less",
    ],
    accepted: ["The doctor is unexpectedly unavailable"],
    explanation:
      "Verhindert means unable to attend; stattdessen means instead.",
  },
  {
    id: "l1",
    skill: "listening",
    band: "a1",
    prompt: "What drink is ordered?",
    audio: "Ein Wasser, bitte.",
    options: ["Water", "Coffee", "Apple juice"],
    accepted: ["Water"],
    explanation: "Ein Wasser, bitte: a water, please.",
  },
  {
    id: "l2",
    skill: "listening",
    band: "a1",
    prompt: "Which day do they suggest?",
    audio: "Kommst du am Freitag?",
    options: ["Tuesday", "Friday", "Sunday"],
    accepted: ["Friday"],
    explanation: "Am Freitag means on Friday.",
  },
  {
    id: "l3",
    skill: "listening",
    band: "a2",
    prompt: "What time should you arrive?",
    audio:
      "Der Film beginnt um acht, aber wir treffen uns schon um halb acht vor dem Kino.",
    options: ["7:30 pm", "8:00 pm", "8:30 pm"],
    accepted: ["7:30 pm"],
    explanation:
      "Halb acht is 7:30, half an hour before eight. The meeting is before the film.",
  },
  {
    id: "l4",
    skill: "listening",
    band: "a2",
    prompt: "Where is the pharmacy?",
    audio:
      "Gehen Sie geradeaus und dann links. Die Apotheke ist neben der Bäckerei.",
    options: [
      "On the right, opposite the station",
      "On the left, beside the bakery",
      "Inside the supermarket",
    ],
    accepted: ["On the left, beside the bakery"],
    explanation:
      "Links means left; neben der Bäckerei means beside the bakery.",
  },
  {
    id: "l5",
    skill: "listening",
    band: "b1",
    prompt: "What changed about the journey?",
    audio:
      "Wegen einer Baustelle hält die Linie sechs heute nicht am Hauptbahnhof. Bitte steigen Sie am Rathaus um.",
    options: [
      "The train is delayed at the station",
      "You must change at the town hall",
      "All services are cancelled",
    ],
    accepted: ["You must change at the town hall"],
    explanation:
      "Umsteigen means change services. Construction prevents the usual station stop.",
  },
  {
    id: "l6",
    skill: "listening",
    band: "b1",
    prompt: "What does the speaker prefer?",
    audio:
      "Eigentlich wollte ich mitkommen, aber ich muss morgen früh raus. Wie wäre es stattdessen am Wochenende?",
    options: [
      "Going tonight",
      "Meeting at the weekend instead",
      "Never meeting again",
    ],
    accepted: ["Meeting at the weekend instead"],
    explanation:
      "Wie wäre es ...? proposes an alternative. Früh raus müssen means having to get up early.",
  },
  {
    id: "g1",
    skill: "grammar",
    band: "a1",
    prompt: "Ich ___ aus Indien.",
    options: ["komme", "kommt", "kommen"],
    accepted: ["komme"],
    explanation: "With ich, kommen becomes komme.",
  },
  {
    id: "g2",
    skill: "grammar",
    band: "a1",
    prompt: "___ du einen Kaffee?",
    options: ["Möchte", "Möchtest", "Möchten"],
    accepted: ["Möchtest"],
    explanation: "Du takes möchtest: would you like?",
  },
  {
    id: "g3",
    skill: "grammar",
    band: "a2",
    prompt: "Gestern ___ ich meine Freundin besucht.",
    options: ["bin", "habe", "werde"],
    accepted: ["habe"],
    explanation:
      "Besuchen forms its conversational past with haben: ich habe besucht.",
  },
  {
    id: "g4",
    skill: "grammar",
    band: "a2",
    prompt: "Ich fahre mit ___ Bus.",
    options: ["der", "den", "dem"],
    accepted: ["dem"],
    explanation: "Mit takes the dative: mit dem Bus.",
  },
  {
    id: "g5",
    skill: "grammar",
    band: "b1",
    prompt: "Ich bleibe zu Hause, weil ___.",
    options: ["ich krank bin", "bin ich krank", "ich bin krank"],
    accepted: ["ich krank bin"],
    explanation:
      "After weil, the conjugated verb goes at the end: weil ich krank bin.",
  },
  {
    id: "g6",
    skill: "grammar",
    band: "b1",
    prompt: "Wenn ich mehr Zeit hätte, ___ ich öfter kochen.",
    options: ["wurde", "würde", "werde"],
    accepted: ["würde"],
    explanation:
      "Hätte and würde describe an imagined situation: if I had more time, I would cook more.",
  },
  {
    id: "p1",
    skill: "production",
    band: "a1",
    prompt: "Write in German: Good morning.",
    accepted: ["Guten Morgen"],
    explanation: "The everyday morning greeting is Guten Morgen.",
  },
  {
    id: "p2",
    skill: "production",
    band: "a1",
    prompt: "Write in German: Thank you very much.",
    accepted: ["Vielen Dank", "Danke schön", "Danke sehr", "Dankeschön"],
    explanation:
      "Vielen Dank and Danke schön are both natural ways to say this.",
  },
  {
    id: "p3",
    skill: "production",
    band: "a2",
    prompt:
      "Complete the reply with two words: Kannst du morgen kommen? Nein, ich habe ___. (no time)",
    accepted: ["keine Zeit"],
    explanation: "Zeit is feminine, so no time is keine Zeit.",
  },
  {
    id: "p4",
    skill: "production",
    band: "a2",
    prompt: "Write the two missing words: Ich ___ gestern Pizza ___. (ate)",
    accepted: ["habe gegessen"],
    explanation: "The spoken past of essen is habe ... gegessen.",
  },
  {
    id: "p5",
    skill: "production",
    band: "b1",
    prompt: "Reorder these words: weil / arbeiten / ich / muss",
    accepted: ["weil ich arbeiten muss"],
    explanation: "The modal verb muss belongs at the end of this weil clause.",
  },
  {
    id: "p6",
    skill: "production",
    band: "b1",
    prompt: "Reorder these words: Sie / das / könnten / wiederholen / bitte",
    accepted: [
      "Könnten Sie das bitte wiederholen",
      "Könnten Sie bitte das wiederholen",
    ],
    explanation:
      "Könnten Sie ...? is a polite request: Could you repeat that, please?",
  },
];

export type MissionTurn = {
  kind: "choose" | "listen" | "build" | "respond";
  line: string;
  translation: string;
  task: string;
  options?: string[];
  words?: string[];
  accepted: string[];
  note: string;
};
export type Mission = {
  id: string;
  topic?: string;
  challenge?: string;
  title: string;
  subtitle: string;
  place: string;
  image: string;
  partner: string;
  role: string;
  skill: Skill;
  minutes: number;
  turns: MissionTurn[];
};

const CORE_MISSIONS: Mission[] = [
  {
    id: "cafe",
    title: "Your usual, please.",
    subtitle: "Order, make a change, and pay with confidence.",
    place: "At the café",
    image: "/images/cafe.jpg",
    partner: "Mila",
    role: "Barista",
    skill: "production",
    minutes: 8,
    turns: [
      {
        kind: "choose",
        line: "Hallo! Was darf es sein?",
        translation: "Hello! What can I get you?",
        task: "Order a coffee politely.",
        options: [
          "Ich hätte gern einen Kaffee, bitte.",
          "Ich bin ein Kaffee.",
          "Der Kaffee geht nach Hause.",
        ],
        accepted: ["Ich hätte gern einen Kaffee, bitte."],
        note: "Ich hätte gern ... is a useful, polite way to order almost anything.",
      },
      {
        kind: "listen",
        line: "Gern. Möchten Sie den Kaffee hier trinken oder mitnehmen?",
        translation:
          "Of course. Would you like to drink it here or take it away?",
        task: "What is Mila asking?",
        options: [
          "Whether you want sugar",
          "Eat in or take away",
          "Cash or card",
        ],
        accepted: ["Eat in or take away"],
        note: "Hier trinken = drink here. Mitnehmen = take away.",
      },
      {
        kind: "build",
        line: "Wir haben auch Hafermilch.",
        translation: "We also have oat milk.",
        task: "Ask for coffee with oat milk.",
        words: ["bitte", "Mit", "Hafermilch,"],
        accepted: ["Mit Hafermilch, bitte"],
        note: "Mit + ingredient lets you adapt an order: mit Milch, mit Zucker, mit Hafermilch.",
      },
      {
        kind: "respond",
        line: "Sonst noch etwas?",
        translation: "Anything else?",
        task: "Say: No, thank you. That's all.",
        accepted: [
          "Nein danke, das ist alles",
          "Nein, danke. Das ist alles",
          "Nein danke",
        ],
        note: "Nein, danke. Das ist alles. is a natural way to finish an order.",
      },
      {
        kind: "respond",
        line: "Das macht vier Euro zwanzig.",
        translation: "That comes to four euros twenty.",
        task: "Ask: Can I pay by card?",
        accepted: [
          "Kann ich mit Karte bezahlen",
          "Kann ich mit Karte zahlen",
          "Kann ich bitte mit Karte bezahlen",
        ],
        note: "Mit Karte bezahlen is pay by card. Bar bezahlen is pay in cash.",
      },
    ],
  },
  {
    id: "station",
    title: "Catch the right train.",
    subtitle: "Find a platform and handle a last-minute change.",
    place: "At the station",
    image: "/images/station.jpg",
    partner: "Jonas",
    role: "Station staff",
    skill: "listening",
    minutes: 7,
    turns: [
      {
        kind: "choose",
        line: "Guten Tag. Kann ich Ihnen helfen?",
        translation: "Hello. Can I help you?",
        task: "Ask where the train to Berlin leaves from.",
        options: [
          "Wo fährt der Zug nach Berlin ab?",
          "Wie alt ist Berlin?",
          "Ich wohne seit Berlin.",
        ],
        accepted: ["Wo fährt der Zug nach Berlin ab?"],
        note: "Abfahren means depart. In a question, ab moves to the end.",
      },
      {
        kind: "listen",
        line: "Der Zug fährt heute von Gleis sieben ab, nicht von Gleis drei.",
        translation:
          "Today the train leaves from platform seven, not platform three.",
        task: "Which platform should you go to?",
        options: ["Platform 3", "Platform 7", "Platform 10"],
        accepted: ["Platform 7"],
        note: "Listen for the correction: sieben, nicht drei.",
      },
      {
        kind: "build",
        line: "Sie müssen in Hannover umsteigen.",
        translation: "You need to change in Hanover.",
        task: "Ask how much time you have.",
        words: ["ich", "Zeit", "Wie", "habe", "viel"],
        accepted: ["Wie viel Zeit habe ich"],
        note: "Wie viel Zeit ...? asks about an amount of time, not a clock time.",
      },
      {
        kind: "respond",
        line: "Sie haben zwölf Minuten.",
        translation: "You have twelve minutes.",
        task: "Ask politely: Could you repeat that?",
        accepted: [
          "Könnten Sie das bitte wiederholen",
          "Können Sie das bitte wiederholen",
          "Könnten Sie bitte das wiederholen",
        ],
        note: "Könnten Sie das bitte wiederholen? works whenever an announcement or answer is unclear.",
      },
      {
        kind: "respond",
        line: "Zwölf Minuten. Gute Reise!",
        translation: "Twelve minutes. Have a good journey!",
        task: "Say: Thank you for your help.",
        accepted: [
          "Vielen Dank für Ihre Hilfe",
          "Danke für Ihre Hilfe",
          "Danke für die Hilfe",
        ],
        note: "Danke für ... lets you thank someone for a specific thing.",
      },
    ],
  },
  {
    id: "appointment",
    title: "Make that appointment.",
    subtitle: "Explain what you need and find a time that works.",
    place: "At the practice",
    image: "/images/appointment.jpg",
    partner: "Mila",
    role: "Receptionist",
    skill: "grammar",
    minutes: 8,
    turns: [
      {
        kind: "choose",
        line: "Praxis Weber, guten Morgen.",
        translation: "Weber medical practice, good morning.",
        task: "Say that you would like to make an appointment.",
        options: [
          "Ich möchte einen Termin vereinbaren.",
          "Ich bin einen Termin.",
          "Ich mache die Uhr zu.",
        ],
        accepted: ["Ich möchte einen Termin vereinbaren."],
        note: "Einen Termin vereinbaren means arrange an appointment, useful for offices as well as practices.",
      },
      {
        kind: "listen",
        line: "Am Dienstag ist nichts mehr frei. Passt Ihnen Donnerstag um Viertel nach neun?",
        translation:
          "There is nothing available on Tuesday. Does Thursday at quarter past nine suit you?",
        task: "Which appointment is offered?",
        options: ["Tuesday, 9:15", "Thursday, 9:15", "Thursday, 8:45"],
        accepted: ["Thursday, 9:15"],
        note: "Viertel nach neun = 9:15. Passt Ihnen ...? means does ... suit you?",
      },
      {
        kind: "build",
        line: "Können Sie vormittags kommen?",
        translation: "Can you come in the morning?",
        task: "Say you cannot because you have to work.",
        words: ["arbeiten", "muss.", "weil", "Nein,", "ich"],
        accepted: ["Nein, weil ich arbeiten muss"],
        note: "With weil, the conjugated verb goes to the end: weil ich arbeiten muss.",
      },
      {
        kind: "respond",
        line: "Dann hätten wir noch Freitag um fünfzehn Uhr.",
        translation: "Then we also have Friday at 3 pm.",
        task: "Say: Friday works well. Thank you.",
        accepted: [
          "Freitag passt gut, danke",
          "Freitag passt gut. Vielen Dank",
          "Freitag passt gut danke schön",
        ],
        note: "Das passt gut or Freitag passt gut confirms a convenient appointment.",
      },
      {
        kind: "respond",
        line: "Bitte bringen Sie Ihre Versichertenkarte mit.",
        translation: "Please bring your insurance card.",
        task: "Ask: What should I bring?",
        accepted: ["Was soll ich mitbringen", "Was muss ich mitbringen"],
        note: "Was soll ich mitbringen? is useful before any appointment.",
      },
    ],
  },
  {
    id: "neighbors",
    title: "More than just hallo.",
    subtitle: "Introduce yourself and turn small talk into a plan.",
    place: "In the neighborhood",
    image: "/images/neighbors.jpg",
    partner: "Jonas",
    role: "Your new neighbor",
    skill: "reading",
    minutes: 7,
    turns: [
      {
        kind: "choose",
        line: "Hey! Bist du neu hier im Haus?",
        translation: "Hey! Are you new to the building?",
        task: "Say you moved in last week.",
        options: [
          "Ja, ich bin letzte Woche eingezogen.",
          "Ja, ich esse eine Woche.",
          "Nein, das Haus fährt weg.",
        ],
        accepted: ["Ja, ich bin letzte Woche eingezogen."],
        note: "Einziehen uses sein in the past: ich bin eingezogen.",
      },
      {
        kind: "listen",
        line: "Wir grillen am Samstag im Hof. Wenn du Lust hast, komm doch vorbei!",
        translation:
          "We're having a barbecue in the courtyard on Saturday. Come along if you feel like it!",
        task: "What is Jonas inviting you to?",
        options: [
          "Dinner at a restaurant on Sunday",
          "A courtyard barbecue on Saturday",
          "A meeting at work",
        ],
        accepted: ["A courtyard barbecue on Saturday"],
        note: "Lust haben means feel like doing something. Vorbeikommen means come by.",
      },
      {
        kind: "build",
        line: "Kennst du schon jemanden hier?",
        translation: "Do you know anyone here yet?",
        task: "Say: Not yet, but I'd like to meet people.",
        words: [
          "Leute",
          "aber",
          "kennenlernen.",
          "nicht,",
          "möchte",
          "Noch",
          "ich",
        ],
        accepted: ["Noch nicht, aber ich möchte Leute kennenlernen"],
        note: "With möchte, the infinitive kennenlernen stays at the end.",
      },
      {
        kind: "respond",
        line: "Zum Grillen bringt jeder etwas mit.",
        translation: "Everyone brings something to the barbecue.",
        task: "Ask: Should I bring something?",
        accepted: ["Soll ich etwas mitbringen", "Soll ich was mitbringen"],
        note: "Soll ich ...? offers to do something. Was instead of etwas is common in informal speech.",
      },
      {
        kind: "respond",
        line: "Ein Salat wäre super. Wir fangen um sechs an.",
        translation: "A salad would be great. We start at six.",
        task: "Say: Great, see you on Saturday!",
        accepted: [
          "Super, bis Samstag",
          "Toll, bis Samstag",
          "Prima, bis Samstag",
        ],
        note: "Bis + day is a friendly goodbye when you know when you'll meet next.",
      },
    ],
  },
];

export const MISSIONS: Mission[] = [...CORE_MISSIONS, ...EXTRA_CHAPTERS];
