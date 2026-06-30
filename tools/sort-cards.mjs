import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const cardsPath = resolve(repoRoot, 'cards.json');
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
});

let cards;

try {
  cards = JSON.parse(readFileSync(cardsPath, 'utf8'));
} catch (error) {
  console.error(`Failed to parse cards.json: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(cards)) {
  console.error('cards.json must be an array of card objects');
  process.exit(1);
}

const migratedCards = cards.map(migrateCard).sort(compareCards);

writeFileSync(cardsPath, `${JSON.stringify(migratedCards, null, 2)}\n`);
console.log(`Sorted ${migratedCards.length} cards.`);

function migrateCard(card, index) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    fail(`Card at index ${index} must be an object`);
  }

  const season = card.season ?? deriveSeason(card.set, card.id || `index ${index}`);
  const migrated = {};

  for (const [key, value] of Object.entries(card)) {
    if (key === 'year') {
      if (!Object.hasOwn(card, 'season')) migrated.season = season;
      continue;
    }

    migrated[key] = key === 'season' ? season : value;
  }

  if (!Object.hasOwn(migrated, 'season')) migrated.season = season;

  return migrated;
}

function deriveSeason(set, cardId) {
  if (typeof set !== 'string') {
    fail(`${cardId}: set is required to derive season`);
  }

  const seasonMatch = set.match(/^(\d{4})-(\d{2})\b/);
  if (seasonMatch) return `${seasonMatch[1]}-${seasonMatch[2]}`;

  const yearMatch = set.match(/^(\d{4})\b/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return `${year - 1}-${String(year).slice(-2)}`;
  }

  fail(`${cardId}: cannot derive season from set "${set}"`);
}

function compareCards(a, b) {
  return (
    compareSeasonDesc(a.season, b.season) ||
    compareText(a.set, b.set) ||
    compareText(a.player, b.player) ||
    compareSerial(a.serial, b.serial) ||
    compareNullableText(a.cardNumber, b.cardNumber) ||
    compareText(a.parallel, b.parallel) ||
    compareText(a.id, b.id)
  );
}

function compareSeasonDesc(a, b) {
  return seasonStart(b) - seasonStart(a) || compareText(b, a);
}

function seasonStart(season) {
  const match = String(season || '').match(/^(\d{4})/);
  return match ? Number(match[1]) : -Infinity;
}

function compareSerial(a, b) {
  const parsedA = parseSerial(a);
  const parsedB = parseSerial(b);

  return (
    parsedA.rank - parsedB.rank ||
    parsedA.denominator - parsedB.denominator ||
    parsedA.numerator - parsedB.numerator ||
    compareText(parsedA.raw, parsedB.raw)
  );
}

function parseSerial(serial) {
  if (serial === null || serial === undefined || serial === '') {
    return {
      rank: 2,
      denominator: Number.POSITIVE_INFINITY,
      numerator: Number.POSITIVE_INFINITY,
      raw: ''
    };
  }

  const raw = String(serial);
  const match = raw.match(/(\d+)\/(\d+)/);
  if (!match) {
    return {
      rank: 1,
      denominator: Number.POSITIVE_INFINITY,
      numerator: Number.POSITIVE_INFINITY,
      raw
    };
  }

  return {
    rank: 0,
    denominator: Number(match[2]),
    numerator: Number(match[1]),
    raw
  };
}

function compareNullableText(a, b) {
  const aMissing = a === null || a === undefined || a === '';
  const bMissing = b === null || b === undefined || b === '';

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return compareText(a, b);
}

function compareText(a, b) {
  return collator.compare(String(a ?? ''), String(b ?? ''));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
