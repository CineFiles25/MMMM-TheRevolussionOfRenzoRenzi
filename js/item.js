/**
 * item.js — script of exhibition.html. Goes in js/item.js, after js/main.js.
 *
 * It does not write any layout: it finds elements by id (listed in HTML-IDS.md)
 * and fills them with data from data/items.json and data/narratives.json,
 * read through the Exhibition object of main.js.
 *
 * URL: exhibition.html?narrative=<narrative id>&item=<item id>
 */
(async function initItemPage() {
  "use strict";

  const $ = (id) => document.getElementById(id);

  try {
    await Exhibition.initPage();            // data + stored theme + #theme-select
  } catch (err) {
    console.error(err);
    $("item-title").textContent = "The exhibition data could not be loaded.";
    return;
  }

  const narrativeId = Exhibition.getQueryParam("narrative") || "renzo-renzi-a-life";
  let itemId = Exhibition.getQueryParam("item");
  if (!itemId) {                              // no item in the URL: start from the first one of the narrative
    const first = Exhibition.getNarrativeItems(narrativeId);
    itemId = first.length ? first[0].id : null;
  }
  const item = Exhibition.getItem(itemId);

  if (!item) {
    $("item-title").textContent = "Item not found.";
    return;
  }

  fillItem();
  fillMedia();
  wireNavButtons();
  Exhibition.wireTextSelector($("text-selector"), (voiceId) => {
    showText(voiceId);
    const radio = document.querySelector(`input[name="text-voice"][value="${voiceId}"]`);
    const label = radio && radio.closest("label");
    $("text-status").textContent = `Showing the text version: ${label ? label.textContent.trim() : voiceId}.`;
  });

  // ---------------------------------------------------------------------

  /** Title, creator, type/date, "where am I" line, text and rights. */
  function fillItem() {
    const meta = item.metadata || {};
    document.title = `${item.title} — The Revolussion of Renzo Renzi`;

    $("item-title").textContent = item.title;
    $("item-creator").textContent = item.creator || "Unknown creator";
    $("item-type").textContent = meta.type || "unknown type";
    $("item-date").textContent = meta.date ? `(${meta.date})` : "";
    $("item-rights").textContent = meta.rights || "";
    $("item-rights").hidden = !meta.rights;

    // "Renzo Renzi: a Life — stop 8 of 15 · Renzo Renzi, the friend / Renzi & Fellini"
    const narrative = Exhibition.getNarrative(narrativeId);
    const order = narrative ? narrative.order : [];
    const stopNo = order.indexOf(item.id) + 1;                       // 0 = not in this narrative
    const stopLabel = narrative && narrative.stopLabels ? narrative.stopLabels[item.id] : null;
    const room = item.mapPosition ? Exhibition.getRooms().find((r) => r.id === item.mapPosition.area) : null;
    const bits = [];
    if (narrative && stopNo > 0) bits.push(`${narrative.title} — stop ${stopNo} of ${order.length}${stopLabel ? ` (${stopLabel})` : ""}`);
    if (room) bits.push(room.title);
    $("item-context").textContent = bits.join(" · ");
    $("item-map-link").href = `map.html?narrative=${encodeURIComponent(narrativeId)}`;

    showText(Exhibition.getVoice());
  }

  /** Puts the text of the chosen version (museum / archival / renzo) in #item-text. */
  function showText(voiceId) {
    const text = Exhibition.findText(item, { voice: voiceId });
    $("item-text").innerHTML = text ? Exhibition.formatText(text.content) : "<p>[text to be written]</p>";
  }

  /**
   * Media of the item, inside #item-media: every local file (an <img> for image
   * files, a link for anything else such as the PDF), then every entry of
   * item.externalLinks (an <iframe> when it has an embedUrl, e.g. YouTube; otherwise a link).
   */
  function fillMedia() {
    const box = $("item-media");
    box.replaceChildren();

    (item.images || []).forEach((path) => {
      if (/\.(jpe?g|png|gif|webp)$/i.test(path)) {
        const img = document.createElement("img");
        img.className = "item-asset";
        img.src = encodeURI(path);
        img.alt = item.title;
        box.appendChild(img);
      } else {
        box.appendChild(makeLink(encodeURI(path), `Open ${path.split("/").pop()}`));
      }
    });

    (item.externalLinks || []).forEach((link) => {
      if (link.embedUrl) {
        const frame = document.createElement("iframe");
        frame.className = "item-embed";
        frame.src = link.embedUrl;
        frame.title = link.label;
        frame.loading = "lazy";
        frame.allowFullscreen = true;
        box.appendChild(frame);
      } else {
        box.appendChild(makeLink(link.url, link.label));
      }
    });

    if (!box.children.length) {
      const note = document.createElement("p");
      note.className = "asset-missing";
      note.textContent = "[media not uploaded yet — see item._todo in items.json]";
      box.appendChild(note);
    }
    box.classList.toggle("multi", box.children.length > 1);   // several media: the box scrolls
  }

  function makeLink(href, label) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    p.appendChild(a);
    return p;
  }

  /** Previous / Next inside the chosen narrative (disabled at the two ends). */
  function wireNavButtons() {
    const prev = Exhibition.getPrevItem(narrativeId, item.id);
    const next = Exhibition.getNextItem(narrativeId, item.id);
    const prevBtn = $("prev-button");
    const nextBtn = $("next-button");
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    if (prev) prevBtn.onclick = () => { window.location.href = Exhibition.buildItemUrl(narrativeId, prev.id); };
    if (next) nextBtn.onclick = () => { window.location.href = Exhibition.buildItemUrl(narrativeId, next.id); };
  }
})();