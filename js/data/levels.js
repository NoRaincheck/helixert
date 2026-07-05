const Levels = [
    // ========== WORLD 0: First Steps (Basic Movement) ==========
    {
        id: 'w0-1',
        world: 0,
        name: 'Hello, Helix!',
        description: 'Use h, j, k, l to reach the food',
        commands: ['h', 'j', 'k', 'l'],
        par: 5,
        wizard: 3,
        grid: {
            width: 7,
            height: 6,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S....#',
                '#..X..#',
                '#...T.#',
                '#...X.#',
                '#######',
            ]
        }
    },
    {
        id: 'w0-2',
        world: 0,
        name: 'The Long Street',
        description: 'Use g to goto the start or end of the street.',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 8,
        wizard: 5,
        grid: {
            width: 17,
            height: 3,
            start: { x: 8, y: 1 },
            tiles: [
                '#################',
                'T....X..S..X....T',
                '#################',
            ]
        }
    },
    {
        id: 'w0-3',
        world: 0,
        name: 'Word Hops',
        description: 'Use w, b, e to jump between items',
        commands: ['w'],
        par: 8,
        wizard: 6,
        grid: {
            width: 17,
            height: 1,
            start: { x: 0, y: 0 },
            tiles: [
                'S...T...T...T...T',
            ]
        }
    },
    {
        id: 'w0-4',
        world: 0,
        name: 'There and back',
        description: 'w hops forward, b hops back. Weave the round and serve every stop.',
        commands: ['h', 'j', 'k', 'l', 'w', 'b'],
        par: 4,
        wizard: 2,
        grid: {
            width: 13,
            height: 2,
            start: { x: 0, y: 0 },
            tiles: [
                'S...T...T...#',
                '#...T...T...#',
            ]
        }
    },
    {
        id: 'w0-5',
        world: 0,
        name: 'Rush Hour',
        description: 'Big map! Use counts like 3j to cover ground fast, and ge (goto end) to drop to the bottom.',
        commands: ['h', 'j', 'k', 'l', 'g', 'e'],
        par: 8,
        wizard: 6,
        grid: {
            width: 16,
            height: 8,
            start: { x: 0, y: 0 },
            tiles: [
                'T###############',
                '################',
                '################',
                '#######T########',
                '################',
                '################',
                '################',
                '###############T',
            ]
        }
    },

    // ========== WORLD 1: Learning the Routes (Counts & Goto) ==========
    {
        id: 'w1-1',
        world: 1,
        name: 'Count On',
        description: 'Chain motions: w forward, gl to the far curb, ge to the start of the line, b back. Plan the loop.',
        commands: ['w', 'g'],
        par: 3,
        wizard: 2,
        grid: {
            width: 13,
            height: 3,
            start: { x: 0, y: 0 },
            tiles: [
                '#...T...T...#',
                '#...........T',
                '#...T...T...#',
            ]
        }
    },
    {
        id: 'w1-2',
        world: 1,
        name: 'Express Elevator',
        description: 'gg jumps to the top row, ge drops to the bottom. Skip the middle floors.',
        commands: ['g'],
        par: 6,
        wizard: 4,
        grid: {
            width: 6,
            height: 6,
            start: { x: 3, y: 2 },
            tiles: [
                'T.....',
                '....X.',
                '.X....',
                '...X..',
                'T.....',
            ]
        }
    },
    {
        id: 'w1-3',
        world: 1,
        name: 'Precision Parking',
        description: 'Each block is a queue of bystanders (X); only the last one is a customer (C). e parks on the END of the block, right on them.',
        commands: ['e'],
        par: 3,
        wizard: 2,
        grid: {
            width: 16,
            height: 1,
            start: { x: 0, y: 0 },
            tiles: [
                '#...XT...XXT...XT',
            ]
        }
    },
    {
        id: 'w1-4',
        world: 1,
        name: 'Downtown Dash',
        description: 'w serves each block you land on. Counts skip customers, so tap it out.',
        commands: ['w'],
        par: 6,
        wizard: 8,
        grid: {
            width: 17,
            height: 3,
            start: { x: 0, y: 0 },
            tiles: [
                '#...T...T...T...T',
                '.................',
                '................T',
            ]
        }
    },
    {
        id: 'w1-5',
        world: 1,
        name: 'Kerb to Kerb',
        description: 'g (goto) start of line and end of line (h/l)',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 12,
        wizard: 10,
        grid: {
            width: 10,
            height: 3,
            start: { x: 0, y: 0 },
            tiles: [
                '...T..X..T',
                '...T.X...T',
                '...T...X.T',
            ]
        }
    },

    // ========== WORLD 2: The Stock Room (Edit the Buffer) ==========
    {
        id: 'w2-1',
        world: 2,
        name: 'Clear the Plate',
        description: "Delete entire lines of doors to clear the plate. Position on a door and press dd to delete the line. Transform 'chocolate cake --> ' into nothing.",
        commands: ['h', 'j', 'k', 'l', 'd'],
        par: 4,
        wizard: 2,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#SDDDD.#',
                '#......#',
                '#DDDD..#',
                '#..TTT.#',
                '########',
            ]
        }
    },
    {
        id: 'w2-2',
        world: 2,
        name: 'Trim the Frosting',
        description: "Trim excess by deleting from cursor to end of line. Position on a door and press d$ to delete to end. Transform 'strawberry tart --> ' by trimming the excess.",
        commands: ['h', 'j', 'k', 'l', 'd', '$'],
        par: 6,
        wizard: 3,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S..DDD#',
                '#......#',
                '#..D..T#',
                '#......#',
                '########',
            ]
        }
    },
    {
        id: 'w2-3',
        world: 2,
        name: 'Yank & Stack',
        description: "Copy a line of doors and paste it elsewhere. Use y to yank the current line, move, then p to paste. Copy 'vanilla cream --> ' and stack it.",
        commands: ['h', 'j', 'k', 'l', 'y', 'p'],
        par: 5,
        wizard: 2,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#SDDDD.#',
                '#......#',
                '#......#',
                '#..TTT.#',
                '########',
            ]
        }
    },
    {
        id: 'w2-4',
        world: 2,
        name: 'The Right Portion',
        description: "Use text objects for precision. Position on a door and press diw to delete inside a word, or daw to delete around a word. Select the right portion of 'mousse --> '.",
        commands: ['h', 'j', 'k', 'l', 'd', 'i', 'a', 'w'],
        par: 8,
        wizard: 4,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#SDDDD.#',
                '#......#',
                '#DDDD..#',
                '#..TTT.#',
                '########',
            ]
        }
    },
    {
        id: 'w2-5',
        world: 2,
        name: 'Master Chef',
        description: "Combine all editing commands to complete the dessert. Use dd, d$, y, p, diw, daw to transform 'Manifest --> Target' into the final recipe.",
        commands: ['h', 'j', 'k', 'l', 'd', 'y', 'p', 'i', 'a', 'w', '$'],
        par: 12,
        wizard: 5,
        grid: {
            width: 10,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '##########',
                '#SDDDD..T#',
                '#........#',
                '#DDDD..D.#',
                '#..TTT...#',
                '##########',
            ]
        }
    },

    // ========== WORLD 3: Scoops & Dops (Editing Commands) ==========
    {
        id: 'w3-1',
        world: 3,
        name: 'Replace & Reveal',
        description: 'Use r<char> to replace characters',
        commands: ['h', 'j', 'k', 'l', 'r'],
        par: 4,
        wizard: 2,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S..D.T#',
                '#......#',
                '#T.....#',
                '########',
            ]
        }
    },
    {
        id: 'w3-2',
        world: 3,
        name: 'Delete & Destroy',
        description: 'Use d to delete characters',
        commands: ['h', 'j', 'k', 'l', 'd'],
        par: 5,
        wizard: 3,
        grid: {
            width: 7,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S.D..#',
                '#...D.#',
                '#....T#',
                '#######',
            ]
        }
    },
    {
        id: 'w3-3',
        world: 3,
        name: 'Line Select',
        description: 'Use x to select entire lines',
        commands: ['h', 'j', 'k', 'l', 'x', 'd'],
        par: 5,
        wizard: 3,
        grid: {
            width: 7,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S.D..#',
                '#.....#',
                '#....T#',
                '#######',
            ]
        }
    },
    {
        id: 'w3-4',
        world: 3,
        name: 'Undo Trick',
        description: 'Use u to undo and try different paths',
        commands: ['h', 'j', 'k', 'l', 'd', 'u'],
        par: 6,
        wizard: 4,
        grid: {
            width: 7,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S.D..#',
                '#...D.#',
                '#....T#',
                '#######',
            ]
        }
    },
    {
        id: 'w3-5',
        world: 3,
        name: 'Edit Master',
        description: 'Combine r, d, c to reshape the maze',
        commands: ['h', 'j', 'k', 'l', 'r', 'd', 'c'],
        par: 8,
        wizard: 5,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S.D.T.#',
                '#...D..#',
                '#T.....#',
                '########',
            ]
        }
    },

    // ========== WORLD 4: Selection Station (Advanced Selection) ==========
    {
        id: 'w4-1',
        world: 4,
        name: 'Visual Range',
        description: 'Use v to enter select mode and extend selection',
        commands: ['h', 'j', 'k', 'l', 'v', 'd'],
        par: 5,
        wizard: 3,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S..X.T#',
                '#......#',
                '#T.....#',
                '########',
            ]
        }
    },
    {
        id: 'w4-2',
        world: 4,
        name: 'Collapse',
        description: 'Use ; to collapse selection',
        commands: ['h', 'j', 'k', 'l', 'v', ';', 'd'],
        par: 6,
        wizard: 4,
        grid: {
            width: 7,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S.X.X#',
                '#....T#',
                '#T....#',
                '#######',
            ]
        }
    },
    {
        id: 'w4-3',
        world: 4,
        name: 'Select All',
        description: 'Use % to select the entire file',
        commands: ['h', 'j', 'k', 'l', 'v', '%', 'd'],
        par: 4,
        wizard: 2,
        grid: {
            width: 7,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '#######',
                '#S.D.T#',
                '#.....#',
                '#T....#',
                '#######',
            ]
        }
    },
    {
        id: 'w4-4',
        world: 4,
        name: 'Swap & Dance',
        description: 'Use ~ to swap case and v for visual selection',
        commands: ['h', 'j', 'k', 'l', 'v', '~', 'd'],
        par: 5,
        wizard: 3,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S..X.T#',
                '#......#',
                '#.T..X.#',
                '########',
            ]
        }
    },
    {
        id: 'w4-5',
        world: 4,
        name: 'Selection Pro',
        description: 'Master visual selection to navigate',
        commands: ['h', 'j', 'k', 'l', 'v', ';', '%', 'd', 'r'],
        par: 8,
        wizard: 5,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S.D.T.#',
                '#..D...#',
                '#T.....#',
                '########',
            ]
        }
    },

    // ========== WORLD 5: Goto Galaxy (Navigation Mastery) ==========
    {
        id: 'w5-1',
        world: 5,
        name: 'Jump to Start',
        description: 'Use gg to jump to the top of the map',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 3,
        wizard: 2,
        grid: {
            width: 6,
            height: 6,
            start: { x: 3, y: 4 },
            tiles: [
                '######',
                '#T...#',
                '#....#',
                '#....#',
                '#..S.#',
                '######',
            ]
        }
    },
    {
        id: 'w5-2',
        world: 5,
        name: 'Jump to End',
        description: 'Use ge to jump to the end of the file',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 3,
        wizard: 2,
        grid: {
            width: 6,
            height: 6,
            start: { x: 3, y: 1 },
            tiles: [
                '######',
                '#..S.#',
                '#....#',
                '#....#',
                '#T...#',
                '######',
            ]
        }
    },
    {
        id: 'w5-3',
        world: 5,
        name: 'Edge Jumper',
        description: 'Use gh and gl to jump to line edges',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 5,
        wizard: 3,
        grid: {
            width: 8,
            height: 5,
            start: { x: 4, y: 2 },
            tiles: [
                '########',
                '#T....T#',
                '#...S..#',
                '#......#',
                '########',
            ]
        }
    },
    {
        id: 'w5-4',
        world: 5,
        name: 'Floor Markers',
        description: 'Use gf to jump to floor marks',
        commands: ['h', 'j', 'k', 'l', 'g'],
        par: 5,
        wizard: 3,
        grid: {
            width: 8,
            height: 5,
            start: { x: 1, y: 1 },
            tiles: [
                '########',
                '#S..F.T#',
                '#......#',
                '#..F.T.#',
                '########',
            ]
        }
    },
    {
        id: 'w5-5',
        world: 5,
        name: 'Helix Master',
        description: 'Combine all commands to conquer the final maze!',
        commands: ['h', 'j', 'k', 'l', 'w', 'b', 'e', 'f', 'F', 't', 'T', 'g', 'd', 'r'],
        par: 8,
        wizard: 5,
        grid: {
            width: 10,
            height: 6,
            start: { x: 1, y: 1 },
            tiles: [
                '##########',
                '#S..T..T.#',
                '#........#',
                '#.T....T.#',
                '#........#',
                '##########',
            ]
        }
    }
];
