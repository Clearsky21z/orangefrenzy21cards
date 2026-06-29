# Orange Frenzy 21 Cards

A no-build GitHub Pages site for displaying a personal soccer card collection.

## What is included

- `index.html` - GitHub Pages redirect to the site in `pages/`
- `pages/index.html` - the full-screen artwork home page
- `pages/gallery.html` - featured cards and collection milestones
- `pages/collection.html` - searchable card catalog with 16 cards per page
- `pages/statistics.html` - live collection statistics
- `pages/about.html` - information about the collection
- `style.css` - the visual design
- `script.js` - search, filters, stats, and card detail dialog
- `cards.json` - the card database
- `images/cards/` - where your real card photos or scans go
- `images/placeholders/` - temporary front/back card images

## Add a card workflow

Use this checklist when adding cards from raw scans or slab photos.

1. Confirm the card details from the request and the images: category, set, card
   number, player, club or country, parallel, serial, auto/relic/graded status,
   and front/back order.
2. Find the newest source images, usually in `~/Downloads`, and visually inspect
   them before using them. Front/back order matters.
3. Create a lowercase slug from the card details:
   `year-set-player-cardnumber-parallel`.
4. Normalize raw portrait scans to `700x980` before adding them to the site:

```sh
ffmpeg -hide_banner -loglevel error -y -i SOURCE.JPG \
  -vf scale=700:980:force_original_aspect_ratio=increase,crop=700:980,setsar=1 \
  -frames:v 1 -update 1 -q:v 2 images/cards/SLUG-front.jpg
```

Use the same command for the back image with `SLUG-back.jpg`. For raw landscape
cards, use `980x700` instead. Keep graded slabs separate from raw-card sizing:
PSA/BGS-style slab photos should keep slab proportions unless a specific slab
normalization is requested.

5. Add a new object to `cards.json`. Keep field names consistent:
   - `clubCountry` is the team or country represented on the card, not the
     player's nationality.
   - `category` should use existing spelling, such as `Football/Soccer`.
   - `serial` should be copied exactly as requested, including notes like
     `Jersey#`.
   - Raw cards use `graded: false` with grade fields set to `null`.
   - Autos use `auto: true`; relics use `relic: true` and `relicType` when known.
   - Use `orientation: "landscape"` only for landscape cards.
6. Choose `parallelColor` from existing colors when possible:
   - Orange: `#f36b00`
   - Gold: `#d4af37`
   - Silver: `#87939e`
   - Black: `#111111`
   - Dortmund yellow: `#f2c500`
   - Base gray: `#6d6d6d`
7. For multi-color parallel names, keep `parallel` as the full plain-text name
   and add `parallelParts` for the colored display text.
8. Do not change the collection card placeholder/background sizing per card. The
   gray tile background should stay the same for all cards; only normalize raw
   card image files.
9. Validate after every add or edit:

```sh
jq empty cards.json
jq length cards.json
jq -r '.[].frontImage, .[].backImage | select(.)' cards.json | while IFS= read -r path; do [ -f "$path" ] || printf '%s\n' "$path"; done
sips -g pixelWidth -g pixelHeight images/cards/SLUG-front.jpg images/cards/SLUG-back.jpg
```

Example card object:

```json
{
  "id": "2025-topps-chrome-mls-maxi-moralez-el-3",
  "player": "Maxi Moralez",
  "clubCountry": "New York City FC",
  "category": "Football/Soccer",
  "year": 2025,
  "set": "2025 Topps Chrome MLS",
  "cardNumber": "EL-3",
  "parallel": "Base",
  "parallelColor": "#171717",
  "serial": null,
  "auto": false,
  "autoType": null,
  "relic": false,
  "relicType": null,
  "graded": false,
  "gradeCompany": null,
  "grade": null,
  "frontImage": "images/cards/2025-topps-chrome-mls-maxi-moralez-el-3-front.webp",
  "backImage": "images/cards/2025-topps-chrome-mls-maxi-moralez-el-3-back.webp"
}
```

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
