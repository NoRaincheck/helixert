// Helixert — Main Entry Point

import * as gs from "./gameState.js";
import * as hc from "./helixCommands.js";
import { hideCelebration, hideModal, initializeDOM } from "./ui-components.js";
import {
  checkWinCondition,
  loadLevel,
  loadSavedProgress,
  nextLevel,
  resetLevel,
  restartGame,
  updateUI,
} from "./event-handlers.js";

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  initializeDOM();
  loadSavedProgress();
  loadLevel(0);

  // --- Keyboard handler ---
  document.addEventListener("keydown", (e) => {
    // Don't handle if modal is visible and user presses Enter
    const modal = document.getElementById("modal");
    if (modal && !modal.classList.contains("pointer-events-none")) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextLevel();
        return;
      }
    }

    // Don't handle if celebration is visible
    const celebration = document.getElementById("celebration");
    if (celebration && !celebration.classList.contains("hidden")) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        restartGame();
        return;
      }
    }

    // Ignore if in search mode — handled separately
    if (gs.getSearchMode()) {
      handleSearchKey(e);
      return;
    }

    // Handle replace pending
    if (gs.getReplacePending()) {
      e.preventDefault();
      hc.executeReplace(e.key);
      updateUI();
      checkWinCondition();
      return;
    }

    // Main command dispatch
    e.preventDefault();
    const result = hc.execute(e.key, e);

    if (result?.searchMode) {
      // Entered search mode — show prompt
      updateUI();
      return;
    }

    updateUI();
    checkWinCondition();
  });

  // --- Level button clicks ---
  const levelSelection = document.getElementById("level-selection");
  if (levelSelection) {
    levelSelection.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-level]");
      if (btn) {
        const idx = parseInt(btn.dataset.level);
        hideModal();
        hideCelebration();
        loadLevel(idx);
      }
    });
  }

  // --- Reset button ---
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      hideModal();
      resetLevel();
    });
  }

  // --- Next level button ---
  const nextBtn = document.getElementById("next-level-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => nextLevel());
  }

  // --- Celebration restart ---
  const restartBtn = document.getElementById("celebration-restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => restartGame());
  }

  // --- Auto-focus editor ---
  const editorInput = document.getElementById("editor-input");
  if (editorInput) {
    editorInput.focus();
  }
});

// --- Search mode key handler ---
function handleSearchKey(e) {
  e.preventDefault();
  const key = e.key;

  if (gs.isEscapeKey(e)) {
    gs.setSearchMode(false);
    gs.setSearchSelectMode(false);
    gs.setSearchQuery("");
    updateUI();
    return;
  }

  if (key === "Backspace") {
    const q = gs.getSearchQuery();
    gs.setSearchQuery(q.slice(0, -1));
    updateUI();
    return;
  }

  if (key === "Enter") {
    const query = gs.getSearchQuery();
    gs.setLastSearchQuery(query);
    gs.setSearchMode(false);
    gs.setCurrentMatchIndex(-1);

    // Compute matches
    const matches = tb_computeSearchMatches(query);
    gs.setSearchMatches(matches);

    // Search-select mode: create selection on first match
    if (gs.getSearchSelectMode()) {
      gs.setSearchSelectMode(false);
      if (matches.length > 0) {
        const m = matches[0];
        gs.setSelectStart({ row: m.row, col: m.start });
        gs.setSelectEnd({ row: m.row, col: m.end });
        import("./textBuffer.js").then((tb) => {
          tb.moveCursor(m.row, m.start);
          updateUI();
          checkWinCondition();
        });
      } else {
        updateUI();
      }
      return;
    }

    // Jump to first match
    if (matches.length > 0) {
      const cursor = gs.getCursor();
      const direction = gs.getLastSearchDirection();
      let bestIdx = -1;

      if (direction === "forward") {
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          if (
            m.row > cursor.row ||
            (m.row === cursor.row && m.start >= cursor.col)
          ) {
            bestIdx = i;
            break;
          }
        }
        if (bestIdx === -1) bestIdx = 0; // wrap
      } else {
        for (let i = matches.length - 1; i >= 0; i--) {
          const m = matches[i];
          if (
            m.row < cursor.row ||
            (m.row === cursor.row && m.start <= cursor.col)
          ) {
            bestIdx = i;
            break;
          }
        }
        if (bestIdx === -1) bestIdx = matches.length - 1; // wrap
      }

      gs.setCurrentMatchIndex(bestIdx);
      const m = matches[bestIdx];
      import("./textBuffer.js").then((tb) => {
        tb.moveCursor(m.row, m.start);
        updateUI();
        checkWinCondition();
      });
    } else {
      updateUI();
    }
    return;
  }

  if (key.length === 1 && !e.ctrlKey && !e.altKey) {
    gs.setSearchQuery(gs.getSearchQuery() + key);
    updateUI();
  }
}

// Helper: compute search matches (inline to avoid circular import)
function tb_computeSearchMatches(query) {
  const content = gs.getContent();
  if (!query) return [];
  const needle = query.toLowerCase();
  const matches = [];
  for (let r = 0; r < content.length; r++) {
    const lineLower = content[r].toLowerCase();
    let idx = 0;
    while (true) {
      const found = lineLower.indexOf(needle, idx);
      if (found === -1) break;
      matches.push({ row: r, start: found, end: found + needle.length });
      idx = found + Math.max(1, needle.length);
    }
  }
  return matches;
}
