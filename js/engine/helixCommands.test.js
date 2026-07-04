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
}

class HelixCommands {
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

    isNonWordTile(tile) {
        return tile === TileType.EMPTY || tile === TileType.START ||
               tile === TileType.FLOOR_MARK || tile === TileType.WALL;
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

function b(grid, x, y = 0) {
    return cmd.moveWordBackward(grid, x, y, 1);
}

// --- Tests: `w` motion ---

Deno.test("w skips whitespace and lands on first word tile", () => {
    const g = makeGrid("...T...");
    assertEquals(w(g, 0), { x: 3, y: 0 });
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

Deno.test("w skips WALL tiles like EMPTY", () => {
    const g = makeGrid("..#..T..");
    assertEquals(w(g, 0), { x: 5, y: 0 });
});

Deno.test("w skips mixed EMPTY and WALL tiles", () => {
    const g = makeGrid(".#.#.T..");
    assertEquals(w(g, 0), { x: 5, y: 0 });
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

Deno.test("w skips walls to reach target beyond", () => {
    const g = makeGrid("T##T.");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w from last word tile with trailing walls/dots stops at last position", () => {
    const g = makeGrid("T.##");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w from START tile lands on first word", () => {
    const g = makeGrid("S..T.");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w skips walls between word tiles", () => {
    const g = makeGrid("T##*..");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w at grid boundary with only walls after", () => {
    const g = makeGrid("T###");
    assertEquals(w(g, 0), { x: 3, y: 0 });
});

Deno.test("w skips all walls to end of line", () => {
    const g = makeGrid(".####");
    assertEquals(w(g, 0), { x: 4, y: 0 });
});

// --- Tests: `b` motion ---

Deno.test("b skips whitespace backward and lands on word tile", () => {
    const g = makeGrid("T...T...");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

Deno.test("b skips walls backward like EMPTY", () => {
    const g = makeGrid("T##T...");
    assertEquals(b(g, 3), { x: 0, y: 0 });
});

Deno.test("b skips mixed EMPTY and WALL backward", () => {
    const g = makeGrid("T.#.#T.");
    assertEquals(b(g, 5), { x: 0, y: 0 });
});

Deno.test("b at start of line stays in place", () => {
    const g = makeGrid("T....");
    assertEquals(b(g, 0), { x: 0, y: 0 });
});

Deno.test("b from word tile skips trailing whitespace to previous word", () => {
    const g = makeGrid("T...T...");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

Deno.test("b skips walls backward to reach word", () => {
    const g = makeGrid("T##T...");
    assertEquals(b(g, 3), { x: 0, y: 0 });
});

Deno.test("b at end of wall run with word before", () => {
    const g = makeGrid("T.###");
    assertEquals(b(g, 4), { x: 0, y: 0 });
});

// --- Helix-like behavior edge cases ---

Deno.test("w treats # and . identically for skip logic", () => {
    const g1 = makeGrid("T....");
    const g2 = makeGrid("T####");
    assertEquals(w(g1, 0), w(g2, 0));
});

Deno.test("w with alternating . and # behaves same as all-.", () => {
    const g1 = makeGrid("T..T..");
    const g2 = makeGrid("T##T##");
    assertEquals(w(g1, 0), w(g2, 0));
});

Deno.test("b treats # and . identically for skip logic", () => {
    const g1 = makeGrid("T...T");
    const g2 = makeGrid("T###T");
    assertEquals(b(g1, 4), b(g2, 4));
});

Deno.test("w handles single-char line", () => {
    const g = makeGrid("T");
    assertEquals(w(g, 0), { x: 0, y: 0 });
});

Deno.test("w on all-wall line stops at last wall", () => {
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

Deno.test("w wraps and skips walls on next line", () => {
    const g = makeMultiLineGrid(["T.", "#T"]);
    assertEquals(w(g, 1, 0), { x: 1, y: 1 });
});

Deno.test("w wraps to word after mixed whitespace and walls", () => {
    const g = makeMultiLineGrid(["T.", ".#T"]);
    assertEquals(w(g, 1, 0), { x: 2, y: 1 });
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

Deno.test("w wraps through multiple lines to find word", () => {
    const g = makeMultiLineGrid(["T.", "#.", ".T"]);
    assertEquals(w(g, 1, 0), { x: 1, y: 2 });
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

Deno.test("b wraps and skips walls on previous line", () => {
    const g = makeMultiLineGrid(["T#", "T."]);
    assertEquals(b(g, 0, 1), { x: 0, y: 0 });
});

Deno.test("b wraps to word before mixed whitespace and walls", () => {
    const g = makeMultiLineGrid(["T#.", "T.."]);
    assertEquals(b(g, 0, 1), { x: 0, y: 0 });
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

Deno.test("b wraps through multiple lines to find word", () => {
    const g = makeMultiLineGrid([".T", ".#", "T."]);
    assertEquals(b(g, 0, 2), { x: 1, y: 0 });
});
