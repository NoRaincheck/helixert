class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        this.add.text(width / 2, 40, 'SELECT WORLD', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const worldWidth = 150;
        const worldHeight = 180;
        const startX = (width - (5 * worldWidth + 4 * 20)) / 2;
        const worldY = height * 0.35;

        Worlds.forEach((world, i) => {
            const x = startX + i * (worldWidth + 20) + worldWidth / 2;
            const y = worldY;
            const unlocked = GameState.isWorldUnlocked(world.num);

            const card = this.add.graphics();
            if (unlocked) {
                card.fillStyle(world.color, 0.15);
                card.lineStyle(2, world.color, 0.8);
            } else {
                card.fillStyle(0x333355, 0.3);
                card.lineStyle(2, 0x444466, 0.3);
            }
            card.fillRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);
            card.strokeRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);

            const icon = this.add.text(x, y - 50, world.icon, {
                fontSize: '36px'
            }).setOrigin(0.5);

            if (!unlocked) icon.setAlpha(0.3);

            const name = this.add.text(x, y - 10, world.name, {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: unlocked ? '#ffffff' : '#666688'
            }).setOrigin(0.5);

            const desc = this.add.text(x, y + 10, world.description, {
                fontSize: '11px',
                fontFamily: 'Courier New, monospace',
                color: unlocked ? '#aaaacc' : '#555577'
            }).setOrigin(0.5);

            const worldLevels = Levels.filter(l => l.world === world.num);
            const completed = worldLevels.filter(l => GameState.isLevelCompleted(l.id)).length;

            const progress = this.add.text(x, y + 35, `${completed}/${worldLevels.length}`, {
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                color: unlocked ? '#4ecdc4' : '#555577'
            }).setOrigin(0.5);

            if (!unlocked) {
                this.add.text(x, y + 60, '🔒', {
                    fontSize: '20px'
                }).setOrigin(0.5);
            }

            if (unlocked) {
                const hitArea = this.add.rectangle(x, y, worldWidth, worldHeight)
                    .setInteractive({ useHandCursor: true })
                    .setAlpha(0.01);

                hitArea.on('pointerover', () => {
                    card.clear();
                    card.fillStyle(world.color, 0.25);
                    card.lineStyle(2, world.color, 1);
                    card.fillRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);
                    card.strokeRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);
                });

                hitArea.on('pointerout', () => {
                    card.clear();
                    card.fillStyle(world.color, 0.15);
                    card.lineStyle(2, world.color, 0.8);
                    card.fillRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);
                    card.strokeRoundedRect(x - worldWidth / 2, y - worldHeight / 2, worldWidth, worldHeight, 12);
                });

                hitArea.on('pointerdown', () => {
                    this.showLevelSelect(world.num);
                });
            }
        });

        this.add.text(width / 2, height - 50, 'Click a world to see levels', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688'
        }).setOrigin(0.5);

        const allUnlocked = [1, 2, 3, 4, 5].every(n => GameState.isWorldUnlocked(n));
        if (!allUnlocked) {
            const unlockBtn = this.add.text(width / 2, height - 20, '[ I already know Helix — unlock all ]', {
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                color: '#555577',
                padding: { x: 10, y: 4 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            unlockBtn.on('pointerover', () => unlockBtn.setColor('#ffd93d'));
            unlockBtn.on('pointerout', () => unlockBtn.setColor('#555577'));
            unlockBtn.on('pointerdown', () => {
                GameState.data.unlockedWorlds = [1, 2, 3, 4, 5];
                GameState.save();
                this.scene.restart();
            });
        }

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    showLevelSelect(worldNum) {
        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive();

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.lineStyle(2, 0x4ecdc4, 0.8);
        panel.fillRoundedRect(width / 2 - 250, height / 2 - 180, 500, 360, 16);
        panel.strokeRoundedRect(width / 2 - 250, height / 2 - 180, 500, 360, 16);

        const world = Worlds.find(w => w.num === worldNum);

        this.add.text(width / 2, height / 2 - 150, `${world.icon} ${world.name}`, {
            fontSize: '22px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const worldLevels = Levels.filter(l => l.world === worldNum);

        worldLevels.forEach((level, i) => {
            const y = height / 2 - 90 + i * 55;
            const completed = GameState.isLevelCompleted(level.id);
            const bestScore = GameState.getBestScore(level.id);

            const levelBg = this.add.graphics();
            levelBg.fillStyle(completed ? 0x2a4a3a : 0x2a2a4a, 0.8);
            levelBg.fillRoundedRect(width / 2 - 200, y - 15, 400, 45, 8);

            const nameText = this.add.text(width / 2 - 170, y + 5, `${i + 1}. ${level.name}`, {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                color: completed ? '#4ecdc4' : '#aaaacc'
            });

            const parText = this.add.text(width / 2 + 170, y + 5, `Par: ${level.par}`, {
                fontSize: '12px',
                fontFamily: 'Courier New, monospace',
                color: '#8888aa'
            }).setOrigin(1, 0.5);

            if (completed) {
                this.add.text(width / 2 + 130, y + 5, '✓', {
                    fontSize: '16px',
                    color: '#4ecdc4'
                }).setOrigin(0.5);

                if (bestScore < Infinity) {
                    this.add.text(width / 2 + 90, y + 5, `${bestScore}`, {
                        fontSize: '12px',
                        fontFamily: 'Courier New, monospace',
                        color: bestScore <= level.wizard ? '#ffd93d' : '#8888aa'
                    }).setOrigin(0.5);
                }
            }

            const hitArea = this.add.rectangle(width / 2, y + 5, 400, 45)
                .setInteractive({ useHandCursor: true })
                .setAlpha(0.01);

            hitArea.on('pointerover', () => {
                levelBg.clear();
                levelBg.fillStyle(0x3a3a6a, 0.9);
                levelBg.fillRoundedRect(width / 2 - 200, y - 15, 400, 45, 8);
            });

            hitArea.on('pointerout', () => {
                levelBg.clear();
                levelBg.fillStyle(completed ? 0x2a4a3a : 0x2a2a4a, 0.8);
                levelBg.fillRoundedRect(width / 2 - 200, y - 15, 400, 45, 8);
            });

            hitArea.on('pointerdown', () => {
                this.scene.start('GameScene', { levelId: level.id, worldNum });
            });
        });

        const closeBtn = this.add.text(width / 2, height / 2 + 155, '[ Close ]', {
            fontSize: '16px',
            fontFamily: 'Courier New, monospace',
            color: '#ff6b6b',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.restart();
        });
    }
}
