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
  loading, narratives/rooms/items lookup, prev/next, theme switching, text
  selection, URL helpers.
- Navigation state travels in the URL (`item.html?narrative=…&item=…`), so
  every state is a plain link (good for accessibility and for the back button).

## The three narratives (agreed by the team)

1. `timeline` — Historical (required), 15 items in date order.
2. `from-subject-to-film` — 7 items, from page to screen.
3. `bologna-walk` — "Guida per camminare a Bologna", 5 items, thematic order;
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
  (`map.html?narrative=bologna-walk`, `=all`). Nothing is hard-coded: route =
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

## What the pages do today

- `item.html` — working skeleton: item view, prev/next inside the chosen
  narrative, theme selector. It shows the local image, the PDF as a link, and
  every `externalLinks` entry (YouTube as an embed, other links as links).
- `map.html` — see above.
- Markup and classes in both pages are placeholders for River's design; the ids
  used by the scripts must stay.

## Still open

1. **Texts.** `items.json` still holds only the catalogue description for each
   item. Claudia's two versions per item (whimsical / academic) and the
   per-narrative descriptions are in `data/text_grid.md` and are not imported
   yet. This needs a small schema decision: the grid axes are now mainly
   *whimsical vs academic* (short vs long), and per-narrative texts need their
   own tag. The item page also needs the text-type selectors (`#text-selectors`
   is still an empty placeholder).
2. **No global scroll.** `map.html` already fits the viewport; `item.html`
   does not yet (long text and images need to scroll inside their own box).
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
