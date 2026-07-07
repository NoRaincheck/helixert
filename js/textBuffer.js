// Helixert — Text Buffer Model

import { getContent, getCursor, setCursor, setCursorRow, setCursorCol, setContent } from './gameState.js';

/**
 * Text buffer operations. All functions read/write through gameState.
 */

export function getLineCount() {
    return getContent().length;
}

export function getLine(row) {
    const content = getContent();
    if (row < 0 || row >= content.length) return '';
    return content[row];
}

export function getLineLength(row) {
    return getLine(row).length;
}

export function getChar(row, col) {
    const line = getLine(row);
    if (col < 0 || col >= line.length) return '';
    return line[col];
}

export function moveCursor(row, col) {
    const content = getContent();
    const clampedRow = Math.max(0, Math.min(row, content.length - 1));
    const clampedCol = Math.max(0, Math.min(col, getLine(clampedRow).length));
    setCursor({ row: clampedRow, col: clampedCol });
}

export function moveCursorRelative(dRow, dCol) {
    const cursor = getCursor();
    moveCursor(cursor.row + dRow, cursor.col + dCol);
}

// Clamp cursor to valid bounds
export function clampCursor() {
    const cursor = getCursor();
    const content = getContent();
    let { row, col } = cursor;
    if (row >= content.length) row = content.length - 1;
    if (row < 0) row = 0;
    const lineLen = getLine(row).length;
    if (col > lineLen) col = lineLen;
    if (col < 0) col = 0;
    setCursor({ row, col });
}

// --- Word boundary detection (Helix same-type-run model) ---

function isWordChar(ch) {
    return /\w/.test(ch);
}

function isPunctChar(ch) {
    return /[^\w\s]/.test(ch);
}

function charType(ch) {
    if (/\s/.test(ch)) return 0;
    if (isWordChar(ch)) return 1;
    if (isPunctChar(ch)) return 2;
    return 0;
}

/**
 * Find the start of the next word from position.
 * Helix word motion: skip current run of same-type chars, then skip whitespace.
 */
export function findWordForward(row, col) {
    const content = getContent();
    if (row >= content.length) return { row, col };

    let r = row;
    let c = col;
    const line = content[r];

    // If at end of line, go to next line
    if (c >= line.length) {
        if (r < content.length - 1) {
            return { row: r + 1, col: 0 };
        }
        return { row: r, col: c };
    }

    const type = charType(line[c]);

    // Skip current run of same-type non-space chars
    if (type !== 0) {
        while (c < line.length && charType(line[c]) === type) c++;
    }

    // Skip whitespace
    while (c < line.length && /\s/.test(line[c])) c++;

    // If we went past the end of line, go to next line
    if (c >= line.length && r < content.length - 1) {
        return { row: r + 1, col: 0 };
    }

    return { row: r, col: Math.min(c, line.length) };
}

/**
 * Find the start of the previous word.
 */
export function findWordBackward(row, col) {
    const content = getContent();
    let r = row;
    let c = col;

    if (c > 0) {
        c--;
        // Skip whitespace backward
        while (c > 0 && /\s/.test(content[r][c])) c--;
        // Skip current run of same-type chars
        const type = charType(content[r][c]);
        if (type !== 0) {
            while (c > 0 && charType(content[r][c - 1]) === type) c--;
        }
    } else if (r > 0) {
        r--;
        c = content[r].length;
        if (c > 0) {
            c--;
            while (c > 0 && /\s/.test(content[r][c])) c--;
            const type = charType(content[r][c]);
            if (type !== 0) {
                while (c > 0 && charType(content[r][c - 1]) === type) c--;
            }
        }
    }

    return { row: r, col: c };
}

/**
 * Find end of current word (last char of current run).
 */
export function findWordEnd(row, col) {
    const content = getContent();
    if (row >= content.length) return { row, col };

    let r = row;
    let c = col;
    const line = content[r];

    if (c >= line.length) {
        if (r < content.length - 1) {
            r++;
            c = 0;
        } else {
            return { row: r, col: c };
        }
    }

    const newLine = content[r];

    // Advance past current position to avoid finding same word
    c++;

    // If past end of line, advance to next line
    if (c >= newLine.length) {
        if (r < content.length - 1) {
            r++;
            c = 0;
            const nextLine = content[r];
            // Skip whitespace on new line
            while (c < nextLine.length && /\s/.test(nextLine[c])) c++;
            return { row: r, col: Math.min(c, nextLine.length > 0 ? nextLine.length - 1 : 0) };
        }
        return { row: r, col: newLine.length > 0 ? newLine.length - 1 : 0 };
    }

    // Skip whitespace forward
    while (c < newLine.length && /\s/.test(newLine[c])) c++;

    // Skip current run of same-type chars (stop at last char of run)
    if (c < newLine.length) {
        const type = charType(newLine[c]);
        while (c < newLine.length - 1 && charType(newLine[c + 1]) === type) c++;
    }

    return { row: r, col: Math.min(c, newLine.length > 0 ? newLine.length - 1 : 0) };
}

// --- Line operations ---

export function deleteLine(row) {
    const content = getContent();
    if (row < 0 || row >= content.length) return '';
    if (content.length <= 1) {
        const line = content[0];
        content[0] = '';
        setContent(content);
        return line;
    }
    const deleted = content.splice(row, 1)[0];
    setContent(content);
    return deleted;
}

export function deleteToLineEnd(row, col) {
    const content = getContent();
    if (row < 0 || row >= content.length) return '';
    const line = content[row];
    const deleted = line.slice(col);
    content[row] = line.slice(0, col);
    setContent(content);
    return deleted;
}

export function deleteRange(startRow, startCol, endRow, endCol) {
    const content = getContent();
    if (startRow === endRow) {
        const line = content[startRow];
        // Full line selected — remove it entirely (keep at least one line)
        if (startCol === 0 && endCol >= line.length && content.length > 1) {
            const deleted = content.splice(startRow, 1)[0];
            setContent(content);
            return deleted;
        }
        const deleted = line.slice(startCol, endCol);
        content[startRow] = line.slice(0, startCol) + line.slice(endCol);
        setContent(content);
        return deleted;
    }

    // Multi-line delete
    const firstLine = content[startRow];
    const lastLine = content[endRow];
    const deleted = firstLine.slice(startCol) + '\n' +
        content.slice(startRow + 1, endRow).join('\n') + '\n' +
        lastLine.slice(0, endCol);

    const newLine = firstLine.slice(0, startCol) + lastLine.slice(endCol);
    // Remove lines from end to start
    for (let i = endRow; i > startRow; i--) content.splice(i, 1);
    content[startRow] = newLine;
    setContent(content);

    return deleted;
}

export function yankRange(startRow, startCol, endRow, endCol) {
    const content = getContent();
    if (startRow === endRow) {
        return content[startRow].slice(startCol, endCol);
    }
    let text = content[startRow].slice(startCol) + '\n';
    for (let i = startRow + 1; i < endRow; i++) {
        text += content[i] + '\n';
    }
    text += content[endRow].slice(0, endCol);
    return text;
}

export function insertText(row, col, text) {
    const content = getContent();
    const line = content[row];
    content[row] = line.slice(0, col) + text + line.slice(col);
    setContent(content);
}

export function pasteAfter(text) {
    const cursor = getCursor();
    const lines = text.split('\n');
    const content = getContent();

    if (lines.length === 1) {
        // Single line paste: insert after cursor on same line
        const line = content[cursor.row];
        const insertCol = Math.min(cursor.col + 1, line.length);
        content[cursor.row] = line.slice(0, insertCol) + text + line.slice(insertCol);
        setContent(content);
        setCursorCol(insertCol + text.length - 1);
    } else {
        // Multi-line paste: insert lines after current line
        const beforeCursor = content[cursor.row].slice(0, cursor.col + 1);
        const afterCursor = content[cursor.row].slice(cursor.col + 1);

        content[cursor.row] = beforeCursor;
        for (let i = 0; i < lines.length; i++) {
            content.splice(cursor.row + 1 + i, 0, lines[i]);
        }
        content[cursor.row + lines.length] += afterCursor;
        setContent(content);

        setCursorRow(cursor.row + lines.length);
        setCursorCol(lines[lines.length - 1].length > 0 ? lines[lines.length - 1].length - 1 : 0);
    }
}

export function pasteBefore(text) {
    const cursor = getCursor();
    const lines = text.split('\n');
    const content = getContent();

    if (lines.length === 1) {
        const line = content[cursor.row];
        content[cursor.row] = line.slice(0, cursor.col) + text + line.slice(cursor.col);
        setCursorCol(cursor.col + text.length - 1);
    } else {
        const beforeCursor = content[cursor.row].slice(0, cursor.col);
        const afterCursor = content[cursor.row].slice(cursor.col);

        content[cursor.row] = beforeCursor;
        for (let i = 0; i < lines.length; i++) {
            content.splice(cursor.row + 1 + i, 0, lines[i]);
        }
        content[cursor.row + lines.length] += afterCursor;

        setCursorRow(cursor.row);
        setCursorCol(0);
    }
}

/**
 * Check if current content matches target.
 * Normalizes whitespace and trailing blank lines.
 */
export function isComplete(targetLines) {
    const content = getContent();
    const trimEnd = (l) => l.replace(/\s+$/, '');
    const stripTrailing = (arr) => {
        const result = [...arr];
        while (result.length > 0 && trimEnd(result[result.length - 1]) === '') result.pop();
        return result;
    };
    const current = stripTrailing(content.map(trimEnd));
    const target = stripTrailing(targetLines.map(trimEnd));
    return current.length === target.length && current.every((l, i) => l === target[i]);
}

/**
 * Find char forward on same line (for f/F/t/T).
 */
export function findCharForward(row, col, ch, inclusive = true) {
    const line = getLine(row);
    const start = inclusive ? col + 1 : col;
    for (let i = start; i < line.length; i++) {
        if (line[i] === ch) return { row, col: i };
    }
    return null;
}

/**
 * Find char backward on same line.
 */
export function findCharBackward(row, col, ch, inclusive = true) {
    const line = getLine(row);
    const start = inclusive ? col - 1 : col;
    for (let i = start; i >= 0; i--) {
        if (line[i] === ch) return { row, col: i };
    }
    return null;
}

/**
 * Find matching bracket.
 */
export function findMatchBracket(row, col) {
    const content = getContent();
    const line = content[row];
    const ch = line[col];
    const pairs = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{' };
    if (!pairs[ch]) return null;

    const open = '([{'.includes(ch);
    const search = open ? pairs[ch] : ch;
    const matchCh = pairs[ch];
    let depth = 0;

    if (open) {
        for (let c = col; c < line.length; c++) {
            if (line[c] === ch) depth++;
            if (line[c] === matchCh) depth--;
            if (depth === 0) return { row, col: c };
        }
    } else {
        for (let c = col; c >= 0; c--) {
            if (line[c] === ch) depth++;
            if (line[c] === matchCh) depth--;
            if (depth === 0) return { row, col: c };
        }
    }
    return null;
}

// Search
export function computeSearchMatches(query) {
    const content = getContent();
    if (!query || query.length === 0) return [];
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
