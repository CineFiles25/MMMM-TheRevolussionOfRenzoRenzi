/**
 * main.js — core logic shared by every page of the site
 * (Renzo Renzi Virtual Exhibition)
 *
 * No framework: a single global `Exhibition` object exposed on window,
 * loaded with <script src="js/main.js"></script> before each page's own
 * script (index/map/item/...).
 *
 * What this file does:
 *  1. Loads data/items.json and data/narratives.json
 *  2. Resolves an item / a narrative by id
 *  3. Computes the previous/next item within a narrative (prev/next)
 *  4. Handles theme switching (6 typographic themes) with persistence
 *  5. Handles the three text versions of every item (museum / read more /
 *     told by Renzo): voice list, choice remembered in localStorage,
 *     text lookup, safe text-to-HTML formatting and the selector widget
 *
 * What it does NOT do (on purpose, for now):
 *  - it knows nothing about how the map is drawn (map.html does that, from
 *    mapPosition and the rooms listed in items.json)
 *  - it does not render HTML: each page stays responsible for its own DOM,
 *    main.js only provides data and helper functions
 */

const Exhibition = (function () {
  "use strict";

  const DATA_PATHS = {
    items: "data/items.json",
    narratives: "data/narratives.json",
  };

  const THEME_STORAGE_KEY = "exhibition:theme";
  const TEXT_VOICE_STORAGE_KEY = "exhibition:textVoice";

  // The 6 typographic themes, in historical-period order.
  // 'cssFile' must match the file in css/ (to be created by River).
  const THEMES = [
    { id: "theme-1", period: "1500–1800", label: "Baroque theatre / opera / carnival masks", cssFile: "css/theme-1.css" },
    { id: "theme-2", period: "19th century", label: "Melodrama theatre", cssFile: "css/theme-2.css" },
    { id: "theme-3", period: "First half of the 20th century", label: "Telefoni bianchi & Italian neorealism", cssFile: "css/theme-3.css" },
    { id: "theme-4", period: "Second half of the 20th century", label: "Fellini (and his collaboration with Renzi)", cssFile: "css/theme-4.css" },
    { id: "theme-5", period: "Late 20th – early 21st century (print)", label: "Commedia all'italiana", cssFile: "css/theme-5.css" },
    { id: "theme-6", period: "2035 (print + screen + ?)", label: "Interactive cinema", cssFile: "css/theme-6.css" },
  ];

  const DEFAULT_THEME_ID = "theme-3"; // opening theme, see project document

  let _cache = null; // { items: Map, narratives: Map } once loaded

  /** Loads (once) items.json + narratives.json and caches them. */
  async function load() {
    if (_cache) return _cache;

    const [itemsRes, narrativesRes] = await Promise.all([
      fetch(DATA_PATHS.items),
      fetch(DATA_PATHS.narratives),
    ]);

    if (!itemsRes.ok) throw new Error(`Could not load ${DATA_PATHS.items} (${itemsRes.status})`);
    if (!narrativesRes.ok) throw new Error(`Could not load ${DATA_PATHS.narratives} (${narrativesRes.status})`);

    const itemsJson = await itemsRes.json();
    const narrativesJson = await narrativesRes.json();

    const itemsById = new Map(itemsJson.items.map((it) => [it.id, it]));
    const narrativesById = new Map(narrativesJson.narratives.map((n) => [n.id, n]));

    // 'rooms' (museum areas) lives in items.json next to the items: see mapPosition.area
    const rooms = Array.isArray(itemsJson.rooms) ? itemsJson.rooms : [];

    _cache = { itemsById, narrativesById, rooms };
    return _cache;
  }

  /** Returns the item with this id, or null. Requires load() to have resolved. */
  function getItem(id) {
    if (!_cache) throw new Error("Exhibition.load() has not completed yet");
    return _cache.itemsById.get(id) || null;
  }

  /** Returns the narrative with this id, or null. */
  function getNarrative(id) {
    if (!_cache) throw new Error("Exhibition.load() has not completed yet");
    return _cache.narrativesById.get(id) || null;
  }

  /** Returns every narrative (in the order of narratives.json), e.g. to build a narrative selector. */
  function getNarratives() {
    if (!_cache) throw new Error("Exhibition.load() has not completed yet");
    return Array.from(_cache.narrativesById.values());
  }

  /** Returns the museum rooms (id, title, theme, color), in visiting order. */
  function getRooms() {
    if (!_cache) throw new Error("Exhibition.load() has not completed yet");
    return [..._cache.rooms].sort((x, y) => x.order - y.order);
  }

  /** Returns the array of items (full objects, not just ids) of a narrative, in their order. */
  function getNarrativeItems(narrativeId) {
    const narrative = getNarrative(narrativeId);
    if (!narrative) return [];
    return narrative.order
      .map((id) => getItem(id))
      .filter((it) => it !== null); // ignore any orphan ids in narratives.json
  }

  /**
   * Returns every item, regardless of narrative — needed by pages like
   * map.html that show the whole collection at once, not one itinerary.
   * Order is whatever items.json happened to list (not meaningful on its own).
   */
  function getAllItems() {
    if (!_cache) throw new Error("Exhibition.load() has not completed yet");
    return Array.from(_cache.itemsById.values());
  }

  /**
   * Computes the item adjacent to currentItemId within narrativeId.
   * direction: 1 for "next", -1 for "prev".
   * Returns null if we are already at the first/last item (no wraparound,
   * on purpose: the UI can disable the button instead of looping).
   */
  function getAdjacentItem(narrativeId, currentItemId, direction) {
    const narrative = getNarrative(narrativeId);
    if (!narrative) return null;
    const idx = narrative.order.indexOf(currentItemId);
    if (idx === -1) return null;
    const targetId = narrative.order[idx + direction];
    return targetId ? getItem(targetId) : null;
  }

  function getNextItem(narrativeId, currentItemId) {
    return getAdjacentItem(narrativeId, currentItemId, 1);
  }

  function getPrevItem(narrativeId, currentItemId) {
    return getAdjacentItem(narrativeId, currentItemId, -1);
  }

  // ---------------------------------------------------------------------
  // Typographic themes
  // ---------------------------------------------------------------------

  function getThemes() {
    return THEMES;
  }

  /**
   * Shared helper for any page with a theme <select>: populates its
   * <option>s, marks the current theme as selected, swaps the
   * #theme-stylesheet link and persists the choice on change, and calls
   * back onChange(theme) (optional) so a page can do extra work (e.g.
   * re-render). Keeping this here avoids re-duplicating the same ~12 lines
   * on every page (item.html, map.html, index.html, ...).
   */
  function wireThemeSelect(selectEl, onChange) {
    if (!selectEl) return;
    const current = getCurrentTheme();
    selectEl.innerHTML = "";
    THEMES.forEach((theme) => {
      const opt = document.createElement("option");
      opt.value = theme.id;
      opt.textContent = `${theme.period} — ${theme.label}`;
      opt.selected = theme.id === current.id;
      selectEl.appendChild(opt);
    });

    selectEl.addEventListener("change", (e) => {
      const theme = THEMES.find((t) => t.id === e.target.value);
      if (!theme) return;
      setTheme(theme.id);
      const link = document.getElementById("theme-stylesheet");
      if (link) link.href = theme.cssFile;
      if (typeof onChange === "function") onChange(theme);
    });
  }

  function getCurrentTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.find((t) => t.id === stored) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
  }

  /** Applies the theme to the current document and remembers it for the next pages. */
  function setTheme(themeId) {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) {
      console.warn(`Unknown theme: ${themeId}`);
      return;
    }
    document.documentElement.setAttribute("data-theme", theme.id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (e) {
      // localStorage can fail (Safari private mode, storage full...): don't block the UI for this
      console.warn("Could not save the theme preference", e);
    }
  }

  /** Call this at the start of a page, before rendering, to avoid a flash of the wrong theme. */
  function applyStoredTheme() {
    const theme = getCurrentTheme();
    document.documentElement.setAttribute("data-theme", theme.id);
    // The page's <link id="theme-stylesheet"> starts with the default theme's file:
    // point it at the visitor's stored theme so the right CSS loads on every page.
    const link = document.getElementById("theme-stylesheet");
    if (link) link.setAttribute("href", theme.cssFile);
    return theme;
  }

  // ---------------------------------------------------------------------
  // Text versions ("voices")
  // ---------------------------------------------------------------------
  // Every item has three texts (see item.texts in data/items.json), one per
  // voice. The grid values below are Claudia's proposal (text_grid.md); each
  // text also carries them (length / competence / audience), so the grid can
  // be widened later without touching the data format.
  //
  //   museum   — medium / average      / general adult  (default)
  //   archival — long   / advanced     / scholar
  //   renzo    — very brief / introductory / young; an imagined Renzi speaking
  //              in the first person (not his real words)
  //
  // To rename a label or add a voice, change THIS list only.

  const VOICES = [
    { id: "museum",   label: "Museum",        description: "A short introduction for a general audience" },
    { id: "archival", label: "Read more",     description: "A longer, archival account with catalogue details" },
    { id: "renzo",    label: "Told by Renzo", description: "A brief, playful voice for younger visitors" },
  ];
  const DEFAULT_VOICE_ID = "museum";

  function getVoices() {
    return VOICES;
  }

  /** The visitor's chosen voice id (remembered across pages), or the default. */
  function getVoice() {
    try {
      const stored = localStorage.getItem(TEXT_VOICE_STORAGE_KEY);
      if (VOICES.some((v) => v.id === stored)) return stored;
    } catch (e) {
      // localStorage unavailable: fall through to the default
    }
    return DEFAULT_VOICE_ID;
  }

  function setVoice(voiceId) {
    if (!VOICES.some((v) => v.id === voiceId)) {
      console.warn(`Unknown text voice: ${voiceId}`);
      return getVoice();
    }
    try {
      localStorage.setItem(TEXT_VOICE_STORAGE_KEY, voiceId);
    } catch (e) {
      console.warn("Could not save the text preference", e);
    }
    return voiceId;
  }

  /**
   * Finds the text of an item for a voice: findText(item) uses the visitor's
   * current voice, findText(item, { voice: "renzo" }) forces one.
   * If the item has no text for that voice, returns its first text (better to
   * show something than nothing), or null if it has none.
   */
  function findText(item, filters = {}) {
    if (!item || !Array.isArray(item.texts) || item.texts.length === 0) return null;
    const voiceId = filters.voice || getVoice();
    return item.texts.find((t) => t.voice === voiceId) || item.texts[0];
  }

  // Kept for older pages: the preference is now just { voice }.
  function getTextPreference() {
    return { voice: getVoice() };
  }

  function setTextPreference(partialPrefs) {
    if (partialPrefs && partialPrefs.voice) setVoice(partialPrefs.voice);
    return getTextPreference();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /**
   * Turns a text from items.json / narratives.json into safe HTML:
   * blank line = new <p>, single line break = <br>, *word* = <em>.
   */
  function formatText(content) {
    if (!content) return "";
    return String(content)
      .split(/\n{2,}/)
      .map((para) => {
        const html = escapeHtml(para.trim())
          .replace(/\*([^*]+)\*/g, "<em>$1</em>")
          .replace(/\n/g, "<br>");
        return `<p>${html}</p>`;
      })
      .join("\n");
  }

  /**
   * Builds the text-version selector (a radio group, so it works with the
   * keyboard and screen readers) inside `container` and calls
   * onChange(voiceId) when the visitor picks another one. Shared by every
   * page that shows texts; markup/classes are placeholders for River's design.
   */
  function wireTextSelector(container, onChange) {
    if (!container) return;
    const current = getVoice();
    container.innerHTML = "";

    const fieldset = document.createElement("fieldset");
    fieldset.className = "text-selector";
    const legend = document.createElement("legend");
    legend.textContent = "Text version";
    fieldset.appendChild(legend);

    VOICES.forEach((voice) => {
      const label = document.createElement("label");
      label.className = "text-selector-option";
      label.title = voice.description;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "text-voice";
      input.value = voice.id;
      input.checked = voice.id === current;
      input.addEventListener("change", () => {
        if (!input.checked) return;
        setVoice(voice.id);
        if (typeof onChange === "function") onChange(voice.id);
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + voice.label));
      fieldset.appendChild(label);
    });

    container.appendChild(fieldset);
  }

  // ---------------------------------------------------------------------
  // URL helpers — navigation state passed via query string,
  // e.g. item.html?narrative=timeline&item=il-primo-fellini
  // ---------------------------------------------------------------------

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function buildItemUrl(narrativeId, itemId) {
    const params = new URLSearchParams({ narrative: narrativeId, item: itemId });
    return `item.html?${params.toString()}`;
  }

  // Public API
  return {
    load,
    getItem,
    getNarrative,
    getNarrativeItems,
    getNarratives,
    getRooms,
    getAllItems,
    getNextItem,
    getPrevItem,
    getThemes,
    getCurrentTheme,
    setTheme,
    wireThemeSelect,
    applyStoredTheme,
    getVoices,
    getVoice,
    setVoice,
    findText,
    formatText,
    wireTextSelector,
    getTextPreference,
    setTextPreference,
    getQueryParam,
    buildItemUrl,
  };
})();
