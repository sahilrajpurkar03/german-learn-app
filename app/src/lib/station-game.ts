export type Departure = {
  id: string;
  destination: string;
  time: string;
  platform: number;
};
export type StationRound = {
  id: string;
  announcement: string;
  explanation: string;
  board: Departure[];
  targetId: string;
};
const destinations = [
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Leipzig",
  "Dresden",
  "Bremen",
  "Hannover",
];
const numberWords = [
  "null",
  "eins",
  "zwei",
  "drei",
  "vier",
  "fünf",
  "sechs",
  "sieben",
  "acht",
  "neun",
  "zehn",
  "elf",
  "zwölf",
  "dreizehn",
  "vierzehn",
  "fünfzehn",
  "sechzehn",
  "siebzehn",
  "achtzehn",
];

function shuffled<Value>(values: Value[], random: () => number): Value[] {
  return values
    .map((value) => ({ value, order: random() }))
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.value);
}

export function createStationRounds(
  random = Math.random,
  count = 6,
): StationRound[] {
  return Array.from({ length: count }, (_, index) => {
    const cities = shuffled(destinations, random).slice(0, 3);
    const platforms = shuffled([1, 2, 3, 4, 5, 6, 7, 8], random).slice(0, 4);
    const hour = 9 + Math.floor(random() * 9);
    const time = `${String(hour).padStart(2, "0")}:30`;
    const targetId = `round-${index}-target`;
    const target: Departure = {
      id: targetId,
      destination: cities[0],
      time,
      platform: platforms[0],
    };
    const board = shuffled(
      [
        target,
        {
          id: `round-${index}-old`,
          destination: cities[0],
          time,
          platform: platforms[1],
        },
        {
          id: `round-${index}-city`,
          destination: cities[1],
          time,
          platform: platforms[0],
        },
        {
          id: `round-${index}-time`,
          destination: cities[0],
          time: `${String(hour).padStart(2, "0")}:15`,
          platform: platforms[2],
        },
      ],
      random,
    );
    const announcement =
      index % 2 === 0
        ? `Achtung, eine Gleisänderung. Der Zug nach ${target.destination} um ${numberWords[hour]} Uhr dreißig fährt heute von Gleis ${numberWords[target.platform]} ab, nicht von Gleis ${numberWords[platforms[1]]}.`
        : `Der Zug nach ${target.destination} fährt um halb ${numberWords[hour + 1]} von Gleis ${numberWords[target.platform]} ab. Bitte achten Sie auf die Abfahrtszeit.`;
    return {
      id: `round-${index}`,
      announcement,
      board,
      targetId,
      explanation:
        index % 2 === 0
          ? `Gleisänderung means a platform change. The correct departure is ${target.destination}, ${time}, platform ${target.platform}. Nicht von Gleis ${platforms[1]} rules out the old platform.`
          : `Halb ${numberWords[hour + 1]} means ${time}, half an hour before ${hour + 1}. Choose ${target.destination} at platform ${target.platform}.`,
    };
  });
}

export function stationPoints(
  correct: boolean,
  supported: boolean,
  streak: number,
): number {
  return correct
    ? supported
      ? 5
      : 10 + Math.min(5, Math.max(0, streak)) * 2
    : 0;
}
