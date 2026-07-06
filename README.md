# OrangeFrenzy21Cards

A no-build GitHub Pages site for displaying a personal soccer card collection.

## What is included

- `index.html` - the full-screen artwork home page
- `pages/` - gallery, collection, statistics, about pages, plus a legacy home redirect
- `pages/gallery.html` - featured cards and collection milestones
- `pages/collection.html` - searchable card catalog with 16 cards per page
- `pages/statistics.html` - live collection statistics
- `pages/about.html` - information about the collection
- `style.css` - the visual design
- `script.js` - search, filters, stats, and card detail dialog
- `cards.json` - the card database
- `images/cards/` - where your real card photos or scans go
- `images/placeholders/` - temporary front/back card images

## Add Card Workflow

New cards are added through `incoming/new-card.json` and the local add-card
script. This is terminal-only developer tooling; it does not add any public
website button, form, admin page, login, upload feature, or browser UI.

### 1. Create `incoming/new-card.json`

Each new card should be described with the standard JSON structure:

```json
{
  "category": "Football/Soccer",
  "season": "2023-24",
  "set": "2023-24 Topps Chrome UCC",
  "player": "Player Name",
  "clubCountry": "Borussia Dortmund",
  "cardNumber": "123",
  "parallel": "Orange Refractor",
  "parallelColor": "#f36b00",
  "serial": "21/25",
  "auto": false,
  "relic": false,
  "graded": false,
  "frontSource": "0001",
  "backSource": "0002"
}
```

Optional fields can be included when needed:

```json
{
  "autoType": "On Card",
  "relicType": "Match Worn",
  "note": "My first Marco Reus card!",
  "orientation": "landscape",
  "backPlaceholderText": "To be Uploaded",
  "parallelParts": [
    {
      "text": "Orange",
      "color": "#f36b00"
    },
    {
      "text": " Inferno",
      "color": "#111111"
    }
  ]
}
```

If `note` is not provided, the script defaults it to:

```json
"note": null
```

### 2. Run the add-card script

```sh
npm run add:card -- incoming/new-card.json
```

The script creates a full card object, generates a stable card ID, finds the
newest matching front/back source images in `~/Downloads`, normalizes raw
portrait cards to `700x980` or raw landscape cards to `980x700`, assigns
front/back image filenames, saves the JPGs in `images/cards/`, and adds the
card to `cards.json`.

For graded cards (`"graded": true`), the script preserves the full slab image
instead of cropping to raw-card proportions. The generated image should keep the
grading label, plastic border, and card inside the slab visible.

When the back image is not available, set `"backSource": null` and provide
`"backPlaceholderText": "To be Uploaded"`. The script creates a generated back
image placeholder with that text so `cards.json` still has a valid `backImage`
path. For graded cards, the placeholder uses the preserved front slab image
dimensions so the front/back display sizes match.

The script also runs:

```sh
npm run sort:cards
npm run check
```

### 3. Card object logic

The generated card object includes:

- `id`
- `player`
- `clubCountry`
- `category`
- `season`
- `set`
- `cardNumber`
- `parallel`
- `parallelColor`
- `serial`
- `note`
- `auto`
- `relic`
- `graded`
- `gradeCompany`
- `grade`
- `certification`
- `frontImage`
- `backImage`

Optional fields are added only when needed or provided:

- `autoType`
- `autoGrade`
- `relicType`
- `parallelParts`
- `orientation` only when the input uses `"landscape"`

Example:

```json
{
  "id": "2022-23-topps-bvb-china-edition-marco-reus-rc-mr-relic-orange",
  "player": "Marco Reus",
  "clubCountry": "Borussia Dortmund",
  "category": "Football/Soccer",
  "season": "2022-23",
  "set": "2022-23 Topps BVB China Edition",
  "cardNumber": "RC-MR",
  "parallel": "RELIC - Orange",
  "parallelColor": "#f36b00",
  "serial": "21/35",
  "note": "My first Marco Reus card!",
  "orientation": "landscape",
  "auto": false,
  "relic": true,
  "relicType": "Match Worn",
  "graded": false,
  "gradeCompany": null,
  "grade": null,
  "certification": null,
  "frontImage": "images/cards/2022-23-topps-bvb-china-edition-marco-reus-rc-mr-relic-orange-front.jpg",
  "backImage": "images/cards/2022-23-topps-bvb-china-edition-marco-reus-rc-mr-relic-orange-back.jpg"
}
```

### Multi-Player Cards

For cards with more than one player, keep using the existing `player` field and
join names with ` & `:

```json
"player": "Karl-Heinz Riedle & Matthias Sammer"
```

Do not add a separate player-list field. The UI displays the `player` value
exactly as written for card titles and details.

Player-based statistics split `player` on `&`, trim whitespace, and count each
name separately. For example, `Player A & Player B & Player C` counts once for
each of `Player A`, `Player B`, and `Player C` in the player distribution.

### 4. Notes

Every card must have a lowercase `note` field.

Valid note values are:

```json
"note": null
```

or:

```json
"note": "Some note text"
```

The UI only displays the note when it is not `null` and not empty. Cards with
`note: null` do not show any note row.

### 5. Relic Logic

For relic cards, use:

```json
"relic": true,
"relicType": "Match Worn"
```

For non-relic cards:

```json
"relic": false
```

### 6. Autograph Logic

For autograph cards, use:

```json
"auto": true
```

For non-autograph cards:

```json
"auto": false
```

The parallel name should still include the autograph label when needed:

```json
"parallel": "AUTO - Orange Refractor"
```

### 7. Validation

After adding or editing a card, run:

```sh
npm run check
```

The check script validates:

- `cards.json` is valid JSON
- every card has required fields
- every card has a valid `note` field
- image paths exist
- schema rules are satisfied

### 8. Standard Workflow

```sh
npm run add:card -- incoming/new-card.json
npm run check
```

In plain English: you feed Codex one clean JSON file, `add-card` converts it
into the full collection object, image paths and ID are generated, `note`
defaults to `null`, and `npm run check` confirms the whole collection is still
valid.

### 9. Add Card Workflow for Codex

When the user asks Codex to add a card, Codex should follow this repo workflow:

1. Create `incoming/new-card.json` from the metadata provided by the user.
2. Preserve the current schema used in `cards.json`.
3. Set `"note": null` unless the user explicitly provides a note.
4. Set `"auto": true` only when the parallel indicates `AUTO` or autograph.
5. Set `"relic": true` only when the card is a relic. Include `relicType` only
   when the user provides it.
6. Use the correct existing `parallelColor` from `cards.json` when the user says
   to use an existing color. For example, gold is `#d4af37`. Use orange
   `#f36b00` only for orange cards.
7. Respect `frontSource` and `backSource` exactly as provided.
8. Include `"orientation": "landscape"` only when the user says the card is
   landscape.
9. Run:

```sh
npm run add:card -- incoming/new-card.json
npm run check
```

After finishing, Codex should report:

- the generated card object
- the generated front/back image filenames
- important flags such as `auto`, `relic`, `relicType`, `note`, `orientation`,
  and `parallelColor`
- confirmation that `npm run add:card` passed
- confirmation that `npm run check` passed

Codex should not change unrelated files or redesign pages during card entry.

## Publish on GitHub Pages

This repo is set up to publish from the repository root.

1. Push the files to GitHub.
2. Open the repo on GitHub.
3. Go to **Settings -> Pages**.
4. Set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` and **Folder** to `/ root`.

For a project repo named `orangefrenzy21cards`, the site will usually publish at:

```text
https://clearsky21z.github.io/orangefrenzy21cards/
```
