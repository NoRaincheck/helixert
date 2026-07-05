class TextCommands {
    constructor() {
        this.mode = 'NORMAL';
        this.buffer = [];
        this.lastCommand = null;
        this.lastFindChar = null;
        this.lastFindDir = null;
        this.selectStart = null;
    }

    reset() {
        this.mode = 'NORMAL';
        this.buffer = [];
        this.lastCommand = null;
        this.lastFindChar = null;
        this.lastFindDir = null;
        this.selectStart = null;
    }

    getMode() {
        return this.mode;
    }

    getBufferDisplay() {
        if (this.buffer.length === 0) return '';
        const b = this.buffer.join('');
        if ((b === 'f' || b === 'F' || b === 't' || b === 'T') && this.buffer.length === 1) {
            return b + ' → ?';
        }
        if (b === 'g' && this.buffer.length === 1) {
            return 'g → ?';
        }
        return b;
    }

    isWaitingForInput() {
        return this.buffer.length > 0;
    }

    execute(key, textBuffer) {
        if (this.mode === 'SELECT') {
            return this.executeSelect(key, textBuffer);
        }

        if (this.buffer.length > 0) {
            return this.executeBuffered(key, textBuffer);
        }

        if (key >= '0' && key <= '9') {
            return this.handleCount(key, textBuffer);
        }

        return this.executeSingle(key, textBuffer);
    }

    handleCount(key, textBuffer) {
        const count = parseInt(key);
        if (this.buffer.length > 0 && !isNaN(parseInt(this.buffer[this.buffer.length - 1]))) {
            this.buffer[this.buffer.length - 1] = '' + (parseInt(this.buffer[this.buffer.length - 1]) * 10 + count);
        } else {
            this.buffer.push(key);
        }
        return { moved: false, count: 0 };
    }

    executeSingle(key, textBuffer) {
        const pos = textBuffer.getCursor();
        let moved = false;

        switch (key) {
            // Basic movement
            case 'h': textBuffer.moveCursorRelative(0, -1); moved = true; break;
            case 'j': textBuffer.moveCursorRelative(1, 0); moved = true; break;
            case 'k': textBuffer.moveCursorRelative(-1, 0); moved = true; break;
            case 'l': textBuffer.moveCursorRelative(0, 1); moved = true; break;

            // Word movements
            case 'w': {
                const newCol = textBuffer.findWordStart(pos.line, pos.col, true);
                if (newCol !== pos.col) {
                    textBuffer.moveCursor(pos.line, newCol);
                    moved = true;
                } else if (pos.line < textBuffer.getLineCount() - 1) {
                    textBuffer.moveCursor(pos.line + 1, 0);
                    moved = true;
                }
                break;
            }
            case 'b': {
                const newCol = textBuffer.findWordStart(pos.line, pos.col, false);
                if (newCol !== pos.col) {
                    textBuffer.moveCursor(pos.line, newCol);
                    moved = true;
                } else if (pos.line > 0) {
                    const prevLine = pos.line - 1;
                    textBuffer.moveCursor(prevLine, textBuffer.getLineLength(prevLine));
                    moved = true;
                }
                break;
            }
            case 'e': {
                const newCol = textBuffer.findWordEnd(pos.line, pos.col);
                if (newCol !== pos.col) {
                    textBuffer.moveCursor(pos.line, newCol);
                    moved = true;
                }
                break;
            }

            // Line position movements
            case '0': textBuffer.moveCursor(pos.line, 0); moved = true; break;
            case '$': textBuffer.moveCursor(pos.line, textBuffer.getLineLength(pos.line)); moved = true; break;
            case '^': {
                const line = textBuffer.getLine(pos.line);
                const firstNonSpace = line.search(/\S/);
                textBuffer.moveCursor(pos.line, firstNonSpace >= 0 ? firstNonSpace : 0);
                moved = true;
                break;
            }

            // Buffer commands
            case 'd': {
                // Delete character under cursor (Helix: d is a verb, single press deletes char)
                const line = textBuffer.getLine(pos.line);
                if (pos.col < line.length) {
                    textBuffer.deleteRange(pos.line, pos.col, pos.col + 1);
                    textBuffer.clampCursor();
                    this.lastCommand = { type: 'deleteChar' };
                    return { moved: false, action: 'deleteChar', linesChanged: false };
                }
                return { moved: false };
            }
            case 'y': this.buffer = ['y']; return { moved: false };
            case 'r': this.buffer = ['r']; return { moved: false };

            // Direct commands
            case 'x': {
                // Delete character under cursor
                const line = textBuffer.getLine(pos.line);
                if (pos.col < line.length) {
                    textBuffer.deleteRange(pos.line, pos.col, pos.col + 1);
                    textBuffer.clampCursor();
                    return { moved: false, action: 'delete', linesChanged: true };
                }
                return { moved: false };
            }
            case 'p': {
                if (textBuffer.yankBuffer !== null) {
                    textBuffer.pasteAfter(pos.line, pos.col);
                    return { moved: false, action: 'paste', linesChanged: textBuffer.yankIsLine };
                }
                return { moved: false };
            }
            case 'P': {
                if (textBuffer.yankBuffer !== null) {
                    textBuffer.pasteBefore(pos.line, pos.col);
                    return { moved: false, action: 'paste', linesChanged: textBuffer.yankIsLine };
                }
                return { moved: false };
            }
            case 'u': {
                if (textBuffer.undo()) {
                    return { moved: false, action: 'undo', linesChanged: true };
                }
                return { moved: false };
            }
            case 'U': {
                if (textBuffer.redo()) {
                    return { moved: false, action: 'redo', linesChanged: true };
                }
                return { moved: false };
            }
            case '.': return this.repeatLast(textBuffer);
            case '~': {
                // Swap case
                const char = textBuffer.getChar(pos.line, pos.col);
                if (char) {
                    const swapped = char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase();
                    textBuffer.replaceChar(pos.line, pos.col, swapped);
                    textBuffer.moveCursorRelative(0, 1);
                    return { moved: false, action: 'replace', linesChanged: false };
                }
                return { moved: false };
            }

            default: return { moved: false, unknown: key };
        }

        if (moved) {
            this.lastCommand = { type: 'move', key };
            return { moved: true };
        }

        return { moved: false };
    }

    executeBuffered(key, textBuffer) {
        const prefix = this.buffer.join('');
        const pos = textBuffer.getCursor();

        // Handle 'd' prefix commands
        if (prefix === 'd') {
            this.buffer = [];
            switch (key) {
                case '$': {
                    // Delete to end of line
                    const deleted = textBuffer.deleteToLineEnd(pos.line, pos.col);
                    if (deleted !== null) {
                        textBuffer.clampCursor();
                        this.lastCommand = { type: 'deleteToLineEnd' };
                        return { moved: false, action: 'deleteToLineEnd', linesChanged: false };
                    }
                    return { moved: false };
                }
                case 'w': {
                    // Delete word
                    const deleted = textBuffer.deleteWord(pos.line, pos.col);
                    if (deleted !== null) {
                        this.lastCommand = { type: 'deleteWord' };
                        return { moved: false, action: 'deleteWord', linesChanged: false };
                    }
                    return { moved: false };
                }
                case 'i': {
                    // di - delete inside (text object), buffer next key
                    this.buffer = ['d', 'i'];
                    return { moved: false };
                }
                case 'a': {
                    // da - delete around (text object), buffer next key
                    this.buffer = ['d', 'a'];
                    return { moved: false };
                }
                default: {
                    // No valid motion after 'd' — delete character at cursor (like 'x')
                    const line = textBuffer.getLine(pos.line);
                    if (pos.col < line.length) {
                        textBuffer.deleteRange(pos.line, pos.col, pos.col + 1);
                        textBuffer.clampCursor();
                        this.lastCommand = { type: 'deleteChar' };
                        return { moved: false, action: 'deleteChar', linesChanged: false };
                    }
                    return { moved: false };
                }
            }
        }

        // Handle 'di' prefix (delete inside word)
        if (prefix === 'di') {
            this.buffer = [];
            if (key === 'w') {
                // diw - delete inside word
                const line = textBuffer.getLine(pos.line);
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                const wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                if (wordStart < wordEnd) {
                    textBuffer.deleteRange(pos.line, wordStart, wordEnd + 1);
                    textBuffer.moveCursor(pos.line, wordStart);
                    this.lastCommand = { type: 'deleteInsideWord' };
                    return { moved: false, action: 'deleteInsideWord', linesChanged: false };
                }
                return { moved: false };
            }
            return { moved: false, unknown: key };
        }

        // Handle 'da' prefix (delete around word)
        if (prefix === 'da') {
            this.buffer = [];
            if (key === 'w') {
                // daw - delete around word (including trailing space)
                const line = textBuffer.getLine(pos.line);
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                let wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                // Include trailing space
                if (wordEnd + 1 < line.length && line[wordEnd + 1] === ' ') {
                    wordEnd++;
                }
                if (wordStart <= wordEnd) {
                    textBuffer.deleteRange(pos.line, wordStart, wordEnd + 1);
                    textBuffer.moveCursor(pos.line, wordStart);
                    this.lastCommand = { type: 'deleteAroundWord' };
                    return { moved: false, action: 'deleteAroundWord', linesChanged: false };
                }
                return { moved: false };
            }
            return { moved: false, unknown: key };
        }

        // Handle 'y' prefix commands
        if (prefix === 'y') {
            this.buffer = [];
            switch (key) {
                case 'y': {
                    // Yank entire line
                    textBuffer.yankLine(pos.line);
                    this.lastCommand = { type: 'yankLine' };
                    return { moved: false, action: 'yank' };
                }
                case '$': {
                    // Yank to end of line
                    textBuffer.yankRange(pos.line, pos.col, textBuffer.getLineLength(pos.line));
                    this.lastCommand = { type: 'yankToLineEnd' };
                    return { moved: false, action: 'yank' };
                }
                default:
                    return { moved: false, unknown: key };
            }
        }

        // Handle 'r' prefix (replace character)
        if (prefix === 'r') {
            this.buffer = [];
            if (key.length === 1) {
                textBuffer.replaceChar(pos.line, pos.col, key);
                textBuffer.moveCursorRelative(0, 1);
                this.lastCommand = { type: 'replace', char: key };
                return { moved: false, action: 'replace', linesChanged: false };
            }
            return { moved: false, unknown: key };
        }

        // Handle 'g' prefix
        if (prefix === 'g') {
            this.buffer = [];
            switch (key) {
                case 'g': {
                    // Go to start of file
                    textBuffer.moveCursor(0, 0);
                    this.lastCommand = { type: 'goto', target: 'start' };
                    return { moved: true };
                }
                case 'e': {
                    // Go to end of file
                    const lastLine = textBuffer.getLineCount() - 1;
                    textBuffer.moveCursor(lastLine, textBuffer.getLineLength(lastLine));
                    this.lastCommand = { type: 'goto', target: 'end' };
                    return { moved: true };
                }
                case 'h': {
                    // Go to start of line
                    textBuffer.moveCursor(pos.line, 0);
                    this.lastCommand = { type: 'goto', target: 'lineStart' };
                    return { moved: true };
                }
                case 'l': {
                    // Go to end of line
                    textBuffer.moveCursor(pos.line, textBuffer.getLineLength(pos.line));
                    this.lastCommand = { type: 'goto', target: 'lineEnd' };
                    return { moved: true };
                }
                default:
                    return { moved: false, unknown: key };
            }
        }

        return { moved: false, unknown: key };
    }

    executeSelect(key, textBuffer) {
        const pos = textBuffer.getCursor();

        switch (key) {
            case 'h': textBuffer.moveCursorRelative(0, -1); return { moved: true };
            case 'j': textBuffer.moveCursorRelative(1, 0); return { moved: true };
            case 'k': textBuffer.moveCursorRelative(-1, 0); return { moved: true };
            case 'l': textBuffer.moveCursorRelative(0, 1); return { moved: true };
            case 'd':
            case 'x': {
                // Delete selection
                if (this.selectStart) {
                    const start = this.selectStart;
                    const end = textBuffer.getCursor();
                    // Ensure start < end
                    let from, to;
                    if (start.line < end.line || (start.line === end.line && start.col <= end.col)) {
                        from = start;
                        to = end;
                    } else {
                        from = end;
                        to = start;
                    }

                    if (from.line === to.line) {
                        textBuffer.deleteRange(from.line, from.col, to.col + 1);
                    } else {
                        // Multi-line delete
                        for (let i = to.line; i >= from.line; i--) {
                            if (i === from.line) {
                                textBuffer.deleteToLineEnd(i, from.col);
                            } else if (i === to.line) {
                                textBuffer.deleteRange(i, 0, to.col + 1);
                            } else {
                                textBuffer.deleteLine(i);
                            }
                        }
                    }
                    textBuffer.moveCursor(from.line, from.col);
                    this.mode = 'NORMAL';
                    this.selectStart = null;
                    return { moved: false, action: 'deleteSelection', linesChanged: true };
                }
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false };
            }
            case 'y': {
                // Yank selection
                if (this.selectStart) {
                    const start = this.selectStart;
                    const end = textBuffer.getCursor();
                    let from, to;
                    if (start.line < end.line || (start.line === end.line && start.col <= end.col)) {
                        from = start;
                        to = end;
                    } else {
                        from = end;
                        to = start;
                    }

                    if (from.line === to.line) {
                        textBuffer.yankRange(from.line, from.col, to.col + 1);
                    } else {
                        // Multi-line yank
                        const lines = [];
                        lines.push(textBuffer.getLine(from.line).substring(from.col));
                        for (let i = from.line + 1; i < to.line; i++) {
                            lines.push(textBuffer.getLine(i));
                        }
                        lines.push(textBuffer.getLine(to.line).substring(0, to.col + 1));
                        textBuffer.yankBuffer = lines.join('\n');
                        textBuffer.yankIsLine = false;
                    }
                    this.mode = 'NORMAL';
                    this.selectStart = null;
                    return { moved: false, action: 'yank' };
                }
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false };
            }
            case ';': {
                // Collapse selection
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false };
            }
            case 'Escape': {
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false };
            }
            default: return { moved: false, unknown: key };
        }
    }

    repeatLast(textBuffer) {
        if (!this.lastCommand) return { moved: false };

        const pos = textBuffer.getCursor();
        const cmd = this.lastCommand;

        switch (cmd.type) {
            case 'move':
                return this.executeSingle(cmd.key, textBuffer);
            case 'deleteChar': {
                const line = textBuffer.getLine(pos.line);
                if (pos.col < line.length) {
                    textBuffer.deleteRange(pos.line, pos.col, pos.col + 1);
                    textBuffer.clampCursor();
                    return { moved: false, action: 'deleteChar', linesChanged: false };
                }
                return { moved: false };
            }
            case 'deleteToLineEnd':
                textBuffer.deleteToLineEnd(pos.line, pos.col);
                textBuffer.clampCursor();
                return { moved: false, action: 'deleteToLineEnd', linesChanged: false };
            case 'deleteWord':
                textBuffer.deleteWord(pos.line, pos.col);
                return { moved: false, action: 'deleteWord', linesChanged: false };
            case 'replace':
                textBuffer.replaceChar(pos.line, pos.col, cmd.char);
                textBuffer.moveCursorRelative(0, 1);
                return { moved: false, action: 'replace', linesChanged: false };
            case 'deleteInsideWord': {
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                const wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                if (wordStart < wordEnd) {
                    textBuffer.deleteRange(pos.line, wordStart, wordEnd + 1);
                    textBuffer.moveCursor(pos.line, wordStart);
                    return { moved: false, action: 'deleteInsideWord', linesChanged: false };
                }
                return { moved: false };
            }
            case 'deleteAroundWord': {
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                let wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                const line = textBuffer.getLine(pos.line);
                if (wordEnd + 1 < line.length && line[wordEnd + 1] === ' ') {
                    wordEnd++;
                }
                if (wordStart <= wordEnd) {
                    textBuffer.deleteRange(pos.line, wordStart, wordEnd + 1);
                    textBuffer.moveCursor(pos.line, wordStart);
                    return { moved: false, action: 'deleteAroundWord', linesChanged: false };
                }
                return { moved: false };
            }
            default:
                return { moved: false };
        }
    }
}
