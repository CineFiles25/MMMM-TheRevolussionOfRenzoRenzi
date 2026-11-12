# HTML ids used by the JavaScript

How the three parts are kept apart:

- **HTML** (written by hand): the structure of each page and its fixed words
  (headings, button labels, legends). No content from the exhibition.
- **JSON** (`data/items.json`, `data/narratives.json`): all the content
  (titles, metadata, the three texts, narratives, rooms, map positions).
- **JavaScript**: `js/main.js` (shared logic: data, themes, text versions) and one
  script per page (`js/item.js`, `js/map.js`). The page scripts do not write layout:
  they find the element with a given **id** and put the data into it.

So: **if you write a page's HTML, give these ids to these elements and the
page will fill itself.** An element can be any tag you like (the tag shown is
what the skeleton uses), as long as the id is the same. Ids in the "must exist"
column are required; the script stops or misbehaves without them.

The file `css/skeleton.css` is a temporary layout; replace it with the real CSS.

## On every page that has them (shared)

| id | tag | what the script does |
| --- | --- | --- |
| `theme-select` | `<select>` | fills it with the 6 themes, keeps it on the chosen one, and changes the theme |
| `theme-stylesheet` | `<link rel="stylesheet">` | its `href` is switched to the chosen theme's CSS file (`css/theme-N.css`) |
| `text-selector` | `<fieldset>` | the three text versions; contains three radio buttons (see below) |
| `prev-button`, `next-button` | `<button>` | previous / next item in the chosen narrative, below the text versions (disabled at the ends) |
| `text-status` | `<p role="status" aria-live="polite">` | announces to screen readers which text version was chosen |

The three radio buttons inside `text-selector` are written in the HTML, all with
`name="text-voice"`, and the `value` decides the version:

| id | `value` | version shown to the visitor |
| --- | --- | --- |
| `voice-museum` | `museum` | Read less (default) |
| `voice-archival` | `archival` | Read more |
| `voice-renzo` | `renzo` | Told by Renzo |

## `exhibition.html` — one item

URL: `exhibition.html?narrative=<narrative id>&item=<item id>`

| id | tag | content put there |
| --- | --- | --- |
| `item-title` | `<h1>` | item title (also "Item not found." if the id is wrong) |
| `item-creator` | `<strong>` / `<span>` | creator (or "Unknown creator") |
| `item-type` | `<span>` | type (Photograph, Letter…) |
| `item-date` | `<span>` | date in brackets, e.g. `(1954)` |
| `item-context` | `<p>` | "Renzo Renzi: a life — stop 8 of 15 · Renzo Renzi, the friend: Renzi & Fellini" |
| `item-room-intro` | `<div>` | empty and `hidden` in the HTML; the script should fill it with the room intro and unhide it |
| `item-next-room` | `<p>` | empty and `hidden`; the script should fill it with a link to the next room, on the last item of a room, and unhide it |
| `item-map-link` | `<a>` | only its `href` is set: back to the map on the same narrative |
| `narrative-select` | `<select>` | in the footer: one option per narrative (set by the inline script in `exhibition.html`); choosing one opens it on the same item if it contains it, otherwise on its first item |
| `next-narrative-link`, `next-narrative` | `<p>` / `<a>` | link to the next narrative (set by the small inline script in `exhibition.html`, hidden until then) |
| `item-text` | `<div lang="en">` | the text of the chosen version, as paragraphs with `<em>` for italics |
| `item-rights` | `<p>` | rights statement (hidden when empty) |
| `item-media` | `<div>` | the images, the PDF (embedded in the page, with a link as fallback) and the video embeds of the item (created by the script; gets the class `multi` when there are several) |
| `prev-button`, `next-button`, `text-selector`, `text-status`, `theme-select` | | shared, see above |

Not used by the script (free for layout): `item-main`, `item-layout`, `item-info`.

## `index.html` — the opening page

| id | tag | content put there |
| --- | --- | --- |
| `preview-map` | `<svg>` | the plan image with a transparent white background (CSS `mix-blend-mode`) |
| `preview-rooms` | `<g>` inside the svg | one link per room (created by the inline script), with a hit circle and a hover card (title + intro) |

## `exhibition.html` and `map.html` — the sliding strip

Written in the HTML, no script for the movement: `nav.indexslider` > `div.indexslide-track` > `a.index-slide` > `img` + `span.index-caption`, moved by CSS in `css/film-strip.css` (which explains `--shift` and `--duration`). Every slide is a link to the item; the picture is the image with the same name as the item (`assets/items/<item id>` or its picture file), also for films, soundtrack and interview. The pictures are only for the strip: on the item page the media are the ones listed in `items.json`. The repeated copies of the set are `aria-hidden` with `tabindex="-1"`.
- `exhibition.html`: one strip per narrative (`strip-<narrative id>`, `hidden`), one slide per item of that narrative, in the order of `narratives.json`, each with its number and title; the inline script unhides the one of the narrative in the URL and marks the current item `aria-current`. If the items of a narrative change, edit its strip by hand.
- `map.html`: one strip with all 16 items (no numbers), linking into the narrative "Renzo Renzi: a life".

## `map.html` — the museum map

URL: `map.html?narrative=<narrative id>` or `map.html?narrative=all`

| id | tag | content put there |
| --- | --- | --- |
| `map-svg` | `<svg>` | the plan (inline SVG with the planimetry image); markers and route are drawn into the two groups below |
| `route` | `<g>` inside the svg | the dashed line joining the stops of the chosen narrative |
| `markers` | `<g>` inside the svg | one numbered link per item (dimmed if not on the route) |
| `itinerary-choice` | `<fieldset>` | one radio button per narrative + "Show all items" (created by the script; the `<legend>` is written in the HTML) |
| `map-status` | `<p role="status">` | "Itinerary: …, 7 stops." for screen readers |
| `route-info` | `<section>` | whole block of the chosen narrative (hidden for "all items") |
| `route-title` | `<h2>` | narrative title |
| `route-title-en` | `<p>` | English title (hidden if none) |
| `route-description` | `<div>` | narrative caption |
| `start-link` | `<a>` | only its `href` is set: first stop of the narrative |
| `route-stops` | `<ol>` | the stops as an ordered list of links, with the stop label ("walk it") |
| `room-list` | `<div>` | every item grouped by room (created by the script) |
| `theme-select`, `theme-stylesheet` | | shared |

Not used by the script (free for layout): `map-page`, `map-stage`, `map-side`, `map-heading`, `room-list-heading`.

## Classes the scripts add to elements they create

Style these in the CSS (all already styled in `css/skeleton.css`):

| class | on what |
| --- | --- |
| `item-asset` | an item `<img>` |
| `item-embed` | an item video `<iframe>` |
| `asset-missing` | the note shown when an item has no media yet |
| `multi` | `#item-media` when it holds more than one element |
| `route-line` | the dashed line on the map |
| `marker`, `dim` | a marker link on the map; `dim` = item not on the chosen route |
| `marker-hit`, `marker-dot`, `marker-num` | invisible click area, coloured dot, stop number |
| `room-section`, `room-swatch` | a room block in `room-list`; its colour square |
| `room-intro` | the short intro paragraph under a room heading (from `intro` in `items.json`) |
| `room-transition` | a paragraph after a room block, from `transition` in `items.json` (rooms 1 and 2 only) |

The route/marker colour is the CSS variable `--map-accent`: a theme can set it.

## Pages still to write (same rules)

`index.html` (cover), `about.html`, `docs.html`, `disclaimer.html`. Use `theme-select`,
`theme-stylesheet` and the shared ids above where the page needs them, and tell Laura
which new ids you want filled from the JSON, so they get added to this list.
