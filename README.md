# Helixert

A browser-based game that teaches [Helix editor](https://helix-editor.com/)
keybindings through 16 focused levels. Helix uses **noun-verb** semantics — you
select text first, then operate on it.

Inspired by [vimMaster](https://github.com/renzorlive/vimmaster).

## How to Play

```sh
# With Deno
deno task dev
# Then open http://localhost:3000
```

Or serve statically with any HTTP server (ES6 modules require a server, not
`file://`).

## What You'll Learn

| Level | Name                 | Commands            |
| ----- | -------------------- | ------------------- |
| 1     | How to Exit          | `:q`, `:wq`         |
| 2     | Basic Movement       | `h`, `j`, `k`, `l`  |
| 3     | Word Movement        | `w`, `b`, `e`       |
| 4     | Line Jumps           | `gg`, `ge`          |
| 5     | Line Bounds          | `0`, `$`, `^`       |
| 6     | Select a Line        | `x` (select line)   |
| 7     | Delete Selection     | `x` → `d`           |
| 8     | Select & Delete Word | `w` → `d`           |
| 9     | Yank & Paste         | `x` → `y`, then `p` |
| 10    | Find Character       | `f{char}`           |
| 11    | Insert Mode          | `a`, `Esc`          |
| 12    | Append & Open Lines  | `o`, `O`            |
| 13    | Change Selection     | `x`/`v` → `c`       |
| 14    | Undo & Redo          | `u`                 |
| 15    | Counts               | `3w`                |
| 16    | Replace Character    | `r{char}`           |

## Helix vs Vim

Helix uses **noun-verb** order (opposite of Vim):

| Vim (verb-noun)   | Helix (noun-verb)       |
| ----------------- | ----------------------- |
| `dd` delete line  | `x` select → `d` delete |
| `dw` delete word  | `w` move → `d` delete   |
| `yy` yank line    | `x` select → `y` yank   |
| `ciw` change word | `v` select → `c` change |

## Tech Stack

- Vanilla HTML/CSS/JavaScript (ES6 modules)
- Tailwind CSS (CDN)
- Deno for development server
- No frameworks, no build step

## Credits

- Inspired by: [vimMaster](https://github.com/renzorlive/vimmaster),
  [VimScoops](https://vimscoops.dev/game)
- Helix editor: [helix-editor.com](https://helix-editor.com/)
