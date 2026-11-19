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

  // Which itinerary is shown: ?narrative=<id> | all ; default = Renzo Renzi: a life
  let selected = Exhibition.getQueryParam("narrative");
  if (selected !== "all" && !Exhibition.getNarrative(selected)) selected = "renzo-renzi-a-life";
  let selectedRoom = "all";                 // "all" or a room id, for the side panel list

  const isPlaced = (it) => it.mapPosition && typeof it.mapPosition.x === "number" && typeof it.mapPosition.y === "number";
  const roomTitle = (id) => (rooms.find((r) => r.id === id) || {}).title || "";
  const toXY = (it) => [(it.mapPosition.x / 100) * IMG_W, (it.mapPosition.y / 100) * IMG_H];

  buildChoice();
  buildRoomChoice();
  render();

  // ---------------------------------------------------------------------

  /** The narrative to open an item in: the chosen itinerary if it contains the item, otherwise the first one that does. */
  function linkNarrative(item) {
    const chosen = Exhibition.getNarrative(selected);
    if (chosen && chosen.order.includes(item.id)) return chosen.id;
    const other = narratives.find((n) => n.order.includes(item.id));
    return other ? other.id : "renzo-renzi-a-life";
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
        selectedRoom = "all";
        setChecked("room", "all");
        history.replaceState(null, "", `?narrative=${encodeURIComponent(selected)}`);
        render();
      });
      label.append(input, document.createTextNode(" " + o.label));
      box.appendChild(label);
    });
  }

  /** One radio button per room with items on the plan, plus "All rooms", inside #room-choice. Filters #room-list. */
  function buildRoomChoice() {
    const box = $("room-choice");
    const options = rooms
      .filter((r) => items.some((i) => isPlaced(i) && i.mapPosition.area === r.id))
      .map((r) => ({ id: r.id, label: r.title, color: r.color }));
    options.unshift({ id: "all", label: "All rooms" });
    options.forEach((o) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "room";
      input.value = o.id;
      input.checked = o.id === selectedRoom;
      input.addEventListener("change", () => {
        selectedRoom = o.id;
        selected = "all";
        setChecked("itinerary", "all");
        history.replaceState(null, "", "?narrative=all");
        render();
      });
      label.append(input, document.createTextNode(" "));
      if (o.color) {
        const sw = document.createElement("span");
        sw.className = "room-swatch";
        sw.style.background = o.color;                              // the room's own colour, from items.json
        sw.setAttribute("aria-hidden", "true");
        label.appendChild(sw);
      }
      label.appendChild(document.createTextNode(o.label));
      box.appendChild(label);
    });
  }

  /** Ticks the radio of one group (by name) and unticks the rest. */
  function setChecked(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = input.value === value;
    });
  }

  function render() {
    const narrative = Exhibition.getNarrative(selected);           // null for "all"
    const stops = narrative ? narrative.order.map((id) => Exhibition.getItem(id)).filter((it) => it && isPlaced(it)) : [];
    const stopNo = new Map(stops.map((it, i) => [it.id, i + 1]));

    drawRoute(stops);
    drawMarkers(narrative, stopNo);
    fillRouteInfo(narrative, stops);
    if (narrative) {
      fillStopList(stops, (it) => Exhibition.buildItemUrl(narrative.id, it.id));
    } else if (selectedRoom !== "all") {
      fillStopList(items.filter((i) => i.mapPosition && i.mapPosition.area === selectedRoom), itemUrl);
    } else {
      fillStopList([], itemUrl);
    }
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
        ? `Stop ${n} of ${stopNo.size}: ${Exhibition.plainTitle(item.title)} (${where})`
        : `${Exhibition.plainTitle(item.title)} (${where})`);

      const hit = document.createElementNS(SVG_NS, "circle");       // bigger invisible target, easier to click/tap
      hit.setAttribute("class", "marker-hit");
      hit.setAttribute("cx", cx); hit.setAttribute("cy", cy); hit.setAttribute("r", 85);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("class", "marker-dot");
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.setAttribute("r", onRoute ? 56 : 42);
      const title = document.createElementNS(SVG_NS, "title");      // native tooltip
      title.textContent = onRoute ? `${n}. ${Exhibition.plainTitle(item.title)}` : Exhibition.plainTitle(item.title);
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
  }

  /** The list under the map (#route-stops): preview and title of each item, one next to the other. */
  function fillStopList(list, urlOf) {
    const ol = $("route-stops");
    ol.replaceChildren();
    list.forEach((it) => {
      const li = document.createElement("li");
      const first = it.poster || (it.images || [])[0] || "";
      if (/\.(jpe?g|png|gif|webp)$/i.test(first)) {
        const img = document.createElement("img");
        img.src = first;
        img.alt = "";
        img.loading = "lazy";
        li.appendChild(img);
      }
      const link = document.createElement("a");
      link.href = urlOf(it);
      link.innerHTML = Exhibition.formatInline(it.title);
      li.appendChild(link);
      ol.appendChild(li);
    });
  }

  /** Side panel, bottom: the items of the chosen room (or of every room), in #room-list (unplaced items go last, flagged). */
  function fillRoomList() {
    const host = $("room-list");
    host.replaceChildren();
    rooms.forEach((room) => {
      if (selectedRoom !== "all" && room.id !== selectedRoom) return;
      const list = items.filter((i) => i.mapPosition && i.mapPosition.area === room.id);
      if (!list.length) return;
      host.appendChild(buildSection(room.title, null, room.color, room.theme, room.intro));
      if (room.transition) {
        const p = document.createElement("p");
        p.className = "room-transition";
        p.textContent = room.transition;
        host.appendChild(p);
      }
    });
    const unplaced = items.filter((i) => !isPlaced(i));
    if (unplaced.length && selectedRoom === "all") host.appendChild(buildSection("Not yet placed on the map", unplaced));
  }

  function buildSection(title, list, color, subtitle, intro) {
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
    if (intro) {
      const p = document.createElement("p");
      p.className = "room-intro";
      p.textContent = intro;
      section.appendChild(p);
    }
    if (list) {
      const ul = document.createElement("ul");
      list.forEach((item) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = itemUrl(item);
        link.innerHTML = Exhibition.formatInline(item.title);
        li.appendChild(link);
        ul.appendChild(li);
      });
      section.appendChild(ul);
    }
    return section;
  }
})();