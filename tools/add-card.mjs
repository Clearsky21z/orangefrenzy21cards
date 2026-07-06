import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const cardsPath = resolve(repoRoot, 'cards.json');
const imagesDir = resolve(repoRoot, 'images/cards');
const downloadsDir = resolve(homedir(), 'Downloads');
const sourceImageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.tif',
  '.tiff'
]);

main();

function main() {
  try {
    const inputPath = process.argv[2];

    if (!inputPath) {
      fail('Usage: npm run add:card -- incoming/new-card.json');
    }

    const input = readInput(resolve(process.cwd(), inputPath));
    const cards = readCards();
    const card = ensureUniqueCardId(buildCard(input), cards);

    const frontSource = findSourceImage(input.frontSource, 'frontSource');
    const backSourceInput = normalizeNullable(input.backSource);

    mkdirSync(imagesDir, { recursive: true });
    const frontOutput = resolve(repoRoot, card.frontImage);
    const backOutput = resolve(repoRoot, card.backImage);

    writeCardImage(frontSource, frontOutput, card);

    if (backSourceInput === null) {
      createPlaceholderImage(
        backOutput,
        normalizeNullable(input.backPlaceholderText) || 'To be Uploaded',
        card.orientation,
        card.graded ? getImageDimensions(frontOutput) : null
      );
    } else {
      const backSource = findSourceImage(backSourceInput, 'backSource');
      writeCardImage(backSource, backOutput, card);
    }

    cards.push(card);
    writeFileSync(cardsPath, `${JSON.stringify(cards, null, 2)}\n`);

    runNpmScript('sort:cards');
    runNpmScript('check');

    console.log(`Added card: ${card.id}`);
    console.log(`Front image: ${card.frontImage}`);
    console.log(`Back image: ${card.backImage}`);
  } catch (error) {
    if (error?.message) {
      console.error(error.message);
    }

    process.exit(1);
  }
}

function readInput(inputPath) {
  try {
    const input = JSON.parse(readFileSync(inputPath, 'utf8'));

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      fail('Input JSON must be a single card object');
    }

    return input;
  } catch (error) {
    fail(`Failed to read input JSON: ${error.message}`);
  }
}

function readCards() {
  try {
    const cards = JSON.parse(readFileSync(cardsPath, 'utf8'));

    if (!Array.isArray(cards)) {
      fail('cards.json must be an array of card objects');
    }

    return cards;
  } catch (error) {
    fail(`Failed to read cards.json: ${error.message}`);
  }
}

function buildCard(input) {
  const cardNumber = normalizeNullable(input.cardNumber);
  const serial = normalizeNullable(input.serial);
  const orientation = String(input.orientation || '').trim().toLowerCase();
  const season = requiredText(input.season, 'season');
  const set = requiredText(input.set, 'set');
  const id = slugify([
    season,
    setSlugPart(set, season),
    requiredText(input.player, 'player'),
    cardNumber,
    requiredText(input.parallel, 'parallel')
  ]);

  if (!id) {
    fail('Generated card id is empty. Check season, set, player, cardNumber, and parallel.');
  }

  const card = {
    id,
    player: requiredText(input.player, 'player'),
    clubCountry: requiredText(input.clubCountry, 'clubCountry'),
    category: requiredText(input.category, 'category'),
    season,
    set,
    cardNumber,
    parallel: requiredText(input.parallel, 'parallel'),
    parallelColor: requiredText(input.parallelColor, 'parallelColor'),
    serial,
    note: normalizeNullable(input.note),
    auto: normalizeBoolean(input.auto, false),
    relic: normalizeBoolean(input.relic, false),
    graded: normalizeBoolean(input.graded, false),
    gradeCompany: normalizeNullable(input.gradeCompany),
    grade: normalizeNullable(input.grade),
    certification: normalizeNullable(input.certification)
  };

  addOptional(card, input, 'autoType');

  if (card.relic) {
    addOptional(card, input, 'relicType');
  }

  addOptional(card, input, 'autoGrade');
  addOptional(card, input, 'parallelParts');

  if (orientation === 'landscape') {
    card.orientation = 'landscape';
  }

  card.frontImage = `images/cards/${id}-front.jpg`;
  card.backImage = `images/cards/${id}-back.jpg`;

  return card;
}

function ensureUniqueCardId(card, cards) {
  const existingIds = new Set(cards.map((existingCard) => existingCard.id));

  if (!existingIds.has(card.id)) {
    return card;
  }

  const serialSuffix = serialSlugPart(card.serial);

  if (!serialSuffix) {
    fail(`Card id already exists in cards.json: ${card.id}`);
  }

  const uniqueId = `${card.id}-${serialSuffix}`;

  if (existingIds.has(uniqueId)) {
    fail(`Card id already exists in cards.json: ${uniqueId}`);
  }

  card.id = uniqueId;
  card.frontImage = `images/cards/${uniqueId}-front.jpg`;
  card.backImage = `images/cards/${uniqueId}-back.jpg`;

  return card;
}

function serialSlugPart(serial) {
  const normalizedSerial = normalizeNullable(serial);

  if (normalizedSerial === null) {
    return null;
  }

  const serialMatch = String(normalizedSerial).match(/(\d+)\s*\/\s*(\d+)/);

  if (!serialMatch) {
    return slugify([normalizedSerial]);
  }

  const numerator = Number.parseInt(serialMatch[1], 10);
  const denominator = Number.parseInt(serialMatch[2], 10);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }

  return `${numerator}-${denominator}`;
}

function addOptional(card, input, key) {
  if (!Object.hasOwn(input, key)) return;

  const value = input[key];

  if (value === undefined || value === null) return;
  if (typeof value === 'string' && !value.trim()) return;

  card[key] = value;
}

function normalizeNullable(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();

  if (!trimmed || /^(no exist|none|null)$/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();

  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;

  return fallback;
}

function requiredText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`${fieldName} is required`);
  }

  return value.trim();
}

function slugify(parts) {
  return parts
    .filter((part) => part !== null && part !== undefined && String(part).trim())
    .join(' ')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function setSlugPart(set, season) {
  const escapedSeason = season.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const seasonPrefix = new RegExp(`^${escapedSeason}\\s+`, 'i');

  return set.replace(seasonPrefix, '');
}

function findSourceImage(source, fieldName) {
  const normalizedSource = normalizeNullable(source);

  if (normalizedSource === null) {
    fail(`${fieldName} is required`);
  }

  const sourceText = String(normalizedSource);
  const directPath = resolve(process.cwd(), sourceText);

  if (existsSync(directPath)) {
    return directPath;
  }

  if (!existsSync(downloadsDir)) {
    fail(`Downloads folder not found: ${downloadsDir}`);
  }

  const matches = readdirSync(downloadsDir)
    .filter((fileName) => fileName.includes(sourceText))
    .filter((fileName) => sourceImageExtensions.has(extname(fileName).toLowerCase()))
    .map((fileName) => {
      const filePath = resolve(downloadsDir, fileName);
      const stats = statSync(filePath);

      return {
        filePath,
        fileName,
        mtimeMs: stats.mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (matches.length === 0) {
    fail(`No ${fieldName} image found in ~/Downloads containing "${sourceText}"`);
  }

  const match = matches[0];
  console.log(`${fieldName}: ${basename(match.filePath)}`);

  return match.filePath;
}

function writeCardImage(sourcePath, outputPath, card) {
  if (card.graded) {
    preserveImage(sourcePath, outputPath);
    return;
  }

  normalizeImage(sourcePath, outputPath, card.orientation);
}

function preserveImage(sourcePath, outputPath) {
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      sourcePath,
      '-frames:v',
      '1',
      '-update',
      '1',
      '-q:v',
      '2',
      outputPath
    ],
    { stdio: 'inherit' }
  );
}

function normalizeImage(sourcePath, outputPath, orientation) {
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? 980 : 700;
  const height = isLandscape ? 700 : 980;
  const filter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;

  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      sourcePath,
      '-vf',
      filter,
      '-frames:v',
      '1',
      '-update',
      '1',
      '-q:v',
      '2',
      outputPath
    ],
    { stdio: 'inherit' }
  );
}

function createPlaceholderImage(outputPath, text, orientation, dimensions = null) {
  const isLandscape = orientation === 'landscape';
  const width = dimensions?.width || (isLandscape ? 980 : 700);
  const height = dimensions?.height || (isLandscape ? 700 : 980);
  const fontSize = Math.max(34, Math.round(Math.min(width, height) * 0.085));
  const safeText = escapeDrawtext(String(text));
  const fontCacheDir = resolve('/private/tmp', 'orangefrenzy21cards-fontconfig');
  const fontOption = "font='Apple SD Gothic Neo\\:style=Bold':";
  const filter = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=0xdedede:t=10`,
    `drawtext=${fontOption}text='${safeText}':fontcolor=0x6d6d6d:bordercolor=0x6d6d6d:borderw=1:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2`
  ].join(',');

  mkdirSync(fontCacheDir, { recursive: true });

  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=0xf6f6f6:s=${width}x${height}`,
      '-vf',
      filter,
      '-frames:v',
      '1',
      '-update',
      '1',
      '-q:v',
      '2',
      outputPath
    ],
    {
      env: {
        ...process.env,
        XDG_CACHE_HOME: fontCacheDir
      },
      stdio: 'inherit'
    }
  );
}

function getImageDimensions(imagePath) {
  const output = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'csv=p=0:s=x',
      imagePath
    ],
    { encoding: 'utf8' }
  ).trim();
  const [width, height] = output.split('x').map((value) => Number.parseInt(value, 10));

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    fail(`Unable to determine image dimensions for ${imagePath}`);
  }

  return { width, height };
}

function escapeDrawtext(text) {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:');
}

function runNpmScript(scriptName) {
  execFileSync('npm', ['run', scriptName], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
}

function fail(message) {
  throw new Error(message);
}
