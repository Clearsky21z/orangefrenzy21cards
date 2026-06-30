import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const cardsPath = resolve(repoRoot, 'cards.json');

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

const requiredFields = [
  'id',
  'player',
  'clubCountry',
  'category',
  'season',
  'set',
  'cardNumber',
  'parallel',
  'parallelColor',
  'serial',
  'auto',
  'relic',
  'graded',
  'frontImage',
  'backImage'
];
const issues = [];

cards.forEach((card, index) => {
  const cardId =
    card && typeof card.id === 'string' && card.id.trim()
      ? card.id
      : `card at index ${index}`;

  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    issues.push({ cardId, issue: 'card must be an object' });
    return;
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(card, field)) {
      issues.push({ cardId, issue: `${field} is missing` });
    }
  }

  if (Object.hasOwn(card, 'year')) {
    issues.push({ cardId, issue: 'year must be replaced with season' });
  }

  if (typeof card.season !== 'string' || !card.season.trim()) {
    issues.push({ cardId, issue: 'season is invalid' });
  }

  for (const field of ['frontImage', 'backImage']) {
    const imagePath = card?.[field];

    if (typeof imagePath !== 'string' || !imagePath.trim()) {
      issues.push({ cardId, issue: `${field} is missing or invalid` });
      continue;
    }

    if (!existsSync(resolve(repoRoot, imagePath))) {
      issues.push({ cardId, issue: `${field} path is missing: ${imagePath}` });
    }
  }
});

if (issues.length > 0) {
  console.error('Card validation failed:');

  for (const { cardId, issue } of issues) {
    console.error(`- ${cardId}: ${issue}`);
  }

  process.exit(1);
}

console.log(`cards.json schema and image paths are valid for ${cards.length} cards.`);
