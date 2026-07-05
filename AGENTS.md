# Helixert Development Notes

## Helix Shortcuts vs Vim — Key Differences

This game uses **Helix-style** keybindings, NOT standard Vim. Helix uses **noun-verb** order (select first, then operate), which is the opposite of Vim's **verb-noun** order.

**WARNING: `dd` is NOT a valid Helix command. Never use or reference `dd` in code, tests, or level descriptions.**

### Command order

| Mode | Vim (verb-noun) | Helix (noun-verb) |
|------|-----------------|-------------------|
| Delete line | `dd` | `x` (select line) → `d` (delete) |
| Delete word | `dw` | `w` (select word) → `d` (delete) |
| Delete inside word | `diw` | `miw` (select inside word) → `d` (delete) |
| Yank line | `yy` | `x` (select line) → `y` (yank) |

### Key commands

| Action | Helix |
|--------|-------|
| Select line | `x` |
| Select character range | `v` enters SELECT mode; move to extend |
| Delete selection | `d` or `x` in SELECT mode |
| Yank selection | `y` in SELECT mode |
| Delete inside word | `miw` → `d` |
| Delete around word | `maw` → `d` |
| Undo | `u` |
| Redo | `U` |

### World 2 (TextEditScene) uses a separate engine

World 2 levels run through `TextCommands` (`js/engine/textCommands.js`), NOT `HelixCommands`. The command set is smaller:

- `x` selects the whole line (Helix noun-verb: `x` selects, then `d` deletes)
- No `v` for character-range selection (only line selection via `x`)
- No `m` (match) command
- No `Space + ?` command palette
- `dd` falls through to single-char delete (no line delete)

When writing descriptions for World 2 levels, only reference commands that exist in `textCommands.js`.

### Testing

Run tests with: `deno test js/engine/helixCommands.test.js`
