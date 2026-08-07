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
let _pendingOperator = null; // operator-pending mode: "c", "d", or "y"
let _pendingInsertedText = ""; // text typed after change operator

export function reset() {
  _buffer = [];
  _lastFindChar = null;
  _lastFindDir = null;
  _lastChange = null;
  _pendingOperator = null;
  _pendingInsertedText = "";
}

export function getBufferDisplay() {
  if (_pendingOperator) return _pendingOperator;
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

// --- Operator-pending: apply operator after a motion ---
function executeOperatorPendingMotion(motionFn) {
  if (!_pendingOperator) return false;
  const op = _pendingOperator;
  _pendingOperator = null;
  const count = getCount();
  const cursor = gs.getCursor();

  // Calculate the range based on the motion
  let startRow = cursor.row;
  let startCol = cursor.col;
  let endRow = cursor.row;
  let endCol = cursor.col;

  if (motionFn) {
    const result = motionFn(count);
    endRow = result.endRow;
    endCol = result.endCol;
  }

  // Normalize selection range
  if (endRow < startRow || (endRow === startRow && endCol < startCol)) {
    [startRow, endRow] = [endRow, startRow];
    [startCol, endCol] = [endCol, startCol];
  }

  gs.setSelectStart({ row: startRow, col: startCol });
  gs.setSelectEnd({ row: endRow, col: endCol });

  // Execute the operator on the selection
  resetCount();
  return executeOperator(op);
}

// Find word range at position (for operator-pending cw/dw/yw)
function getWordRangeAt(row, col) {
  const line = tb.getLine(row);
  if (!line || col < 0 || col >= line.length) return null;

  // If on whitespace or non-word char, move forward to next word
  if (/\s/.test(line[col]) || !/\w/.test(line[col])) {
    const next = tb.findWordForward(row, col);
    const range = getWordRangeAt(next.row, next.col);
    // If still no word found, return empty range (safety)
    if (!range) return { start: col, end: col };
    return range;
  }

  let start = col;
  let end = col;
  while (start > 0 && /\w/.test(line[start - 1])) start--;
  while (end < line.length && /\w/.test(line[end])) end++;
  return { start, end };
}

// --- Execute a single key in NORMAL mode ---
function executeSingle(key, e) {
  const ctrlKey = e.ctrlKey;

  // Escape
  if (gs.isEscapeKey(e)) {
    if (_pendingOperator) {
      _pendingOperator = null;
      gs.clearCommandLog();
      return { handled: true };
    }
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
    if (_pendingOperator) {
      // For operator-pending cw/dw/yw: delete/change/yank from cursor to end of word
      return executeOperatorPendingMotion((count) => {
        let c = { ...gs.getCursor() };
        for (let i = 0; i < count; i++) {
          const range = getWordRangeAt(c.row, c.col);
          if (range) c = { row: c.row, col: range.end };
        }
        return { endRow: c.row, endCol: c.col };
      });
    }
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
    if (_pendingOperator) {
      return executeOperatorPendingMotion((count) => {
        let c = { ...gs.getCursor() };
        for (let i = 0; i < count; i++) {
          const prev = tb.findWordBackward(c.row, c.col);
          c = { ...prev };
        }
        return { endRow: c.row, endCol: c.col };
      });
    }
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
    if (_pendingOperator) {
      return executeOperatorPendingMotion((count) => {
        let c = { ...gs.getCursor() };
        for (let i = 0; i < count; i++) {
          const end = tb.findWordEnd(c.row, c.col);
          c = { ...end };
        }
        return { endRow: c.row, endCol: c.col };
      });
    }
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
    if (_pendingOperator) {
      // Store as buffered key for operator-pending
      _buffer.push(key);
      gs.setUsedFindChar(true);
      gs.appendCommandLog(key);
      return { handled: true };
    }
    _buffer.push(key);
    gs.setUsedFindChar(true);
    gs.appendCommandLog(key);
    return { handled: true };
  }

  // --- Select line (x) — Helix noun: select the whole line ---
  if (key === "x") {
    if (_pendingOperator) {
      return executeOperatorPendingMotion((count) => {
        const cursor = gs.getCursor();
        const endRow = Math.min(cursor.row + count - 1, tb.getLineCount() - 1);
        return { endRow, endCol: tb.getLineLength(endRow) };
      });
    }
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

  // --- Operators (verbs) — act on current selection or enter operator-pending ---
  if ("dcy".includes(key)) {
    const sel = gs.getSelectionRange();
    if (sel) {
      // Selection exists — execute immediately (backward compat)
      return executeOperator(key);
    }
    // No selection — enter operator-pending mode
    _pendingOperator = key;
    gs.appendCommandLog(key);
    return { handled: true };
  }

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
    gs.insertContentLine(c.row + 1, "");
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
    gs.insertContentLine(c.row, "");
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

  // --- Select all ---
  if (key === "%") {
    const content = gs.getContent();
    if (content.length > 0) {
      gs.setSelectStart({ row: 0, col: 0 });
      const lastRow = content.length - 1;
      const lastCol = content[lastRow].length;
      gs.setSelectEnd({ row: lastRow, col: lastCol });
    }
    resetCount();
    gs.clearCommandLog();
    return { handled: true, selected: true };
  }

  // --- Match bracket ---
  if (key === "m") {
    const c = gs.getCursor();
    const match = tb.findMatchBracket(c.row, c.col);
    if (match) tb.moveCursor(match.row, match.col);
    resetCount();
    gs.clearCommandLog();
    return { handled: true, moved: true };
  }

  // --- Search-select (select all matches within current selection) ---
  if (key === "s") {
    gs.setSearchMode(true);
    gs.setSearchQuery("");
    gs.setSearchSelectMode(true);
    resetCount();
    return { handled: true, searchMode: true };
  }

  // Ignore unhandled keys
  resetCount();
  gs.clearCommandLog();
  return { handled: false };
}

// --- Buffered commands (multi-key sequences) ---
function executeBuffered(key, e) {
  // Ignore modifier keys — they are part of producing a character (e.g. Shift+2 → @)
  // and should not clear the pending buffer.
  if (["Shift", "Control", "Alt", "Meta"].includes(key)) {
    return { handled: true };
  }
  gs.appendCommandLog(key);
  const buf = _buffer.join("");

  // g prefix
  if (buf === "g") {
    if (key === "g") {
      // gg — go to first line
      _buffer = [];
      if (_pendingOperator) {
        const op = _pendingOperator;
        _pendingOperator = null;
        gs.setSelectStart({ row: 0, col: 0 });
        gs.setSelectEnd({ row: tb.getLineCount() - 1, col: tb.getLineLength(tb.getLineCount() - 1) });
        resetCount();
        return executeOperator(op);
      }
      tb.moveCursor(0, 0);
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "e") {
      // ge — go to last line
      _buffer = [];
      if (_pendingOperator) {
        const op = _pendingOperator;
        _pendingOperator = null;
        const lastRow = tb.getLineCount() - 1;
        gs.setSelectStart({ row: 0, col: 0 });
        gs.setSelectEnd({ row: lastRow, col: tb.getLineLength(lastRow) });
        resetCount();
        return executeOperator(op);
      }
      tb.moveCursor(tb.getLineCount() - 1, 0);
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "h") {
      // gh — go to line start (first non-blank)
      const line = tb.getLine(gs.getCursor().row);
      const firstNonBlank = line.search(/\S/);
      _buffer = [];
      if (_pendingOperator) {
        const op = _pendingOperator;
        _pendingOperator = null;
        const c = gs.getCursor();
        const targetCol = firstNonBlank >= 0 ? firstNonBlank : 0;
        gs.setSelectStart({ row: c.row, col: 0 });
        gs.setSelectEnd({ row: c.row, col: targetCol });
        resetCount();
        return executeOperator(op);
      }
      tb.moveCursor(gs.getCursor().row, firstNonBlank >= 0 ? firstNonBlank : 0);
      gs.setDesiredCol(gs.getCursor().col);
      gs.clearCommandLog();
      return { handled: true, moved: true };
    }
    if (key === "l") {
      // gl — go to line end
      const row = gs.getCursor().row;
      _buffer = [];
      if (_pendingOperator) {
        const op = _pendingOperator;
        _pendingOperator = null;
        const c = gs.getCursor();
        const targetCol = Math.max(0, tb.getLineLength(row) - 1);
        gs.setSelectStart({ row: c.row, col: 0 });
        gs.setSelectEnd({ row: c.row, col: targetCol });
        resetCount();
        return executeOperator(op);
      }
      tb.moveCursor(row, Math.max(0, tb.getLineLength(row) - 1));
      gs.setDesiredCol(gs.getCursor().col);
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
        if (_pendingOperator) {
          // Operator-pending: apply operator from cursor to found position
          const op = _pendingOperator;
          _pendingOperator = null;
          const startRow = gs.getCursor().row;
          const startCol = gs.getCursor().col;
          const endRow = result.row;
          const endCol = result.col + (buf === "f" || buf === "F" ? 1 : 0);

          gs.setSelectStart({ row: startRow, col: startCol });
          gs.setSelectEnd({ row: endRow, col: endCol });
          tb.moveCursor(result.row, result.col);
          resetCount();
          return executeOperator(op);
        }
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
    _pendingInsertedText = "";
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
    // Capture inserted text for dot repeat
    if (_lastChange && _lastChange.type === "change" && _pendingInsertedText) {
      _lastChange.insertedText = _pendingInsertedText;
    }
    gs.setMode("NORMAL");
    // Move cursor back one (like vim/helix)
    const c = gs.getCursor();
    if (c.col > 0) tb.moveCursorRelative(0, -1);
    _pendingInsertedText = "";
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

  if (key === "Delete") {
    const c = gs.getCursor();
    const lineLen = tb.getLineLength(c.row);
    if (c.col < lineLen) {
      gs.pushUndo();
      const line = tb.getLine(c.row);
      gs.updateContentLine(c.row, line.slice(0, c.col) + line.slice(c.col + 1));
    } else if (c.row < tb.getLineCount() - 1) {
      gs.pushUndo();
      const nextLine = tb.getLine(c.row + 1);
      gs.updateContentLine(c.row, tb.getLine(c.row) + nextLine);
      tb.deleteLine(c.row + 1);
    }
    gs.clearCommandLog();
    return { handled: true };
  }

  if (key === "Enter") {
    if (tb.getLineCount() >= 50) {
      gs.clearCommandLog();
      return { handled: true };
    }
    gs.pushUndo();
    const c = gs.getCursor();
    const line = tb.getLine(c.row);
    const before = line.slice(0, c.col);
    const after = line.slice(c.col);
    gs.updateContentLine(c.row, before);
    gs.insertContentLine(c.row + 1, after);
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

  // Arrow keys in INSERT mode
  if (key === "ArrowLeft") {
    const c = gs.getCursor();
    if (c.col > 0) {
      tb.moveCursorRelative(0, -1);
    } else if (c.row > 0) {
      tb.moveCursor(c.row - 1, tb.getLineLength(c.row - 1));
    }
    gs.clearCommandLog();
    return { handled: true };
  }
  if (key === "ArrowRight") {
    const c = gs.getCursor();
    if (c.col < tb.getLineLength(c.row)) {
      tb.moveCursorRelative(0, 1);
    } else if (c.row < tb.getLineCount() - 1) {
      tb.moveCursor(c.row + 1, 0);
    }
    gs.clearCommandLog();
    return { handled: true };
  }
  if (key === "ArrowUp") {
    const c = gs.getCursor();
    if (c.row > 0) {
      const targetCol = Math.min(c.col, tb.getLineLength(c.row - 1));
      tb.moveCursor(c.row - 1, targetCol);
    }
    gs.clearCommandLog();
    return { handled: true };
  }
  if (key === "ArrowDown") {
    const c = gs.getCursor();
    if (c.row < tb.getLineCount() - 1) {
      const targetCol = Math.min(c.col, tb.getLineLength(c.row + 1));
      tb.moveCursor(c.row + 1, targetCol);
    }
    gs.clearCommandLog();
    return { handled: true };
  }

  if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
    gs.pushUndo();
    const c = gs.getCursor();
    tb.insertText(c.row, c.col, key);
    tb.moveCursorRelative(0, 1);
    // Accumulate inserted text for dot repeat
    if (_lastChange && _lastChange.type === "change") {
      _pendingInsertedText += key;
    }
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
    const range = getWordRangeAt(c.row, c.col);
    if (range) {
      tb.moveCursor(c.row, range.end);
    } else {
      const next = tb.findWordForward(c.row, c.col);
      tb.moveCursor(next.row, next.col);
    }
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
  } else if (change.type === "change") {
    // Replay a change at the CURRENT cursor position.
    // For cw/dw-style changes, find the word at current position
    // and apply the same transformation.
    const c = gs.getCursor();
    const range = getWordRangeAt(c.row, c.col);
    let startCol = c.col;
    let endCol = c.col + 1; // fallback: single char
    if (range) {
      startCol = range.start;
      endCol = range.end;
    }

    gs.setSelectStart({ row: c.row, col: startCol });
    gs.setSelectEnd({ row: c.row, col: endCol });
    // Save inserted text before executeOperator overwrites _lastChange
    const savedInsertedText = change.insertedText;
    // Delete the selection (enters INSERT mode)
    executeOperator("c");
    // Insert the stored text
    if (savedInsertedText) {
      const ic = gs.getCursor();
      tb.insertText(ic.row, ic.col, savedInsertedText);
      // Move cursor forward by inserted text length, then back one
      // (simulating vim/helix Esc behavior after typing in INSERT mode)
      const afterInsert = gs.getCursor();
      for (let i = 0; i < savedInsertedText.length; i++) {
        tb.moveCursorRelative(0, 1);
      }
      const final = gs.getCursor();
      if (final.col > 0) tb.moveCursorRelative(0, -1);
    }
    // Restore _lastChange with insertedText for subsequent dot repeats
    _lastChange = { type: "change", range: { startRow: c.row, startCol, endRow: c.row, endCol }, insertedText: savedInsertedText };
    // Return to NORMAL mode
    gs.setMode("NORMAL");
  }
}
