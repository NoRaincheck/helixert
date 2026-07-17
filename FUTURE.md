# Future Learning Roadmap — Helixert Worlds & Motions

Adapted from [Vim Scoops](https://vimscoops.dev/game) — 45 levels across 9 worlds.
Teaching **Helix** keybindings (noun-verb: select first, then operate), with notes
on differences from Vim.

---

## World 0 — First Day on the Job

> Move the van with h j k l, hop by word, and jump to any line.

| Level | Title             | Teaches            |
| ----- | ----------------- | ------------------ |
| 0-1   | Learning to Drive | `h`, `j`, `k`, `l` |
| 0-2   | The Long Street   | `0`, `$`           |
| 0-3   | Hop the Blocks    | `w`                |
| 0-4   | There and Back    | `w`, `b`           |
| 0-5   | Rush Hour         | `G`, counts (`3j`) |

**Key motions:** `h j k l` basic movement, `0` / `$` line start/end, `w` / `b`
word forward/back, `G` go to line, counts as multiplier.

---

## World 1 — Learning the Routes

> Chain those motions into real routes, with counts and gg / G.

| Level | Title             | Teaches            |
| ----- | ----------------- | ------------------ |
| 1-1   | The Scenic Route  | `w`, `b`, `$`, `j` |
| 1-2   | Express Elevator  | `gg`, `G`          |
| 1-3   | Precision Parking | `e`                |
| 1-4   | Downtown Dash     | `w`, `G`, counts   |
| 1-5   | Kerb to Kerb      | `^`, `$`, `j`      |

**Key motions:** `gg` / `G` top/bottom of file, `e` end of word, `^` first
non-blank char, chaining motions into routes.

---

## World 2 — The Stock Room

> Edit the buffer: delete, yank, paste, and text objects.

| Level | Title                | Teaches                            |
| ----- | -------------------- | ---------------------------------- |
| 2-1   | Spilled Sugar        | `x`, counts                        |
| 2-2   | Restock Run          | `dd`, `p`, `G`                     |
| 2-3   | Clear the Expired    | `dd`, `.` (dot-repeat), `u` (undo) |
| 2-4   | Fix the Labels       | `di"`, `x`, `.`                    |
| 2-5   | Copy the Bestsellers | `yy`, `p`                          |

**Key motions:** `x` delete char, `dd` delete line, `yy` yank line, `p` paste,
`.` repeat last change, `u` undo, `di"` delete inside quotes.

---

## World 3 — The Flavour Shelf

> Replace single characters with `r`, and swap with x and p.

| Level | Title               | Teaches           |
| ----- | ------------------- | ----------------- |
| 3-1   | Wrong Scoop         | `r`               |
| 3-2   | Restamp the Row     | `r`, `l`, `.`     |
| 3-3   | Swap the Cones      | `x`, `p`          |
| 3-4   | Rebuild the Cabinet | `dd`, `p`, `r`    |
| 3-5   | Batch Restock       | counts + `r`, `l` |

**Key motions:** `r{char}` replace single char under cursor (Helix: one char at a
time, same as Vim's `r` — no find-and-replace here).
`x` + `p` for swapping adjacent chars, `count + r` batch replace same char.

> **Helix vs Vim note:** In both Helix and Vim, `r` replaces only the single
> character under the cursor (optionally repeated with a count). Helix does **not**
> have a Vim-style `:s/foo/bar/g` substitute command. For bulk find-and-replace in
> Helix, the idiomatic approach is `%` (select all) → `s{pattern}` (narrow to
> regex matches, creating multi-cursor) → `c` (change all selections). This
> multi-cursor workflow is discussed in [Helix #3630](https://github.com/helix-editor/helix/discussions/3630).

---

## World 4 — The Express Lane

> Fly straight to any letter with f and t, repeat with ; and ,.

| Level | Title                | Teaches            |
| ----- | -------------------- | ------------------ |
| 4-1   | Straight to the Door | `f`, `;`           |
| 4-2   | Fly and Flip         | `f`, `,`           |
| 4-3   | Bracket the Row      | `t`, `T`, `r`, `.` |
| 4-4   | Find the Flavour     | `f`, `;`, `r`, `.` |
| 4-5   | The Grand Round      | `f`, `F`, `;`, `j` |

**Key motions:** `f{char}` find char forward, `F{char}` find char backward,
`t{char}` until char (before), `T{char}` until char backward (after), `;` repeat
find, `,` reverse find.

---

## World 5 — The Order Book

> Type into the buffer with insert mode: i a o, and change with cc and ci".

| Level | Title                 | Teaches               |
| ----- | --------------------- | --------------------- |
| 5-1   | Fix the Label         | `i`, `Esc`            |
| 5-2   | Append the Order      | `A`, `a`, `Esc`       |
| 5-3   | New Line on the Board | `o`, `O`, `Esc`       |
| 5-4   | Rewrite the Card      | `cc`, `C`, `s`, `Esc` |
| 5-5   | Fix the Flavour       | `ci"`, `ciw`, `Esc`   |

**Key motions:** `i` insert before cursor, `a` insert after cursor, `A` append
end of line, `I` insert at line start, `o` open line below, `O` open line above,
`cc` change line, `C` change to end, `s` narrow to regex matches (Helix),
`ci"` change inside quotes, `ciw` change inner word.

---

## World 6 — The Modes Tour

> Highlight first with v, V and Ctrl-v, then delete, copy, or restamp the
> selection.

| Level | Title                 | Teaches       |
| ----- | --------------------- | ------------- |
| 6-1   | Highlight and Cut     | `v`, `d`      |
| 6-2   | Copy the Highlight    | `v`, `y`, `P` |
| 6-3   | Whole Trays           | `V`, `j`, `d` |
| 6-4   | The Column Restamp    | `Ctrl-v`, `r` |
| 6-5   | Rewrite the Highlight | `v`, `c`      |

**Key motions:** `v` character visual mode, `V` line visual mode, `Ctrl-v` block
visual mode, `y` yank selection, `d` delete selection, `c` change selection, `P`
paste before cursor.

---

## World 7 — Spot Check

> Look items up by name with /, hop matches with n and N, and hunt a word with
> *.

| Level | Title              | Teaches        |
| ----- | ------------------ | -------------- |
| 7-1   | Look It Up         | `/`, `dd`      |
| 7-2   | Next, Please       | `/`, `n`, `.`  |
| 7-3   | Back and Forth     | `/`, `N`, `dd` |
| 7-4   | Star Search        | `*`, `dd`      |
| 7-5   | Search and Destroy | `/`, `n`, `.`  |

**Key motions:** `/` search forward, `?` search backward, `n` next match, `N`
previous match, `*` search word under cursor forward, `#` search word under
cursor backward.

> **Helix search-and-replace:** In Helix, after searching with `/`, you can press
> `c` on a match to change it (entering insert mode), then `n` to jump to the next
> match and `.` to repeat the last change. For bulk replace across the whole
> buffer, use `%` (select all) → `s{regex}` (narrow to regex matches via multi-
> cursor) → `c` (change all). See [Helix #3630](https://github.com/helix-editor/helix/discussions/3630).

---

## World 8 — The Back Office

> Stash clips in named bins with "a, and record a routine once with q to replay
> it with @.

| Level | Title            | Teaches          |
| ----- | ---------------- | ---------------- |
| 8-1   | Labeled Bins     | `"a`, `yy`, `p`  |
| 8-2   | Two Bins         | `"a`, `"b`, `p`  |
| 8-3   | Record a Routine | `q`, `@`, counts |
| 8-4   | Play It Back     | `q`, `@`, `@@`   |
| 8-5   | The Full Routine | `q`, `@`, counts |

**Key motions:** `"a` / `"b` named registers (extra clipboards), `qa` record
macro to register a, `@a` replay macro from register a, `@@` repeat last macro,
`q` stop recording.

---

## Quick Reference — All Motions by Category

### Movement

| Motion    | Action                              |
| --------- | ----------------------------------- |
| `h j k l` | Left, down, up, right               |
| `w`       | Forward one word                    |
| `b`       | Back one word                       |
| `e`       | End of word                         |
| `0`       | Start of line                       |
| `$`       | End of line                         |
| `^`       | First non-blank char                |
| `gg`      | Top of file                         |
| `G`       | Bottom of file (or `:N` for line N) |
| `f{char}` | Find char forward                   |
| `F{char}` | Find char backward                  |
| `t{char}` | Until char (before it)              |
| `T{char}` | Until char backward (after it)      |
| `;` / `,` | Repeat / reverse find               |

### Editing

| Motion    | Action                                 |
| --------- | -------------------------------------- |
| `x`       | Delete char under cursor               |
| `dd`      | Delete line                            |
| `yy`      | Yank (copy) line                       |
| `p`       | Paste after cursor                     |
| `P`       | Paste before cursor                    |
| `r{char}` | Replace single char under cursor       |
| `.`       | Repeat last change                     |
| `u`       | Undo                                   |
| `cc`      | Change (replace) entire line           |
| `C`       | Change to end of line                  |
| `s`       | Narrow selection to regex matches      |
| `ci"`     | Change inside quotes                   |
| `ciw`     | Change inner word                      |

> **Bulk replace (Helix):** `%` → `s{regex}` → `c` — select all, narrow to regex
> matches (multi-cursor), then change all. No Vim-style `:s` command exists.

### Insert Mode

| Motion | Action                |
| ------ | --------------------- |
| `i`    | Insert before cursor  |
| `a`    | Insert after cursor   |
| `I`    | Insert at line start  |
| `A`    | Append at line end    |
| `o`    | Open new line below   |
| `O`    | Open new line above   |
| `Esc`  | Return to normal mode |

### Visual Mode

| Motion        | Action                                  |
| ------------- | --------------------------------------- |
| `v`           | Character visual select                 |
| `V`           | Line visual select                      |
| `Ctrl-v`      | Block visual select                     |
| `d` in visual | Delete selection                        |
| `y` in visual | Yank selection                          |
| `c` in visual | Change selection                        |
| `s` in visual | Narrow selection to regex matches (multi-cursor) |
| `%`           | Select entire buffer                    |

### Search

| Motion     | Action                   |
| ---------- | ------------------------ |
| `/pattern` | Search forward           |
| `?pattern` | Search backward          |
| `n`        | Next match               |
| `N`        | Previous match           |
| `*`        | Search word under cursor |
| `c` (on match) | Change match, enter insert |

### Registers & Macros

| Motion    | Action                   |
| --------- | ------------------------ |
| `"a`–`"z` | Select named register    |
| `q{a}`    | Record macro to register |
| `@{a}`    | Replay macro             |
| `@@`      | Repeat last macro        |

---

_Adapted from https://vimscoops.dev/game — 45 levels, 9 worlds, all free.
Re-tuned for Helix noun-verb semantics._
