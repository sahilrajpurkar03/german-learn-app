import type { Pattern } from "../../lib/course/types.ts";

// A1 grammar strand. Each pattern: one short rule, a few highlighted examples, and drills
// whose wrong options are explained. Drill 1–2 appear in the lesson; the last one in the
// checkpoint and in later reviews.
export const A1_PATTERNS: Pattern[] = [
  {
    id: "g.verb-endings", level: "a1", title: "Verb endings: ich -e, du -st, Sie -en",
    rule: "German verbs change their ending to match the person: ich heiß**e**, du heiß**t**, er/sie heiß**t**, wir/Sie heiß**en**.",
    examples: [{ de: "Ich wohn**e** in Dortmund.", en: "I live in Dortmund." }, { de: "Du wohn**st** in Köln.", en: "You live in Cologne." }, { de: "Wie heiß**en** Sie?", en: "What is your name? (formal)" }],
    drills: [
      { sentence: "Ich ___ Ravi.", en: "My name is Ravi.", options: ["heiße", "heißt", "heißen"], answer: "heiße", why: { heißt: "heißt goes with du or er/sie. With ich, the ending is -e.", heißen: "heißen goes with wir or Sie. With ich, the ending is -e." } },
      { sentence: "Wie ___ du?", en: "What's your name?", options: ["heißt", "heiße", "heißen"], answer: "heißt", why: { heiße: "heiße goes with ich. With du, the verb ends in -st (heißt already ends in ß, so just -t).", heißen: "heißen goes with Sie or wir." } },
      { sentence: "Wir ___ in Berlin.", en: "We live in Berlin.", options: ["wohnen", "wohne", "wohnt"], answer: "wohnen", why: { wohne: "wohne goes with ich. With wir, the ending is -en.", wohnt: "wohnt goes with er/sie/es or ihr." } },
    ],
  },
  {
    id: "g.w-questions", level: "a1", title: "W-questions: the verb comes second",
    rule: "Questions with Wer, Wie, Wo, Woher, Was start with the question word, and the **verb comes second**.",
    examples: [{ de: "Woher **kommen** Sie?", en: "Where are you from?" }, { de: "Wo **wohnst** du?", en: "Where do you live?" }, { de: "Was **machen** Sie?", en: "What do you do?" }],
    drills: [
      { sentence: "Woher ___ Sie?", en: "Where are you from?", options: ["kommen", "komme", "kommst"], answer: "kommen", why: { komme: "komme goes with ich. The question is about Sie, so: kommen.", kommst: "kommst goes with du. The question is about Sie, so: kommen." } },
      { sentence: "___ wohnst du?", en: "Where do you live?", options: ["Wo", "Woher", "Wer"], answer: "Wo", why: { Woher: "Woher asks where someone comes from. Wo asks where someone is or lives.", Wer: "Wer means who." } },
      { sentence: "Wie ___ Sie?", en: "What is your name?", options: ["heißen", "Sie heißen", "heißt"], answer: "heißen", why: { "Sie heißen": "The verb comes right after the question word: Wie heißen Sie?", heißt: "heißt goes with du. With Sie, use heißen." } },
    ],
  },
  {
    id: "g.sein", level: "a1", title: "sein (to be)",
    rule: "sein is irregular: ich **bin**, du **bist**, er/sie/es **ist**, wir/Sie/sie **sind**.",
    examples: [{ de: "Ich **bin** müde.", en: "I am tired." }, { de: "Sie **ist** Ärztin.", en: "She is a doctor." }, { de: "Wir **sind** neu hier.", en: "We are new here." }],
    drills: [
      { sentence: "Ich ___ Sam.", en: "I'm Sam.", options: ["bin", "ist", "bist"], answer: "bin", why: { ist: "ist goes with er/sie/es. With ich, use bin.", bist: "bist goes with du. With ich, use bin." } },
      { sentence: "Das ___ Anna.", en: "This is Anna.", options: ["ist", "bin", "sind"], answer: "ist", why: { bin: "bin goes with ich only.", sind: "sind is for plural or Sie. Das (this) takes ist." } },
      { sentence: "___ Sie neu hier?", en: "Are you new here?", options: ["Sind", "Ist", "Bist"], answer: "Sind", why: { Ist: "Ist is for er/sie/es. With Sie (formal you), use sind.", Bist: "Bist is for du. With Sie, use sind." } },
    ],
  },
  {
    id: "g.haben", level: "a1", title: "haben (to have)",
    rule: "haben: ich **habe**, du **hast**, er/sie/es **hat**, wir/Sie **haben**. Many everyday phrases use haben where English uses 'be': Ich habe Zeit (I'm free), Ich habe Hunger (I'm hungry).",
    examples: [{ de: "Ich **habe** zwei Kinder.", en: "I have two children." }, { de: "**Hast** du Zeit?", en: "Do you have time?" }, { de: "Er **hat** Hunger.", en: "He is hungry." }],
    drills: [
      { sentence: "Ich ___ drei Geschwister.", en: "I have three siblings.", options: ["habe", "hat", "hast"], answer: "habe", why: { hat: "hat goes with er/sie/es. With ich: habe.", hast: "hast goes with du. With ich: habe." } },
      { sentence: "___ du heute Zeit?", en: "Do you have time today?", options: ["Hast", "Habe", "Hat"], answer: "Hast", why: { Habe: "Habe goes with ich. With du: hast.", Hat: "Hat goes with er/sie/es. With du: hast." } },
      { sentence: "Maria ___ ein Auto.", en: "Maria has a car.", options: ["hat", "habe", "haben"], answer: "hat", why: { habe: "habe is for ich. Maria = sie, so: hat.", haben: "haben is for wir or Sie." } },
    ],
  },
  {
    id: "g.numbers-21", level: "a1", title: "Numbers 21–99: the ones come first",
    rule: "From 21, German says the **ones first**, then 'und', then the tens: 21 = **einund**zwanzig (one-and-twenty), 45 = **fünfund**vierzig.",
    examples: [{ de: "**einund**zwanzig", en: "21" }, { de: "**zweiund**dreißig", en: "32" }, { de: "**siebenund**fünfzig", en: "57" }],
    drills: [
      { sentence: "Ich bin ___ Jahre alt.", en: "I'm 25 years old.", options: ["fünfundzwanzig", "zwanzigfünf", "zweiundfünfzig"], answer: "fünfundzwanzig", why: { zwanzigfünf: "German puts the ones first: fünf-und-zwanzig.", zweiundfünfzig: "zweiundfünfzig is 52. The ones come first: 25 = fünfundzwanzig." } },
      { sentence: "Das kostet ___ Euro.", en: "That costs 34 euros.", options: ["vierunddreißig", "dreiundvierzig", "dreißigvier"], answer: "vierunddreißig", why: { dreiundvierzig: "dreiundvierzig is 43. For 34, say the four first: vier-und-dreißig.", dreißigvier: "The ones come first, joined with und: vierunddreißig." } },
      { sentence: "Ich nehme die Linie ___.", en: "I take line 61.", options: ["einundsechzig", "sechzigeins", "sechsundzehn"], answer: "einundsechzig", why: { sechzigeins: "Ones first: ein-und-sechzig.", sechsundzehn: "That's not a German number. 61 = einundsechzig." } },
    ],
  },
  {
    id: "g.time-prepositions", level: "a1", title: "Time: um, am, im",
    rule: "**um** + clock time (um 8 Uhr), **am** + day or part of the day (am Montag, am Abend), **im** + month or season (im Mai, im Sommer).",
    examples: [{ de: "Der Kurs beginnt **um** neun Uhr.", en: "The course starts at nine." }, { de: "**Am** Montag arbeite ich.", en: "On Monday I work." }, { de: "**Im** Juli habe ich Urlaub.", en: "In July I'm on holiday." }],
    drills: [
      { sentence: "Wir treffen uns ___ acht Uhr.", en: "We're meeting at eight o'clock.", options: ["um", "am", "im"], answer: "um", why: { am: "am is for days (am Montag). Clock times take um.", im: "im is for months and seasons. Clock times take um." } },
      { sentence: "___ Freitag habe ich frei.", en: "On Friday I'm off.", options: ["Am", "Um", "Im"], answer: "Am", why: { Um: "um is for clock times. Days take am.", Im: "im is for months. Days take am." } },
      { sentence: "___ August fliege ich nach Indien.", en: "In August I'm flying to India.", options: ["Im", "Am", "Um"], answer: "Im", why: { Am: "am is for days. Months take im.", Um: "um is for clock times. Months take im." } },
    ],
  },
  {
    id: "g.verb-position-2", level: "a1", title: "The verb is always in position 2",
    rule: "In a statement the **verb is the second element**. If you start with a time (Heute, Am Montag), the subject moves behind the verb: Heute **habe** ich Zeit.",
    examples: [{ de: "Ich **arbeite** am Montag.", en: "I work on Monday." }, { de: "Am Montag **arbeite** ich.", en: "On Monday I work." }, { de: "Heute **habe** ich Zeit.", en: "Today I have time." }],
    drills: [
      { sentence: "Heute ___ ich zu Hause.", en: "Today I am at home.", options: ["bin", "ich bin", "sein"], answer: "bin", why: { "ich bin": "ich is already in the sentence. After Heute, the verb comes next: Heute bin ich...", sein: "sein is the infinitive. With ich, use bin." } },
      { sentence: "Am Wochenende ___ wir Freunde.", en: "At the weekend we visit friends.", options: ["besuchen", "wir besuchen", "besucht"], answer: "besuchen", why: { "wir besuchen": "The verb comes second, before the subject: Am Wochenende besuchen wir...", besucht: "besucht goes with er/sie/ihr. With wir: besuchen." } },
      { sentence: "Morgen ___ der Kurs um neun.", en: "Tomorrow the course starts at nine.", options: ["beginnt", "der Kurs beginnt", "beginnen"], answer: "beginnt", why: { "der Kurs beginnt": "After Morgen, the verb comes second: Morgen beginnt der Kurs.", beginnen: "The subject is der Kurs (it), so: beginnt." } },
    ],
  },
  {
    id: "g.articles", level: "a1", title: "der, die, das and ein, eine",
    rule: "Every noun has a gender: **der** (masculine), **die** (feminine), **das** (neuter). 'A' is **ein** for der/das words and **eine** for die words. Always learn nouns with their article.",
    examples: [{ de: "**der** Kaffee → **ein** Kaffee", en: "the coffee → a coffee" }, { de: "**die** Milch → **eine** Milch", en: "the milk → a milk" }, { de: "**das** Wasser → **ein** Wasser", en: "the water → a water" }],
    drills: [
      { sentence: "___ Tee ist heiß.", en: "The tea is hot.", options: ["Der", "Die", "Das"], answer: "Der", why: { Die: "Tee is masculine: der Tee.", Das: "Tee is masculine: der Tee." } },
      { sentence: "___ Wasser ist kalt.", en: "The water is cold.", options: ["Das", "Der", "Die"], answer: "Das", why: { Der: "Wasser is neuter: das Wasser.", Die: "Wasser is neuter: das Wasser." } },
      { sentence: "___ Milch ist kalt.", en: "The milk is cold.", options: ["Die", "Der", "Das"], answer: "Die", why: { Der: "Milch is feminine: die Milch.", Das: "Milch is feminine: die Milch." } },
    ],
  },
  {
    id: "g.akk-den", level: "a1", title: "Ordering something: der → den, ein → einen",
    rule: "When a **der**-word is the object (what you want, buy, order), der becomes **den** and ein becomes **einen**. die and das words don't change.",
    examples: [{ de: "Ich hätte gern **einen** Kaffee.", en: "I'd like a coffee." }, { de: "Ich nehme **den** Tee.", en: "I'll take the tea." }, { de: "Ich möchte **eine** Cola und **ein** Wasser.", en: "I'd like a cola and a water." }],
    drills: [
      { sentence: "Ich möchte ___ Tee.", en: "I would like a tea.", options: ["einen", "ein", "eine"], answer: "einen", why: { ein: "Tee is masculine (der Tee). As the thing you order, ein becomes einen.", eine: "eine is for feminine nouns. Tee is masculine: einen Tee." } },
      { sentence: "Ich nehme ___ Salat.", en: "I'll take the salad.", options: ["den", "der", "das"], answer: "den", why: { der: "der Salat is the object here, so der becomes den.", das: "Salat is masculine: der Salat → den Salat." } },
      { sentence: "Ich hätte gern ___ Wasser.", en: "I'd like a water.", options: ["ein", "einen", "eine"], answer: "ein", why: { einen: "einen is only for masculine (der) words. Wasser is das Wasser, so it stays ein.", eine: "eine is for feminine words. das Wasser → ein Wasser." } },
    ],
  },
  {
    id: "g.negation", level: "a1", title: "nicht or kein?",
    rule: "Use **kein** to negate a noun with ein or no article (Ich esse **kein** Fleisch). Use **nicht** for everything else — verbs, adjectives, names (Das ist **nicht** teuer).",
    examples: [{ de: "Ich habe **keine** Zeit.", en: "I don't have time." }, { de: "Ich esse **kein** Fleisch.", en: "I don't eat meat." }, { de: "Das Brot ist **nicht** frisch.", en: "The bread isn't fresh." }],
    drills: [
      { sentence: "Ich trinke ___ Kaffee.", en: "I don't drink coffee.", options: ["keinen", "nicht", "kein"], answer: "keinen", why: { nicht: "Kaffee is a noun without an article, so use kein. It's masculine and the object: keinen.", kein: "Kaffee is masculine and the object, so kein becomes keinen." } },
      { sentence: "Die Suppe ist ___ heiß.", en: "The soup isn't hot.", options: ["nicht", "kein", "keine"], answer: "nicht", why: { kein: "heiß is an adjective. Negate adjectives with nicht.", keine: "heiß is an adjective. Negate adjectives with nicht." } },
      { sentence: "Wir haben ___ Milch mehr.", en: "We don't have any more milk.", options: ["keine", "nicht", "kein"], answer: "keine", why: { nicht: "Milch is a noun, so use kein. It's feminine: keine Milch.", kein: "Milch is feminine (die Milch): keine." } },
    ],
  },
  {
    id: "g.modal-koennen", level: "a1", title: "können + verb at the end",
    rule: "With **können** (can), the second verb goes to the **end** in its basic form: Ich **kann** mit Karte **zahlen**. Forms: ich/er kann, du kannst, wir/Sie können.",
    examples: [{ de: "**Kann** ich mit Karte **zahlen**?", en: "Can I pay by card?" }, { de: "Ich **kann** heute nicht **kommen**.", en: "I can't come today." }, { de: "**Können** Sie mir **helfen**?", en: "Can you help me?" }],
    drills: [
      { sentence: "Kann ich bar ___?", en: "Can I pay in cash?", options: ["zahlen", "zahle", "zahlt"], answer: "zahlen", why: { zahle: "After können, the second verb stays in its basic form at the end: zahlen.", zahlt: "After können, use the basic form: zahlen." } },
      { sentence: "___ Sie mir helfen?", en: "Can you help me?", options: ["Können", "Kann", "Kannst"], answer: "Können", why: { Kann: "kann goes with ich or er/sie. With Sie: können.", Kannst: "kannst goes with du. With Sie: können." } },
      { sentence: "Du ___ gut kochen.", en: "You can cook well.", options: ["kannst", "kann", "können"], answer: "kannst", why: { kann: "kann is for ich or er/sie. With du: kannst.", können: "können is for wir or Sie. With du: kannst." } },
    ],
  },
  {
    id: "g.plural", level: "a1", title: "Plural: always die",
    rule: "In the plural every noun takes **die**. Plural endings vary (-e, -n, -er, umlaut), so learn them with the word: der Apfel → die **Ä**pfel, das Ei → die Ei**er**.",
    examples: [{ de: "der Apfel → die **Äpfel**", en: "apple → apples" }, { de: "das Ei → die **Eier**", en: "egg → eggs" }, { de: "die Tomate → die **Tomaten**", en: "tomato → tomatoes" }],
    drills: [
      { sentence: "Ich kaufe drei ___.", en: "I'm buying three apples.", options: ["Äpfel", "Apfel", "Apfels"], answer: "Äpfel", why: { Apfel: "Apfel is singular. The plural adds an umlaut: Äpfel.", Apfels: "German plurals rarely use -s. Apfel → Äpfel." } },
      { sentence: "___ Tomaten sind frisch.", en: "The tomatoes are fresh.", options: ["Die", "Der", "Das"], answer: "Die", why: { Der: "In the plural, every noun takes die.", Das: "In the plural, every noun takes die." } },
      { sentence: "Wir brauchen sechs ___.", en: "We need six eggs.", options: ["Eier", "Ei", "Eis"], answer: "Eier", why: { Ei: "Ei is one egg. The plural is Eier.", Eis: "Eis means ice cream. Eggs = Eier." } },
    ],
  },
  {
    id: "g.moechten", level: "a1", title: "möchten + verb at the end",
    rule: "**möchten** (would like) works like können: the second verb goes to the **end**. Ich **möchte** ein Kilo Äpfel **kaufen**. Forms: ich/er möchte, du möchtest, wir/Sie möchten.",
    examples: [{ de: "Ich **möchte** zwei Flaschen Wasser **kaufen**.", en: "I'd like to buy two bottles of water." }, { de: "**Möchten** Sie hier **essen**?", en: "Would you like to eat here?" }, { de: "Wir **möchten** **zahlen**.", en: "We'd like to pay." }],
    drills: [
      { sentence: "Ich möchte ein Brot ___.", en: "I'd like to buy a loaf of bread.", options: ["kaufen", "kaufe", "kauft"], answer: "kaufen", why: { kaufe: "After möchten, the second verb stays in the basic form at the end: kaufen.", kauft: "After möchten, use the basic form: kaufen." } },
      { sentence: "___ du einen Tee?", en: "Would you like a tea?", options: ["Möchtest", "Möchte", "Möchten"], answer: "Möchtest", why: { Möchte: "möchte is for ich or er/sie. With du: möchtest.", Möchten: "möchten is for wir or Sie. With du: möchtest." } },
      { sentence: "Wir ___ bitte zahlen.", en: "We'd like to pay, please.", options: ["möchten", "möchte", "möchtest"], answer: "möchten", why: { möchte: "möchte is for ich or er/sie. With wir: möchten.", möchtest: "möchtest is for du. With wir: möchten." } },
    ],
  },
  {
    id: "g.yes-no-questions", level: "a1", title: "Yes/no questions start with the verb",
    rule: "For a yes/no question, put the **verb first**: Sie haben die Jacke in M. → **Haben** Sie die Jacke in M?",
    examples: [{ de: "**Haben** Sie die Hose in Größe M?", en: "Do you have the trousers in size M?" }, { de: "**Passt** die Jacke?", en: "Does the jacket fit?" }, { de: "**Kommst** du mit?", en: "Are you coming along?" }],
    drills: [
      { sentence: "___ Sie die Schuhe in 42?", en: "Do you have the shoes in 42?", options: ["Haben", "Sie haben", "Hat"], answer: "Haben", why: { "Sie haben": "In a yes/no question the verb comes first: Haben Sie...?", Hat: "hat goes with er/sie. With Sie: haben." } },
      { sentence: "___ die Hose?", en: "Do the trousers fit?", options: ["Passt", "Die passt", "Passen"], answer: "Passt", why: { "Die passt": "Start the question with the verb: Passt die Hose?", Passen: "die Hose is singular (it), so: passt." } },
      { sentence: "___ du heute Abend?", en: "Are you working this evening?", options: ["Arbeitest", "Du arbeitest", "Arbeite"], answer: "Arbeitest", why: { "Du arbeitest": "Verb first in a yes/no question: Arbeitest du...?", Arbeite: "arbeite is for ich. With du: arbeitest." } },
    ],
  },
  {
    id: "g.separable", level: "a1", title: "Separable verbs: the prefix jumps to the end",
    rule: "Some verbs split: the prefix goes to the **end** of the sentence. um|tauschen → Ich **tausche** die Jacke **um**. an|rufen → Ich **rufe** morgen **an**.",
    examples: [{ de: "Ich **tausche** die Schuhe **um**.", en: "I'm exchanging the shoes." }, { de: "Der Zug **fährt** um acht **ab**.", en: "The train departs at eight." }, { de: "Wir **steigen** hier **aus**.", en: "We get off here." }],
    drills: [
      { sentence: "Ich rufe den Vermieter ___.", en: "I'm calling the landlord.", options: ["an", "um", "aus"], answer: "an", why: { um: "The verb is anrufen, so the prefix is an.", aus: "The verb is anrufen, so the prefix is an." } },
      { sentence: "Der Zug ___ um 9 Uhr ab.", en: "The train departs at 9.", options: ["fährt", "abfährt", "fahren"], answer: "fährt", why: { abfährt: "In a main sentence the prefix separates: fährt ... ab.", fahren: "der Zug = it, so: fährt." } },
      { sentence: "Wann ___ du morgens auf?", en: "When do you get up in the morning?", options: ["stehst", "aufstehst", "steht"], answer: "stehst", why: { aufstehst: "The prefix auf moves to the end: stehst ... auf.", steht: "steht goes with er/sie. With du: stehst." } },
    ],
  },
  {
    id: "g.possessive", level: "a1", title: "mein, meine / Ihr, Ihre",
    rule: "**mein** (my) and **Ihr** (your, formal) follow ein: **mein** for der/das words, **meine** for die words and plurals.",
    examples: [{ de: "**Meine** Wohnung hat drei Zimmer.", en: "My flat has three rooms." }, { de: "**Mein** Zimmer ist klein.", en: "My room is small." }, { de: "Wie ist **Ihre** Adresse?", en: "What is your address?" }],
    drills: [
      { sentence: "___ Küche ist neu.", en: "My kitchen is new.", options: ["Meine", "Mein", "Meinen"], answer: "Meine", why: { Mein: "Küche is feminine (die Küche): meine.", Meinen: "meinen is for masculine objects. die Küche → meine Küche." } },
      { sentence: "___ Balkon ist groß.", en: "My balcony is big.", options: ["Mein", "Meine", "Meiner"], answer: "Mein", why: { Meine: "Balkon is masculine (der Balkon): mein.", Meiner: "Balkon is masculine and the subject: mein." } },
      { sentence: "Wie ist ___ Telefonnummer?", en: "What is your phone number? (formal)", options: ["Ihre", "Ihr", "Ihren"], answer: "Ihre", why: { Ihr: "Telefonnummer is feminine (die Telefonnummer): Ihre.", Ihren: "Ihren is for masculine objects. die Telefonnummer → Ihre." } },
    ],
  },
  {
    id: "g.modal-muessen", level: "a1", title: "müssen (have to) + verb at the end",
    rule: "**müssen** means have to/must. Like können, the second verb goes to the **end**: Ich **muss** den Vermieter **anrufen**. Forms: ich/er muss, du musst, wir/Sie müssen.",
    examples: [{ de: "Ich **muss** heute **arbeiten**.", en: "I have to work today." }, { de: "Sie **müssen** hier **unterschreiben**.", en: "You have to sign here." }, { de: "**Musst** du **umsteigen**?", en: "Do you have to change trains?" }],
    drills: [
      { sentence: "Ich ___ morgen früh aufstehen.", en: "I have to get up early tomorrow.", options: ["muss", "musst", "müssen"], answer: "muss", why: { musst: "musst goes with du. With ich: muss.", müssen: "müssen goes with wir or Sie. With ich: muss." } },
      { sentence: "Wir müssen die Rechnung ___.", en: "We have to pay the bill.", options: ["bezahlen", "bezahlt", "bezahle"], answer: "bezahlen", why: { bezahlt: "After müssen, the second verb stays in its basic form: bezahlen.", bezahle: "After müssen, use the basic form: bezahlen." } },
      { sentence: "___ du heute arbeiten?", en: "Do you have to work today?", options: ["Musst", "Muss", "Müssen"], answer: "Musst", why: { Muss: "muss is for ich or er/sie. With du: musst.", Müssen: "müssen is for wir or Sie. With du: musst." } },
    ],
  },
  {
    id: "g.imperative-sie", level: "a1", title: "Polite instructions: Gehen Sie ...",
    rule: "To tell someone (formally) what to do, put the **verb first, then Sie**: **Gehen Sie** geradeaus. **Nehmen Sie** die Linie 4.",
    examples: [{ de: "**Gehen Sie** geradeaus.", en: "Go straight ahead." }, { de: "**Nehmen Sie** eine Tablette.", en: "Take one tablet." }, { de: "**Warten Sie** bitte hier.", en: "Please wait here." }],
    drills: [
      { sentence: "___ Sie links ab.", en: "Turn left.", options: ["Biegen", "Biegt", "Biege"], answer: "Biegen", why: { Biegt: "With Sie, the verb takes the -en form: Biegen Sie...", Biege: "With Sie, the verb takes the -en form: Biegen Sie..." } },
      { sentence: "Bitte ___ hier.", en: "Please sign here.", options: ["unterschreiben Sie", "Sie unterschreiben", "unterschreibt"], answer: "unterschreiben Sie", why: { "Sie unterschreiben": "That's a statement (you sign). For an instruction, the verb comes first: unterschreiben Sie.", unterschreibt: "In a formal instruction use the -en form plus Sie." } },
      { sentence: "___ Sie den Bus Nummer 5.", en: "Take bus number 5.", options: ["Nehmen", "Nimm", "Nehme"], answer: "Nehmen", why: { Nimm: "Nimm is the informal (du) form. With Sie: Nehmen Sie.", Nehme: "Nehme is the ich form. With Sie: Nehmen Sie." } },
    ],
  },
  {
    id: "g.dativ-prep", level: "a1", title: "mit, bei, zu, von + dem/der",
    rule: "After **mit, bei, zu, von, nach, aus** the article changes: der/das → **dem**, die → **der**. Short forms: zu dem = **zum**, zu der = **zur**, bei dem = **beim**.",
    examples: [{ de: "Ich fahre **mit dem** Bus.", en: "I'm going by bus." }, { de: "Das Paket ist **bei der** Nachbarin.", en: "The parcel is at the neighbour's." }, { de: "Wie komme ich **zum** Bahnhof?", en: "How do I get to the station?" }],
    drills: [
      { sentence: "Ich fahre mit ___ Zug.", en: "I'm going by train.", options: ["dem", "der", "den"], answer: "dem", why: { der: "Zug is masculine (der Zug). After mit, der becomes dem.", den: "den is for objects without a preposition. After mit: dem." } },
      { sentence: "Das Paket ist bei ___ Nachbarin.", en: "The parcel is at the neighbour's.", options: ["der", "die", "dem"], answer: "der", why: { die: "Nachbarin is feminine. After bei, die becomes der.", dem: "dem is for der/das words. die Nachbarin → bei der Nachbarin." } },
      { sentence: "Ich gehe ___ Arzt.", en: "I'm going to the doctor.", options: ["zum", "zur", "zu die"], answer: "zum", why: { zur: "zur = zu der, for feminine words. der Arzt → zu dem → zum.", "zu die": "After zu, der Arzt becomes zu dem = zum." } },
    ],
  },
  {
    id: "g.weh-tun", level: "a1", title: "Saying what hurts: tut weh / tun weh",
    rule: "Name the body part, then **tut weh** (one part) or **tun weh** (several): Mein Kopf **tut weh**. Meine Füße **tun weh**. Or use -schmerzen: Ich habe **Kopfschmerzen**.",
    examples: [{ de: "Mein Rücken **tut weh**.", en: "My back hurts." }, { de: "Meine Augen **tun weh**.", en: "My eyes hurt." }, { de: "Ich habe **Halsschmerzen**.", en: "I have a sore throat." }],
    drills: [
      { sentence: "Mein Bauch ___ weh.", en: "My stomach hurts.", options: ["tut", "tun", "hat"], answer: "tut", why: { tun: "tun weh is for plurals. One body part: tut weh.", hat: "The phrase is weh tun: Mein Bauch tut weh." } },
      { sentence: "Meine Füße ___ weh.", en: "My feet hurt.", options: ["tun", "tut", "sind"], answer: "tun", why: { tut: "Füße is plural, so: tun weh.", sind: "The phrase is weh tun: Meine Füße tun weh." } },
      { sentence: "Ich habe ___.", en: "I have a headache.", options: ["Kopfschmerzen", "Kopf weh", "Kopfweh tut"], answer: "Kopfschmerzen", why: { "Kopf weh": "Say either Mein Kopf tut weh or Ich habe Kopfschmerzen.", "Kopfweh tut": "With haben, use Kopfschmerzen: Ich habe Kopfschmerzen." } },
    ],
  },
  {
    id: "g.sein-oder-haben", level: "a1", title: "Ich bin krank, ich habe Fieber",
    rule: "Use **sein** with adjectives (Ich **bin** krank, müde) and **haben** with nouns (Ich **habe** Fieber, Husten, Hunger).",
    examples: [{ de: "Ich **bin** krank.", en: "I am ill." }, { de: "Ich **habe** Fieber.", en: "I have a fever." }, { de: "Ich **bin** müde und **habe** Hunger.", en: "I'm tired and hungry." }],
    drills: [
      { sentence: "Ich ___ Husten.", en: "I have a cough.", options: ["habe", "bin", "ist"], answer: "habe", why: { bin: "Husten is a noun, so use haben: Ich habe Husten.", ist: "Husten is a noun, so use haben: Ich habe Husten." } },
      { sentence: "Er ___ sehr müde.", en: "He is very tired.", options: ["ist", "hat", "bin"], answer: "ist", why: { hat: "müde is an adjective, so use sein: Er ist müde.", bin: "bin is for ich. With er: ist." } },
      { sentence: "Wir ___ Hunger.", en: "We are hungry.", options: ["haben", "sind", "hat"], answer: "haben", why: { sind: "In German you 'have' hunger: Wir haben Hunger.", hat: "hat is for er/sie. With wir: haben." } },
    ],
  },
  {
    id: "g.sie-du", level: "a1", title: "Sie or du?",
    rule: "Use **Sie** (capital S) with officials, staff and people you don't know; the verb ends in -en. Use **du** with friends, family and children; the verb ends in -st.",
    examples: [{ de: "Wie heißen **Sie**?", en: "What's your name? (formal)" }, { de: "Wie heißt **du**?", en: "What's your name? (informal)" }, { de: "Haben **Sie** Ihren Pass?", en: "Do you have your passport?" }],
    drills: [
      { sentence: "Wo wohnen ___?", en: "At the citizens' office: Where do you live?", options: ["Sie", "du", "sie"], answer: "Sie", why: { du: "At an office, use formal Sie.", sie: "lowercase sie means she or they. Formal you is Sie." } },
      { sentence: "Kommst ___ mit?", en: "To a friend: Are you coming along?", options: ["du", "Sie", "ihr"], answer: "du", why: { Sie: "With a friend, use du. The verb kommst also shows du.", ihr: "ihr is 'you' for several friends: kommt ihr." } },
      { sentence: "Können ___ mir helfen?", en: "To a clerk: Can you help me?", options: ["Sie", "du", "dich"], answer: "Sie", why: { du: "With a clerk, use formal Sie. können also needs Sie.", dich: "dich is an object form. The subject here is Sie." } },
    ],
  },
  {
    id: "g.nach-zu", level: "a1", title: "Where to? nach, zu, in",
    rule: "**nach** + cities and most countries (nach Köln, nach Indien) and nach Hause. **zu** + people and places (zum Arzt, zur Post). **in** + some countries and places you go into (in die Stadt, in die Türkei).",
    examples: [{ de: "Ich fliege **nach** Indien.", en: "I'm flying to India." }, { de: "Ich gehe **zur** Post.", en: "I'm going to the post office." }, { de: "Wir fahren **in die** Stadt.", en: "We're going into town." }],
    drills: [
      { sentence: "Der Brief geht ___ Delhi.", en: "The letter is going to Delhi.", options: ["nach", "zu", "in"], answer: "nach", why: { zu: "For cities use nach: nach Delhi.", in: "For cities use nach: nach Delhi." } },
      { sentence: "Ich gehe ___ Bank.", en: "I'm going to the bank.", options: ["zur", "nach", "zum"], answer: "zur", why: { nach: "nach is for cities and countries. For places like the bank: zur (zu der) Bank.", zum: "Bank is feminine (die Bank): zu der = zur." } },
      { sentence: "Wann gehst du ___ Hause?", en: "When are you going home?", options: ["nach", "zu", "in"], answer: "nach", why: { zu: "zu Hause means at home. Going home is nach Hause.", in: "Going home is always nach Hause." } },
    ],
  },
  {
    id: "g.als-beruf", level: "a1", title: "Jobs: no article",
    rule: "When you say what someone does, there's **no article**: Ich bin **Ingenieur**. Ich arbeite **als** Pflegerin. Many jobs add **-in** for women: Lehrer → Lehrer**in**.",
    examples: [{ de: "Ich bin **Ingenieurin**.", en: "I'm an engineer." }, { de: "Er arbeitet **als** Koch.", en: "He works as a cook." }, { de: "Sie ist **Ärztin**.", en: "She is a doctor." }],
    drills: [
      { sentence: "Ich bin ___.", en: "I'm a teacher. (male)", options: ["Lehrer", "ein Lehrer", "der Lehrer"], answer: "Lehrer", why: { "ein Lehrer": "No article with jobs: Ich bin Lehrer.", "der Lehrer": "No article with jobs: Ich bin Lehrer." } },
      { sentence: "Sie arbeitet ___ Ärztin.", en: "She works as a doctor.", options: ["als", "wie", "bei"], answer: "als", why: { wie: "wie means like/how. 'Works as' is arbeitet als.", bei: "bei is for the employer: bei Siemens. 'As a doctor' is als Ärztin." } },
      { sentence: "Priya ist ___.", en: "Priya is an engineer.", options: ["Ingenieurin", "Ingenieur", "eine Ingenieurin"], answer: "Ingenieurin", why: { Ingenieur: "For a woman add -in: Ingenieurin.", "eine Ingenieurin": "No article with jobs: Priya ist Ingenieurin." } },
    ],
  },
  {
    id: "g.gern", level: "a1", title: "Saying what you like: gern",
    rule: "Put **gern** after the verb to say you like doing something: Ich koche **gern**. **nicht gern** = don't like doing. **lieber** = prefer.",
    examples: [{ de: "Ich lese **gern**.", en: "I like reading." }, { de: "Ich schwimme **nicht gern**.", en: "I don't like swimming." }, { de: "Ich trinke **lieber** Tee.", en: "I prefer tea." }],
    drills: [
      { sentence: "Ich tanze ___.", en: "I like dancing.", options: ["gern", "gut", "viel"], answer: "gern", why: { gut: "gut means well: Ich tanze gut = I dance well. Liking it: gern.", viel: "viel means a lot. Liking it: gern." } },
      { sentence: "Ich koche ___ gern.", en: "I don't like cooking.", options: ["nicht", "kein", "keine"], answer: "nicht", why: { kein: "kein negates nouns. Here negate gern with nicht.", keine: "keine negates nouns. Here negate gern with nicht." } },
      { sentence: "Ich trinke ___ Tee als Kaffee.", en: "I prefer tea to coffee.", options: ["lieber", "gern", "mehr gern"], answer: "lieber", why: { gern: "To compare, use lieber (prefer).", "mehr gern": "The comparative of gern is lieber." } },
    ],
  },
  {
    id: "g.es", level: "a1", title: "Weather: es regnet, es ist kalt",
    rule: "Weather uses **es** as the subject: **Es** regnet. **Es** schneit. **Es** ist warm. Also: **Es gibt** Regen (there will be rain).",
    examples: [{ de: "**Es** regnet.", en: "It's raining." }, { de: "**Es** ist sehr kalt.", en: "It's very cold." }, { de: "Morgen **gibt es** Sonne.", en: "Tomorrow there'll be sun." }],
    drills: [
      { sentence: "___ regnet heute.", en: "It's raining today.", options: ["Es", "Das", "Er"], answer: "Es", why: { Das: "Weather verbs use es: Es regnet.", Er: "Weather verbs use es: Es regnet." } },
      { sentence: "Heute ___ es warm.", en: "It's warm today.", options: ["ist", "hat", "gibt"], answer: "ist", why: { hat: "With adjectives use sein: es ist warm.", gibt: "es gibt is for nouns (es gibt Regen). With warm: es ist." } },
      { sentence: "Morgen ___ es Schnee.", en: "Tomorrow there'll be snow.", options: ["gibt", "ist", "hat"], answer: "gibt", why: { ist: "With a noun like Schnee, use es gibt.", hat: "With a noun like Schnee, use es gibt." } },
    ],
  },
  {
    id: "g.perfekt-intro", level: "a1", title: "Talking about the past: habe + ge...t",
    rule: "For most past events use **haben + past participle** at the end: Ich **habe** gekocht. Movement verbs use **sein**: Ich **bin** gefahren. For sein itself, say **ich war**.",
    examples: [{ de: "Ich **habe** Freunde **besucht**.", en: "I visited friends." }, { de: "Wir **haben** Pizza **gegessen**.", en: "We ate pizza." }, { de: "Ich **bin** nach Köln **gefahren**.", en: "I went to Cologne." }],
    drills: [
      { sentence: "Gestern ___ ich gekocht.", en: "Yesterday I cooked.", options: ["habe", "bin", "hat"], answer: "habe", why: { bin: "kochen takes haben: ich habe gekocht.", hat: "hat is for er/sie. With ich: habe." } },
      { sentence: "Wir haben Fußball ___.", en: "We played football.", options: ["gespielt", "spielen", "spielt"], answer: "gespielt", why: { spielen: "After haben, use the participle at the end: gespielt.", spielt: "After haben, use the participle: ge-spiel-t." } },
      { sentence: "Ich ___ nach Berlin gefahren.", en: "I went to Berlin.", options: ["bin", "habe", "war"], answer: "bin", why: { habe: "fahren is a movement verb, so it takes sein: ich bin gefahren.", war: "war is the simple past of sein. With gefahren, use bin." } },
    ],
  },
];
