# Helixert

A browser-based game that teaches [Helix editor](https://helix-editor.com/) keybindings through maze navigation, inspired by [VimScoops](https://vimscoops.dev/game).

## How to Play

1. Open `index.html` in your browser (or visit the GitHub Pages URL)
2. Browse worlds and select a level
3. Use Helix keybindings to navigate the van through the maze
4. Collect all food items to complete the level
5. Match the keystroke par to earn Wizard rank!

## Helix Keybindings Taught

### World 1: First Steps (Basic Movement)
- `h j k l` - Move left, down, up, right
- `w b e` - Word movement
- `W B E` - WORD movement
- `0 $ ^` - Line positions

### World 2: Character Hunt (Find & Till)
- `f <char>` - Find character forward
- `F <char>` - Find character backward
- `t <char>` - Till character forward
- `T <char>` - Till character backward
- `; ,` - Repeat find motions

### World 3: Scoops & Dops (Editing)
- `r <char>` - Replace character
- `d` - Delete
- `c` - Change
- `x` - Select line
- `u U` - Undo/redo

### World 4: Selection Station
- `v` - Visual selection mode
- `;` - Collapse selection
- `%` - Select all

### World 5: Goto Galaxy
- `g g` - Go to file start
- `g e` - Go to file end
- `g h` - Go to line start
- `g l` - Go to line end
- `g f` - Go to floor mark

## GitHub Pages Deployment

1. Push this repository to GitHub
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/ (root)` folder
5. Save - your game will be live at `https://<username>.github.io/<repo-name>/`

## Credits

- Game engine: [Phaser 3](https://phaser.io/)
- Sprites: [OpenMoji](https://openmoji.org/) (CC BY-SA 4.0)
- Inspired by: [VimScoops](https://vimscoops.dev/game)
