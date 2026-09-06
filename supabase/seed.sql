-- Starter content seed: everyday-life topics (not textbook-chapter order),
-- grammar is embedded in examples/phrases rather than taught separately.
-- Run after 0001_init.sql.

insert into topics (slug, title, level, sort_order, icon) values
  ('greetings', 'Greetings & Small Talk', 'a1', 1, '👋'),
  ('numbers', 'Numbers & Time', 'a1', 2, '🔢'),
  ('family', 'Family & People', 'a1', 3, '👪'),
  ('food', 'Food & Ordering', 'a1', 4, '🍽️'),
  ('shopping', 'Shopping & Money', 'a1', 5, '🛍️'),
  ('daily_routine', 'Daily Routine', 'a1', 6, '⏰'),
  ('directions', 'Directions & Transport', 'a2', 7, '🚉'),
  ('work_study', 'Work & Study', 'a2', 8, '🎓')
on conflict (slug) do nothing;

-- Vocab items ----------------------------------------------------------------
with t as (select id, slug from topics)
insert into vocab_items (topic_id, lemma, pos, translation_en, example_de, example_en, level)
select t.id, v.lemma, v.pos, v.translation_en, v.example_de, v.example_en, v.level
from (values
  ('greetings', 'hallo', 'interj', 'hello', 'Hallo! Wie geht es dir?', 'Hello! How are you?', 'a1'),
  ('greetings', 'tschüss', 'interj', 'bye', 'Tschüss, bis morgen!', 'Bye, see you tomorrow!', 'a1'),
  ('greetings', 'heißen', 'verb', 'to be called', 'Ich heiße Raj. Wie heißt du?', 'My name is Raj. What is your name?', 'a1'),
  ('greetings', 'kommen', 'verb', 'to come/be from', 'Ich komme aus Indien.', 'I come from India.', 'a1'),
  ('greetings', 'wohnen', 'verb', 'to live', 'Ich wohne in Berlin.', 'I live in Berlin.', 'a1'),
  ('greetings', 'gut', 'adj', 'good/fine', 'Mir geht es gut, danke.', 'I am fine, thanks.', 'a1'),
  ('greetings', 'die Freundschaft', 'noun', 'friendship', 'Das ist meine Freundschaft mit ihm.', 'That is my friendship with him.', 'a2'),

  ('numbers', 'eins', 'num', 'one', 'Ich habe eins Bruder.', 'I have one brother.', 'a1'),
  ('numbers', 'zwei', 'num', 'two', 'Zwei Kaffee, bitte.', 'Two coffees, please.', 'a1'),
  ('numbers', 'die Uhr', 'noun', 'clock/o''clock', 'Es ist drei Uhr.', 'It is three o''clock.', 'a1'),
  ('numbers', 'die Stunde', 'noun', 'hour', 'Ich warte seit einer Stunde.', 'I have been waiting for an hour.', 'a1'),
  ('numbers', 'heute', 'adv', 'today', 'Was machst du heute?', 'What are you doing today?', 'a1'),
  ('numbers', 'morgen', 'adv', 'tomorrow', 'Morgen habe ich Deutschkurs.', 'Tomorrow I have German class.', 'a1'),

  ('family', 'die Familie', 'noun', 'family', 'Meine Familie ist groß.', 'My family is big.', 'a1'),
  ('family', 'der Bruder', 'noun', 'brother', 'Mein Bruder studiert Informatik.', 'My brother studies computer science.', 'a1'),
  ('family', 'die Schwester', 'noun', 'sister', 'Meine Schwester wohnt in Indien.', 'My sister lives in India.', 'a1'),
  ('family', 'die Eltern', 'noun', 'parents', 'Meine Eltern rufen mich jeden Sonntag an.', 'My parents call me every Sunday.', 'a1'),
  ('family', 'verheiratet', 'adj', 'married', 'Bist du verheiratet?', 'Are you married?', 'a2'),

  ('food', 'das Brot', 'noun', 'bread', 'Ich kaufe frisches Brot.', 'I buy fresh bread.', 'a1'),
  ('food', 'der Kaffee', 'noun', 'coffee', 'Ich trinke gern Kaffee.', 'I like drinking coffee.', 'a1'),
  ('food', 'bestellen', 'verb', 'to order', 'Ich möchte das Schnitzel bestellen.', 'I would like to order the schnitzel.', 'a1'),
  ('food', 'die Rechnung', 'noun', 'bill', 'Können wir die Rechnung haben?', 'Can we have the bill?', 'a1'),
  ('food', 'lecker', 'adj', 'tasty', 'Das Essen war sehr lecker.', 'The food was very tasty.', 'a1'),

  ('shopping', 'kaufen', 'verb', 'to buy', 'Ich kaufe ein neues Handy.', 'I am buying a new phone.', 'a1'),
  ('shopping', 'kosten', 'verb', 'to cost', 'Wie viel kostet das?', 'How much does that cost?', 'a1'),
  ('shopping', 'billig', 'adj', 'cheap', 'Dieses T-Shirt ist billig.', 'This t-shirt is cheap.', 'a1'),
  ('shopping', 'teuer', 'adj', 'expensive', 'Die Miete ist sehr teuer.', 'The rent is very expensive.', 'a1'),
  ('shopping', 'das Geld', 'noun', 'money', 'Ich habe nicht viel Geld dabei.', 'I don''t have much money with me.', 'a1'),

  ('daily_routine', 'aufstehen', 'verb', 'to get up', 'Ich stehe um sieben Uhr auf.', 'I get up at seven o''clock.', 'a1'),
  ('daily_routine', 'arbeiten', 'verb', 'to work', 'Ich arbeite von Montag bis Freitag.', 'I work Monday to Friday.', 'a1'),
  ('daily_routine', 'lernen', 'verb', 'to study/learn', 'Ich lerne jeden Tag Deutsch.', 'I study German every day.', 'a1'),
  ('daily_routine', 'müde', 'adj', 'tired', 'Ich bin heute sehr müde.', 'I am very tired today.', 'a1'),
  ('daily_routine', 'die Pause', 'noun', 'break', 'Wir machen jetzt eine Pause.', 'We are taking a break now.', 'a1'),

  ('directions', 'die Haltestelle', 'noun', 'bus/tram stop', 'Die Haltestelle ist gleich um die Ecke.', 'The stop is just around the corner.', 'a2'),
  ('directions', 'umsteigen', 'verb', 'to change (transport)', 'Sie müssen am Hauptbahnhof umsteigen.', 'You need to change at the main station.', 'a2'),
  ('directions', 'geradeaus', 'adv', 'straight ahead', 'Gehen Sie geradeaus und dann links.', 'Go straight ahead and then left.', 'a2'),

  ('work_study', 'die Bewerbung', 'noun', 'application', 'Ich schreibe eine Bewerbung.', 'I am writing an application.', 'a2'),
  ('work_study', 'die Prüfung', 'noun', 'exam', 'Die Prüfung ist nächste Woche.', 'The exam is next week.', 'a2'),
  ('work_study', 'das Praktikum', 'noun', 'internship', 'Ich mache ein Praktikum in München.', 'I am doing an internship in Munich.', 'a2')
) as v(topic_slug, lemma, pos, translation_en, example_de, example_en, level)
join t on t.slug = v.topic_slug;

-- Phrases (dialogue lines for speaking/listening) -----------------------------
with t as (select id, slug from topics)
insert into phrases (topic_id, de_text, en_text, level, situation)
select t.id, p.de_text, p.en_text, p.level, p.situation
from (values
  ('greetings', 'Hallo, wie geht es dir?', 'Hello, how are you?', 'a1', 'meeting someone'),
  ('greetings', 'Mir geht es gut, danke. Und dir?', 'I am fine, thanks. And you?', 'a1', 'meeting someone'),
  ('greetings', 'Woher kommst du?', 'Where are you from?', 'a1', 'small talk'),
  ('greetings', 'Ich komme aus Indien und wohne jetzt in Deutschland.', 'I come from India and now live in Germany.', 'a1', 'small talk'),

  ('food', 'Ich möchte einen Kaffee bestellen, bitte.', 'I would like to order a coffee, please.', 'a1', 'at a cafe'),
  ('food', 'Können wir bitte die Rechnung haben?', 'Can we have the bill, please?', 'a1', 'at a restaurant'),
  ('food', 'Das Essen war wirklich lecker.', 'The food was really tasty.', 'a1', 'at a restaurant'),

  ('shopping', 'Wie viel kostet das T-Shirt?', 'How much does the t-shirt cost?', 'a1', 'at a shop'),
  ('shopping', 'Das ist mir zu teuer.', 'That is too expensive for me.', 'a1', 'at a shop'),
  ('shopping', 'Haben Sie das eine Nummer kleiner?', 'Do you have this one size smaller?', 'a2', 'at a shop'),

  ('directions', 'Entschuldigung, wie komme ich zum Hauptbahnhof?', 'Excuse me, how do I get to the main station?', 'a2', 'asking directions'),
  ('directions', 'Gehen Sie geradeaus und dann nach links.', 'Go straight ahead and then to the left.', 'a2', 'giving directions'),
  ('directions', 'Muss ich umsteigen?', 'Do I need to change trains?', 'a2', 'public transport'),

  ('work_study', 'Ich mache gerade ein Praktikum bei einer Firma.', 'I am currently doing an internship at a company.', 'a2', 'talking about work'),
  ('work_study', 'Wann ist deine nächste Prüfung?', 'When is your next exam?', 'a2', 'talking about studies')
) as p(topic_slug, de_text, en_text, level, situation)
join t on t.slug = p.topic_slug;
