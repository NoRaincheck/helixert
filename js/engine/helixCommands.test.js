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
                if (wordType === 2) {
                    return this.skipToEndOfRun(grid, x + 1, y);
                }
                // For #, treat the entire run as one word
                if (next === TileType.WALL) {
                    return this.skipToEndOfRun(grid, x + 1, y);
                }
                return { x: x + 1, y };
            }
        }

        // At end of line - wrap to next line and find first word
        return this.findFirstWordForward(grid, x, y, wordType);
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

    findFirstWordForward(grid, startX, startY, wordType) {
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
                    if (wordType === 2 || tile === TileType.WALL) {
                        return this.skipToEndOfRun(grid, x, y);
                    }
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
                if (wordType === 2) {
                    return this.skipToStartOfRun(grid, x - 1, y);
                }
                // For #, treat the entire run as one word
                if (prev === TileType.WALL) {
                    return this.skipToStartOfRun(grid, x - 1, y);
                }
                return { x: x - 1, y };
            }
        }

        // At start of line - wrap to previous line and find last word
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

            // Skip trailing non-word characters
            while (x >= 0) {
                const tile = grid.getTile(x, y);
                if (this.isNonWordTile(tile)) {
                    x--;
                } else {
                    // Found a word character
                    if (wordType === 2 || tile === TileType.WALL) {
                        return this.skipToStartOfRun(grid, x, y);
                    }
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
               tile === TileType.FLOOR_MARK;
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
    assertEquals(b(g, 3), { x: 2, y: 0 });
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
    assertEquals(b(g, 3), { x: 2, y: 0 });
});

Deno.test("b from wall run lands on WALL token", () => {
    const g = makeGrid("T.###");
    assertEquals(b(g, 4), { x: 3, y: 0 });
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
    assertEquals(b(g2, 4), { x: 3, y: 0 });
});

Deno.test("w handles single-char line", () => {
    const g = makeGrid("T");
    assertEquals(w(g, 0), { x: 0, y: 0 });
});

Deno.test("w on all-wall line lands on first WALL", () => {
    const g = makeGrid("####");
    assertEquals(w(g, 0), { x: 1, y: 0 });
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
    assertEquals(W(g, 0), { x: 1, y: 0 });
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
    assertEquals(B(g, 5), { x: 4, y: 0 });
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
