# Target Word Hints — Implementation Plan

## Overview

Two changes to navigation levels:

1. **Loosen win criteria**: Landing anywhere on the target word wins (not just
   exact character)
2. **Visual highlight**: Render the target word with a colored background so
   users see where to go

---

## Change 1: `js/textBuffer.js` — Add `getWordRangeAt()` helper

After line ~366 (before `findMatchBracket`), add:

```js
export function getWordRangeAt(row, col) {
  const content = getContent();
  const line = content[row];
  if (!line || col < 0 || col >= line.length) return null;
  if (!isWordChar(line[col])) return null;
  let start = col;
  let end = col;
  while (start > 0 && isWordChar(line[start - 1])) start--;
  while (end < line.length && isWordChar(line[end])) end++;
  return { start, end };
}
```

---

## Change 2: `js/levels.js` — Add `targetWord: true` to 7 levels

Add `targetWord: true,` to these level objects:

| Level | Line ~56 | After `target: { row: 0, col: 16 },` | | Level | Line ~69 |
After `target: { row: 1, col: 12 },` | | Level | Line ~106 | After
`target: { row: 2, col: 9 },` | | Level | Line ~122 | After
`target: { row: 4, col: 0 },` | | Level | Line ~134 | After
`target: { row: 0, col: 22 },` | | Level | Line ~148 | After
`target: { row: 2, col: 21 },` | | Level | Line ~162 | After
`target: { row: 2, col: 10 },` |

(Levels 0-0, 0-1, 0-4 do NOT get `targetWord` — their targets are on punctuation
or past-line-end.)

---

## Change 3: `js/event-handlers.js` — Loosen win check + pass range to renderer

### 3a. In `checkWinCondition()` (~line 80–82)

Replace:

```js
if (level.target) {
  const cursor = gs.getCursor();
  won = cursor.row === level.target.row && cursor.col === level.target.col;
}
```

With:

```js
if (level.target) {
  const cursor = gs.getCursor();
  if (level.targetWord) {
    const range = tb.getWordRangeAt(level.target.row, level.target.col);
    won = range && cursor.row === level.target.row &&
      cursor.col >= range.start && cursor.col < range.end;
  } else {
    won = cursor.row === level.target.row && cursor.col === level.target.col;
  }
}
```

### 3b. In `updateUI()` (~line 194–238)

After `const level = levels[gs.getCurrentLevel()];` (line 214), add target word
range computation:

```js
// Compute target word range for highlighting
let targetWordRange = null;
if (level.target && level.targetWord) {
  const content = gs.getContent();
  const line = content[level.target.row];
  if (line) {
    let start = level.target.col;
    let end = level.target.col;
    while (start > 0 && /\w/.test(line[start - 1])) start--;
    while (end < line.length && /\w/.test(line[end])) end++;
    if (start < end) {
      targetWordRange = { row: level.target.row, start, end };
    }
  }
}
```

Then pass `targetWordRange` to `renderEditor`:

```js
renderEditor(
  gs.getContent(),
  gs.getCursor(),
  gs.getMode(),
  gs.getSelectStart(),
  gs.getSelectEnd(),
  targetWordRange,
);
```

---

## Change 4: `js/ui-components.js` — Render target word highlight

### 4a. Update `renderEditor` signature (line 30)

```js
export function renderEditor(content, cursor, mode, selectStart, selectEnd, targetWordRange)
```

### 4b. In the character loop (~line 80–92), after the search-match checks, add:

```js
// Target word highlight (lowest priority — only if no other highlight applies)
let isTargetWord = false;
if (
  !cls && targetWordRange && rowIdx === targetWordRange.row &&
  colIdx >= targetWordRange.start && colIdx < targetWordRange.end
) {
  isTargetWord = true;
}
```

### 4c. In the CSS class assignment (~line 94), add:

```js
if (isTargetWord) {
  cls = "target-word";
}
```

The full priority in the condition chain should be:

1. cursor / insert-cursor / selected-cursor
2. selected
3. search-current
4. search-match
5. **target-word** (new — lowest priority)

---

## Change 5: `css/main.css` — Add `.target-word` style

After line 325 (after `.search-current` block), add:

```css
.editor-display .target-word {
  background-color: color-mix(in srgb, var(--peach) 30%, transparent);
}
```

---

## No test changes needed

Tests assert cursor position via `getCursorPos()`, not by checking the win
condition. All existing tests should pass unchanged.
