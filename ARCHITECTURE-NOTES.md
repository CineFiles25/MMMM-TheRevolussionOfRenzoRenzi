# Architecture notes — The Revolussion of Renzo Renzi

Starting point for the "Architecture & Data" part (Laura), migrated into the
team's actual repo (`CineFiles25/MMMM-TheRevolussionOfRenzoRenzi`) after
discovering Claudia had already been populating it with real research and
assets. Nothing from the earlier draft (in `lauraaa13/Information-Modelling`)
is lost — the data model and JS logic are the same, just rebuilt from the
real `data/items.csv` instead of placeholders.

## Files in this drop

- `data/items.json` — generated from `data/items.csv`. Every item keeps its
  CSV `identifier` as `id` (so it lines up with the filenames already in
  `assets/items/`). Core navigation fields (`id`, `title`, `creator`,
  `images`, `texts`, `mapPosition`) are at the top level; every other
  cataloguing field from the CSV (rights, dimensions, inventory numbers,
  archival description, etc.) is preserved verbatim under `metadata` —
  nothing Claudia researched is dropped.
- `data/narratives.json` — the "timeline" narrative, now ordered from the
  **real dates in items.csv** instead of a blind guess (see "What's still
  open" below for the caveats). The second narrative is now named --
  "Renzi: Many Lives" -- and modelled as three parallel threads
  (`renzi-critic`, `renzi-curator`, `renzi-soldier-partisan`), each with an
  empty `order` waiting for Claudia to assign items.
- `js/main.js` — two additions on top of the first draft: `getAllItems()`
  (returns every item regardless of narrative — needed by `map.html`,
  which shows the whole collection at once) and `wireThemeSelect(selectEl,
  onChange)` (the theme-`<select>` population/wiring logic that used to be
  duplicated inline in `item.html`, now shared so `map.html` and future
  pages don't repeat it). Everything else is unchanged from the first
  draft: it only needs `id`/`texts`/`order`, so it didn't need any
  rewiring to work with the real data.
- `item.html` — updated to actually render the real assets: an `<img>` for
  photos/drawings, a plain link for the PDF, and a placeholder note for the
  5 items that don't have a local asset yet (see list below). Still a
  skeleton, not the final design — that's River's job. Now uses the shared
  `Exhibition.wireThemeSelect()` helper instead of its own duplicated theme
  code.
- `map.html` — new. Shows the floor plan image (`assets/img/museum/
  planimetry_cinema_modernissimo.jpg`) with a clickable marker per item,
  positioned from `item.mapPosition.x`/`y` (percentages of the image's
  width/height — see `items.json`'s `_readme`). Since no item has a real
  position yet, the page falls back to a small `TEST_POSITIONS` table
  hard-coded in the page's own script, for 3 items already confirmed
  working in `item.html` (`renzi_letter_1942`, `po_screenplay`,
  `l_armata_s_agapo`) — clearly commented as demo-only, **to delete once
  Claudia's real positions are in `items.json`**. Because accessibility is
  the team's stated #1 priority, the map is never the only way to reach an
  item: below it, a full `<ul>` lists every item as a plain link (keyboard-
  and screen-reader-reachable), flagging the ones not yet placed on the
  map with "(not yet placed on the map)".

## What's genuinely new since the last version

- The museum is no longer an open question: `assets/img/museum/
  planimetry_cinema_modernissimo.jpg` is already in the repo, so Cinema
  Modernissimo (Sottopasso Via Rizzoli) is de facto decided.
- Each item's first text is no longer a placeholder: it's seeded from
  Claudia's `description` field in the CSV (real, accurate content), tagged
  `{length: "long", competence: "specialist", tone: "neutral"}`. Claudia
  still needs to write the shorter/more casual variants for the full
  length/competence/tone grid, but the site no longer shows "[text to be
  written]" for every item.
- The timeline order is now evidence-based (sorted from the CSV's `date`
  field), not arbitrary.

## What's still open (bring to the team)

1. **Missing assets** — these 5 items have no local file in `assets/items/`
   yet: `guida_documentary` and `renzi_interview_2000` (the two `_toadd`
   placeholder files — videos still to be added, probably as external
   links given the file size), `la_strada_film` and
   `la_strada_soundtrack_original` (per the original project doc, meant to
   be external links — full film / YouTube), and `photo_lastrada_premiere`
   (the Cinema Fulgor premiere photo — this one looks like it's simply
   missing, worth checking with Claudia).
2. **Timeline order within 1954** — six items share that year (the
   documentary, the film, the Gelsomina drawing, two production stills, the
   premiere photo, the soundtrack). The order I used is a reasonable guess,
   not verified. `renzi_portrait` has no date at all in the CSV and is
   placed last as unplaced.
3. **Second narrative — item assignment.** The three threads (critic /
   curator / soldier-partisan) exist in `narratives.json` with empty
   `order` arrays. Claudia is assigning items to each thread when the team
   meets Wednesday. Two items look like obvious candidates for
   `renzi-soldier-partisan` just from the CSV content (`renzi_letter_1942`,
   written from the WWII front, and `l_armata_s_agapo`, the article that
   got him court-martialled) — but that's a guess from the data, not
   Claudia's actual call, so don't treat it as settled.
4. **Map positions.** `map.html` is now built and working (with test/demo
   positions for 3 items — see "Files in this drop"), but no item has a
   *real* position yet. Claudia is bringing the room/area layout on
   Wednesday. Once she has it: fill in `mapPosition.x`/`y` (percentages,
   not pixels — see `items.json`'s `_readme`) for every item, and delete
   the `TEST_POSITIONS` block in `map.html` — nothing else about the page
   needs to change.
5. **Text grid** — exact values for length/competence/tone beyond the one
   seeded text per item, to align with Claudia.

## One thing worth deciding now that two repos existed

`lauraaa13/Information-Modelling` (Laura's personal repo) has the same
early version of this architecture but with placeholder data — it's now
superseded by this repo. Worth a one-line note in its README pointing here,
so nobody on the team accidentally works from the old one.
