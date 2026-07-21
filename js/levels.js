// Helixert — Level Definitions (45 levels across 9 worlds)
// Helix uses noun-verb: select first, then operate.

import { worlds } from "./worlds.js";

export { worlds };

// Each level: { world, name, instructions, initialContent, target/targetText/targetContent/validation, setup, commands, par, wizard }
// Validation targets:
//   target: { row, col } — cursor must land here
//   targetText: { line, text } — exact line content match
//   targetContent: [lines] — full content match (normalized)
//   validation: (state) => boolean — custom check

export const levels = [
  // ============================================================
  // WORLD 0 — First Steps (Basic Movement)
  // ============================================================
  {
    world: 0,
    name: "Learning to Drive",
    instructions:
      'Use <kbd class="kbd">h</kbd> <kbd class="kbd">j</kbd> <kbd class="kbd">k</kbd> <kbd class="kbd">l</kbd> to move. Reach the <kbd class="kbd">$</kbd> character.',
    initialContent: [
      "Move with h(left), j(down), k(up), l(right).",
      "Your cursor starts here.",
      "",
      "The goal is to navigate to the dollar sign below.",
      "Practice moving around the text.",
      "Find the $",
    ],
    target: { row: 5, col: 9 },
    setup: (s) => {
      s.cursor = { row: 1, col: 5 };
    },
    commands: ["h", "j", "k", "l"],
    par: 10,
    wizard: 5,
  },
  {
    world: 0,
    name: "The Long Street",
    instructions:
      'Use <kbd class="kbd">g</kbd><kbd class="kbd">h</kbd> to jump to line start, <kbd class="kbd">g</kbd><kbd class="kbd">l</kbd> to jump to line end. Navigate to the end of the first line.',
    initialContent: [
      "Jump to the start and end of this line.",
      "Practice makes perfect.",
    ],
    target: { row: 0, col: 38 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["g", "h", "l"],
    par: 4,
    wizard: 2,
  },
  {
    world: 0,
    name: "Hop the Blocks",
    instructions:
      'Use <kbd class="kbd">w</kbd> to jump forward by word. Land on each target.',
    initialContent: [
      "S...T...T...T...T",
    ],
    target: { row: 0, col: 16 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["w"],
    par: 5,
    wizard: 4,
  },
  {
    world: 0,
    name: "There and Back",
    instructions:
      '<kbd class="kbd">w</kbd> hops forward, <kbd class="kbd">b</kbd> hops back. Navigate to the last target.',
    initialContent: [
      "S...T...T...T",
      "#...T...T...T",
    ],
    target: { row: 1, col: 12 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["w", "b"],
    par: 6,
    wizard: 4,
  },
  {
    world: 0,
    name: "Rush Hour",
    instructions:
      'Big file! Use counts like <kbd class="kbd">3j</kbd> to cover ground fast.',
    initialContent: [
      "Line 1 - start here",
      "Line 2",
      "Line 3",
      "Line 4 - target!",
      "Line 5",
      "Line 6",
      "Line 7",
      "Line 8 - end",
    ],
    target: { row: 3, col: 15 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["j", "k", "3"],
    par: 4,
    wizard: 2,
  },

  // ============================================================
  // WORLD 1 — Navigation (Advanced Movement)
  // ============================================================
  {
    world: 1,
    name: "The Scenic Route",
    instructions:
      'Chain motions: <kbd class="kbd">w</kbd> forward by word, <kbd class="kbd">j</kbd> down. Reach the target word.',
    initialContent: [
      "The quick brown",
      "fox jumps over",
      "the lazy dog",
    ],
    target: { row: 2, col: 9 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["w", "j"],
    par: 6,
    wizard: 4,
  },
  {
    world: 1,
    name: "Express Elevator",
    instructions:
      'Use <kbd class="kbd">gg</kbd> to jump to the top, <kbd class="kbd">ge</kbd> to jump to the bottom.',
    initialContent: [
      "Line 1 — top (gg here)",
      "Line 2",
      "Line 3",
      "Line 4",
      "Line 5 — bottom (ge here)",
    ],
    target: { row: 4, col: 0 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 2, col: 0 };
    },
    commands: ["g", "g", "e"],
    par: 4,
    wizard: 2,
  },
  {
    world: 1,
    name: "Precision Parking",
    instructions:
      'Use <kbd class="kbd">e</kbd> to jump to the end of the current word. Land on the last letter of "destination".',
    initialContent: [
      "Find the destination of this journey",
    ],
    target: { row: 0, col: 22 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["e"],
    par: 4,
    wizard: 3,
  },
  {
    world: 1,
    name: "Downtown Dash",
    instructions:
      'Use <kbd class="kbd">w</kbd> to skip words fast, <kbd class="kbd">ge</kbd> to jump to bottom. Combine motions to reach the target.',
    initialContent: [
      "one two three four five",
      "six seven eight nine ten",
      "TARGET is on this line",
    ],
    target: { row: 2, col: 21 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["w", "ge"],
    par: 5,
    wizard: 3,
  },
  {
    world: 1,
    name: "Kerb to Kerb",
    instructions:
      'Use <kbd class="kbd">w</kbd> to hop by word, <kbd class="kbd">j</kbd> to move down. Navigate to the target.',
    initialContent: [
      "alpha beta gamma",
      "delta epsilon zeta",
      "eta theta iota",
    ],
    target: { row: 2, col: 10 },
    targetWord: true,
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["w", "j"],
    par: 8,
    wizard: 5,
  },

  // ============================================================
  // WORLD 2 — The Stock Room (Select & Delete — Noun-Verb)
  // ============================================================
  {
    world: 2,
    name: "Select a Line",
    instructions:
      'In Helix, <kbd class="kbd">x</kbd> selects the entire line. Press x to select the middle line.',
    initialContent: [
      "Keep this line.",
      "Select this entire line.",
      "Keep this line too.",
    ],
    targetContent: [
      "Keep this line.",
      "Select this entire line.",
      "Keep this line too.",
    ],
    setup: (s) => {
      s.cursor = { row: 1, col: 0 };
    },
    validation: (s) => s.usedSelectLine,
    commands: ["x"],
    par: 1,
    wizard: 1,
  },
  {
    world: 2,
    name: "Restock Run",
    instructions:
      'Helix noun-verb: <kbd class="kbd">x</kbd> to select, then <kbd class="kbd">d</kbd> to delete. Delete the expired line.',
    initialContent: [
      "Keep this.",
      "DELETE this line.",
      "Keep this too.",
    ],
    targetContent: [
      "Keep this.",
      "Keep this too.",
    ],
    setup: (s) => {
      s.cursor = { row: 1, col: 0 };
    },
    commands: ["x", "d"],
    par: 2,
    wizard: 1,
  },
  {
    world: 2,
    name: "Clear the Expired",
    instructions:
      'Delete multiple lines. Select with <kbd class="kbd">x</kbd>, delete with <kbd class="kbd">d</kbd>. Remove all "expired" items.',
    initialContent: [
      "milk — fresh",
      "bread — expired",
      "eggs — fresh",
      "cheese — expired",
      "butter — fresh",
    ],
    targetContent: [
      "milk — fresh",
      "eggs — fresh",
      "butter — fresh",
    ],
    setup: (s) => {
      s.cursor = { row: 1, col: 0 };
    },
    commands: ["x", "d"],
    par: 6,
    wizard: 3,
  },
  {
    world: 2,
    name: "Fix the Chocolate",
    instructions:
      'Move to each <kbd class="kbd">!</kbd> and press <kbd class="kbd">d</kbd> to delete it.',
    initialContent: [
      "choc!!!!olate",
      "strawberry",
    ],
    targetContent: [
      "chocolate",
      "strawberry",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 4 };
    },
    commands: ["h", "l", "d"],
    par: 5,
    wizard: 3,
  },
  {
    world: 2,
    name: "Undo Mistake",
    instructions:
      'Delete a line with <kbd class="kbd">x</kbd> + <kbd class="kbd">d</kbd>, then undo with <kbd class="kbd">u</kbd>. The line should end up restored.',
    initialContent: [
      "Top line.",
      "Do not delete me!",
      "Bottom line.",
    ],
    targetContent: [
      "Top line.",
      "Do not delete me!",
      "Bottom line.",
    ],
    setup: (s) => {
      s.cursor = { row: 1, col: 0 };
    },
    validation: (s) => s.usedSelectLine, // Must have used x (even if undone)
    commands: ["x", "d", "u"],
    par: 4,
    wizard: 3,
  },

  // ============================================================
  // WORLD 3 — The Flavour Shelf (Replace & Swap)
  // ============================================================
  {
    world: 3,
    name: "Wrong Scoop",
    instructions:
      'Use <kbd class="kbd">r</kbd> + a character to replace under the cursor.',
    initialContent: [
      "The qyick brown fox",
    ],
    targetContent: [
      "The quick brown fox",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 5 };
    },
    commands: ["r"],
    par: 2,
    wizard: 1,
  },
  {
    world: 3,
    name: "Restamp the Row",
    instructions: 'Replace multiple characters with <kbd class="kbd">r</kbd>.',
    initialContent: [
      "X-X-X-X-X",
    ],
    targetContent: [
      "O-O-O-O-O",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["r", "l"],
    par: 10,
    wizard: 6,
  },
  {
    world: 3,
    name: "Swap the Cones",
    instructions:
      'Swap two characters: <kbd class="kbd">v</kbd> to select, move to extend, <kbd class="kbd">d</kbd> to delete (yanks), then <kbd class="kbd">p</kbd> to paste.',
    initialContent: [
      "AB",
    ],
    targetContent: [
      "BA",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["v", "l", "d", "p"],
    par: 4,
    wizard: 3,
  },
  {
    world: 3,
    name: "Rebuild the Cabinet",
    instructions:
      'Combine <kbd class="kbd">r</kbd>, <kbd class="kbd">x</kbd>, and <kbd class="kbd">d</kbd> to reshape.',
    initialContent: [
      "foo---bar",
    ],
    targetContent: [
      "foo bar",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 3 };
    },
    commands: ["r", "x", "d"],
    par: 5,
    wizard: 3,
  },
  {
    world: 3,
    name: "Batch Restock",
    instructions:
      'Use <kbd class="kbd">%</kbd> to select all, <kbd class="kbd">s</kbd> to search within selection, then <kbd class="kbd">c</kbd> to change.',
    initialContent: [
      "aaa bbb ccc",
    ],
    targetContent: [
      "xxx bbb yyy",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["%", "s", "c"],
    par: 22,
    wizard: 2,
  },

  // ============================================================
  // WORLD 4 — The Express Lane (Find & Till)
  // ============================================================
  {
    world: 4,
    name: "Straight to the Door",
    instructions:
      'Use <kbd class="kbd">f</kbd> + a character to jump to it on the same line. Find the "@" symbol.',
    initialContent: [
      "email: user@example.com",
    ],
    target: { row: 0, col: 11 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["f"],
    par: 2,
    wizard: 1,
  },
  {
    world: 4,
    name: "Fly and Flip",
    instructions:
      'Use <kbd class="kbd">F</kbd> + char to find backward. Navigate to the opening bracket.',
    initialContent: [
      "function(param) { return param; }",
    ],
    target: { row: 0, col: 8 },
    setup: (s) => {
      s.cursor = { row: 0, col: 15 };
    },
    commands: ["F"],
    par: 2,
    wizard: 1,
  },
  {
    world: 4,
    name: "Bracket the Row",
    instructions:
      'Use <kbd class="kbd">t</kbd> to land just before a character (till). Find the position before the closing paren.',
    initialContent: [
      "(content here)",
    ],
    target: { row: 0, col: 13 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["t"],
    par: 2,
    wizard: 1,
  },
  {
    world: 4,
    name: "Find the Flavour",
    instructions:
      'Use <kbd class="kbd">f</kbd> then <kbd class="kbd">r</kbd> to find a char and replace the next one. Fix the misspelling.',
    initialContent: [
      "I love chocate",
    ],
    targetContent: [
      "I love chocolate",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["f", "r"],
    par: 4,
    wizard: 2,
  },
  {
    world: 4,
    name: "The Grand Round",
    instructions:
      'Combine <kbd class="kbd">f</kbd>, <kbd class="kbd">F</kbd>, <kbd class="kbd">;</kbd> to navigate. Find and replace all typos.',
    initialContent: [
      "fix ths and ths and ths",
    ],
    targetContent: [
      "fix this and this and this",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["f", "r", "l"],
    par: 12,
    wizard: 8,
  },

  // ============================================================
  // WORLD 5 — The Order Book (Insert Mode)
  // ============================================================
  {
    world: 5,
    name: "Fix the Label",
    instructions:
      'Press <kbd class="kbd">i</kbd> to insert before cursor. Type " is awesome!" then <kbd class="kbd">Esc</kbd>.',
    initialContent: [
      "Helix has multiple modes.",
      "You have been in NORMAL mode.",
      "Learning Helix",
    ],
    targetText: { line: 2, text: "Learning Helix is awesome!" },
    setup: (s) => {
      s.cursor = { row: 2, col: 13 };
    },
    commands: ["i", "Esc"],
    par: 14,
    wizard: 12,
  },
  {
    world: 5,
    name: "Append the Order",
    instructions:
      'Use <kbd class="kbd">a</kbd> to append after cursor, <kbd class="kbd">A</kbd> to append at line end. Complete the sentence.',
    initialContent: [
      "The answer is",
    ],
    targetText: { line: 0, text: "The answer is 42" },
    setup: (s) => {
      s.cursor = { row: 0, col: 13 };
    },
    commands: ["a", "A"],
    par: 4,
    wizard: 3,
  },
  {
    world: 5,
    name: "New Line on the Board",
    instructions:
      'Use <kbd class="kbd">o</kbd> to open a line below, <kbd class="kbd">O</kbd> above. Insert "new line" between the two lines.',
    initialContent: [
      "First line.",
      "Second line.",
    ],
    targetContent: [
      "First line.",
      "new line",
      "Second line.",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 5 };
    },
    commands: ["o", "O"],
    par: 5,
    wizard: 3,
  },
  {
    world: 5,
    name: "Rewrite the Card",
    instructions:
      'Use <kbd class="kbd">I</kbd> to insert at line start. Add "TODO: " at the beginning of the line.',
    initialContent: [
      "Fix this bug",
    ],
    targetText: { line: 0, text: "TODO: Fix this bug" },
    setup: (s) => {
      s.cursor = { row: 0, col: 5 };
    },
    commands: ["I"],
    par: 7,
    wizard: 5,
  },
  {
    world: 5,
    name: "Fix the Flavour",
    instructions:
      'Navigate to the word, use <kbd class="kbd">i</kbd> to insert mode, type the correction, <kbd class="kbd">Esc</kbd> to finish.',
    initialContent: [
      "I love banannas",
    ],
    targetText: { line: 0, text: "I love bananas" },
    setup: (s) => {
      s.cursor = { row: 0, col: 10 };
    },
    commands: ["i", "Esc"],
    par: 8,
    wizard: 5,
  },

  // ============================================================
  // WORLD 6 — The Modes Tour (Select Mode)
  // ============================================================
  {
    world: 6,
    name: "Highlight and Cut",
    instructions:
      'Press <kbd class="kbd">v</kbd> to enter SELECT mode, move to extend selection, then <kbd class="kbd">d</kbd> to delete. Remove "TARGET".',
    initialContent: [
      "Keep this word TARGET and this.",
    ],
    targetContent: [
      "Keep this word  and this.",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 15 };
    },
    commands: ["v", "d"],
    par: 5,
    wizard: 3,
  },
  {
    world: 6,
    name: "Copy the Highlight",
    instructions:
      'Select with <kbd class="kbd">v</kbd>, yank with <kbd class="kbd">y</kbd>, move, paste with <kbd class="kbd">p</kbd>. Duplicate "hello".',
    initialContent: [
      "hello world",
    ],
    targetContent: [
      "hello worldhello",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["v", "y", "p"],
    par: 6,
    wizard: 4,
  },
  {
    world: 6,
    name: "Whole Trays",
    instructions:
      'Select entire lines with <kbd class="kbd">x</kbd>, delete with <kbd class="kbd">d</kbd>. Remove the middle line.',
    initialContent: [
      "Keep this.",
      "Delete this line.",
      "Keep this too.",
    ],
    targetContent: [
      "Keep this.",
      "Keep this too.",
    ],
    setup: (s) => {
      s.cursor = { row: 1, col: 0 };
    },
    commands: ["x", "d"],
    par: 2,
    wizard: 1,
  },
  {
    world: 6,
    name: "The Column Restamp",
    instructions:
      'Select a range with <kbd class="kbd">v</kbd>, then <kbd class="kbd">d</kbd> to delete. Remove the bracketed text.',
    initialContent: [
      "remove [this text] please",
    ],
    targetContent: [
      "remove  please",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 7 };
    },
    commands: ["v", "d"],
    par: 4,
    wizard: 2,
  },
  {
    world: 6,
    name: "Rewrite the Highlight",
    instructions:
      'Select with <kbd class="kbd">v</kbd>, change with <kbd class="kbd">c</kbd> (deletes selection, enters INSERT). Replace "old" with "new".',
    initialContent: [
      "the old way is old",
    ],
    targetContent: [
      "the new way is new",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 4 };
    },
    commands: ["v", "c"],
    par: 8,
    wizard: 5,
  },

  // ============================================================
  // WORLD 7 — Spot Check (Search)
  // ============================================================
  {
    world: 7,
    name: "Look It Up",
    instructions:
      'Press <kbd class="kbd">/</kbd> then type a pattern and <kbd class="kbd">Enter</kbd> to search forward. Find "target".',
    initialContent: [
      "find the target here",
      "another line",
      "target appears again",
    ],
    target: { row: 0, col: 9 },
    setup: (s) => {
      s.cursor = { row: 2, col: 0 };
    },
    commands: ["/"],
    par: 8,
    wizard: 5,
  },
  {
    world: 7,
    name: "Next, Please",
    instructions:
      'Search with <kbd class="kbd">/</kbd>, then <kbd class="kbd">n</kbd> to jump to next match. Find the second "target".',
    initialContent: [
      "target first",
      "no match here",
      "target second",
    ],
    target: { row: 2, col: 0 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["/", "n"],
    par: 5,
    wizard: 3,
  },
  {
    world: 7,
    name: "Back and Forth",
    instructions:
      'Search backward with <kbd class="kbd">?</kbd>, navigate with <kbd class="kbd">N</kbd>. Go to the earlier "alpha".',
    initialContent: [
      "alpha here",
      "beta gamma",
      "alpha there",
    ],
    target: { row: 0, col: 0 },
    setup: (s) => {
      s.cursor = { row: 2, col: 5 };
    },
    commands: ["?", "N"],
    par: 5,
    wizard: 3,
  },
  {
    world: 7,
    name: "Search and Destroy",
    instructions:
      'Search for a word with <kbd class="kbd">/</kbd>, navigate to it with <kbd class="kbd">n</kbd>, then delete the line with <kbd class="kbd">x</kbd> + <kbd class="kbd">d</kbd>.',
    initialContent: [
      "keep this",
      "remove me",
      "keep this too",
    ],
    targetContent: [
      "keep this",
      "keep this too",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["/", "n", "x", "d"],
    par: 7,
    wizard: 4,
  },
  {
    world: 7,
    name: "Search Navigation",
    instructions:
      'Search for "foo", then press <kbd class="kbd">n</kbd> twice to reach the third occurrence.',
    initialContent: [
      "foo bar baz",
      "qux foo quux",
      "corge grault foo",
    ],
    target: { row: 2, col: 13 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["/", "n"],
    par: 5,
    wizard: 3,
  },

  // ============================================================
  // WORLD 8 — The Back Office (Advanced Techniques)
  // ============================================================
  {
    world: 8,
    name: "Dot Repeat",
    instructions:
      'Make a change (e.g., <kbd class="kbd">r</kbd> to replace), then <kbd class="kbd">.</kbd> to repeat it. Fix all the X marks.',
    initialContent: [
      "X X X X X",
    ],
    targetContent: [
      "O O O O O",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["r", ".", "l"],
    par: 8,
    wizard: 5,
  },
  {
    world: 8,
    name: "Undo and Redo",
    instructions:
      'Make a change, undo it with <kbd class="kbd">u</kbd>, then redo with <kbd class="kbd">Ctrl+U</kbd>. The text should end up changed.',
    initialContent: [
      "Original text here",
    ],
    targetContent: [
      "Changed text here",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["r", "u"],
    par: 5,
    wizard: 3,
  },
  {
    world: 8,
    name: "Match Bracket",
    instructions:
      'Use <kbd class="kbd">m</kbd> to jump to the matching bracket. Navigate between opening and closing parens.',
    initialContent: [
      "(nested (brackets) here)",
    ],
    target: { row: 0, col: 23 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["m"],
    par: 2,
    wizard: 1,
  },
  {
    world: 8,
    name: "Counts Power",
    instructions:
      'Use counts with operations. <kbd class="kbd">3w</kbd> jumps 3 words, <kbd class="kbd">2x</kbd> selects 2 lines. Reach the target fast.',
    initialContent: [
      "one two three four five",
      "six seven eight nine ten",
      "TARGET is here",
    ],
    target: { row: 2, col: 11 },
    setup: (s) => {
      s.cursor = { row: 0, col: 0 };
    },
    commands: ["3", "w", "j"],
    par: 4,
    wizard: 2,
  },
  {
    world: 8,
    name: "Helix Master",
    instructions:
      "Combine everything: movement, selection, delete, replace, search. Transform the text to match the target.",
    initialContent: [
      "fix the typos: helx is awsome",
      "and search for the target word",
    ],
    targetContent: [
      "fix the typos: helix is awesome",
      "and search for the target word",
    ],
    setup: (s) => {
      s.cursor = { row: 0, col: 16 };
    },
    commands: ["r", "l", "i", "Esc"],
    par: 10,
    wizard: 7,
  },
];

// Helper functions
export function loadLevel(index) {
  if (index < 0 || index >= levels.length) return null;
  return levels[index];
}

export function getLevelCount() {
  return levels.length;
}

export function getLevelsForWorld(worldNum) {
  return levels.filter((l) => l.world === worldNum);
}

export function getWorldForLevel(levelIndex) {
  return levels[levelIndex]?.world ?? 0;
}
