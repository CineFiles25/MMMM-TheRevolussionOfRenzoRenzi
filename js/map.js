/**
 * map.js — script of map.html. Goes in js/map.js, after js/main.js.
 *
 * It finds elements by id (listed in HTML-IDS.md) and fills them from the JSON
 * data through the Exhibition object of main.js. Nothing is hard-coded:
 *   - marker positions  = item.mapPosition (percentages of the plan image)
 *   - route             = narrative.order  (data/narratives.json)
 *   - rooms             = rooms in data/items.json
 *
 * URL: map.html?narrative=<narrative id>   or   map.html?narrative=all (no route)
 */
(async function initMapPage() {
  "use strict";

  const $ = (id) => document.getElementById(id);

  try {
    await Exhibition.initPage();            // data + stored theme + #theme-select
  } catch (err) {
    console.error(err);
    $("map-status").textContent = "The exhibition data could not be loaded.";
    return;
  }

  // Size of the image the percentages refer to (assets/img/museum/gallery_planimetry_no_punti.png)
  const IMG_W = 4032, IMG_H = 3024;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const rooms = Exhibition.getRooms();
  const narratives = Exhibition.getNarratives();
  const items = Exhibition.getAllItems();

  // Which itinerary is shown: ?narrative=<id> | all ; default = the historical timeline
  let selected = Exhibition.getQueryParam("narrative");
  if (selected !== "all" && !Exhibition.getNarrative(selected)) selected = "timeline";

  const isPlaced = (it) => it.mapPosition && typeof it.mapPosition.x === "number" && typeof it.mapPosition.y === "number";
  const roomTitle = (id) => (rooms.find((r) => r.id === id) || {}).title || "";
  const toXY = (it) => [(it.mapPosition.x / 100) * IMG_W, (it.mapPosition.y / 100) * IMG_H];

  buildChoice();
  render();

  // ---------------------------------------------------------------------

  /** The narrative to open an item in: the chosen itinerary if it contains the item, otherwise the first one that does. */
  function linkNarrative(item) {
    const chosen = Exhibition.getNarrative(selected);
    if (chosen && chosen.order.includes(item.id)) return chosen.id;
    const other = narratives.find((n) => n.order.includes(item.id));
    return other ? other.id : "timeline";
  }
  function itemUrl(item) {
    return Exhibition.buildItemUrl(linkNarrative(item), item.id);
  }

  /** One radio button per narrative, plus "all items", inside #itinerary-choice. */
  function buildChoice() {
    const box = $("itinerary-choice");
    const options = narratives.map((n) => ({ id: n.id, label: `${n.title} (${n.order.length} stops)` }));
    options.push({ id: "all", label: "Show all items (no route)" });
    options.forEach((o) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "itinerary";
      input.value = o.id;
      input.checked = o.id === selected;
      input.addEventListener("change", () => {
        selected = o.id;
        history.replaceState(null, "", `?narrative=${encodeURIComponent(selected)}`);
        render();
      });
      label.append(input, document.createTextNode(" " + o.label));
      box.appendChild(label);
    });
  }

  function render() {
    const narrative = Exhibition.getNarrative(selected);           // null for "all"
    const stops = narrative ? narrative.order.map((id) => Exhibition.getItem(id)).filter((it) => it && isPlaced(it)) : [];
    const stopNo = new Map(stops.map((it, i) => [it.id, i + 1]));

    drawRoute(stops);
    drawMarkers(narrative, stopNo);
    fillRouteInfo(narrative, stops);
    fillRoomList();

    $("map-status").textContent = narrative
      ? `Itinerary: ${narrative.title}, ${stops.length} stops.`
      : "Showing all items, no route.";
  }

  /** The dashed line joining the stops, in <g id="route">. */
  function drawRoute(stops) {
    const layer = $("route");
    layer.replaceChildren();
    if (stops.length < 2) return;
    const line = document.createElementNS(SVG_NS, "polyline");
    line.setAttribute("class", "route-line");
    line.setAttribute("points", stops.map((it) => toXY(it).join(",")).join(" "));
    line.setAttribute("aria-hidden", "true");
    layer.appendChild(line);
  }

  /** One marker (a real link) per placed item, in <g id="markers">; numbered if it is a stop of the route. */
  function drawMarkers(narrative, stopNo) {
    const layer = $("markers");
    layer.replaceChildren();
    // Items that are not on the route first, so numbered stops are drawn on top of them
    const ordered = [...items].sort((a, b) => (stopNo.has(a.id) ? 1 : 0) - (stopNo.has(b.id) ? 1 : 0));
    ordered.forEach((item) => {
      if (!isPlaced(item)) return;                                  // listed in the side panel, not on the plan
      const [cx, cy] = toXY(item);
      const n = stopNo.get(item.id);
      const onRoute = n !== undefined;

      const a = document.createElementNS(SVG_NS, "a");
      a.setAttribute("class", "marker" + (narrative && !onRoute ? " dim" : ""));
      a.setAttribute("href", itemUrl(item));
      const where = roomTitle(item.mapPosition.area) || "no room";
      a.setAttribute("aria-label", onRoute
        ? `Stop ${n} of ${stopNo.size}: ${item.title} (${where})`
        : `${item.title} (${where})`);

      const hit = document.createElementNS(SVG_NS, "circle");       // bigger invisible target, easier to click/tap
      hit.setAttribute("class", "marker-hit");
      hit.setAttribute("cx", cx); hit.setAttribute("cy", cy); hit.setAttribute("r", 85);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("class", "marker-dot");
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", onRoute ? 56 : 42);
      const title = document.createElementNS(SVG_NS, "title");      // native tooltip
      title.textContent = onRoute ? `${n}. ${item.title}` : item.title;
      a.append(hit, dot, title);

      if (onRoute) {
        const num = document.createElementNS(SVG_NS, "text");
        num.setAttribute("class", "marker-num");
        num.setAttribute("x", cx); num.setAttribute("y", cy);
        num.setAttribute("aria-hidden", "true");
        num.textContent = String(n);
        a.appendChild(num);
      }
      layer.appendChild(a);
    });
  }

  /** Side panel, top: the chosen itinerary (title, caption, start link, ordered list of stops). Hidden for "all". */
  function fillRouteInfo(narrative, stops) {
    const section = $("route-info");
    section.hidden = !narrative;
    if (!narrative) return;

    $("route-title").textContent = narrative.title;
    $("route-title-en").textContent = narrative.titleEn || "";
    $("route-title-en").hidden = !narrative.titleEn;
    // Claudia's captions use *italics* for film titles: formatText turns them into <em>.
    $("route-description").innerHTML = Exhibition.formatText(narrative.description);

    const start = $("start-link");
    start.hidden = stops.length === 0;
    if (stops.length) start.href = Exhibition.buildItemUrl(narrative.id, stops[0].id);

    const ol = $("route-stops");
    ol.replaceChildren();
    stops.forEach((it) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = Exhibition.buildItemUrl(narrative.id, it.id);
      link.textContent = it.title;
      li.appendChild(link);
      const label = narrative.stopLabels && narrative.stopLabels[it.id];   // e.g. "walk it"
      if (label) li.appendChild(document.createTextNode(" — " + label));
      ol.appendChild(li);
    });
  }

  /** Side panel, bottom: every item grouped by room, in #room-list (items without a position go last, flagged). */
  function fillRoomList() {
    const host = $("room-list");
    host.replaceChildren();
    rooms.forEach((room) => {
      const list = items.filter((i) => i.mapPosition && i.mapPosition.area === room.id);
      if (list.length) host.appendChild(buildSection(room.title, list, room.color, room.theme));
    });
    const unplaced = items.filter((i) => !isPlaced(i));
    if (unplaced.length) host.appendChild(buildSection("Not yet placed on the map", unplaced));
  }

  function buildSection(title, list, color, subtitle) {
    const section = document.createElement("section");
    section.className = "room-section";
    const h3 = document.createElement("h3");
    if (color) {
      const sw = document.createElement("span");
      sw.className = "room-swatch";
      sw.style.background = color;                                  // the room's own colour, from items.json
      sw.setAttribute("aria-hidden", "true");
      h3.appendChild(sw);
    }
    h3.appendChild(document.createTextNode(title));
    section.appendChild(h3);
    if (subtitle) {
      const p = document.createElement("p");
      p.textContent = subtitle;
      section.appendChild(p);
    }
    const ul = document.createElement("ul");
    list.forEach((item) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = itemUrl(item);
      link.textContent = item.title;
      li.appendChild(link);
      ul.appendChild(li);
    });
    section.appendChild(ul);
    return section;
  }
})();