// Helixert — Centralized Game State

// --- Private state ---
let _content = [];
let _cursor = { row: 0, col: 0 };
let _mode = "NORMAL"; // NORMAL | SELECT | INSERT
let _currentLevel = 0;
let _commandLog = [];
let _yankedText = null;
let _replacePending = false;
let _countBuffer = "";
let _undoStack = [];
let _redoStack = [];
let _searchMode = false;
let _searchSelectMode = false;
let _searchQuery = "";
let _lastSearchQuery = null;
let _lastSearchDirection = "forward";
let _searchMatches = [];
let _currentMatchIndex = -1;
let _usedSearchInLevel = false;
let _navCountSinceSearch = 0;
let _desiredCol = 0; // Vim-style curswant: column for vertical movement

// Selection state (Helix noun-verb: selection is the "noun")
let _selectStart = null; // { row, col } — where selection began
let _selectEnd = null; // { row, col } — current selection end

// Level validation tracking
let _usedSelectLine = false; // used `x` to select a line
let _usedSelectMode = false; // used `v` to enter SELECT mode
let _usedInsertMode = false; // entered INSERT mode
let _usedSearch = false; // used / or ?
let _usedFindChar = false; // used f/F/t/T

// --- Getters ---
export const getContent = () => [..._content];
export const getCursor = () => ({ ..._cursor });
export const getMode = () => _mode;
export const getCurrentLevel = () => _currentLevel;
export const getCommandLog = () => [..._commandLog];
export const getYankedText = () => _yankedText;
export const getReplacePending = () => _replacePending;
export const getCountBuffer = () => _countBuffer;
export const getUndoStack = () => [..._undoStack];
export const getRedoStack = () => [..._redoStack];
export const getSearchMode = () => _searchMode;
export const getSearchSelectMode = () => _searchSelectMode;
export const getSearchQuery = () => _searchQuery;
export const getLastSearchQuery = () => _lastSearchQuery;
export const getLastSearchDirection = () => _lastSearchDirection;
export const getSearchMatches = () => [..._searchMatches];
export const getCurrentMatchIndex = () => _currentMatchIndex;
export const getUsedSearchInLevel = () => _usedSearchInLevel;
export const getNavCountSinceSearch = () => _navCountSinceSearch;
export const getSelectStart = () => _selectStart ? { ..._selectStart } : null;
export const getSelectEnd = () => _selectEnd ? { ..._selectEnd } : null;
export const getUsedSelectLine = () => _usedSelectLine;
export const getUsedSelectMode = () => _usedSelectMode;
export const getUsedInsertMode = () => _usedInsertMode;
export const getUsedSearch = () => _usedSearch;
export const getUsedFindChar = () => _usedFindChar;
export const getDesiredCol = () => _desiredCol;

// --- Setters ---
export const setContent = (c) => {
  _content = [...c];
};
export const setCursor = (pos) => {
  _cursor = { ...pos };
};
export const setCursorRow = (r) => {
  _cursor.row = r;
};
export const setCursorCol = (c) => {
  _cursor.col = c;
};
export const setMode = (m) => {
  _mode = m;
};
export const setCurrentLevel = (l) => {
  _currentLevel = l;
};
export const setCommandLog = (log) => {
  _commandLog = [...log];
};
export const setYankedText = (t) => {
  _yankedText = t;
};
export const setReplacePending = (p) => {
  _replacePending = p;
};
export const setCountBuffer = (b) => {
  _countBuffer = b;
};
export const setCountBufferAppend = (k) => {
  _countBuffer += k;
};
export const setSearchMode = (m) => {
  _searchMode = m;
};
export const setSearchSelectMode = (m) => {
  _searchSelectMode = m;
};
export const setSearchQuery = (q) => {
  _searchQuery = q;
};
export const setLastSearchQuery = (q) => {
  _lastSearchQuery = q;
};
export const setLastSearchDirection = (d) => {
  _lastSearchDirection = d;
};
export const setSearchMatches = (m) => {
  _searchMatches = [...m];
};
export const setCurrentMatchIndex = (i) => {
  _currentMatchIndex = i;
};
export const setUsedSearchInLevel = (v) => {
  _usedSearchInLevel = v;
};
export const setNavCountSinceSearch = (n) => {
  _navCountSinceSearch = n;
};
export const setSelectStart = (s) => {
  _selectStart = s ? { ...s } : null;
};
export const setSelectEnd = (e) => {
  _selectEnd = e ? { ...e } : null;
};
export const setUsedSelectLine = (v) => {
  _usedSelectLine = v;
};
export const setUsedSelectMode = (v) => {
  _usedSelectMode = v;
};
export const setUsedInsertMode = (v) => {
  _usedInsertMode = v;
};
export const setUsedSearch = (v) => {
  _usedSearch = v;
};
export const setUsedFindChar = (v) => {
  _usedFindChar = v;
};
export const setDesiredCol = (v) => {
  _desiredCol = v;
};

// --- Content manipulation ---
export const updateContentLine = (row, newLine) => {
  if (row >= 0 && row < _content.length) _content[row] = newLine;
};
export const insertContentLine = (row, newLine) => {
  _content.splice(row, 0, newLine);
};
export const removeContentLine = (row) => {
  if (row >= 0 && row < _content.length) return _content.splice(row, 1)[0];
  return null;
};
export const addContentLine = (line) => {
  _content.push(line);
};

// --- Command log ---
export const appendCommandLog = (key) => {
  _commandLog.push(key);
};
export const clearCommandLog = () => {
  _commandLog = [];
};

// --- Undo / Redo ---
export const cloneState = () => ({
  content: [..._content],
  cursor: { ..._cursor },
  mode: _mode,
  yankedText: _yankedText,
});

export const pushUndo = () => {
  _undoStack.push(cloneState());
  if (_undoStack.length > 200) _undoStack.shift();
  _redoStack = [];
};

export const popUndo = () => _undoStack.pop();
export const pushRedo = (s) => {
  _redoStack.push(s);
};
export const popRedo = () => _redoStack.pop();
export const pushUndoNoClear = (s) => {
  // Push to undo without clearing redo (used during redo)
  _undoStack.push(s);
  if (_undoStack.length > 200) _undoStack.shift();
};
export const getRedoStackLength = () => _redoStack.length;

// --- Selection helpers ---
export const hasSelection = () => _selectStart !== null && _selectEnd !== null;

export const getSelectionRange = () => {
  if (!_selectStart || !_selectEnd) return null;
  const startRow = Math.min(_selectStart.row, _selectEnd.row);
  const endRow = Math.max(_selectStart.row, _selectEnd.row);
  const startCol = _selectStart.row <= _selectEnd.row
    ? _selectStart.col
    : _selectEnd.col;
  const endCol = _selectStart.row <= _selectEnd.row
    ? _selectEnd.col
    : _selectStart.col;
  return { startRow, endRow, startCol, endCol };
};

export const clearSelection = () => {
  _selectStart = null;
  _selectEnd = null;
};

// --- State reset ---
export const resetLevelState = () => {
  _commandLog = [];
  _yankedText = null;
  _replacePending = false;
  _countBuffer = "";
  _undoStack = [];
  _redoStack = [];
  _searchMode = false;
  _searchSelectMode = false;
  _searchQuery = "";
  _lastSearchQuery = null;
  _lastSearchDirection = "forward";
  _searchMatches = [];
  _currentMatchIndex = -1;
  _usedSearchInLevel = false;
  _usedSearch = false;
  _navCountSinceSearch = 0;
  _selectStart = null;
  _selectEnd = null;
  _usedSelectLine = false;
  _usedSelectMode = false;
  _usedInsertMode = false;
  _usedFindChar = false;
};

// --- Utility ---
export const escapeHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const isEscapeKey = (e) =>
  e.key === "Escape" ||
  (e.key === "[" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey);
