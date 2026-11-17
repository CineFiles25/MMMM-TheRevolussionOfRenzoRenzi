/**
 * index.js — page initialization for index.html.
 * The shared main.js setup loads exhibition data and wires the theme selector.
 */
(async function initIndexPage() {
  "use strict";

  try {
    await Exhibition.initPage();
  } catch (err) {
    console.error("Could not initialize the index page:", err);
  }
})();
