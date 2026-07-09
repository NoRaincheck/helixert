// Helixert — UI Components

import { escapeHtml, getSearchMatches, getLastSearchQuery, getCurrentMatchIndex } from './gameState.js';
import { worlds } from './levels.js';

// DOM references
let editorDisplay, statusBar, instructionsEl, levelIndicator, commandLogEl,
    editorContainer, resetBtn, modal, modalTitle, modalMessage, nextLevelBtn,
    celebration, celebrationRestartBtn, levelSelectionContainer, worldTabsContainer,
    targetColumn, targetContentEl;

export function initializeDOM() {
    editorDisplay = document.getElementById('editor-display');
    statusBar = document.getElementById('status-bar');
    instructionsEl = document.getElementById('instructions');
    levelIndicator = document.getElementById('level-indicator');
    commandLogEl = document.getElementById('command-log');
    editorContainer = document.getElementById('editor-container');
    resetBtn = document.getElementById('reset-btn');
    modal = document.getElementById('modal');
    modalTitle = document.getElementById('modal-title');
    modalMessage = document.getElementById('modal-message');
    nextLevelBtn = document.getElementById('next-level-btn');
    celebration = document.getElementById('celebration');
    celebrationRestartBtn = document.getElementById('celebration-restart');
    levelSelectionContainer = document.getElementById('level-selection');
    worldTabsContainer = document.getElementById('world-tabs');
    targetColumn = document.getElementById('target-column');
    targetContentEl = document.getElementById('target-content');
}

// --- Editor rendering ---
export function renderEditor(content, cursor, mode, selectStart, selectEnd, targetWordRange) {
    if (!editorDisplay) return;

    const searchMatches = getSearchMatches();
    const lastQuery = getLastSearchQuery();
    const curMatchIdx = getCurrentMatchIndex();
    const hasSel = selectStart && selectEnd;

    let selMinRow, selMaxRow, selMinCol, selMaxCol;
    if (hasSel) {
        selMinRow = Math.min(selectStart.row, selectEnd.row);
        selMaxRow = Math.max(selectStart.row, selectEnd.row);
        selMinCol = selectStart.row <= selectEnd.row ? selectStart.col : selectEnd.col;
        selMaxCol = selectStart.row <= selectEnd.row ? selectEnd.col : selectStart.col;
    }

    let html = '';
    content.forEach((line, rowIdx) => {
        html += `<div class="line"><span class="line-number">${rowIdx + 1}</span><span class="line-content">`;

        for (let colIdx = 0; colIdx <= line.length; colIdx++) {
            const isCursor = rowIdx === cursor.row && colIdx === cursor.col;
            const char = colIdx < line.length ? line[colIdx] : ' ';
            const safeChar = escapeHtml(char === ' ' ? '\u00A0' : char);

            let isSelected = false;
            if (hasSel) {
                if (rowIdx > selMinRow && rowIdx < selMaxRow) {
                    isSelected = true;
                } else if (rowIdx === selMinRow && rowIdx === selMaxRow) {
                    isSelected = colIdx >= selMinCol && colIdx < selMaxCol;
                } else if (rowIdx === selMinRow) {
                    isSelected = colIdx >= selMinCol;
                } else if (rowIdx === selMaxRow) {
                    isSelected = colIdx < selMaxCol;
                }
            }

            let isSearchMatch = false;
            let isSearchCurrent = false;
            if (lastQuery && searchMatches.length > 0) {
                for (let i = 0; i < searchMatches.length; i++) {
                    const m = searchMatches[i];
                    if (m.row === rowIdx && colIdx >= m.start && colIdx < m.end) {
                        isSearchMatch = true;
                        if (i === curMatchIdx) isSearchCurrent = true;
                        break;
                    }
                }
            }

            let cls = '';
            if (isCursor && (mode === 'NORMAL' || mode === 'SELECT')) {
                cls = isSelected ? 'selected-cursor' : 'cursor';
            } else if (isCursor && mode === 'INSERT') {
                cls = 'insert-cursor';
            } else if (isSelected) {
                cls = 'selected';
            } else if (isSearchCurrent) {
                cls = 'search-current';
            } else if (isSearchMatch) {
                cls = 'search-match';
            } else if (targetWordRange && rowIdx === targetWordRange.row && colIdx >= targetWordRange.start && colIdx < targetWordRange.end) {
                cls = 'target-word';
            }

            if (cls) {
                html += `<span class="${cls}">${safeChar}</span>`;
            } else {
                html += safeChar;
            }
        }

        if (rowIdx === cursor.row && cursor.col >= line.length && mode !== 'INSERT') {
            html += `<span class="cursor">\u00A0</span>`;
        }

        html += '</span></div>';
    });

    editorDisplay.innerHTML = html;
}

// --- Target display ---
export function renderTargetDisplay(targetContent) {
    if (!targetColumn || !targetContentEl) return;

    if (!targetContent) {
        targetColumn.classList.add('hidden');
        return;
    }

    targetColumn.classList.remove('hidden');
    targetContentEl.textContent = targetContent.join('\n');
}

// --- Status bar ---
export function updateStatusBar(mode, countBuffer, commandLog, searchMode, searchQuery, searchDirection) {
    if (!statusBar) return;

    let text = `-- ${mode} --`;

    if (searchMode) {
        const prefix = searchDirection === 'backward' ? '?' : '/';
        text += ` ${prefix}${searchQuery}`;
    }

    if (countBuffer) {
        text = `${countBuffer}-- ${mode} --`;
    }

    statusBar.textContent = text;

    statusBar.className = 'status-bar';
    statusBar.classList.add(`mode-${mode.toLowerCase()}`);
}

// --- Instructions ---
export function updateInstructions(text) {
    if (!instructionsEl) return;
    if (text !== undefined) {
        instructionsEl.innerHTML = text;
    }
}

// --- Command log ---
export function updateCommandLog(log) {
    if (!commandLogEl) return;
    commandLogEl.textContent = log.slice(-10).join('');
}

// --- Level indicator ---
export function updateLevelIndicator(currentWorld, worldName, levelInWorld, totalInWorld) {
    if (!levelIndicator) return;
    levelIndicator.textContent = `World ${currentWorld}: ${worldName} — Level ${levelInWorld + 1} / ${totalInWorld}`;
}

// --- World tabs ---
export function createWorldTabs(currentWorld, completedLevelsByWorld, onWorldClick) {
    if (!worldTabsContainer) return;
    worldTabsContainer.innerHTML = '';

    worlds.forEach((world) => {
        const btn = document.createElement('button');
        const completed = completedLevelsByWorld[world.num] || 0;
        const total = 5; // All worlds have 5 levels
        const isCurrent = world.num === currentWorld;

        btn.innerHTML = `<span>${world.icon}</span> ${world.name}`;
        if (isCurrent) {
            btn.className = 'world-tab-current';
            btn.style.backgroundColor = world.color;
        }

        btn.title = `${world.description} (${completed}/${total} completed)`;
        btn.dataset.world = world.num;
        btn.addEventListener('click', () => onWorldClick(world.num));
        worldTabsContainer.appendChild(btn);
    });
}

// --- Level buttons ---
export function createLevelButtons(levels, currentLevel, completedLevels, currentWorld) {
    if (!levelSelectionContainer) return;
    levelSelectionContainer.innerHTML = '';

    const worldLevels = levels.filter(l => l.world === currentWorld);
    const firstIdx = levels.indexOf(worldLevels[0]);

    worldLevels.forEach((level, localIdx) => {
        const globalIdx = firstIdx + localIdx;
        const btn = document.createElement('button');
        btn.textContent = localIdx + 1;
        btn.className = 'level-btn ';
        if (globalIdx === currentLevel) {
            btn.className += 'current';
        } else if (completedLevels.has(globalIdx)) {
            btn.className += 'completed';
        } else {
            btn.className += 'locked';
        }
        btn.title = level.name;
        btn.dataset.level = globalIdx;
        levelSelectionContainer.appendChild(btn);
    });
}

// --- Modal ---
export function showModal(title, message) {
    if (!modal || !modalTitle || !modalMessage) return;
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    modal.classList.remove('opacity-0', 'pointer-events-none');
}

export function hideModal() {
    if (!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
}

// --- Celebration ---
export function showCelebration() {
    if (!celebration) return;
    celebration.classList.remove('hidden');
    spawnConfetti();
}

export function hideCelebration() {
    if (!celebration) return;
    celebration.classList.add('hidden');
    celebration.querySelectorAll('.confetti').forEach(n => n.remove());
}

function spawnConfetti() {
    if (!celebration) return;
    celebration.querySelectorAll('.confetti').forEach(n => n.remove());
    const emojis = ['🎉', '✨', '🎊', '⭐', '💥', '🔥'];
    for (let i = 0; i < 60; i++) {
        const span = document.createElement('span');
        span.className = 'confetti';
        span.textContent = emojis[i % emojis.length];
        span.style.left = Math.random() * 100 + 'vw';
        span.style.animationDuration = (5 + Math.random() * 3).toFixed(2) + 's';
        span.style.animationDelay = (Math.random() * 1.5).toFixed(2) + 's';
        span.style.transform = `translateY(${Math.random() * -40}vh)`;
        celebration.appendChild(span);
    }
}

// --- Level complete flash ---
export function flashLevelComplete() {
    if (!editorContainer) return;
    editorContainer.classList.add('level-complete-flash');
    setTimeout(() => editorContainer.classList.remove('level-complete-flash'), 500);
}
