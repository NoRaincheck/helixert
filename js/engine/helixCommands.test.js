import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// --- Inline source under test ---

const TileType = {
    EMPTY: '.',
    WALL: '#',
    TARGET: 'T',
    START: 'S',
    DOOR: 'D',
    BONUS: '*',
    COLLECTED: 'C',
    SWITCH: 'X',
    FLOOR_MARK: 'F'
};

class Grid {
    constructor(levelData) {
        this.width = levelData.grid.width;
        this.height = levelData.grid.height;
        this.tiles = [];
        this.startPos = { ...levelData.grid.start };
        this.playerPos = { ...levelData.grid.start };

        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = levelData.grid.tiles[y][x];
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TileType.WALL;
        }
        return this.tiles[y][x];
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return true;
    }

    getFirstNonWallInRow(y, direction) {
        if (direction > 0) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        } else {
            for (let x = this.width - 1; x >= 0; x--) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        }
        return -1;
    }

    getLastNonWallInRow(y, direction) {
        if (direction > 0) {
            for (let x = this.width - 1; x >= 0; x--) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        } else {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        }
        return -1;
    }

    collectTarget(x, y) {
        return false;
    }

    isFloorMark(x, y) {
        return this.getTile(x, y) === TileType.FLOOR_MARK;
    }
}

class HelixCommands {
    constructor() {
        this.buffer = [];
    }

    moveWordForward(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;
        const tile = grid.getTile(x, y);

        let endOfRunX = x;
        const wasOnWord = !this.isNonWordTile(tile);
        if (!this.isNonWordTile(tile)) {
            while (x < grid.width - 1 && grid.getTile(x + 1, y) === tile) {
                x++;
                endOfRunX = x;
            }
        }

        while (x < grid.width - 1 && this.isNonWordTile(grid.getTile(x + 1, y))) {
            x++;
        }

        if (x < grid.width - 1 && !this.isNonWordTile(grid.getTile(x + 1, y))) {
            if (wordType === 2) {
                return this.skipToEndOfRun(grid, x + 1, y);
            }
            return { x: x + 1, y };
        }

        return this.findFirstWordForward(grid, x, y, wordType, endOfRunX, wasOnWord);
    }

    skipToEndOfRun(grid, startX, y) {
        let x = startX;
        const tile = grid.getTile(x, y);

        while (x < grid.width - 1) {
            const next = grid.getTile(x + 1, y);
            if (next === tile) {
                x++;
            } else {
                break;
            }
        }

        return { x, y };
    }

    findFirstWordForward(grid, startX, startY, wordType, endOfRunX, wasOnWord) {
        let y = startY + 1;

        while (y < grid.height) {
            let x = 0;

            while (x < grid.width) {
                const tile = grid.getTile(x, y);
                if (this.isNonWordTile(tile)) {
                    x++;
                } else {
                    if (wordType === 2) {
                        return this.skipToEndOfRun(grid, x, y);
                    }
                    return { x, y };
                }
            }

            y++;
        }

        // No word found - return end of current word run, or last position if started on separator
        if (wasOnWord && endOfRunX !== undefined) {
            return { x: endOfRunX, y: startY };
        }
        return { x: startX, y: startY };
    }

    moveWordBackward(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;
        const tile = grid.getTile(x, y);

        // Phase 1: skip backward past current word (same-type run)
        if (!this.isNonWordTile(tile)) {
            while (x > 0 && grid.getTile(x - 1, y) === tile) {
                x--;
            }
        }

        // Phase 2: skip non-word characters backward
        while (x > 0 && this.isNonWordTile(grid.getTile(x - 1, y))) {
            x--;
        }

        // Phase 3: land on start of previous word
        if (x > 0 && !this.isNonWordTile(grid.getTile(x - 1, y))) {
            return this.skipToStartOfRun(grid, x - 1, y);
        }

        // Wrap: find last word on previous line
        return this.findLastWordBackward(grid, x, y, wordType);
    }

    skipToStartOfRun(grid, startX, y) {
        let x = startX;
        const tile = grid.getTile(x, y);

        while (x > 0) {
            const prev = grid.getTile(x - 1, y);
            if (prev === tile) {
                x--;
            } else {
                break;
            }
        }

        return { x, y };
    }

    findLastWordBackward(grid, startX, startY, wordType) {
        let y = startY - 1;

        while (y >= 0) {
            let x = grid.width - 1;

            while (x >= 0) {
                const tile = grid.getTile(x, y);
                if (this.isNonWordTile(tile)) {
                    x--;
                } else {
                    if (wordType === 2) {
                        return this.skipToStartOfRun(grid, x, y);
                    }
                    return { x, y };
                }
            }

            y--;
        }

        return { x: startX, y: startY };
    }

    isNonWordTile(tile) {
        return tile === TileType.EMPTY || tile === TileType.START ||
               tile === TileType.FLOOR_MARK;
    }

    moveWordEnd(grid, startX, startY, wordType) {
        let x = startX;
        let y = startY;
        const tile = grid.getTile(x, y);

        let endOfRunX = x;
        const wasOnWord = !this.isNonWordTile(tile);
        if (!this.isNonWordTile(tile)) {
            const oldX = x;
            while (x < grid.width - 1 && grid.getTile(x + 1, y) === tile) {
                x++;
                endOfRunX = x;
            }
            // If we advanced within the run, we're at the end — return
            if (x > oldX) {
                return { x, y };
            }
            // We were already at the end — continue to Phase 2 to find next word
        }

        while (x < grid.width - 1 && this.isNonWordTile(grid.getTile(x + 1, y))) {
            x++;
        }

        if (x < grid.width - 1 && !this.isNonWordTile(grid.getTile(x + 1, y))) {
            x++;
            const nextTile = grid.getTile(x, y);
            while (x < grid.width - 1 && grid.getTile(x + 1, y) === nextTile) {
                x++;
            }
            return { x, y };
        }

        const result = this.findFirstWordForward(grid, x, y, wordType, endOfRunX, wasOnWord);
        if (result.x !== startX || result.y !== startY) {
            let ex = result.x;
            const wt = grid.getTile(ex, result.y);
            while (ex < grid.width - 1 && grid.getTile(ex + 1, result.y) === wt) {
                ex++;
            }
            return { x: ex, y: result.y };
        }

        return { x: endOfRunX, y: startY };
    }

    gotoStart(grid) {
        const y = 0;
        const x = grid.getFirstNonWallInRow(y, 1);
        if (x >= 0) {
            grid.playerPos.x = x;
            grid.playerPos.y = y;
            return { x, y };
        }
        return null;
    }

    gotoEnd(grid) {
        const y = grid.height - 1;
        const x = grid.getFirstNonWallInRow(y, 1);
        if (x >= 0) {
            grid.playerPos.x = x;
            grid.playerPos.y = y;
            return { x, y };
        }
        return null;
    }

    gotoLineStart(grid) {
        const pos = grid.playerPos;
        const x = grid.getFirstNonWallInRow(pos.y, 1);
        if (x >= 0) {
            grid.playerPos.x = x;
            return { x, y: pos.y };
        }
        return null;
    }

    gotoLineEnd(grid) {
        const pos = grid.playerPos;
        const x = grid.getLastNonWallInRow(pos.y, 1);
        if (x >= 0) {
            grid.playerPos.x = x;
            return { x, y: pos.y };
        }
        return null;
    }

    executeSingle(key, grid) {
        const pos = grid.playerPos;
        switch (key) {
            case 'x':
                return { moved: false, action: 'selectLine', line: pos.y };
            default:
                return { moved: false, unknown: key };
        }
    }

    executeBuffered(key, grid) {
        const prefix = this.buffer.join('');
        const pos = grid.playerPos;
        if (prefix === 'd') {
            this.buffer = [];
            if (key === 'd') {
                return { moved: false, action: 'deleteLine', line: pos.y };
            }
            return { moved: false, unknown: key };
        }
        return { moved: false, unknown: key };
    }
}

// --- Helpers ---

function makeGrid(row, startCol = 0) {
    return new Grid({
        grid: {
            width: row.length,
            height: 1,
            start: { x: startCol, y: 0 },
            tiles: [row.split('')]
        }
    });
}

function makeMultiLineGrid(rows, startCol = 0, startRow = 0) {
    const height = rows.length;
    const width = Math.max(...rows.map(r => r.length));
    const tiles = rows.map(r => {
        const padded = r.padEnd(width, '.');
        return padded.split('');
    });
    return new Grid({
        grid: {
            width,
            height,
            start: { x: startCol, y: startRow },
            tiles
        }
    });
}

const cmd = new HelixCommands();

function w(grid, x = 0, y = 0) {
    return cmd.moveWordForward(grid, x, y, 1);
}

function W(grid, x = 0, y = 0) {
    return cmd.moveWordForward(grid, x, y, 2);
}

function b(grid, x, y = 0) {
    return cmd.moveWordBackward(grid, x, y, 1);
}

function B(grid, x, y = 0) {
    return cmd.moveWordBackward(grid, x, y, 2);
}

function e(grid, x = 0, y = 0) {
    return cmd.moveWordEnd(grid, x, y, 1);
}

// --- Tests: `w` motion (same-type-run model) ---

Deno.test("w: from # skips to first X in #...XT...XXT...XT", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 0), { x: 4, y: 0 });
});

Deno.test("w: from X skips to T (same-type boundary)", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 4), { x: 5, y: 0 });
});

Deno.test("w: from T skips dots then lands on X", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 5), { x: 9, y: 0 });
});

Deno.test("w: from first X of XX skips to T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 9), { x: 11, y: 0 });
});

Deno.test("w: from XX lands on T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 10), { x: 11, y: 0 });
});

Deno.test("w: from T after XX skips to X", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 11), { x: 15, y: 0 });
});

Deno.test("w: from X at end skips to T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 15), { x: 16, y: 0 });
});

Deno.test("w: from T at end of single line stays", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(w(g, 16), { x: 16, y: 0 });
});

Deno.test("w: on separator skips to next word", () => {
    const g = makeGrid("...T..");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w: adjacent same-type chars move as one word", () => {
    const g = makeGrid("XXTT..");
    assertEquals(w(g, 0), { x: 2, y: 0 });
});

Deno.test("w: TT run then XX run", () => {
    const g = makeGrid("TT..XX");
    assertEquals(w(g, 0), { x: 4, y: 0 });
});

// --- Tests: `e` motion (end of next word) ---

Deno.test("e: from # lands on end of X word", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 0), { x: 4, y: 0 });
});

Deno.test("e: from X lands on T (end of T word)", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 4), { x: 5, y: 0 });
});

Deno.test("e: from T skips to end of XX run", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 5), { x: 10, y: 0 });
});

Deno.test("e: from first X of XX lands on last X", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 9), { x: 10, y: 0 });
});

Deno.test("e: from XX lands on T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 10), { x: 11, y: 0 });
});

Deno.test("e: from T after XX lands on X (end of X word)", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 11), { x: 15, y: 0 });
});

Deno.test("e: from second X lands on T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 15), { x: 16, y: 0 });
});

Deno.test("e: from T at end stays", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(e(g, 16), { x: 16, y: 0 });
});

Deno.test("e: adjacent XX then TT", () => {
    const g = makeGrid("XXTT..");
    assertEquals(e(g, 0), { x: 1, y: 0 });
});

// --- Tests: `b` motion (backward, same-type-run model) ---

Deno.test("b: from T lands on start of X word", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(b(g, 5), { x: 4, y: 0 });
});

Deno.test("b: from X after dots lands on T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(b(g, 9), { x: 5, y: 0 });
});

Deno.test("b: from last T lands on XX", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(b(g, 11), { x: 9, y: 0 });
});

Deno.test("b: from X at end lands on T", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(b(g, 16), { x: 15, y: 0 });
});

Deno.test("b: from first X lands on T before dots", () => {
    const g = makeGrid("#...XT...XXT...XT");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

// --- Tests: `w` multi-line wrapping (same-type-run model) ---

Deno.test("w wraps to next line", () => {
    const g = makeMultiLineGrid(["T.", "T."]);
    assertEquals(w(g, 0, 0), { x: 0, y: 1 });
});

Deno.test("w wraps skipping separator line", () => {
    const g = makeMultiLineGrid(["T.", "...", "T."]);
    assertEquals(w(g, 0, 0), { x: 0, y: 2 });
});

Deno.test("w wraps to different type on next line", () => {
    const g = makeMultiLineGrid(["X.", "T."]);
    assertEquals(w(g, 0, 0), { x: 0, y: 1 });
});

Deno.test("w at end of last line stays", () => {
    const g = makeMultiLineGrid(["T.", "T."]);
    assertEquals(w(g, 0, 1), { x: 0, y: 1 });
});

// --- Tests: `W` WORD motion (uppercase = skip to end of run) ---

Deno.test("W: from X skips to end of TT run", () => {
    const g = makeGrid("XTT..XX");
    assertEquals(W(g, 0), { x: 2, y: 0 });
});

Deno.test("W: from XX skips to end of TT", () => {
    const g = makeGrid("..XXTT..");
    assertEquals(W(g, 2), { x: 5, y: 0 });
});

Deno.test("W wraps to end of run on next line", () => {
    const g = makeMultiLineGrid(["X.", "TT"]);
    assertEquals(W(g, 0, 0), { x: 1, y: 1 });
});

// --- Tests: `B` WORD motion (uppercase backward) ---

Deno.test("B: from TT skips to start of XX", () => {
    const g = makeGrid("XX..TT");
    assertEquals(B(g, 5), { x: 0, y: 0 });
});

Deno.test("B wraps to start of run on previous line", () => {
    const g = makeMultiLineGrid(["XX", "T."]);
    assertEquals(B(g, 0, 1), { x: 0, y: 0 });
});

Deno.test("w skips consecutive EMPTY tiles", () => {
    const g = makeGrid(".....T..");
    assertEquals(w(g, 0), { x: 5, y: 0 });
});

Deno.test("w skips START tiles like EMPTY", () => {
    const g = makeGrid("..S..T..");
    assertEquals(w(g, 0), { x: 5, y: 0 });
});

Deno.test("w skips FLOOR_MARK tiles like EMPTY", () => {
    const g = makeGrid("..F..T..");
    assertEquals(w(g, 0), { x: 5, y: 0 });
});

Deno.test("w lands on WALL as a word token", () => {
    const g = makeGrid("..#..T..");
    assertEquals(w(g, 0), { x: 2, y: 0 });
});

Deno.test("w lands on first WALL in mixed EMPTY and WALL", () => {
    const g = makeGrid(".#.#.T..");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

Deno.test("w from word tile skips trailing whitespace to next word", () => {
    const g = makeGrid("T...T...");
    assertEquals(w(g, 0), { x: 4, y: 0 });
});

Deno.test("w lands on adjacent word tile with no gap", () => {
    const g = makeGrid("TT....");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

Deno.test("w at end of line with only walls stays in place", () => {
    const g = makeGrid("T####");
    assertEquals(w(g, 4), { x: 4, y: 0 });
});

Deno.test("w lands on first WALL after word tile", () => {
    const g = makeGrid("T##T.");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

Deno.test("w from word tile lands on next WALL token", () => {
    const g = makeGrid("T.##");
    assertEquals(w(g, 0), { x: 2, y: 0 });
});

Deno.test("w from START tile lands on first word", () => {
    const g = makeGrid("S..T.");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w from word tile lands on first WALL", () => {
    const g = makeGrid("T##*..");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

Deno.test("w from word tile lands on WALL at grid boundary", () => {
    const g = makeGrid("T###");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

Deno.test("w from EMPTY lands on first WALL", () => {
    const g = makeGrid(".####");
    assertEquals(w(g, 0), { x: 1, y: 0 });
});

// --- Tests: `b` motion ---

Deno.test("b skips whitespace backward and lands on word tile", () => {
    const g = makeGrid("T...T...");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

Deno.test("b lands on WALL as a word token backward", () => {
    const g = makeGrid("T##T...");
    assertEquals(b(g, 3), { x: 1, y: 0 });
});

Deno.test("b lands on first WALL backward in mixed", () => {
    const g = makeGrid("T.#.#T.");
    assertEquals(b(g, 5), { x: 4, y: 0 });
});

Deno.test("b at start of line stays in place", () => {
    const g = makeGrid("T....");
    assertEquals(b(g, 0), { x: 0, y: 0 });
});

Deno.test("b from word tile skips trailing whitespace to previous word", () => {
    const g = makeGrid("T...T...");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

Deno.test("b lands on WALL backward to reach word", () => {
    const g = makeGrid("T##T...");
    assertEquals(b(g, 3), { x: 1, y: 0 });
});

Deno.test("b from wall run lands on WALL token", () => {
    const g = makeGrid("T.###");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

// --- Helix-like behavior edge cases ---

Deno.test("w treats # and . differently - # is a token", () => {
    const g1 = makeGrid("T....");
    const g2 = makeGrid("T####");
    // With # as token, w lands on first # in g2
    assertEquals(w(g2, 0), { x: 1, y: 0 });
});

Deno.test("w with alternating . and # lands on first #", () => {
    const g1 = makeGrid("T..T..");
    const g2 = makeGrid("T##T##");
    assertEquals(w(g2, 0), { x: 1, y: 0 });
});

Deno.test("b treats # and . differently - # is a token", () => {
    const g1 = makeGrid("T...T");
    const g2 = makeGrid("T###T");
    assertEquals(b(g2, 4), { x: 1, y: 0 });
});

Deno.test("w handles single-char line", () => {
    const g = makeGrid("T");
    assertEquals(w(g, 0), { x: 0, y: 0 });
});

Deno.test("w on all-wall line lands on first WALL", () => {
    const g = makeGrid("####");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w on empty line stops at last dot", () => {
    const g = makeGrid("....");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

// --- Tests: `w` multi-line wrapping ---

Deno.test("w at end of line with no words on next line stays in place", () => {
    const g = makeMultiLineGrid(["T.", ".."]);
    assertEquals(w(g, 1, 0), { x: 1, y: 0 });
});

Deno.test("w wraps and skips leading whitespace on next line", () => {
    const g = makeMultiLineGrid(["T.", "...T"]);
    assertEquals(w(g, 1, 0), { x: 3, y: 1 });
});

Deno.test("w wraps to WALL on next line", () => {
    const g = makeMultiLineGrid(["T.", "#T"]);
    assertEquals(w(g, 1, 0), { x: 0, y: 1 });
});

Deno.test("w wraps to WALL after mixed whitespace", () => {
    const g = makeMultiLineGrid(["T.", ".#T"]);
    assertEquals(w(g, 1, 0), { x: 1, y: 1 });
});

Deno.test("w from word tile wraps to next line", () => {
    const g = makeMultiLineGrid(["T.", "T."]);
    assertEquals(w(g, 0, 0), { x: 0, y: 1 });
});

Deno.test("w wraps skipping empty lines", () => {
    const g = makeMultiLineGrid(["T.", "...", "..T"]);
    assertEquals(w(g, 1, 0), { x: 2, y: 2 });
});

Deno.test("w at end of last line stays in place", () => {
    const g = makeMultiLineGrid(["..", "T."]);
    assertEquals(w(g, 1, 1), { x: 1, y: 1 });
});

Deno.test("w wraps to next line skipping START tiles", () => {
    const g = makeMultiLineGrid(["T.", "S.T"]);
    assertEquals(w(g, 1, 0), { x: 2, y: 1 });
});

Deno.test("w wraps to next line skipping FLOOR_MARK tiles", () => {
    const g = makeMultiLineGrid(["T.", "F.T"]);
    assertEquals(w(g, 1, 0), { x: 2, y: 1 });
});

Deno.test("w wraps to BONUS tile on next line", () => {
    const g = makeMultiLineGrid(["T.", "..*"]);
    assertEquals(w(g, 1, 0), { x: 2, y: 1 });
});

Deno.test("w wraps to WALL on next non-empty line", () => {
    const g = makeMultiLineGrid(["T.", "#.", ".T"]);
    assertEquals(w(g, 1, 0), { x: 0, y: 1 });
});

// --- Tests: `b` multi-line wrapping ---

Deno.test("b at start of line with no words on previous line stays in place", () => {
    const g = makeMultiLineGrid(["..", "T."]);
    assertEquals(b(g, 0, 1), { x: 0, y: 1 });
});

Deno.test("b wraps and skips trailing whitespace on previous line", () => {
    const g = makeMultiLineGrid(["...T", "T.."]);
    assertEquals(b(g, 0, 1), { x: 3, y: 0 });
});

Deno.test("b wraps to WALL on previous line", () => {
    const g = makeMultiLineGrid(["T#", "T."]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b wraps to WALL before mixed whitespace", () => {
    const g = makeMultiLineGrid(["T#.", "T.."]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b from word tile wraps to previous line", () => {
    const g = makeMultiLineGrid([".T", "T."]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b wraps skipping empty lines", () => {
    const g = makeMultiLineGrid(["T..", "...", "T."]);
    assertEquals(b(g, 0, 2), { x: 0, y: 0 });
});

Deno.test("b at start of first line stays in place", () => {
    const g = makeMultiLineGrid(["T.", ".."]);
    assertEquals(b(g, 0, 0), { x: 0, y: 0 });
});

Deno.test("b wraps to previous line skipping START tiles", () => {
    const g = makeMultiLineGrid([".T", "S.T"]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b wraps to previous line skipping FLOOR_MARK tiles", () => {
    const g = makeMultiLineGrid([".T", "F.T"]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b wraps to BONUS tile on previous line", () => {
    const g = makeMultiLineGrid([".*.", "T.."]);
    assertEquals(b(g, 0, 1), { x: 1, y: 0 });
});

Deno.test("b wraps to WALL on previous non-empty line", () => {
    const g = makeMultiLineGrid([".T", ".#", "T."]);
    assertEquals(b(g, 0, 2), { x: 1, y: 1 });
});

// --- Tests: `W` WORD motion ---

Deno.test("W skips to end of wall run", () => {
    const g = makeGrid("T###T");
    assertEquals(W(g, 0), { x: 3, y: 0 });
});

Deno.test("W skips single wall to end of run", () => {
    const g = makeGrid("T#T");
    assertEquals(W(g, 0), { x: 1, y: 0 });
});

Deno.test("W on target skips to end of next wall run", () => {
    const g = makeGrid("TT..###");
    assertEquals(W(g, 1), { x: 6, y: 0 });
});

Deno.test("W skips whitespace then to end of wall run", () => {
    const g = makeGrid("...###T");
    assertEquals(W(g, 0), { x: 5, y: 0 });
});

Deno.test("W from wall run skips to end of next run", () => {
    const g = makeGrid("##..##");
    assertEquals(W(g, 0), { x: 5, y: 0 });
});

Deno.test("W at end of wall run skips to end of next word", () => {
    const g = makeGrid("###T##");
    assertEquals(W(g, 3), { x: 5, y: 0 });
});

Deno.test("W skips single target then to end of wall run", () => {
    const g = makeGrid("T...###");
    assertEquals(W(g, 0), { x: 6, y: 0 });
});

Deno.test("W wraps to end of run on next line", () => {
    const g = makeMultiLineGrid(["T.", "###T"]);
    assertEquals(W(g, 0, 0), { x: 2, y: 1 });
});

Deno.test("W wraps skipping empty lines to wall run", () => {
    const g = makeMultiLineGrid(["T.", "...", "##T"]);
    assertEquals(W(g, 0, 0), { x: 1, y: 2 });
});

// --- Tests: `B` WORD motion ---

Deno.test("B skips to start of wall run backward", () => {
    const g = makeGrid("T###T");
    assertEquals(B(g, 4), { x: 1, y: 0 });
});

Deno.test("B skips single wall backward", () => {
    const g = makeGrid("T#T");
    assertEquals(B(g, 2), { x: 1, y: 0 });
});

Deno.test("B on target skips backward to start of word run", () => {
    const g = makeGrid("TT..T");
    assertEquals(B(g, 4), { x: 0, y: 0 });
});

Deno.test("B skips whitespace then to start of wall run", () => {
    const g = makeGrid("T###...");
    assertEquals(B(g, 6), { x: 1, y: 0 });
});

Deno.test("B from wall run skips to start of previous run", () => {
    const g = makeGrid("##..##");
    assertEquals(B(g, 5), { x: 0, y: 0 });
});

Deno.test("B at start of wall run skips to start of previous word", () => {
    const g = makeGrid("##T###");
    assertEquals(B(g, 0), { x: 0, y: 0 });
});

Deno.test("B wraps to start of run on previous line", () => {
    const g = makeMultiLineGrid(["###T", "T."]);
    assertEquals(B(g, 0, 1), { x: 3, y: 0 });
});

Deno.test("B wraps skipping empty lines to wall run", () => {
    const g = makeMultiLineGrid(["##T", "...", "T."]);
    assertEquals(B(g, 0, 2), { x: 2, y: 0 });
});

// --- Tests: `gg` (goto start) ---

Deno.test("gg jumps to first non-wall in top row", () => {
    const g = makeMultiLineGrid(["###T.", "#...#", "...T#"]);
    g.playerPos = { x: 3, y: 2 };
    const result = cmd.gotoStart(g);
    assertEquals(result, { x: 3, y: 0 });
});

Deno.test("gg from bottom lands on top row", () => {
    const g = makeMultiLineGrid(["T..", "...", "..S"]);
    g.playerPos = { x: 2, y: 2 };
    const result = cmd.gotoStart(g);
    assertEquals(result, { x: 0, y: 0 });
});

Deno.test("gg when top row is all walls returns null", () => {
    const g = makeMultiLineGrid(["####", "T...", "...T"]);
    g.playerPos = { x: 0, y: 2 };
    const result = cmd.gotoStart(g);
    assertEquals(result, null);
});

Deno.test("gg updates player position", () => {
    const g = makeMultiLineGrid(["..T#", "#...", "...."]);
    g.playerPos = { x: 1, y: 2 };
    cmd.gotoStart(g);
    assertEquals(g.playerPos, { x: 0, y: 0 });
});

// --- Tests: `ge` (goto end — beginning of final line) ---

Deno.test("ge jumps to first non-wall in last row", () => {
    const g = makeMultiLineGrid(["T...", "#...", "..T#"]);
    g.playerPos = { x: 0, y: 0 };
    const result = cmd.gotoEnd(g);
    assertEquals(result, { x: 0, y: 2 });
});

Deno.test("ge from top lands on last row", () => {
    const g = makeMultiLineGrid(["S..", "...", "#.T"]);
    g.playerPos = { x: 0, y: 0 };
    const result = cmd.gotoEnd(g);
    assertEquals(result, { x: 1, y: 2 });
});

Deno.test("ge when last row is all walls returns null", () => {
    const g = makeMultiLineGrid(["T...", "...T", "####"]);
    g.playerPos = { x: 0, y: 0 };
    const result = cmd.gotoEnd(g);
    assertEquals(result, null);
});

Deno.test("ge updates player position", () => {
    const g = makeMultiLineGrid(["T...", "...", "##T."]);
    g.playerPos = { x: 0, y: 0 };
    cmd.gotoEnd(g);
    assertEquals(g.playerPos, { x: 2, y: 2 });
});

Deno.test("ge on single line goes to first non-wall of that line", () => {
    const g = makeGrid("#T..");
    g.playerPos = { x: 2, y: 0 };
    const result = cmd.gotoEnd(g);
    assertEquals(result, { x: 1, y: 0 });
});

// --- Tests: `gh` (goto line start) ---

Deno.test("gh jumps to first non-wall in current row", () => {
    const g = makeMultiLineGrid(["####", "#.T.", "#..#"]);
    g.playerPos = { x: 3, y: 1 };
    const result = cmd.gotoLineStart(g);
    assertEquals(result, { x: 1, y: 1 });
});

Deno.test("gh from middle of row goes to start", () => {
    const g = makeGrid("..T..");
    g.playerPos = { x: 3, y: 0 };
    const result = cmd.gotoLineStart(g);
    assertEquals(result, { x: 0, y: 0 });
});

Deno.test("gh when row is all walls returns null", () => {
    const g = makeMultiLineGrid(["####", "####", "####"]);
    g.playerPos = { x: 2, y: 1 };
    const result = cmd.gotoLineStart(g);
    assertEquals(result, null);
});

Deno.test("gh updates player x but not y", () => {
    const g = makeMultiLineGrid(["T...", "#..T", "...T"]);
    g.playerPos = { x: 3, y: 1 };
    cmd.gotoLineStart(g);
    assertEquals(g.playerPos, { x: 1, y: 1 });
});

Deno.test("gh on top row goes to first non-wall", () => {
    const g = makeGrid("#.T..");
    g.playerPos = { x: 4, y: 0 };
    const result = cmd.gotoLineStart(g);
    assertEquals(result, { x: 1, y: 0 });
});

// --- Tests: `gl` (goto line end) ---

Deno.test("gl jumps to last non-wall in current row", () => {
    const g = makeMultiLineGrid(["####", "#.T#", "#..#"]);
    g.playerPos = { x: 1, y: 1 };
    const result = cmd.gotoLineEnd(g);
    assertEquals(result, { x: 2, y: 1 });
});

Deno.test("gl from start of row goes to end", () => {
    const g = makeGrid("..T..");
    g.playerPos = { x: 0, y: 0 };
    const result = cmd.gotoLineEnd(g);
    assertEquals(result, { x: 4, y: 0 });
});

Deno.test("gl when row is all walls returns null", () => {
    const g = makeMultiLineGrid(["####", "####", "####"]);
    g.playerPos = { x: 2, y: 1 };
    const result = cmd.gotoLineEnd(g);
    assertEquals(result, null);
});

Deno.test("gl updates player x but not y", () => {
    const g = makeMultiLineGrid(["T...", ".#..", "...T"]);
    g.playerPos = { x: 0, y: 1 };
    cmd.gotoLineEnd(g);
    assertEquals(g.playerPos, { x: 3, y: 1 });
});

Deno.test("gl on bottom row goes to last non-wall", () => {
    const g = makeGrid("..T.#");
    g.playerPos = { x: 2, y: 0 };
    const result = cmd.gotoLineEnd(g);
    assertEquals(result, { x: 3, y: 0 });
});

// --- Tests: line selection ---

Deno.test("x returns selectLine action (for use in SELECT mode)", () => {
    const g = makeMultiLineGrid(["abc", "def"]);
    g.playerPos = { x: 0, y: 0 };
    const testCmd = new HelixCommands();
    const result = testCmd.executeSingle('x', g);
    assertEquals(result.action, 'selectLine');
    assertEquals(result.line, 0);
});
