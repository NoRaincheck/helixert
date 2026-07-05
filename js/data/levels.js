const Levels = [
    // ========== WORLD 1: First Steps (Basic Movement) ==========
    {
        id: 'w1-1',
        world: 1,
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
        id: 'w1-2',
        world: 1,
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
        id: 'w1-3',
        world: 1,
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
        id: 'w1-4',
        world: 1,
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
        id: 'w1-5',
        world: 1,
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

    // ========== WORLD 2: Learning the Routes (Counts & Goto) ==========
    {
        id: 'w2-1',
        world: 2,
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
        id: 'w2-2',
        world: 2,
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
        id: 'w2-3',
        world: 2,
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
        id: 'w2-4',
        world: 2,
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
        id: 'w2-5',
        world: 2,
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

    // ========== WORLD 3: Character Hunt (Find & Till) ==========
    {
        id: 'w3-1',
        world: 3,
        name: 'Find Right',
        description: 'Use f<char> to find a character forward',
        commands: ['h', 'j', 'k', 'l', 'f'],
        par: 3,
        wizard: 2,
        grid: {
            width: 10,
            height: 5,
            start: { x: 1, y: 2 },
            tiles: [
                '##########',
                '#........#',
                '#S.X....T#',
                '#........#',
                '##########',
            ]
        }
    },
    {
        id: 'w3-2',
        world: 3,
        name: 'Find Left',
        description: 'Use F<char> to find a character backward',
        commands: ['h', 'j', 'k', 'l', 'f', 'F'],
        par: 3,
        wizard: 2,
        grid: {
            width: 10,
            height: 5,
            start: { x: 8, y: 2 },
            tiles: [
                '##########',
                '#........#',
                '#T....X.S#',
                '#........#',
                '##########',
            ]
        }
    },
    {
        id: 'w3-3',
        world: 3,
        name: 'Till There',
        description: 'Use t<char> to stop just before a character',
        commands: ['h', 'j', 'k', 'l', 'f', 't'],
        par: 3,
        wizard: 2,
        grid: {
            width: 10,
            height: 5,
            start: { x: 1, y: 2 },
            tiles: [
                '##########',
                '#........#',
                '#S.X....T#',
                '#........#',
                '##########',
            ]
        }
    },
    {
        id: 'w3-4',
        world: 3,
        name: 'Till Back',
        description: 'Use T<char> to stop just after a backward character',
        commands: ['h', 'j', 'k', 'l', 'f', 'F', 't', 'T'],
        par: 3,
        wizard: 2,
        grid: {
            width: 10,
            height: 5,
            start: { x: 8, y: 2 },
            tiles: [
                '##########',
                '#........#',
                '#T....X.S#',
                '#........#',
                '##########',
            ]
        }
    },
    {
        id: 'w3-5',
        world: 3,
        name: 'Repeat Seeker',
        description: 'Use ; and , to repeat find motions',
        commands: ['h', 'j', 'k', 'l', 'f', 'F', 't', 'T', ';', ','],
        par: 5,
        wizard: 3,
        grid: {
            width: 12,
            height: 5,
            start: { x: 1, y: 2 },
            tiles: [
                '############',
                '#..........#',
                '#S.X.X.X..T#',
                '#..........#',
                '############',
            ]
        }
    },

    // ========== WORLD 4: Scoops & Dops (Editing Commands) ==========
    {
        id: 'w4-1',
        world: 4,
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
        id: 'w4-2',
        world: 4,
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
        id: 'w4-3',
        world: 4,
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
        id: 'w4-4',
        world: 4,
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
        id: 'w4-5',
        world: 4,
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

    // ========== WORLD 5: Selection Station (Advanced Selection) ==========
    {
        id: 'w5-1',
        world: 5,
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
        id: 'w5-2',
        world: 5,
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
        id: 'w5-3',
        world: 5,
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
        id: 'w5-4',
        world: 5,
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
        id: 'w5-5',
        world: 5,
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

    // ========== WORLD 6: Goto Galaxy (Navigation Mastery) ==========
    {
        id: 'w6-1',
        world: 6,
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
        id: 'w6-2',
        world: 6,
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
        id: 'w6-3',
        world: 6,
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
        id: 'w6-4',
        world: 6,
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
        id: 'w6-5',
        world: 6,
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
