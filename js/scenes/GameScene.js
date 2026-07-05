class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
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
        this.grid = new Grid(levelData);
        this.helix = new HelixCommands();
        this.keystrokeCount = 0;
        this.isAnimating = false;
        this.commandLog = [];
        this.yankBuffer = null;

        const { width, height } = this.cameras.main;

        this.CELL_SIZE = 56;
        this.gridOffsetX = (width - this.grid.width * this.CELL_SIZE) / 2;
        this.gridOffsetY = 60;

        this.createBackground();
        this.renderGrid();
        this.createHUD();
        this.setupInput();
    }

    createBackground() {
        const { width, height } = this.cameras.main;
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        const color1 = 0x2a2a4a;
        const color2 = 0x3a3a5a;
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const px = this.gridOffsetX + x * this.CELL_SIZE;
                const py = this.gridOffsetY + y * this.CELL_SIZE;
                bg.fillStyle((x + y) % 2 === 0 ? color1 : color2, 1);
                bg.fillRect(px, py, this.CELL_SIZE, this.CELL_SIZE);
            }
        }
    }

    renderGrid() {
        this.tileSprites = [];

        for (let y = 0; y < this.grid.height; y++) {
            this.tileSprites[y] = [];
            for (let x = 0; x < this.grid.width; x++) {
                const tile = this.grid.getTile(x, y);
                const px = this.gridOffsetX + x * this.CELL_SIZE + this.CELL_SIZE / 2;
                const py = this.gridOffsetY + y * this.CELL_SIZE + this.CELL_SIZE / 2;

                let spriteKey = null;
                let tint = null;

                switch (tile) {
                    case TileType.WALL:
                        spriteKey = 'wall';
                        break;
                    case TileType.TARGET:
                        spriteKey = 'target';
                        break;
                    case TileType.START:
                    case TileType.EMPTY:
                    case TileType.FLOOR_MARK:
                        break;
                    case TileType.DOOR:
                        spriteKey = 'door';
                        break;
                    case TileType.BONUS:
                        spriteKey = 'star';
                        break;
                    case TileType.COLLECTED:
                        spriteKey = 'star';
                        break;
                    case TileType.SWITCH:
                        spriteKey = 'lemon';
                        break;
                    case TileType.CHOCOLATE:
                        spriteKey = 'chocolate';
                        break;
                }

                if (spriteKey) {
                    const sprite = this.add.image(px, py, spriteKey)
                        .setDisplaySize(this.CELL_SIZE - 4, this.CELL_SIZE - 4);
                    if (tint) sprite.setTint(tint);
                    this.tileSprites[y][x] = sprite;
                } else {
                    this.tileSprites[y][x] = null;
                }

                if (tile !== TileType.EMPTY && tile !== TileType.START && tile !== TileType.WALL && tile !== TileType.COLLECTED) {
                    this.add.text(px, py + this.CELL_SIZE / 2 - 8, tile, {
                        fontSize: '10px',
                        fontFamily: 'Courier New, monospace',
                        fontStyle: 'bold',
                        color: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 2
                    }).setOrigin(0.5);
                }
            }
        }

        const startPos = this.grid.startPos;
        const ppx = this.gridOffsetX + startPos.x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const ppy = this.gridOffsetY + startPos.y * this.CELL_SIZE + this.CELL_SIZE / 2;

        this.playerSprite = this.add.image(ppx, ppy, 'player')
            .setDisplaySize(this.CELL_SIZE - 4, this.CELL_SIZE - 4)
            .setDepth(10);

        this.tweens.add({
            targets: this.playerSprite,
            scaleX: (this.CELL_SIZE - 4) / 72 * 1.05,
            scaleY: (this.CELL_SIZE - 4) / 72 * 1.05,
            duration: 600,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    updatePlayerPosition(newX, newY, animated = true) {
        const px = this.gridOffsetX + newX * this.CELL_SIZE + this.CELL_SIZE / 2;
        const py = this.gridOffsetY + newY * this.CELL_SIZE + this.CELL_SIZE / 2;

        if (animated) {
            this.isAnimating = true;
            const dist = Math.abs(newX - this.grid.playerPos.x) + Math.abs(newY - this.grid.playerPos.y);
            const duration = Math.min(120 * (dist + 1), 600);
            this.tweens.add({
                targets: this.playerSprite,
                x: px,
                y: py,
                duration: duration,
                ease: 'Power3.easeOut',
                onComplete: () => {
                    this.isAnimating = false;
                }
            });
        } else {
            this.playerSprite.x = px;
            this.playerSprite.y = py;
        }
    }

    updateTileSprite(x, y) {
        const oldSprite = this.tileSprites[y][x];
        if (oldSprite) oldSprite.destroy();

        const tile = this.grid.getTile(x, y);
        const px = this.gridOffsetX + x * this.CELL_SIZE;
        const py = this.gridOffsetY + y * this.CELL_SIZE;
        const pxCenter = px + this.CELL_SIZE / 2;
        const pyCenter = py + this.CELL_SIZE / 2;

        let spriteKey = null;
        let tint = null;

        switch (tile) {
            case TileType.WALL: spriteKey = 'wall'; break;
            case TileType.TARGET: spriteKey = 'target'; break;
            case TileType.START:
            case TileType.EMPTY:
            case TileType.FLOOR_MARK: {
                const color1 = 0x2a2a4a;
                const color2 = 0x3a3a5a;
                const bg = this.add.graphics();
                bg.fillStyle((x + y) % 2 === 0 ? color1 : color2, 1);
                bg.fillRect(px, py, this.CELL_SIZE, this.CELL_SIZE);
                this.tileSprites[y][x] = bg;
                return;
            }
            case TileType.DOOR: spriteKey = 'door'; break;
            case TileType.BONUS: spriteKey = 'star'; break;
            case TileType.COLLECTED: spriteKey = 'star'; break;
            case TileType.SWITCH: spriteKey = 'lemon'; break;
            case TileType.CHOCOLATE: spriteKey = 'chocolate'; break;
        }

        if (spriteKey) {
            const sprite = this.add.image(pxCenter, pyCenter, spriteKey)
                .setDisplaySize(this.CELL_SIZE - 4, this.CELL_SIZE - 4);
            if (tint) sprite.setTint(tint);
            this.tileSprites[y][x] = sprite;
        } else {
            this.tileSprites[y][x] = null;
        }

        if (tile !== TileType.EMPTY && tile !== TileType.START && tile !== TileType.WALL && tile !== TileType.COLLECTED) {
            this.add.text(pxCenter, pyCenter + this.CELL_SIZE / 2 - 8, tile, {
                fontSize: '10px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }
    }

    createSparkle(x, y) {
        const px = this.gridOffsetX + x * this.CELL_SIZE + this.CELL_SIZE / 2;
        const py = this.gridOffsetY + y * this.CELL_SIZE + this.CELL_SIZE / 2;

        const sparkle = this.add.image(px, py, 'sparkle')
            .setDisplaySize(this.CELL_SIZE, this.CELL_SIZE)
            .setDepth(20)
            .setAlpha(0);

        this.tweens.add({
            targets: sparkle,
            alpha: 1,
            scaleX: this.CELL_SIZE / 72 * 1.5,
            scaleY: this.CELL_SIZE / 72 * 1.5,
            duration: 200,
            yoyo: true,
            onComplete: () => sparkle.destroy()
        });
    }

    createHUD() {
        const { width, height } = this.cameras.main;

        const hudBg = this.add.graphics();
        hudBg.fillStyle(0x0d0d1a, 0.9);
        hudBg.fillRect(0, height - 120, width, 120);
        hudBg.lineStyle(1, 0x4ecdc4, 0.3);
        hudBg.lineBetween(0, height - 120, width, height - 120);

        const world = Worlds.find(w => w.num === this.worldNum);
        this.add.text(15, height - 112, `${world.icon} W${this.worldNum + 1}: ${this.levelData.name}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        });

        this.add.text(15, height - 92, this.levelData.description, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa'
        });

        const cmdBadges = this.levelData.commands.map(c => {
            return `[${c}]`;
        }).join(' ');

        this.add.text(15, height - 72, `Commands: ${cmdBadges}`, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#4ecdc4'
        });

        this.keystrokeText = this.add.text(width - 15, height - 112, `Keys: 0 / Par: ${this.levelData.par}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#ffd93d'
        }).setOrigin(1, 0);

        this.wizardText = this.add.text(width - 15, height - 92, `Wizard: ${this.levelData.wizard}`, {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#9b5de5'
        }).setOrigin(1, 0);

        this.targetsText = this.add.text(width - 15, height - 72, `Targets: ${this.grid.getTargetsRemaining()}`, {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#ff6b6b'
        }).setOrigin(1, 0);

        this.modeText = this.add.text(width / 2, height - 112, 'NORMAL', {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            backgroundColor: '#1a3a3a',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0);

        this.bufferText = this.add.text(width / 2, height - 50, '', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffd93d',
            backgroundColor: '#2a2a1a',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5, 0).setAlpha(0);

        this.commandLogText = this.add.text(15, height - 48, '', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688',
            wordWrap: { width: width - 30 }
        });

        const resetBtn = this.add.text(width - 15, height - 50, '[ Reset ]', {
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

        const backBtn = this.add.text(width - 15, height - 30, '[ World Map ]', {
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
        this.targetsText.setText(`Targets: ${this.grid.getTargetsRemaining()}`);
        this.modeText.setText(this.helix.getMode());

        const mode = this.helix.getMode();
        if (mode === 'SELECT') {
            this.modeText.setColor('#ff6b6b');
            this.modeText.setBackgroundColor('#3a1a1a');
        } else {
            this.modeText.setColor('#4ecdc4');
            this.modeText.setBackgroundColor('#1a3a3a');
        }

        const buffer = this.helix.getBufferDisplay();
        if (buffer) {
            this.bufferText.setText(buffer);
            this.bufferText.setAlpha(1);
        } else {
            this.bufferText.setAlpha(0);
        }

        const recent = this.commandLog.slice(-8);
        this.commandLogText.setText(recent.join(' '));
    }

    setupInput() {
        this.input.keyboard.on('keydown', (event) => {
            if (this.isAnimating) return;
            if (event.key === 'Escape') {
                this.scene.start('LevelSelectScene');
                return;
            }

            const key = event.key;

            const result = this.helix.execute(key, this.grid);

            if (result.unknown) return;

            this.keystrokeCount++;
            this.commandLog.push(key);

            if (result.moved) {
                this.updatePlayerPosition(this.grid.playerPos.x, this.grid.playerPos.y);
            }

            if (result.collected) {
                this.createSparkle(this.grid.playerPos.x, this.grid.playerPos.y);
                this.updateTileSprite(this.grid.playerPos.x, this.grid.playerPos.y);
            }

            if (result.action === 'replace' && result.char) {
                const pos = this.grid.playerPos;
                const adjacentX = pos.x + 1;
                if (this.grid.getTile(adjacentX, pos.y) === TileType.DOOR) {
                    this.grid.setTile(adjacentX, pos.y, TileType.EMPTY);
                    this.updateTileSprite(adjacentX, pos.y);
                }
            }

            if (result.action === 'deleteLine') {
                const line = result.line;
                for (let x = 0; x < this.grid.width; x++) {
                    const tile = this.grid.getTile(x, line);
                    if (tile === TileType.DOOR || tile === TileType.WALL) {
                        if (tile !== TileType.WALL || (x > 0 && x < this.grid.width - 1)) {
                            this.grid.setTile(x, line, TileType.EMPTY);
                            this.updateTileSprite(x, line);
                        }
                    }
                }
            }

            if (result.action === 'deleteTo' || result.action === 'changeTo') {
                const from = result.from;
                const to = result.to;
                const minX = Math.min(from.x, to.x);
                const maxX = Math.max(from.x, to.x);
                for (let x = minX; x <= maxX; x++) {
                    const tile = this.grid.getTile(x, from.y);
                    if (tile === TileType.DOOR) {
                        this.grid.setTile(x, from.y, TileType.EMPTY);
                        this.updateTileSprite(x, from.y);
                    }
                }
            }

            if (result.action === 'yank') {
                const pos = this.grid.playerPos;
                const y = pos.y;
                this.yankBuffer = [];
                for (let x = 0; x < this.grid.width; x++) {
                    if (this.grid.getTile(x, y) === TileType.DOOR) {
                        this.yankBuffer.push({ x: x - pos.x, y: 0 });
                    }
                }
            }

            if (result.action === 'paste') {
                if (this.yankBuffer) {
                    const pos = this.grid.playerPos;
                    for (const door of this.yankBuffer) {
                        const newX = pos.x + door.x;
                        const newY = pos.y + door.y;
                        if (newX >= 0 && newX < this.grid.width && newY >= 0 && newY < this.grid.height) {
                            this.grid.setTile(newX, newY, TileType.DOOR);
                            this.updateTileSprite(newX, newY);
                        }
                    }
                }
            }

            if (result.action === 'deleteInside' || result.action === 'deleteAround') {
                const pos = this.grid.playerPos;
                const y = pos.y;
                const isInside = result.action === 'deleteInside';

                // Find word boundaries (contiguous run of doors on current line)
                let startX = pos.x;
                while (startX > 0 && this.grid.getTile(startX - 1, y) === TileType.DOOR) {
                    startX--;
                }
                let endX = pos.x;
                while (endX < this.grid.width - 1 && this.grid.getTile(endX + 1, y) === TileType.DOOR) {
                    endX++;
                }

                let deleteStart = startX;
                let deleteEnd = endX;

                if (!isInside) {
                    // deleteAround: also delete adjacent empty cells up to walls
                    while (deleteStart > 0 && this.grid.getTile(deleteStart - 1, y) === TileType.EMPTY) {
                        deleteStart--;
                    }
                    while (deleteEnd < this.grid.width - 1 && this.grid.getTile(deleteEnd + 1, y) === TileType.EMPTY) {
                        deleteEnd++;
                    }
                }

                for (let x = deleteStart; x <= deleteEnd; x++) {
                    const tile = this.grid.getTile(x, y);
                    if (isInside && x === pos.x) continue;
                    if (tile === TileType.DOOR || (!isInside && tile === TileType.EMPTY)) {
                        this.grid.setTile(x, y, TileType.EMPTY);
                        this.updateTileSprite(x, y);
                    }
                }
            }

            this.updateHUD();

            if (this.grid.getTargetsRemaining() === 0) {
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
