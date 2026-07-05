class TextEditScene extends Phaser.Scene {
    constructor() {
        super('TextEditScene');
    }

    init(data) {
        this.levelId = data.levelId;
        this.worldNum = data.worldNum;
    }

    create() {
        const levelData = Levels.find(l => l.id === this.levelId);
        if (!levelData) {
            this.scene.start('LevelSelectScene');
            return;
        }

        this.levelData = levelData;
        this.textBuffer = new TextBuffer(levelData.manifest);
        this.textCommands = new TextCommands();
        this.keystrokeCount = 0;
        this.commandLog = [];

        const { width, height } = this.cameras.main;
        this.gameWidth = width;
        this.gameHeight = height;

        // Layout constants
        this.PANEL_GAP = 40;
        this.PANEL_WIDTH = (width - this.PANEL_GAP * 3) / 2;
        this.PANEL_TOP = 80;
        this.PANEL_BOTTOM = height - 140;
        this.LINE_HEIGHT = 24;
        this.FONT_SIZE = '16px';
        this.LINE_NUM_WIDTH = 30;

        this.createBackground();
        this.createSplitPane();
        this.createHUD();
        this.setupInput();
        this.renderText();
    }

    createBackground() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }

    createSplitPane() {
        const world = Worlds.find(w => w.num === this.worldNum);

        // LHS Panel (Manifest - Editable)
        const lhsX = this.PANEL_GAP;
        const lhsWidth = this.PANEL_WIDTH;

        // LHS background
        const lhsBg = this.add.graphics();
        lhsBg.fillStyle(0x2a2a4a, 1);
        lhsBg.fillRoundedRect(lhsX, this.PANEL_TOP, lhsWidth, this.PANEL_BOTTOM - this.PANEL_TOP, 8);
        lhsBg.lineStyle(2, world.color, 0.5);
        lhsBg.strokeRoundedRect(lhsX, this.PANEL_TOP, lhsWidth, this.PANEL_BOTTOM - this.PANEL_TOP, 8);

        // LHS label
        this.add.text(lhsX + lhsWidth / 2, this.PANEL_TOP - 20, 'MANIFEST (Edit this)', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // RHS Panel (Target - Read-only)
        const rhsX = lhsX + lhsWidth + this.PANEL_GAP;
        const rhsWidth = this.PANEL_WIDTH;

        // RHS background
        const rhsBg = this.add.graphics();
        rhsBg.fillStyle(0x3a3a5a, 1);
        rhsBg.fillRoundedRect(rhsX, this.PANEL_TOP, rhsWidth, this.PANEL_BOTTOM - this.PANEL_TOP, 8);
        rhsBg.lineStyle(2, 0x4ecdc4, 0.3);
        rhsBg.strokeRoundedRect(rhsX, this.PANEL_TOP, rhsWidth, this.PANEL_BOTTOM - this.PANEL_TOP, 8);

        // RHS label
        this.add.text(rhsX + rhsWidth / 2, this.PANEL_TOP - 20, 'TARGET (Goal)', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4'
        }).setOrigin(0.5);

        // Store panel positions
        this.lhsX = lhsX;
        this.lhsWidth = lhsWidth;
        this.rhsX = rhsX;
        this.rhsWidth = rhsWidth;

        // Create text containers
        this.lhsTexts = [];
        this.rhsTexts = [];
        this.selectionHighlights = [];
        this.cursorHighlight = null;
    }

    renderText() {
        // Clear existing text objects
        this.lhsTexts.forEach(t => t.destroy());
        this.rhsTexts.forEach(t => t.destroy());
        if (this.cursorHighlight) this.cursorHighlight.destroy();
        if (this.cursorBlink) this.cursorBlink.remove();
        this.selectionHighlights.forEach(h => h.destroy());

        this.lhsTexts = [];
        this.rhsTexts = [];
        this.selectionHighlights = [];

        const manifestLines = this.textBuffer.lines;
        const targetLines = this.levelData.target.split('\n');
        const maxLines = Math.max(manifestLines.length, targetLines.length);

        const contentPadding = 10;
        const textStartX = this.lhsX + this.LINE_NUM_WIDTH + contentPadding;
        const textStartY = this.PANEL_TOP + 15;

        // Render manifest lines (LHS)
        for (let i = 0; i < manifestLines.length; i++) {
            const y = textStartY + i * this.LINE_HEIGHT;

            // Line number
            const lineNum = this.add.text(this.lhsX + 5, y, `${i + 1}`, {
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                color: '#555577'
            });
            this.lhsTexts.push(lineNum);

            // Line content with character-by-character coloring
            const line = manifestLines[i];
            const targetLine = i < targetLines.length ? targetLines[i] : '';

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const targetChar = j < targetLine.length ? targetLine[j] : null;
                const isMatch = targetChar !== null && char === targetChar;

                const charText = this.add.text(textStartX + j * 9.6, y, char, {
                    fontSize: this.FONT_SIZE,
                    fontFamily: 'Courier New, monospace',
                    color: isMatch ? '#4ecdc4' : '#ff6b6b'
                });
                this.lhsTexts.push(charText);
            }

            // Highlight cursor position
            const cursor = this.textBuffer.getCursor();
            if (i === cursor.line) {
                // Cursor highlight background
                this.cursorHighlight = this.add.graphics();
                this.cursorHighlight.fillStyle(0xffffff, 0.3);
                this.cursorHighlight.fillRect(
                    textStartX + cursor.col * 9.6 - 1,
                    y - 2,
                    10,
                    this.LINE_HEIGHT
                );

                // Blinking cursor
                this.cursorBlink = this.time.addEvent({
                    delay: 500,
                    callback: () => {
                        if (this.cursorHighlight) {
                            this.cursorHighlight.setAlpha(
                                this.cursorHighlight.alpha === 0.3 ? 0.8 : 0.3
                            );
                        }
                    },
                    loop: true
                });
            }

            // Highlight selection range
            const selectStart = this.textCommands.selectStart;
            if (selectStart && this.textCommands.getMode() === 'SELECT') {
                const from = selectStart.line < cursor.line || (selectStart.line === cursor.line && selectStart.col <= cursor.col)
                    ? selectStart : cursor;
                const to = selectStart.line < cursor.line || (selectStart.line === cursor.line && selectStart.col <= cursor.col)
                    ? cursor : selectStart;

                if (i >= from.line && i <= to.line) {
                    const selStartCol = (i === from.line) ? from.col : 0;
                    const selEndCol = (i === to.line) ? to.col + 1 : this.textBuffer.getLineLength(i);
                    if (selStartCol < selEndCol) {
                        const selGfx = this.add.graphics();
                        selGfx.fillStyle(0x4ecdc4, 0.3);
                        selGfx.fillRect(
                            textStartX + selStartCol * 9.6 - 1,
                            y - 2,
                            (selEndCol - selStartCol) * 9.6 + 2,
                            this.LINE_HEIGHT
                        );
                        this.selectionHighlights.push(selGfx);
                    }
                }
            }
        }

        // Render target lines (RHS)
        const rhsTextStartX = this.rhsX + this.LINE_NUM_WIDTH + contentPadding;

        for (let i = 0; i < targetLines.length; i++) {
            const y = textStartY + i * this.LINE_HEIGHT;

            // Line number
            const lineNum = this.add.text(this.rhsX + 5, y, `${i + 1}`, {
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                color: '#555577'
            });
            this.rhsTexts.push(lineNum);

            // Line content
            const line = targetLines[i];
            for (let j = 0; j < line.length; j++) {
                const charText = this.add.text(rhsTextStartX + j * 9.6, y, line[j], {
                    fontSize: this.FONT_SIZE,
                    fontFamily: 'Courier New, monospace',
                    color: '#8888aa'
                });
                this.rhsTexts.push(charText);
            }
        }
    }

    createHUD() {
        const world = Worlds.find(w => w.num === this.worldNum);

        // HUD background
        const hudBg = this.add.graphics();
        hudBg.fillStyle(0x0d0d1a, 0.9);
        hudBg.fillRect(0, this.gameHeight - 120, this.gameWidth, 120);
        hudBg.lineStyle(1, 0x4ecdc4, 0.3);
        hudBg.lineBetween(0, this.gameHeight - 120, this.gameWidth, this.gameHeight - 120);

        // World and level info
        this.add.text(15, this.gameHeight - 112, `${world.icon} W${this.worldNum + 1}: ${this.levelData.name}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        });

        this.add.text(15, this.gameHeight - 92, this.levelData.description, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa'
        });

        // Commands
        const cmdBadges = this.levelData.commands.map(c => `[${c}]`).join(' ');
        this.add.text(15, this.gameHeight - 72, `Commands: ${cmdBadges}`, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#4ecdc4'
        });

        // Keystroke count
        this.keystrokeText = this.add.text(this.gameWidth - 15, this.gameHeight - 112, `Keys: 0 / Par: ${this.levelData.par}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#ffd93d'
        }).setOrigin(1, 0);

        // Wizard par
        this.wizardText = this.add.text(this.gameWidth - 15, this.gameHeight - 92, `Wizard: ${this.levelData.wizard}`, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#9b5de5'
        }).setOrigin(1, 0);

        // Diff indicator
        this.diffText = this.add.text(this.gameWidth - 15, this.gameHeight - 72, '', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#ff6b6b'
        }).setOrigin(1, 0);

        // Mode indicator
        this.modeText = this.add.text(this.gameWidth / 2, this.gameHeight - 112, 'NORMAL', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            backgroundColor: '#1a3a3a',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0);

        // Buffer display
        this.bufferText = this.add.text(this.gameWidth / 2, this.gameHeight - 50, '', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffd93d',
            backgroundColor: '#2a2a1a',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0).setAlpha(0);

        // Command log
        this.commandLogText = this.add.text(15, this.gameHeight - 48, '', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688',
            wordWrap: { width: this.gameWidth - 30 }
        });

        // Reset button
        const resetBtn = this.add.text(this.gameWidth - 15, this.gameHeight - 50, '[ Reset ]', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688',
            padding: { x: 8, y: 3 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);

        resetBtn.on('pointerover', () => resetBtn.setColor('#ff6b6b'));
        resetBtn.on('pointerout', () => resetBtn.setColor('#666688'));
        resetBtn.on('pointerdown', () => {
            this.scene.restart({ levelId: this.levelId, worldNum: this.worldNum });
        });

        // Back button
        const backBtn = this.add.text(this.gameWidth - 15, this.gameHeight - 30, '[ World Map ]', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688',
            padding: { x: 8, y: 3 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);

        backBtn.on('pointerover', () => backBtn.setColor('#4ecdc4'));
        backBtn.on('pointerout', () => backBtn.setColor('#666688'));
        backBtn.on('pointerdown', () => {
            this.scene.start('LevelSelectScene');
        });
    }

    updateHUD() {
        this.keystrokeText.setText(`Keys: ${this.keystrokeCount} / Par: ${this.levelData.par}`);

        const mode = this.textCommands.getMode();
        this.modeText.setText(mode);

        if (mode === 'SELECT') {
            this.modeText.setColor('#ff6b6b');
            this.modeText.setBackgroundColor('#3a1a1a');
        } else {
            this.modeText.setColor('#4ecdc4');
            this.modeText.setBackgroundColor('#1a3a3a');
        }

        const buffer = this.textCommands.getBufferDisplay();
        if (buffer) {
            this.bufferText.setText(buffer);
            this.bufferText.setAlpha(1);
        } else {
            this.bufferText.setAlpha(0);
        }

        const recent = this.commandLog.slice(-8);
        this.commandLogText.setText(recent.join(' '));

        // Update diff indicator
        const currentText = this.textBuffer.getCurrentText();
        const targetText = this.levelData.target;
        if (currentText === targetText) {
            this.diffText.setText('✓ MATCH');
            this.diffText.setColor('#4ecdc4');
        } else {
            const diffCount = this.countDifferences(currentText, targetText);
            this.diffText.setText(`${diffCount} diff${diffCount !== 1 ? 's' : ''}`);
            this.diffText.setColor('#ff6b6b');
        }
    }

    countDifferences(a, b) {
        const aLines = a.split('\n');
        const bLines = b.split('\n');
        let diffs = 0;

        const maxLines = Math.max(aLines.length, bLines.length);
        for (let i = 0; i < maxLines; i++) {
            const aLine = aLines[i] || '';
            const bLine = bLines[i] || '';
            const maxLen = Math.max(aLine.length, bLine.length);
            for (let j = 0; j < maxLen; j++) {
                if (aLine[j] !== bLine[j]) diffs++;
            }
        }

        return diffs;
    }

    setupInput() {
        this.input.keyboard.on('keydown', (event) => {
            const key = event.key;

            // In INSERT mode, Escape goes back to NORMAL (not exit level)
            if (key === 'Escape' && this.textCommands.getMode() === 'INSERT') {
                // Let textCommands handle it to switch to NORMAL
            } else if (key === 'Escape') {
                this.scene.start('LevelSelectScene');
                return;
            }

            // Prevent default for keys we handle
            if (['Tab', 'Backspace', 'Delete', 'Enter'].includes(key)) {
                event.preventDefault();
            }

            const result = this.textCommands.execute(key, this.textBuffer);

            if (result.unknown) return;

            this.keystrokeCount++;
            this.commandLog.push(key);

            // Re-render text after any change
            this.renderText();
            this.updateHUD();

            // Check completion
            if (this.textBuffer.isComplete(this.levelData.target)) {
                this.time.delayedCall(300, () => {
                    this.scene.start('ResultScene', {
                        levelId: this.levelId,
                        worldNum: this.worldNum,
                        keystrokes: this.keystrokeCount,
                        par: this.levelData.par,
                        wizard: this.levelData.wizard
                    });
                });
            }
        });
    }
}
