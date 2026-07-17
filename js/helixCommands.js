// Helixert — Helix Command Engine (noun-verb semantics)
//
// In Helix: you SELECT first (the noun), then OPERATE (the verb).
//   x  → select entire line
//   v  → enter SELECT mode (character-wise selection via motions)
//   w  → extend selection by word
//   d  → delete current selection
//   c  → change current selection (delete + INSERT)
//   y  → yank current selection

import * as gs from "./gameState.js";
import * as tb from "./textBuffer.js";

// Pending multi-key command buffer
let _buffer = [];
let _lastFindChar = null;
let _lastFindDir = null;
let _lastChange = null; // for dot repeat

export function reset() {
  _buffer = [];
  _lastFindChar = null;
  _lastFindDir = null;
  _lastChange = null;
}

export function getBufferDisplay() {
  if (_buffer.length === 0) return "";
  const b = _buffer.join("");
  if (
    (b === "f" || b === "F" || b === "t" || b === "T") && _buffer.length === 1
  ) {
    return b + " → ?";
  }
  if (b === "g" && _buffer.length === 1) return "g → ?";
  return b;
}

export function isWaitingForInput() {
  return _buffer.length > 0;
}

// --- Main entry point ---
export function execute(key, e) {
  const mode = gs.getMode();

  if (mode === "INSERT") return executeInsert(key, e);
  if (mode === "SELECT") return executeSelect(key, e);

  // NORMAL mode
  if (_buffer.length > 0) return executeBuffered(key, e);

  // Count buffer
  if (/^[0-9]$/.test(key)) {
    if (!(key === "0" && gs.getCountBuffer() === "")) {
      gs.setCountBufferAppend(key);
      gs.appendCommandLog(key);
      return { handled: true };
    }
  }

  return executeSingle(key, e);
}

function getCount() {
  const buf = gs.getCountBuffer();
  const n = buf ? parseInt(buf, 10) : 1;
  return Math.max(1, n);
}

function resetCount() {
  gs.setCountBuffer("");
}

// --- Execute a single key in NORMAL mode ---
function executeSingle(key, e) {
  const ctrlKey = e.ctrlKey;

  // Escape
  if (gs.isEscapeKey(e)) {
    if (gs.hasSelection()) {
      gs.clearSelection();
    }
    resetCount();
    return { handled: true };
  }

  // --- Basic movement (these also work as selection extenders in SELECT mode) ---
  if ("hjk".includes(key)) {
    const count = getCount();
    for (let i = 0; i < count; i++) {
      if (key === "h") {
        tb.moveCursorRelative(0, -1);
        gs.setDesiredCol(gs.getCursor().col);
      } else if (key === "j" || key === "k") {
        tb.moveCursorRelative(key === "j" ? 1 : -1, 0);
        const c = gs.getCursor();
        const maxCol = Math.max(0, tb.getLineLength(c.row) - 1);
        gs.setCursor({ row: c.row, col: Math.min(gs.getDesiredCol(), maxCol) });
      }
    }
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  if (key === "l") {
    const count = getCount();
    const cursor = gs.getCursor();
    // In NORMAL mode, l doesn't go past last char of line
    for (let i = 0; i < count; i++) {
      const c = gs.getCursor();
      const lineLen = tb.getLineLength(c.row);
      if (c.col < lineLen - 1) {
        tb.moveCursorRelative(0, 1);
      } else if (c.row < tb.getLineCount() - 1) {
        tb.moveCursor(c.row + 1, 0);
      }
    }
    gs.setDesiredCol(gs.getCursor().col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // --- Word motions ---
  if (key === "w") {
    const count = getCount();
    for (let i = 0; i < count; i++) {
      const c = gs.getCursor();
      const next = tb.findWordForward(c.row, c.col);
      tb.moveCursor(next.row, next.col);
    }
    gs.setDesiredCol(gs.getCursor().col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  if (key === "b") {
    const count = getCount();
    for (let i = 0; i < count; i++) {
      const c = gs.getCursor();
      const prev = tb.findWordBackward(c.row, c.col);
      tb.moveCursor(prev.row, prev.col);
    }
    gs.setDesiredCol(gs.getCursor().col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  if (key === "e") {
    const count = getCount();
    for (let i = 0; i < count; i++) {
      const c = gs.getCursor();
      const end = tb.findWordEnd(c.row, c.col);
      tb.moveCursor(end.row, end.col);
    }
    gs.setDesiredCol(gs.getCursor().col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // --- Line position ---
  if (key === "0") {
    tb.moveCursor(gs.getCursor().row, 0);
    gs.setDesiredCol(0);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // --- Goto mode (g prefix) ---
  if (key === "g") {
    _buffer.push("g");
    gs.appendCommandLog("g");
    return { handled: true };
  }

  // --- Find/Till (f/F/t/T prefix) ---
  if ("fFtT".includes(key)) {
    _buffer.push(key);
    gs.setUsedFindChar(true);
    gs.appendCommandLog(key);
    return { handled: true };
  }

  // --- Select line (x) — Helix noun: select the whole line ---
  if (key === "x") {
    const count = getCount();
    const cursor = gs.getCursor();
    gs.setSelectStart({ row: cursor.row, col: 0 });
    // Select count lines
    const endRow = Math.min(cursor.row + count - 1, tb.getLineCount() - 1);
    const endCol = tb.getLineLength(endRow);
    gs.setSelectEnd({ row: endRow, col: endCol });
    gs.setUsedSelectLine(true);
    tb.moveCursor(cursor.row, 0);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selected: true };
  }

  // --- Visual/Select mode (v) — Helix noun: start character-wise selection ---
  if (key === "v" && !ctrlKey) {
    const cursor = gs.getCursor();
    gs.setSelectStart({ ...cursor });
    gs.setSelectEnd({ ...cursor });
    gs.setMode("SELECT");
    gs.setUsedSelectMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "SELECT" };
  }

  // --- Operators (verbs) — act on current selection ---
  if (key === "d") return executeOperator("d");
  if (key === "c") return executeOperator("c");
  if (key === "y") return executeOperator("y");

  // --- Paste after (p) ---
  if (key === "p") {
    const text = gs.getYankedText();
    if (text) {
      gs.pushUndo();
      tb.pasteAfter(text);
      gs.clearCommandLog();
      return { handled: true, operated: "p" };
    }
    gs.clearCommandLog();
    return { handled: true };
  }

  // --- Replace single char ---
  if (key === "r") {
    gs.setReplacePending(true);
    gs.clearCommandLog();
    return { handled: true };
  }

  // --- Insert mode entry ---
  if (key === "i") {
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }
  if (key === "a") {
    const c = gs.getCursor();
    const lineLen = tb.getLineLength(c.row);
    if (c.col < lineLen) tb.moveCursorRelative(0, 1);
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }
  if (key === "I") {
    const c = gs.getCursor();
    const line = tb.getLine(c.row);
    const firstNonBlank = line.search(/\S/);
    tb.moveCursor(c.row, firstNonBlank >= 0 ? firstNonBlank : 0);
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }
  if (key === "A") {
    const c = gs.getCursor();
    tb.moveCursor(c.row, tb.getLineLength(c.row));
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }
  if (key === "o") {
    gs.pushUndo();
    const c = gs.getCursor();
    tb.insertContentLine(c.row + 1, "");
    tb.moveCursor(c.row + 1, 0);
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }
  if (key === "O") {
    gs.pushUndo();
    const c = gs.getCursor();
    tb.insertContentLine(c.row, "");
    tb.moveCursor(c.row, 0);
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, modeChange: "INSERT" };
  }

  // --- Undo / Redo ---
  if (key === "u") {
    const prev = gs.popUndo();
    if (prev) {
      gs.pushRedo(gs.cloneState());
      gs.setContent(prev.content);
      gs.setCursor(prev.cursor);
      gs.setMode(prev.mode);
      gs.setYankedText(prev.yankedText);
    }
    resetCount();
    gs.clearCommandLog();
    return { handled: true };
  }
  if (key === "U" && ctrlKey) {
    // Redo: pop from redo stack, push current to undo (without clearing redo), restore
    const nextState = gs.popRedo();
    if (nextState) {
      gs.pushUndoNoClear(gs.cloneState());
      gs.setContent(nextState.content);
      gs.setCursor(nextState.cursor);
      gs.setMode(nextState.mode);
      gs.setYankedText(nextState.yankedText);
    }
    resetCount();
    gs.clearCommandLog();
    return { handled: true };
  }

  // --- Dot repeat ---
  if (key === ".") {
    if (_lastChange) {
      replayChange(_lastChange);
    }
    resetCount();
    gs.clearCommandLog();
    return { handled: true };
  }

  // --- Search ---
  if (key === "/") {
    gs.setSearchMode(true);
    gs.setSearchQuery("");
    gs.setLastSearchDirection("forward");
    gs.setUsedSearchInLevel(true);
    gs.setUsedSearch(true);
    resetCount();
    return { handled: true, searchMode: true };
  }
  if (key === "?") {
    gs.setSearchMode(true);
    gs.setSearchQuery("");
    gs.setLastSearchDirection("backward");
    gs.setUsedSearchInLevel(true);
    gs.setUsedSearch(true);
    resetCount();
    return { handled: true, searchMode: true };
  }

  // --- Search navigation ---
  if (key === "n" || key === "N") {
    const forward = key === "n"
      ? gs.getLastSearchDirection() === "forward"
      : gs.getLastSearchDirection() === "backward";
    const matches = gs.getSearchMatches();
    if (matches.length === 0) return { handled: true };
    let idx = gs.getCurrentMatchIndex();
    if (idx === -1) idx = 0;
    if (forward) {
      idx = (idx + 1) % matches.length;
    } else {
      idx = (idx - 1 + matches.length) % matches.length;
    }
    gs.setCurrentMatchIndex(idx);
    const m = matches[idx];
    tb.moveCursor(m.row, m.start);
    gs.setNavCountSinceSearch(gs.getNavCountSinceSearch() + 1);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // --- Match bracket ---
  if (key === "%") {
    const c = gs.getCursor();
    const match = tb.findMatchBracket(c.row, c.col);
    if (match) tb.moveCursor(match.row, match.col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // Ignore unhandled keys
  resetCount();
  gs.clearCommandLog();
  return { handled: false };
}

// --- Buffered commands (multi-key sequences) ---
function executeBuffered(key, e) {
  gs.appendCommandLog(key);
  const buf = _buffer.join("");

  // g prefix
  if (buf === "g") {
    if (key === "g") {
      // gg — go to first line
      tb.moveCursor(0, 0);
      _buffer = [];
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "e") {
      // ge — go to last line
      tb.moveCursor(tb.getLineCount() - 1, 0);
      _buffer = [];
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "h") {
      // gh — go to line start (first non-blank)
      const line = tb.getLine(gs.getCursor().row);
      const firstNonBlank = line.search(/\S/);
      tb.moveCursor(gs.getCursor().row, firstNonBlank >= 0 ? firstNonBlank : 0);
      gs.setDesiredCol(gs.getCursor().col);
      _buffer = [];
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "l") {
      // gl — go to line end
      const row = gs.getCursor().row;
      tb.moveCursor(row, Math.max(0, tb.getLineLength(row) - 1));
      gs.setDesiredCol(gs.getCursor().col);
      _buffer = [];
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    // Unknown g command — discard
    _buffer = [];
    gs.clearCommandLog();
    return { handled: true };
  }

  // f/F/t/T prefix — find/till character
  if (["f", "F", "t", "T"].includes(buf)) {
    if (key.length === 1 && !e.ctrlKey && !e.altKey) {
      const c = gs.getCursor();
      let result = null;
      if (buf === "f") result = tb.findCharForward(c.row, c.col, key, true);
      else if (buf === "F") {
        result = tb.findCharBackward(c.row, c.col, key, true);
      } else if (buf === "t") {
        result = tb.findCharForward(c.row, c.col, key, false);
      } else if (buf === "T") {
        result = tb.findCharBackward(c.row, c.col, key, false);
      }

      _lastFindChar = key;
      _lastFindDir = buf;
      _buffer = [];

      if (result) {
        tb.moveCursor(result.row, result.col);
        gs.clearCommandLog();
        return { handled: true, moved: true };
      }
      gs.clearCommandLog();
      return { handled: true };
    }
    _buffer = [];
    gs.clearCommandLog();
    return { handled: true };
  }

  // Unknown buffer — discard
  _buffer = [];
  gs.clearCommandLog();
  return { handled: true };
}

// --- Operator execution (d/c/y on selection) ---
function executeOperator(op) {
  const sel = gs.getSelectionRange();
  if (!sel) {
    if (op === "d") {
      const cursor = gs.getCursor();
      const content = gs.getContent();
      const line = content[cursor.row] || "";
      if (cursor.col < line.length) {
        gs.pushUndo();
        gs.setYankedText(line[cursor.col]);
        content[cursor.row] = line.slice(0, cursor.col) +
          line.slice(cursor.col + 1);
        gs.setContent(content);
        tb.clampCursor();
        _lastChange = { type: "delete-char", pos: { ...cursor } };
      }
      resetCount();
      gs.clearCommandLog();
      return { handled: true, operated: "d" };
    }
    gs.clearCommandLog();
    return { handled: true };
  }

  gs.pushUndo();

  if (op === "d") {
    const deleted = tb.deleteRange(
      sel.startRow,
      sel.startCol,
      sel.endRow,
      sel.endCol,
    );
    gs.setYankedText(deleted);
    gs.clearSelection();
    tb.clampCursor();
    _lastChange = { type: "delete", range: sel, text: deleted };
  } else if (op === "c") {
    const deleted = tb.deleteRange(
      sel.startRow,
      sel.startCol,
      sel.endRow,
      sel.endCol,
    );
    gs.setYankedText(deleted);
    gs.clearSelection();
    tb.clampCursor();
    gs.setMode("INSERT");
    gs.setUsedInsertMode(true);
    _lastChange = { type: "change", range: sel, text: deleted };
  } else if (op === "y") {
    const yanked = tb.yankRange(
      sel.startRow,
      sel.startCol,
      sel.endRow,
      sel.endCol,
    );
    gs.setYankedText(yanked);
    gs.clearSelection();
    tb.clampCursor();
  }

  resetCount();
  // Return to NORMAL mode after d/y in SELECT mode
  if (op !== "c" && gs.getMode() === "SELECT") {
    gs.setMode("NORMAL");
  }
  gs.clearCommandLog();
  return { handled: true, operated: op };
}

// --- INSERT mode ---
function executeInsert(key, e) {
  if (gs.isEscapeKey(e)) {
    gs.setMode("NORMAL");
    // Move cursor back one (like vim/helix)
    const c = gs.getCursor();
    if (c.col > 0) tb.moveCursorRelative(0, -1);
    gs.clearCommandLog();
    return { handled: true, modeChange: "NORMAL" };
  }

  if (key === "Backspace") {
    const c = gs.getCursor();
    if (c.col > 0) {
      gs.pushUndo();
      const line = tb.getLine(c.row);
      gs.updateContentLine(c.row, line.slice(0, c.col - 1) + line.slice(c.col));
      tb.moveCursorRelative(0, -1);
    } else if (c.row > 0) {
      gs.pushUndo();
      const prevLen = tb.getLineLength(c.row - 1);
      const currentLine = tb.getLine(c.row);
      gs.updateContentLine(c.row - 1, tb.getLine(c.row - 1) + currentLine);
      tb.deleteLine(c.row);
      tb.moveCursor(c.row - 1, prevLen);
    }
    gs.clearCommandLog();
    return { handled: true };
  }

  if (key === "Enter") {
    gs.pushUndo();
    const c = gs.getCursor();
    const line = tb.getLine(c.row);
    const before = line.slice(0, c.col);
    const after = line.slice(c.col);
    gs.updateContentLine(c.row, before);
    tb.insertContentLine(c.row + 1, after);
    tb.moveCursor(c.row + 1, 0);
    gs.clearCommandLog();
    return { handled: true };
  }

  if (key === "Tab") {
    gs.pushUndo();
    const c = gs.getCursor();
    tb.insertText(c.row, c.col, "    ");
    tb.moveCursorRelative(0, 4);
    gs.clearCommandLog();
    return { handled: true };
  }

  if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    gs.pushUndo();
    const c = gs.getCursor();
    tb.insertText(c.row, c.col, key);
    tb.moveCursorRelative(0, 1);
    gs.clearCommandLog();
    return { handled: true };
  }

  gs.clearCommandLog();
  return { handled: false };
}

// --- SELECT mode ---
function executeSelect(key, e) {
  if (gs.isEscapeKey(e)) {
    gs.setMode("NORMAL");
    gs.clearSelection();
    gs.clearCommandLog();
    return { handled: true, modeChange: "NORMAL" };
  }

  // In SELECT mode, movement keys extend the selection
  const movementKeys = { h: [0, -1], j: [1, 0], k: [-1, 0], l: [0, 1] };
  if (movementKeys[key]) {
    const [dr, dc] = movementKeys[key];
    const count = getCount();
    for (let i = 0; i < count; i++) {
      if (key === "j" || key === "k") {
        tb.moveCursorRelative(dr, dc);
        const c = gs.getCursor();
        const maxCol = Math.max(0, tb.getLineLength(c.row) - 1);
        gs.setCursor({ row: c.row, col: Math.min(gs.getDesiredCol(), maxCol) });
      } else {
        tb.moveCursorRelative(dr, dc);
      }
    }
    if (key !== "j" && key !== "k") {
      gs.setDesiredCol(gs.getCursor().col);
    }
    gs.setSelectEnd(gs.getCursor());
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }

  // Word motions in SELECT mode
  if (key === "w") {
    const c = gs.getCursor();
    const next = tb.findWordForward(c.row, c.col);
    tb.moveCursor(next.row, next.col);
    gs.setSelectEnd(gs.getCursor());
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }
  if (key === "b") {
    const c = gs.getCursor();
    const prev = tb.findWordBackward(c.row, c.col);
    tb.moveCursor(prev.row, prev.col);
    gs.setSelectEnd(gs.getCursor());
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }
  if (key === "e") {
    const c = gs.getCursor();
    const end = tb.findWordEnd(c.row, c.col);
    tb.moveCursor(end.row, end.col);
    gs.setSelectEnd(gs.getCursor());
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }

  // Line position in SELECT mode
  if (key === "0") {
    tb.moveCursor(gs.getCursor().row, 0);
    gs.setSelectEnd(gs.getCursor());
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }

  // Operators in SELECT mode
  if ("dyc".includes(key)) {
    return executeOperator(key);
  }

  // x in SELECT mode — extend to full line
  if (key === "x") {
    const c = gs.getCursor();
    gs.setSelectStart({ row: c.row, col: 0 });
    gs.setSelectEnd({ row: c.row, col: tb.getLineLength(c.row) });
    gs.clearCommandLog();
    return { handled: true, selectionExtended: true };
  }

  gs.clearCommandLog();
  return { handled: true };
}

// --- Replace pending ---
export function executeReplace(key) {
  if (key.length === 1) {
    const c = gs.getCursor();
    const line = tb.getLine(c.row);
    if (c.col < line.length) {
      gs.pushUndo();
      gs.updateContentLine(
        c.row,
        line.slice(0, c.col) + key + line.slice(c.col + 1),
      );
      _lastChange = { type: "replace", pos: { ...c }, char: key };
    }
    gs.setReplacePending(false);
    return { handled: true };
  }
  return { handled: false };
}

// --- Dot repeat ---
function replayChange(change) {
  if (change.type === "delete") {
    tb.moveCursor(change.range.startRow, change.range.startCol);
    gs.setSelectStart({
      row: change.range.startRow,
      col: change.range.startCol,
    });
    gs.setSelectEnd({ row: change.range.endRow, col: change.range.endCol });
    executeOperator("d");
  } else if (change.type === "replace") {
    tb.moveCursor(change.pos.row, change.pos.col);
    const line = tb.getLine(change.pos.row);
    if (change.pos.col < line.length) {
      gs.pushUndo();
      gs.updateContentLine(
        change.pos.row,
        line.slice(0, change.pos.col) + change.char +
          line.slice(change.pos.col + 1),
      );
    }
  }
}
