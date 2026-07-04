class HelixCommands {
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

    execute(key, grid) {
        if (this.mode === 'SELECT') {
            return this.executeSelect(key, grid);
        }

        if (this.buffer.length > 0) {
            return this.executeBuffered(key, grid);
        }

        if (key >= '0' && key <= '9') {
            return this.handleCount(key, grid);
        }

        return this.executeSingle(key, grid);
    }

    handleCount(key, grid) {
        const count = parseInt(key);
        if (this.buffer.length > 0 && !isNaN(parseInt(this.buffer[this.buffer.length - 1]))) {
            this.buffer[this.buffer.length - 1] = '' + (parseInt(this.buffer[this.buffer.length - 1]) * 10 + count);
        } else {
            this.buffer.push(key);
        }
        return { moved: false, count: 0 };
    }

    executeSingle(key, grid) {
        const pos = grid.playerPos;
        let newX = pos.x;
        let newY = pos.y;
        let moved = false;

        switch (key) {
            case 'h': newX--; moved = true; break;
            case 'j': newY++; moved = true; break;
            case 'k': newY--; moved = true; break;
            case 'l': newX++; moved = true; break;

            case 'w': {
                const result = this.moveWordForward(grid, pos.x, pos.y, 1);
                newX = result.x; newY = result.y; moved = true;
                break;
            }
            case 'b': {
                const result = this.moveWordBackward(grid, pos.x, pos.y, 1);
                newX = result.x; newY = result.y; moved = true;
                break;
            }
            case 'e': {
                const result = this.moveWordEnd(grid, pos.x, pos.y, 1);
                newX = result.x; newY = result.y; moved = true;
                break;
            }
            case 'W': {
                const result = this.moveWordForward(grid, pos.x, pos.y, 2);
                newX = result.x; newY = result.y; moved = true;
                break;
            }
            case 'B': {
                const result = this.moveWordBackward(grid, pos.x, pos.y, 2);
                newX = result.x; newY = result.y; moved = true;
                break;
            }
            case 'E': {
                const result = this.moveWordEnd(grid, pos.x, pos.y, 2);
                newX = result.x; newY = result.y; moved = true;
                break;
            }

            case '0': newX = grid.getFirstNonWallInRow(pos.y, 1); moved = true; break;
            case '$': newX = grid.getLastNonWallInRow(pos.y, 1); moved = true; break;
            case '^': {
                const first = grid.getFirstNonWallInRow(pos.y, 1);
                newX = first >= 0 ? first : pos.x;
                moved = true;
                break;
            }

            case 'f': this.buffer = ['f']; return { moved: false };
            case 'F': this.buffer = ['F']; return { moved: false };
            case 't': this.buffer = ['t']; return { moved: false };
            case 'T': this.buffer = ['T']; return { moved: false };

            case 'g': this.buffer = ['g']; return { moved: false };
            case 'm': this.buffer = ['m']; return { moved: false };

            case 'v':
                this.mode = 'SELECT';
                this.selectStart = { x: pos.x, y: pos.y };
                return { moved: false, modeChange: 'SELECT' };

            case 'x':
                return { moved: false, action: 'selectLine', line: pos.y };

            case 'd': this.buffer = ['d']; return { moved: false };
            case 'c': this.buffer = ['c']; return { moved: false };

            case 'r': this.buffer = ['r']; return { moved: false };

            case 'i': return { moved: false, action: 'insert', position: 'before' };
            case 'a': return { moved: false, action: 'insert', position: 'after' };
            case 'I': return { moved: false, action: 'insert', position: 'lineStart' };
            case 'A': return { moved: false, action: 'insert', position: 'lineEnd' };
            case 'o': return { moved: false, action: 'openLine', direction: 'below' };
            case 'O': return { moved: false, action: 'openLine', direction: 'above' };

            case 'u': return { moved: false, action: 'undo' };
            case 'U': return { moved: false, action: 'redo' };
            case 'y': return { moved: false, action: 'yank' };
            case 'p': return { moved: false, action: 'paste' };
            case 'P': return { moved: false, action: 'pasteBefore' };
            case '.': return this.repeatLast(grid);
            case '~': return { moved: false, action: 'swapCase' };

            case ';': return { moved: false, action: 'repeatFind', direction: 1 };
            case ',': return { moved: false, action: 'repeatFind', direction: -1 };

            case '/': this.buffer = ['/']; return { moved: false };
            case 'n': return { moved: false, action: 'searchNext' };
            case 'N': return { moved: false, action: 'searchPrev' };

            case ' ': this.buffer = [' ']; return { moved: false };

            default: return { moved: false, unknown: key };
        }

        if (moved && grid.isWalkable(newX, newY)) {
            grid.playerPos.x = newX;
            grid.playerPos.y = newY;
            const collected = grid.collectTarget(newX, newY);
            this.lastCommand = { type: 'move', key };
            return { moved: true, collected, newX, newY };
        }

        return { moved: false, hitWall: moved };
    }

    executeBuffered(key, grid) {
        const prefix = this.buffer.join('');
        const pos = grid.playerPos;

        if (prefix === 'f') {
            this.buffer = [];
            this.lastFindChar = key;
            this.lastFindDir = 1;
            const target = grid.findCharInDirection(pos.x, pos.y, 1, 0, key);
            if (target && grid.isWalkable(target.x, target.y)) {
                grid.playerPos.x = target.x;
                grid.playerPos.y = target.y;
                const collected = grid.collectTarget(target.x, target.y);
                this.lastCommand = { type: 'find', char: key, dir: 1 };
                return { moved: true, collected, newX: target.x, newY: target.y };
            }
            return { moved: false, action: 'findFailed' };
        }

        if (prefix === 'F') {
            this.buffer = [];
            this.lastFindChar = key;
            this.lastFindDir = -1;
            const target = grid.findCharInDirection(pos.x, pos.y, -1, 0, key);
            if (target && grid.isWalkable(target.x, target.y)) {
                grid.playerPos.x = target.x;
                grid.playerPos.y = target.y;
                const collected = grid.collectTarget(target.x, target.y);
                this.lastCommand = { type: 'find', char: key, dir: -1 };
                return { moved: true, collected, newX: target.x, newY: target.y };
            }
            return { moved: false, action: 'findFailed' };
        }

        if (prefix === 't') {
            this.buffer = [];
            this.lastFindChar = key;
            this.lastFindDir = 1;
            const target = grid.findCharTill(pos.x, pos.y, 1, 0, key);
            if (target && grid.isWalkable(target.x, target.y)) {
                grid.playerPos.x = target.x;
                grid.playerPos.y = target.y;
                const collected = grid.collectTarget(target.x, target.y);
                this.lastCommand = { type: 'till', char: key, dir: 1 };
                return { moved: true, collected, newX: target.x, newY: target.y };
            }
            return { moved: false, action: 'findFailed' };
        }

        if (prefix === 'T') {
            this.buffer = [];
            this.lastFindChar = key;
            this.lastFindDir = -1;
            const target = grid.findCharTill(pos.x, pos.y, -1, 0, key);
            if (target && grid.isWalkable(target.x, target.y)) {
                grid.playerPos.x = target.x;
                grid.playerPos.y = target.y;
                const collected = grid.collectTarget(target.x, target.y);
                this.lastCommand = { type: 'till', char: key, dir: -1 };
                return { moved: true, collected, newX: target.x, newY: target.y };
            }
            return { moved: false, action: 'findFailed' };
        }

        if (prefix === 'g') {
            this.buffer = [];
            switch (key) {
                case 'g': {
                    const y = 0;
                    const x = grid.getFirstNonWallInRow(y, 1);
                    if (x >= 0) {
                        grid.playerPos.x = x;
                        grid.playerPos.y = y;
                        const collected = grid.collectTarget(x, y);
                        this.lastCommand = { type: 'goto', target: 'start' };
                        return { moved: true, collected, newX: x, newY: y };
                    }
                    return { moved: false };
                }
                case 'e': {
                    for (let y = grid.height - 1; y >= 0; y--) {
                        const x = grid.getLastNonWallInRow(y, 1);
                        if (x >= 0) {
                            grid.playerPos.x = x;
                            grid.playerPos.y = y;
                            const collected = grid.collectTarget(x, y);
                            this.lastCommand = { type: 'goto', target: 'end' };
                            return { moved: true, collected, newX: x, newY: y };
                        }
                    }
                    return { moved: false };
                }
                case 'h': {
                    const x = grid.getFirstNonWallInRow(pos.y, 1);
                    if (x >= 0) {
                        grid.playerPos.x = x;
                        const collected = grid.collectTarget(x, pos.y);
                        this.lastCommand = { type: 'goto', target: 'lineStart' };
                        return { moved: true, collected, newX: x, newY: pos.y };
                    }
                    return { moved: false };
                }
                case 'l': {
                    const x = grid.getLastNonWallInRow(pos.y, 1);
                    if (x >= 0) {
                        grid.playerPos.x = x;
                        const collected = grid.collectTarget(x, pos.y);
                        this.lastCommand = { type: 'goto', target: 'lineEnd' };
                        return { moved: true, collected, newX: x, newY: pos.y };
                    }
                    return { moved: false };
                }
                case 'f': {
                    for (let y = 0; y < grid.height; y++) {
                        for (let x = 0; x < grid.width; x++) {
                            if (grid.isFloorMark(x, y)) {
                                grid.playerPos.x = x;
                                grid.playerPos.y = y;
                                const collected = grid.collectTarget(x, y);
                                this.lastCommand = { type: 'goto', target: 'file' };
                                return { moved: true, collected, newX: x, newY: y };
                            }
                        }
                    }
                    return { moved: false };
                }
                default:
                    return { moved: false, unknown: key };
            }
        }

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

        if (prefix === 'ms') {
            this.buffer = [];
            return { moved: false, action: 'surroundAdd', char: key };
        }

        if (prefix === 'md') {
            this.buffer = [];
            return { moved: false, action: 'surroundDelete', char: key };
        }

        if (prefix === 'mi') {
            this.buffer = [];
            return { moved: false, action: 'selectInside', object: key };
        }

        if (prefix === 'ma') {
            this.buffer = [];
            return { moved: false, action: 'selectAround', object: key };
        }

        if (prefix === 'd') {
            this.buffer = [];
            switch (key) {
                case 'w': {
                    const end = this.moveWordForward(grid, pos.x, pos.y, 1);
                    return { moved: false, action: 'deleteTo', from: { ...pos }, to: { x: end.x, y: end.y } };
                }
                case 'e': {
                    const end = this.moveWordEnd(grid, pos.x, pos.y, 1);
                    return { moved: false, action: 'deleteTo', from: { ...pos }, to: { x: end.x, y: end.y } };
                }
                case '$': {
                    const end = grid.getLastNonWallInRow(pos.y, 1);
                    return { moved: false, action: 'deleteTo', from: { ...pos }, to: { x: end, y: pos.y } };
                }
                case 'd':
                    return { moved: false, action: 'deleteLine', line: pos.y };
                case 'i':
                    this.buffer = ['d', 'i'];
                    return { moved: false };
                case 'a':
                    this.buffer = ['d', 'a'];
                    return { moved: false };
                default:
                    return { moved: false, unknown: key };
            }
        }

        if (prefix === 'di') {
            this.buffer = [];
            return { moved: false, action: 'deleteInside', object: key };
        }

        if (prefix === 'da') {
            this.buffer = [];
            return { moved: false, action: 'deleteAround', object: key };
        }

        if (prefix === 'c') {
            this.buffer = [];
            switch (key) {
                case 'w': {
                    const end = this.moveWordForward(grid, pos.x, pos.y, 1);
                    return { moved: false, action: 'changeTo', from: { ...pos }, to: { x: end.x, y: end.y } };
                }
                case '$': {
                    const end = grid.getLastNonWallInRow(pos.y, 1);
                    return { moved: false, action: 'changeTo', from: { ...pos }, to: { x: end, y: pos.y } };
                }
                case 'c':
                    return { moved: false, action: 'changeLine', line: pos.y };
                case 'i':
                    this.buffer = ['c', 'i'];
                    return { moved: false };
                default:
                    return { moved: false, unknown: key };
            }
        }

        if (prefix === 'ci') {
            this.buffer = [];
            return { moved: false, action: 'changeInside', object: key };
        }

        if (prefix === 'r') {
            this.buffer = [];
            return { moved: false, action: 'replace', char: key };
        }

        if (prefix === '/') {
            this.buffer = [];
            return { moved: false, action: 'search', pattern: key };
        }

        if (prefix === ' ') {
            this.buffer = [];
            return this.executeSpaceMode(key, grid);
        }

        this.buffer = [];
        return { moved: false, unknown: key };
    }

    executeSpaceMode(key, grid) {
        switch (key) {
            case 'f': return { moved: false, action: 'filePicker' };
            case 'b': return { moved: false, action: 'bufferPicker' };
            case 'j': return { moved: false, action: 'jumplist' };
            case 'w': this.buffer = [' ']; return { moved: false };
            case 'c': return { moved: false, action: 'toggleComments' };
            case 'y': return { moved: false, action: 'yankToClipboard' };
            case 'p': return { moved: false, action: 'pasteFromClipboard' };
            case '/': return { moved: false, action: 'globalSearch' };
            case '?': return { moved: false, action: 'commandPalette' };
            case 'r': return { moved: false, action: 'rename' };
            case 'a': return { moved: false, action: 'codeAction' };
            case 's': return { moved: false, action: 'symbolPicker' };
            case 'd': return { moved: false, action: 'diagnostics' };
            default: return { moved: false, unknown: key };
        }
    }

    executeSelect(key, grid) {
        const pos = grid.playerPos;
        let newX = pos.x;
        let newY = pos.y;
        let extend = false;

        switch (key) {
            case 'h': newX--; extend = true; break;
            case 'j': newY++; extend = true; break;
            case 'k': newY--; extend = true; break;
            case 'l': newX++; extend = true; break;
            case 'w': {
                const r = this.moveWordForward(grid, pos.x, pos.y, 1);
                newX = r.x; newY = r.y; extend = true;
                break;
            }
            case 'b': {
                const r = this.moveWordBackward(grid, pos.x, pos.y, 1);
                newX = r.x; newY = r.y; extend = true;
                break;
            }
            case 'e': {
                const r = this.moveWordEnd(grid, pos.x, pos.y, 1);
                newX = r.x; newY = r.y; extend = true;
                break;
            }
            case 'd':
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false, action: 'deleteSelection', from: this.selectStart || pos, to: pos };
            case 'c':
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false, action: 'changeSelection', from: this.selectStart || pos, to: pos };
            case 'y':
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false, action: 'yankSelection', from: this.selectStart || pos, to: pos };
            case ';':
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false, action: 'collapseSelection' };
            case 'Escape':
                this.mode = 'NORMAL';
                this.selectStart = null;
                return { moved: false, modeChange: 'NORMAL' };
            default:
                return { moved: false, unknown: key };
        }

        if (extend && grid.isWalkable(newX, newY)) {
            grid.playerPos.x = newX;
            grid.playerPos.y = newY;
            const collected = grid.collectTarget(newX, newY);
            return { moved: true, collected, newX, newY, extending: true };
        }

        return { moved: false, hitWall: extend };
    }

    moveWordForward(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;

        // Skip non-word characters on current line
        while (x < grid.width - 1) {
            const next = grid.getTile(x + 1, y);
            if (this.isNonWordTile(next)) {
                x++;
            } else {
                break;
            }
        }

        // If we found a word character ahead, move to it
        if (x < grid.width - 1) {
            const next = grid.getTile(x + 1, y);
            if (!this.isNonWordTile(next)) {
                return { x: x + 1, y };
            }
        }

        // At end of line - wrap to next line and find first word
        return this.findFirstWordForward(grid, x, y);
    }

    findFirstWordForward(grid, startX, startY) {
        let y = startY + 1;

        while (y < grid.height) {
            let x = 0;

            // Skip leading non-word characters
            while (x < grid.width) {
                const tile = grid.getTile(x, y);
                if (this.isNonWordTile(tile)) {
                    x++;
                } else {
                    // Found a word character
                    return { x, y };
                }
            }

            y++;
        }

        // No word found - return last valid position
        return { x: startX, y: startY };
    }

    isNonWordTile(tile) {
        return tile === TileType.EMPTY || tile === TileType.START ||
               tile === TileType.FLOOR_MARK || tile === TileType.WALL;
    }

    moveWordBackward(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;

        // Skip non-word characters on current line
        while (x > 0) {
            const prev = grid.getTile(x - 1, y);
            if (this.isNonWordTile(prev)) {
                x--;
            } else {
                break;
            }
        }

        // If we found a word character behind, move to it
        if (x > 0) {
            const prev = grid.getTile(x - 1, y);
            if (!this.isNonWordTile(prev)) {
                return { x: x - 1, y };
            }
        }

        // At start of line - wrap to previous line and find last word
        return this.findLastWordBackward(grid, x, y);
    }

    findLastWordBackward(grid, startX, startY) {
        let y = startY - 1;

        while (y >= 0) {
            let x = grid.width - 1;

            // Skip trailing non-word characters
            while (x >= 0) {
                const tile = grid.getTile(x, y);
                if (this.isNonWordTile(tile)) {
                    x--;
                } else {
                    // Found a word character
                    return { x, y };
                }
            }

            y--;
        }

        // No word found - return last valid position
        return { x: startX, y: startY };
    }

    moveWordEnd(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;

        if (wordType === 1) {
            if (x < grid.width - 1) {
                const nextTile = grid.getTile(x + 1, y);
                if (nextTile !== TileType.WALL && nextTile !== TileType.TARGET && nextTile !== TileType.BONUS && grid.isWalkable(x + 1, y)) {
                    x++;
                    while (x < grid.width - 1) {
                        const tile = grid.getTile(x + 1, y);
                        if (tile === TileType.WALL || tile === TileType.TARGET || tile === TileType.BONUS || !grid.isWalkable(x + 1, y)) {
                            break;
                        }
                        x++;
                    }
                }
            }
        } else {
            if (x < grid.width - 1) {
                const nextTile = grid.getTile(x + 1, y);
                if (nextTile !== TileType.WALL && nextTile !== TileType.TARGET && nextTile !== TileType.BONUS && grid.isWalkable(x + 1, y)) {
                    x++;
                    while (x < grid.width - 1) {
                        const tile = grid.getTile(x + 1, y);
                        if (tile === TileType.WALL || tile === TileType.TARGET || tile === TileType.BONUS || !grid.isWalkable(x + 1, y)) {
                            break;
                        }
                        x++;
                    }
                }
            }
        }

        return { x, y };
    }

    repeatLast(grid) {
        if (!this.lastCommand) return { moved: false };

        const cmd = this.lastCommand;
        switch (cmd.type) {
            case 'move':
                return this.executeSingle(cmd.key, grid);
            case 'find': {
                const dir = cmd.dir;
                const pos = grid.playerPos;
                const target = grid.findCharInDirection(pos.x, pos.y, dir, 0, cmd.char);
                if (target && grid.isWalkable(target.x, target.y)) {
                    grid.playerPos.x = target.x;
                    grid.playerPos.y = target.y;
                    const collected = grid.collectTarget(target.x, target.y);
                    return { moved: true, collected, newX: target.x, newY: target.y };
                }
                return { moved: false };
            }
            case 'till': {
                const dir = cmd.dir;
                const pos = grid.playerPos;
                const target = grid.findCharTill(pos.x, pos.y, dir, 0, cmd.char);
                if (target && grid.isWalkable(target.x, target.y)) {
                    grid.playerPos.x = target.x;
                    grid.playerPos.y = target.y;
                    const collected = grid.collectTarget(target.x, target.y);
                    return { moved: true, collected, newX: target.x, newY: target.y };
                }
                return { moved: false };
            }
            default:
                return { moved: false };
        }
    }
}
