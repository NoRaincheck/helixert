class TextBuffer {
    constructor(initialText) {
        this.lines = initialText.split('\n');
        this.cursor = { line: 0, col: 0 };
        this.yankBuffer = null;
        this.yankIsLine = false;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSize = 50;
    }

    // Core getters
    getCurrentText() {
        return this.lines.join('\n');
    }

    getLine(lineNum) {
        if (lineNum < 0 || lineNum >= this.lines.length) return '';
        return this.lines[lineNum];
    }

    getLineCount() {
        return this.lines.length;
    }

    getLineLength(lineNum) {
        if (lineNum < 0 || lineNum >= this.lines.length) return 0;
        return this.lines[lineNum].length;
    }

    getCursor() {
        return { line: this.cursor.line, col: this.cursor.col };
    }

    // Cursor movement with clamping
    moveCursor(line, col) {
        this.cursor.line = Math.max(0, Math.min(line, this.lines.length - 1));
        const lineLen = this.getLineLength(this.cursor.line);
        this.cursor.col = Math.max(0, Math.min(col, lineLen));
    }

    moveCursorRelative(dLine, dCol) {
        this.moveCursor(this.cursor.line + dLine, this.cursor.col + dCol);
    }

    // Clamp cursor to valid position (call after text modifications)
    clampCursor() {
        this.cursor.line = Math.max(0, Math.min(this.cursor.line, this.lines.length - 1));
        const lineLen = this.getLineLength(this.cursor.line);
        this.cursor.col = Math.max(0, Math.min(this.cursor.col, lineLen));
    }

    // Save state for undo
    saveState() {
        this.undoStack.push({
            lines: this.lines.map(l => l),
            cursor: { ...this.cursor }
        });
        if (this.undoStack.length > this.maxUndoSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    // Undo
    undo() {
        if (this.undoStack.length === 0) return false;
        this.redoStack.push({
            lines: this.lines.map(l => l),
            cursor: { ...this.cursor }
        });
        const state = this.undoStack.pop();
        this.lines = state.lines;
        this.cursor = state.cursor;
        return true;
    }

    // Redo
    redo() {
        if (this.redoStack.length === 0) return false;
        this.undoStack.push({
            lines: this.lines.map(l => l),
            cursor: { ...this.cursor }
        });
        const state = this.redoStack.pop();
        this.lines = state.lines;
        this.cursor = state.cursor;
        return true;
    }

    // Delete operations
    deleteLine(lineNum) {
        if (lineNum < 0 || lineNum >= this.lines.length) return null;
        this.saveState();
        const deleted = this.lines.splice(lineNum, 1)[0];
        if (this.lines.length === 0) {
            this.lines.push('');
        }
        this.clampCursor();
        return deleted;
    }

    deleteToLineEnd(lineNum, col) {
        if (lineNum < 0 || lineNum >= this.lines.length) return null;
        const line = this.lines[lineNum];
        if (col >= line.length) return null;
        this.saveState();
        const deleted = line.substring(col);
        this.lines[lineNum] = line.substring(0, col);
        return deleted;
    }

    deleteWord(lineNum, col) {
        if (lineNum < 0 || lineNum >= this.lines.length) return null;
        const line = this.lines[lineNum];
        if (col >= line.length) return null;
        this.saveState();

        // Find end of current word
        let endCol = col;
        if (line[endCol] === ' ') {
            // Skip spaces
            while (endCol < line.length && line[endCol] === ' ') endCol++;
        } else {
            // Skip non-space characters
            while (endCol < line.length && line[endCol] !== ' ') endCol++;
        }

        const deleted = line.substring(col, endCol);
        this.lines[lineNum] = line.substring(0, col) + line.substring(endCol);
        this.clampCursor();
        return deleted;
    }

    deleteRange(lineNum, startCol, endCol) {
        if (lineNum < 0 || lineNum >= this.lines.length) return null;
        const line = this.lines[lineNum];
        if (startCol >= line.length) return null;
        this.saveState();
        const actualEnd = Math.min(endCol, line.length);
        const deleted = line.substring(startCol, actualEnd);
        this.lines[lineNum] = line.substring(0, startCol) + line.substring(actualEnd);
        this.clampCursor();
        return deleted;
    }

    // Insert operations
    insertText(lineNum, col, text) {
        if (lineNum < 0 || lineNum >= this.lines.length) return false;
        this.saveState();
        const line = this.lines[lineNum];
        const insertCol = Math.max(0, Math.min(col, line.length));
        this.lines[lineNum] = line.substring(0, insertCol) + text + line.substring(insertCol);
        this.moveCursor(lineNum, insertCol + text.length);
        return true;
    }

    insertLine(lineNum, text, after) {
        this.saveState();
        const insertAt = after ? lineNum + 1 : lineNum;
        this.lines.splice(insertAt, 0, text);
        this.moveCursor(insertAt, 0);
        return true;
    }

    // Replace operations
    replaceChar(lineNum, col, char) {
        if (lineNum < 0 || lineNum >= this.lines.length) return false;
        const line = this.lines[lineNum];
        if (col >= line.length) return false;
        this.saveState();
        this.lines[lineNum] = line.substring(0, col) + char + line.substring(col + 1);
        return true;
    }

    // Yank operations
    yankLine(lineNum) {
        if (lineNum < 0 || lineNum >= this.lines.length) return false;
        this.yankBuffer = this.lines[lineNum];
        this.yankIsLine = true;
        return true;
    }

    yankRange(lineNum, startCol, endCol) {
        if (lineNum < 0 || lineNum >= this.lines.length) return false;
        const line = this.lines[lineNum];
        const actualEnd = Math.min(endCol, line.length);
        this.yankBuffer = line.substring(startCol, actualEnd);
        this.yankIsLine = false;
        return true;
    }

    // Paste operations
    pasteAfter(lineNum, col) {
        if (this.yankBuffer === null) return false;
        this.saveState();

        if (this.yankIsLine) {
            this.lines.splice(lineNum + 1, 0, this.yankBuffer);
            this.moveCursor(lineNum + 1, 0);
        } else {
            const line = this.lines[lineNum];
            const insertCol = Math.min(col + 1, line.length);
            this.lines[lineNum] = line.substring(0, insertCol) + this.yankBuffer + line.substring(insertCol);
            this.moveCursor(lineNum, insertCol + this.yankBuffer.length - 1);
        }
        return true;
    }

    pasteBefore(lineNum, col) {
        if (this.yankBuffer === null) return false;
        this.saveState();

        if (this.yankIsLine) {
            this.lines.splice(lineNum, 0, this.yankBuffer);
            this.moveCursor(lineNum, 0);
        } else {
            const line = this.lines[lineNum];
            const insertCol = Math.min(col, line.length);
            this.lines[lineNum] = line.substring(0, insertCol) + this.yankBuffer + line.substring(insertCol);
            this.moveCursor(lineNum, insertCol);
        }
        return true;
    }

    // Validation
    isComplete(target) {
        return this.getCurrentText() === target;
    }

    // Get character at position
    getChar(lineNum, col) {
        if (lineNum < 0 || lineNum >= this.lines.length) return null;
        const line = this.lines[lineNum];
        if (col < 0 || col >= line.length) return null;
        return line[col];
    }

    // Word boundaries for word motions
    findWordStart(lineNum, col, forward) {
        const line = this.lines[lineNum];
        if (!line) return col;

        if (forward) {
            // Move to end of current word, then start of next word
            let i = col;
            // Skip current word
            if (i < line.length && line[i] !== ' ') {
                while (i < line.length && line[i] !== ' ') i++;
            }
            // Skip spaces
            while (i < line.length && line[i] === ' ') i++;
            return i;
        } else {
            // Move backward to start of current word or previous word
            let i = col;
            // Skip spaces
            while (i > 0 && line[i - 1] === ' ') i--;
            // Skip word
            if (i > 0 && line[i - 1] !== ' ') {
                while (i > 0 && line[i - 1] !== ' ') i--;
            }
            return i;
        }
    }

    findWordEnd(lineNum, col) {
        const line = this.lines[lineNum];
        if (!line) return col;

        let i = col;
        // Skip spaces
        while (i < line.length && line[i] === ' ') i++;
        // Move to end of word
        if (i < line.length && line[i] !== ' ') {
            while (i < line.length - 1 && line[i + 1] !== ' ') i++;
        }
        return i;
    }
}
