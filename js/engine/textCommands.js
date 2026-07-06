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
        if (b === 'm' && this.buffer.length === 1) {
            return 'm → ?';
        }
        if (b === 'ms' || b === 'md' || b === 'mi' || b === 'ma') {
            return b + ' → ?';
        }
        return b;
    }

    isWaitingForInput() {
        return this.buffer.length > 0;
    }

    execute(key, textBuffer) {
        if (this.mode === 'INSERT') {
            return this.executeInsert(key, textBuffer);
        }

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
                if (line.length === 0) {
                    textBuffer.deleteLine(pos.line);
                    textBuffer.clampCursor();
                    this.lastCommand = { type: 'deleteLine' };
                    return { moved: false, action: 'deleteLine', linesChanged: true };
                }
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
            case 'm': this.buffer = ['m']; return { moved: false };

            // Insert mode entry
            case 'i': {
                this.mode = 'INSERT';
                return { moved: false, action: 'insertMode' };
            }
            case 'a': {
                this.mode = 'INSERT';
                textBuffer.moveCursorRelative(0, 1);
                return { moved: false, action: 'insertMode' };
            }
            case 'o': {
                // Open new line below
                textBuffer.insertLine(pos.line, '', true);
                this.mode = 'INSERT';
                return { moved: false, action: 'insertMode', linesChanged: true };
            }
            case 'O': {
                // Open new line above
                textBuffer.insertLine(pos.line, '', false);
                this.mode = 'INSERT';
                return { moved: false, action: 'insertMode', linesChanged: true };
            }

            // Direct commands
            case 'x': {
                // Select entire line (Helix noun-verb: x selects, then d deletes)
                this.mode = 'SELECT';
                this.selectStart = { line: pos.line, col: 0 };
                textBuffer.moveCursor(pos.line, textBuffer.getLineLength(pos.line));
                return { moved: false, action: 'selectLine', linesChanged: false };
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

        // Handle 'm' prefix commands
        if (prefix === 'm') {
            if (key === 's' || key === 'd' || key === 'i' || key === 'a') {
                this.buffer = ['m', key];
                return { moved: false };
            }
            if (key === 'm') {
                this.buffer = [];
                return { moved: false, action: 'matchBracket' };
            }
            this.buffer = [];
            return { moved: false, unknown: key };
        }

        // Handle 'mi' prefix (select inside text object)
        if (prefix === 'mi') {
            this.buffer = [];
            if (key === 'w') {
                // miw - select inside word
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                const wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                if (wordStart < wordEnd) {
                    this.mode = 'SELECT';
                    this.selectStart = { line: pos.line, col: wordStart };
                    textBuffer.moveCursor(pos.line, wordEnd);
                    return { moved: false, action: 'selectInside', linesChanged: false };
                }
                return { moved: false };
            }
            return { moved: false, unknown: key };
        }

        // Handle 'ma' prefix (select around text object)
        if (prefix === 'ma') {
            this.buffer = [];
            if (key === 'w') {
                // maw - select around word (including trailing space)
                const wordStart = textBuffer.findWordStart(pos.line, pos.col, false);
                let wordEnd = textBuffer.findWordEnd(pos.line, pos.col);
                const line = textBuffer.getLine(pos.line);
                if (wordEnd + 1 < line.length && line[wordEnd + 1] === ' ') {
                    wordEnd++;
                }
                if (wordStart <= wordEnd) {
                    this.mode = 'SELECT';
                    this.selectStart = { line: pos.line, col: wordStart };
                    textBuffer.moveCursor(pos.line, wordEnd);
                    return { moved: false, action: 'selectAround', linesChanged: false };
                }
                return { moved: false };
            }
            return { moved: false, unknown: key };
        }

        // Handle 'ms' prefix (surround add)
        if (prefix === 'ms') {
            this.buffer = [];
            return { moved: false, action: 'surroundAdd', char: key };
        }

        // Handle 'md' prefix (surround delete)
        if (prefix === 'md') {
            this.buffer = [];
            return { moved: false, action: 'surroundDelete', char: key };
        }

        return { moved: false, unknown: key };
    }

    executeSelect(key, textBuffer) {
        const pos = textBuffer.getCursor();

        // Handle buffered 'g' prefix
        if (this.buffer.length === 1 && this.buffer[0] === 'g') {
            this.buffer = [];
            switch (key) {
                case 'g': textBuffer.moveCursor(0, 0); return { moved: true };
                case 'e': {
                    const lastLine = textBuffer.getLineCount() - 1;
                    textBuffer.moveCursor(lastLine, textBuffer.getLineLength(lastLine));
                    return { moved: true };
                }
                case 'h': textBuffer.moveCursor(pos.line, 0); return { moved: true };
                case 'l': textBuffer.moveCursor(pos.line, textBuffer.getLineLength(pos.line)); return { moved: true };
                default: return { moved: false, unknown: key };
            }
        }

        switch (key) {
            case 'h': textBuffer.moveCursorRelative(0, -1); return { moved: true };
            case 'j': textBuffer.moveCursorRelative(1, 0); return { moved: true };
            case 'k': textBuffer.moveCursorRelative(-1, 0); return { moved: true };
            case 'l': textBuffer.moveCursorRelative(0, 1); return { moved: true };
            case 'g': this.buffer = ['g']; return { moved: false };
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

                    // Yank before deleting
                    if (from.line === to.line) {
                        const selLine = textBuffer.getLine(from.line);
                        const isWholeLine = from.col === 0 && to.col >= selLine.length - 1;
                        if (isWholeLine) {
                            textBuffer.yankLine(from.line);
                            textBuffer.deleteLine(from.line);
                        } else if (selLine.length === 0) {
                            textBuffer.deleteLine(from.line);
                        } else {
                            textBuffer.yankRange(from.line, from.col, to.col + 1);
                            textBuffer.deleteRange(from.line, from.col, to.col + 1);
                        }
                    } else {
                        // Multi-line yank
                        const lines = [];
                        for (let i = from.line; i <= to.line; i++) {
                            lines.push(textBuffer.getLine(i));
                        }
                        textBuffer.yankBuffer = lines.join('\n');
                        textBuffer.yankIsLine = false;

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

    executeInsert(key, textBuffer) {
        const pos = textBuffer.getCursor();

        switch (key) {
            case 'Escape': {
                this.mode = 'NORMAL';
                return { moved: false, action: 'normalMode' };
            }
            case 'Enter':
            case 13: {
                // Split current line at cursor
                const line = textBuffer.getLine(pos.line);
                const before = line.substring(0, pos.col);
                const after = line.substring(pos.col);
                textBuffer.lines[pos.line] = before;
                textBuffer.insertLine(pos.line, after, true);
                return { moved: false, action: 'insertNewline', linesChanged: true };
            }
            case 'Backspace': {
                if (pos.col > 0) {
                    textBuffer.deleteRange(pos.line, pos.col - 1, pos.col);
                    textBuffer.moveCursorRelative(0, -1);
                } else if (pos.line > 0) {
                    const prevLineLen = textBuffer.getLineLength(pos.line - 1);
                    const currentLine = textBuffer.getLine(pos.line);
                    textBuffer.lines[pos.line - 1] += currentLine;
                    textBuffer.deleteLine(pos.line);
                    textBuffer.moveCursor(pos.line - 1, prevLineLen);
                }
                return { moved: false, action: 'backspace', linesChanged: true };
            }
            case 'Delete': {
                if (pos.col < textBuffer.getLineLength(pos.line)) {
                    textBuffer.deleteRange(pos.line, pos.col, pos.col + 1);
                } else if (pos.line < textBuffer.getLineCount() - 1) {
                    const currentLine = textBuffer.getLine(pos.line);
                    const nextLine = textBuffer.getLine(pos.line + 1);
                    textBuffer.lines[pos.line] = currentLine + nextLine;
                    textBuffer.deleteLine(pos.line + 1);
                }
                return { moved: false, action: 'delete', linesChanged: true };
            }
            case 'Tab': {
                textBuffer.insertText(pos.line, pos.col, '    ');
                return { moved: false, action: 'insertText', linesChanged: false };
            }
            default: {
                // Insert printable character
                if (key.length === 1 && key >= ' ') {
                    textBuffer.insertText(pos.line, pos.col, key);
                    return { moved: false, action: 'insertChar', linesChanged: false };
                }
                return { moved: false, unknown: key };
            }
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
