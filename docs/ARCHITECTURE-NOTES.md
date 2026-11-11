# Architecture notes — The Revolussion of Renzo Renzi

Notes for the "Architecture & Data" part (Laura): how the data, the JS and the
pages fit together, what changed, and what is still open. Updated after the
team agreed on the three narratives, the three rooms and the final planimetry.

## How it fits together

- `data/items.csv` (Claudia's research) is the source of truth for the
  cataloguing metadata. `data/items.json` is generated from it and keeps every
  CSV field under `metadata`, so nothing is lost.
- `data/items.json` — 16 items plus the three museum `rooms`. Per item:
  `id` (= CSV identifier = asset file naming), `title`, `creator`, `images`
  (local files in `assets/items/`), `externalLinks` (things hosted elsewhere:
  YouTube embeds, Bologna Fotografata, Archivio Luce), `texts`, `mapPosition`
  and a `metadata` object.
- `data/narratives.json` — each narrative is just an ordered list of item ids.
  An item can be in several narratives, so nothing is duplicated.
- `js/main.js` — one global `Exhibition` object shared by every page: data
  loading (`initPage`), narratives/rooms/items lookup, prev/next, theme
  switching, text versions, URL helpers. It never writes page layout.
- Navigation state travels in the URL (`exhibition.html?narrative=…&item=…`), so
  every state is a plain link (good for accessibility and for the back button).

## HTML, JSON and JS stay separate

- **HTML** = structure and fixed words only, written by hand. **JSON** = all the
  content. **JS** = `js/main.js` (shared logic) + one script per page
  (`js/item.js`, `js/map.js`) that finds elements **by id** and fills them.
- The ids are listed page by page in `HTML-IDS.md` (this is the list to give to
  whoever writes the HTML). `css/skeleton.css` is a temporary layout, to replace.
- Files: `exhibition.html`, `map.html` in the root; `js/main.js`, `js/item.js`,
  `js/map.js`; `css/skeleton.css`; `data/*.json`.

## The three narratives (agreed by the team)

1. `renzo-renzi-a-life` — Renzo Renzi: a Life (Historical, required), 15 items in date order.
2. `from-subject-to-film` — 7 items, from page to screen.
3. `guide-to-walking-bologna` — "Guide to walking in Bologna", 5 items, thematic order;
   each stop has a verb (walk it, film it, read it, watch a film in it,
   remember it) stored as `stopLabels`.

Orders and descriptions follow the Notion table "Narratives".

The earlier "Renzi: Many Lives" idea (critic / curator / soldier) was dropped;
the three rooms keep a trace of it.

## The map

- Image: `assets/img/museum/gallery_planimetry_no_punti.png` (4032×3024,
  Claudia's final planimetry; the coloured zones are the three rooms).
- `mapPosition.area` = room id (`room-1`, `room-2`, `room-3`, defined in
  `items.json` → `rooms`); `mapPosition.x` / `.y` = **percentages** (0–100) of
  the image width/height, not pixels.
- Positions were read from Claudia's annotated sketch, one dot per item.
- `map.html` draws the image in an inline SVG (it scales to any box, so the page
  is exactly viewport-sized with no global scroll). Markers are real links.
- **Itineraries on the map.** The visitor picks a narrative (or "all items");
  its stops are joined by a numbered route in the order of
  `narratives.json`, the other items are dimmed, and "Start this itinerary"
  opens the first item. The choice lives in the URL
  (`map.html?narrative=guide-to-walking-bologna`, `=all`). Nothing is hard-coded: route =
  `narrative.order`, positions = `mapPosition`.
- Non-visual alternative: the side panel gives the itinerary as an ordered list
  of links, plus every item grouped by room; the number of stops is announced
  to screen readers when the itinerary changes.
- Route/marker colour is the CSS variable `--map-accent`, so a theme can
  override it.
- Note: the historical route zigzags between rooms, because rooms are
  thematic and the timeline is chronological. That is a property of the
  design, not a bug.

| Room | Items |
| --- | --- |
| 1 — the man / soldier | letter, *L'armata s'agapò*, portrait, interview |
| 2 — the filmmaker | Po screenplay, *Guida*, Ferrari photo, *Bologna, una città*, caricature |
| 3 — Renzi & Fellini | film, soundtrack, two stills, premiere photo, Gelsomina drawing, *Il primo Fellini* |

## The texts (three versions per item)

Claudia's `data/text_grid.md` is imported: every item has **three texts**, one
per "voice" (the minimum of the brief; per-item cells are the grid values she
proposed):

| Voice id | Label in the UI | Length / competence / audience |
| --- | --- | --- |
| `museum` (default) | Read less | medium / average / general adult |
| `archival` | Read more | long / advanced / scholar |
| `renzo` | Told by Renzo | very brief / introductory / young (an imagined Renzi, first person; not his real words) |

- `item.texts[]` = `{ voice, length, competence, audience, lang, content, _source }`.
- `content` is plain text: blank line = new paragraph, line break = `<br>`,
  `*asterisks*` = italics. `Exhibition.formatText()` escapes it and turns it
  into HTML, so the same function serves items and narrative captions.
- The visitor's choice is remembered (`localStorage`, key
  `exhibition:textVoice`) and shared by all pages. `Exhibition.wireTextSelector(el, onChange)`
  builds the selector (a radio group, keyboard accessible); every page that
  shows texts calls it, like `wireThemeSelect`.
- Labels and the list of voices live in one place: `VOICES` in `js/main.js`.
- Narrative captions (Historical / From subject to film / Bologna) replaced the
  short descriptions in `narratives.json` and appear in the map's side panel.
- Claudia's file is a *review draft*: when she changes it, the import is a
  re-run of a small script (ask Laura) or a manual paste into `items.json`.

## What the pages do today

- `exhibition.html` — working skeleton, window-sized: media on the left (all local
  images, PDF link, video embeds), text on the right, with "stop N of M", the
  room and a link back to the map; prev/next inside the chosen narrative,
  theme selector, text-version selector. On phones media goes above the text. It shows the local image, the PDF as a link, and
  every `externalLinks` entry (YouTube as an embed, other links as links).
- `map.html` — see above. Both pages are structure only; their scripts are `js/item.js` and `js/map.js`.
- Markup and classes in both pages are placeholders; the ids used by the scripts
  (`HTML-IDS.md`) must stay.

## Still open

1. **Texts: to review with Claudia.** Imported as a review draft (see above).
   - Italian/Bolognese words inside English text (titles, *Bulåggna*, the
     "Baci" quote) have no `lang` marking yet; for accessibility each foreign
     phrase should get `lang="it"` (or the Bolognese code, to verify).
   - `la_strada_film` / archival repeats "International title: *The Road*"
     (already in the first line).
   - `photo_lastrada_premiere`: the museum text lists Fellini and Masina, the
     "Told by Renzo" text puts Renzi in the photograph too. Check.
   - `renzi_interview_2000`: the texts speak of hearing Renzi "in his own voice",
     but the video is not playable on the site yet (see 4).
   - The text selector is on `exhibition.html` only; the other pages still need it.
2. **No global scroll: done for `map.html` and `exhibition.html`** (the page is
   window-sized; the text box and, for items with several images such as the
   letter, the media box scroll inside themselves). The other pages still have
   to follow the same rule.
3. **Pages nobody owns yet:** `index`, `about`, `docs`, `disclaimer`. Every page
   also needs prev/next, the theme selector and the text-type selectors.
4. **Video items.** `guida_documentary` and `renzi_interview_2000` have no
   playable file: the videos are too large for the repo (only an Archivio Luce
   record is linked for *Guida*). Decide: external hosting or Git LFS.
5. **Small data questions for Claudia:**
   - `bologna_book` (1964) is not in the Historical timeline; if it should be,
     it goes between the caricature and *Il primo Fellini*.
   - Timeline order inside 1954 is a best guess; `renzi_portrait` is undated
     and sits last.
   - On the map, which of the two "foto film" dots is which still is a guess,
     and the "script La Strada" label was read as *Il primo Fellini*.
6. **Notion vs data.** In the Notion, §3 (items list) says *Guida* is the
   documentary and *Po* the screenplay (as in the CSV and JSON), while §4
   (metadata table) says the opposite. The Cineteca holds both a film and a
   manuscript for each title, so either choice is valid, but the project should
   pick one and align the table.
7. The old personal repo (`lauraaa13/Information-Modelling`) is superseded by
   this one; a one-line pointer in its README avoids confusion.
