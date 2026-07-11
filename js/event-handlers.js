// Helixert — Event Handlers & Game Logic

import * as gs from "./gameState.js";
import * as tb from "./textBuffer.js";
import * as hc from "./helixCommands.js";
import { getLevelCount, getLevelsForWorld, levels, worlds } from "./levels.js";
import {
  createLevelButtons,
  createWorldTabs,
  flashLevelComplete,
  hideCelebration,
  hideModal,
  renderEditor,
  renderTargetDisplay,
  showCelebration,
  showModal,
  updateCommandLog,
  updateInstructions,
  updateLevelIndicator,
  updateStatusBar,
} from "./ui-components.js";
import { getProgress, saveProgress } from "./progress-system.js";

let _completedLevels = new Set();
let _currentWorld = 0;

export function getCompletedLevels() {
  return _completedLevels;
}

export function getCurrentWorld() {
  return _currentWorld;
}

export function loadSavedProgress() {
  const progress = getProgress();
  _completedLevels = new Set(
    Array.isArray(progress.completedLevels) ? progress.completedLevels : [],
  );
  _currentWorld = progress.currentWorld || 0;
}

function saveCurrentWorld() {
  saveProgress({ currentWorld: _currentWorld });
}

// --- Get levels in current world ---
function getWorldLevelIndices() {
  return levels
    .map((l, i) => ({ level: l, index: i }))
    .filter((item) => item.level.world === _currentWorld)
    .map((item) => item.index);
}

function getNextIncompleteLevelInWorld() {
  const indices = getWorldLevelIndices();
  for (const idx of indices) {
    if (!_completedLevels.has(idx)) return idx;
  }
  return null; // All levels in world completed
}

// --- Load a level ---
export function loadLevel(index) {
  if (index < 0 || index >= getLevelCount()) return;

  const level = levels[index];
  _currentWorld = level.world;
  gs.setCurrentLevel(index);
  gs.setContent(level.initialContent);
  gs.setMode("NORMAL");
  gs.resetLevelState();
  hc.reset();

  if (level.setup) {
    const state = { cursor: gs.getCursor() };
    level.setup(state);
    gs.setCursor(state.cursor);
  }

  saveCurrentWorld();
  updateUI();
}

// --- Win condition check ---
export function checkWinCondition() {
  const level = levels[gs.getCurrentLevel()];
  if (!level) return;

  let won = false;

  if (level.target) {
    const cursor = gs.getCursor();
    if (level.targetWord) {
      const range = tb.getWordRangeAt(level.target.row, level.target.col);
      won = range && cursor.row === level.target.row &&
        cursor.col >= range.start && cursor.col < range.end;
    } else {
      won = cursor.row === level.target.row && cursor.col === level.target.col;
    }
  } else if (level.targetText) {
    const content = gs.getContent();
    won = content[level.targetText.line] === level.targetText.text &&
      gs.getMode() === "NORMAL";
  } else if (level.targetContent) {
    won = tb.isComplete(level.targetContent);
  } else if (level.validation) {
    const state = {
      content: gs.getContent(),
      cursor: gs.getCursor(),
      mode: gs.getMode(),
      usedSelectLine: gs.getUsedSelectLine(),
      usedSelectMode: gs.getUsedSelectMode(),
      usedInsertMode: gs.getUsedInsertMode(),
      usedSearch: gs.getUsedSearch(),
      usedFindChar: gs.getUsedFindChar(),
    };
    won = level.validation(state);
  }

  if (won) {
    _completedLevels.add(gs.getCurrentLevel());
    saveProgress({ completedLevels: [..._completedLevels] });
    flashLevelComplete();
    setTimeout(() => {
      if (gs.getCurrentLevel() === getLevelCount() - 1) {
        showCelebration();
      } else {
        // Check if this was the last level in the world
        const worldLevels = getLevelsForWorld(_currentWorld);
        const worldComplete = worldLevels.every((_, i) => {
          const globalIdx = levels.indexOf(worldLevels[i]);
          return _completedLevels.has(globalIdx);
        });

        if (worldComplete && _currentWorld < worlds.length - 1) {
          showModal(
            `World ${_currentWorld} Complete!`,
            `You've mastered: <strong>${
              worlds[_currentWorld].name
            }</strong>!<br><br>
                        <button id="next-world-btn" class="btn-next-world">
                            Next World: ${worlds[_currentWorld + 1].name}
                        </button>`,
          );
          // Bind next world button
          setTimeout(() => {
            const nextWorldBtn = document.getElementById("next-world-btn");
            if (nextWorldBtn) {
              nextWorldBtn.addEventListener("click", () => {
                hideModal();
                switchWorld(_currentWorld + 1);
              });
            }
          }, 50);
        } else {
          showModal(
            `Level ${gs.getCurrentLevel() + 1} Complete!`,
            `You mastered: <strong>${level.name}</strong>.`,
          );
        }
      }
    }, 500);
  }
}

// --- Level navigation ---
export function nextLevel() {
  // Find next incomplete level in current world
  const nextIdx = getNextIncompleteLevelInWorld();
  if (nextIdx !== null) {
    hideModal();
    loadLevel(nextIdx);
  } else {
    // All levels in world done — go to next world or show celebration
    if (_currentWorld < worlds.length - 1) {
      hideModal();
      switchWorld(_currentWorld + 1);
    }
  }
}

export function resetLevel() {
  loadLevel(gs.getCurrentLevel());
}

export function restartGame() {
  hideCelebration();
  _currentWorld = 0;
  loadLevel(0);
}

// --- World switching ---
export function switchWorld(worldNum) {
  if (worldNum < 0 || worldNum >= worlds.length) return;
  _currentWorld = worldNum;
  saveCurrentWorld();

  // Find first incomplete level in this world, or the first level
  const nextIdx = getNextIncompleteLevelInWorld();
  if (nextIdx !== null) {
    loadLevel(nextIdx);
  } else {
    // All completed — load first level of the world
    const worldLevels = getLevelsForWorld(worldNum);
    if (worldLevels.length > 0) {
      loadLevel(levels.indexOf(worldLevels[0]));
    }
  }
}

// --- Main UI update ---
let _isUpdating = false;

export function updateUI() {
  if (_isUpdating) return;
  _isUpdating = true;
  try {
    const level = levels[gs.getCurrentLevel()];
    let targetWordRange = null;
    if (level.target) {
      const content = gs.getContent();
      const line = content[level.target.row];
      if (line) {
        let start = level.target.col;
        let end = level.target.col;
        if (level.targetWord) {
          while (start > 0 && /\w/.test(line[start - 1])) start--;
          while (end < line.length && /\w/.test(line[end])) end++;
        } else {
          end = level.target.col + 1;
        }
        if (start < end) {
          targetWordRange = { row: level.target.row, start, end };
        }
      }
    }
    renderEditor(
      gs.getContent(),
      gs.getCursor(),
      gs.getMode(),
      gs.getSelectStart(),
      gs.getSelectEnd(),
      targetWordRange,
    );
    renderTargetDisplay(level ? level.targetContent : null);
    updateStatusBar(
      gs.getMode(),
      gs.getCountBuffer(),
      gs.getCommandLog(),
      gs.getSearchMode(),
      gs.getSearchQuery(),
      gs.getLastSearchDirection(),
      hc.getBufferDisplay(),
    );

    if (level) {
      updateInstructions(level.instructions);
    }

    // Compute completed levels per world for tabs
    const completedByWorld = {};
    worlds.forEach((w) => {
      completedByWorld[w.num] = 0;
    });
    _completedLevels.forEach((idx) => {
      const w = levels[idx]?.world;
      if (w !== undefined) completedByWorld[w]++;
    });

    // World-aware level indicator
    const world = worlds[_currentWorld];
    const worldLevels = getLevelsForWorld(_currentWorld);
    const levelInWorld = worldLevels.findIndex((l) =>
      levels.indexOf(l) === gs.getCurrentLevel()
    );
    updateLevelIndicator(
      _currentWorld,
      world.name,
      levelInWorld,
      worldLevels.length,
    );

    createWorldTabs(_currentWorld, completedByWorld, switchWorld);
    createLevelButtons(
      levels,
      gs.getCurrentLevel(),
      _completedLevels,
      _currentWorld,
    );
    updateCommandLog(gs.getCommandLog());
  } finally {
    _isUpdating = false;
  }
}
