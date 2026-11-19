/**
 * index.js — page initialization for index.html.
 * The shared main.js setup loads exhibition data and wires the theme selector.
 */
(async function initIndexPage() {
  "use strict";

  const descriptions = document.querySelectorAll("[data-narrative-description]");
  try {
    await Exhibition.initPage();
    descriptions.forEach((element) => {
      const id = element.dataset.narrativeDescription;
      const narrative = Exhibition.getNarrative(id);
      if (!narrative || !narrative.description) {
        console.error(`Missing narrative description: ${id}`);
        element.textContent = "The narrative description could not be loaded.";
        return;
      }
      element.innerHTML = Exhibition.formatText(narrative.description);
    });
  } catch (err) {
    console.error("Could not initialize the index page:", err);
    descriptions.forEach((element) => {
      element.textContent = "The narrative description could not be loaded.";
    });
  }
})();
