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

const missingReferences = [];

cards.forEach((card, index) => {
  const cardId =
    card && typeof card.id === 'string' && card.id.trim()
      ? card.id
      : `card at index ${index}`;

  for (const field of ['frontImage', 'backImage']) {
    const imagePath = card?.[field];

    if (typeof imagePath !== 'string' || !imagePath.trim()) {
      missingReferences.push({ cardId, imagePath: `${field} is missing` });
      continue;
    }

    if (!existsSync(resolve(repoRoot, imagePath))) {
      missingReferences.push({ cardId, imagePath });
    }
  }
});

if (missingReferences.length > 0) {
  console.error('Missing image references:');

  for (const { cardId, imagePath } of missingReferences) {
    console.error(`- ${cardId}: ${imagePath}`);
  }

  process.exit(1);
}

console.log(`All image paths exist for ${cards.length} cards.`);
