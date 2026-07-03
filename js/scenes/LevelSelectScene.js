class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        this.scrollY = 0;
        this.maxScroll = 0;
        this.container = this.add.container(0, 0);

        const title = this.add.text(width / 2, 30, 'HELIX MAZE', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            stroke: '#1a1a2e',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(title);

        const subtitle = this.add.text(width / 2, 58, 'Learn Helix Editor Keybindings', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa'
        }).setOrigin(0.5);
        this.container.add(subtitle);

        const intro = this.add.text(width / 2, 78, 'Pick a route. Drive with h j k l, hop with w b e, collect all food under par.', {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: '#aaaacc',
            wordWrap: { width: width - 40 },
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(intro);

        let yPos = 100;

        Worlds.forEach((world, worldIndex) => {
            const worldUnlocked = GameState.isWorldUnlocked(world.num);
            const prevWorldComplete = worldIndex === 0 || this.isWorldComplete(worldIndex);
            const seqLocked = !worldUnlocked && !prevWorldComplete;

            const packBg = this.add.graphics();
            if (worldUnlocked) {
                packBg.fillStyle(world.color, 0.08);
                packBg.lineStyle(2, world.color, 0.5);
            } else {
                packBg.fillStyle(0x222233, 0.3);
                packBg.lineStyle(2, 0x333344, 0.3);
            }
            packBg.fillRoundedRect(20, yPos, width - 40, 10, 8);
            packBg.strokeRoundedRect(20, yPos, width - 40, 10, 8);
            this.container.add(packBg);

            const header = this.add.text(35, yPos + 8, `${world.icon} ${world.name}`, {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                fontStyle: 'bold',
                color: worldUnlocked ? '#ffffff' : '#555566'
            });
            this.container.add(header);

            const sub = this.add.text(35, yPos + 26, world.description, {
                fontSize: '10px',
                fontFamily: 'Courier New, monospace',
                color: worldUnlocked ? '#8888aa' : '#444455'
            });
            this.container.add(sub);

            if (seqLocked) {
                const lock = this.add.text(width - 35, yPos + 16, '🔒 Complete previous world', {
                    fontSize: '10px',
                    fontFamily: 'Courier New, monospace',
                    color: '#666677'
                }).setOrigin(1, 0.5);
                this.container.add(lock);
            }

            yPos += 50;

            const worldLevels = Levels.filter(l => l.world === world.num);
            const cols = 3;
            const btnW = (width - 80) / cols;
            const btnH = 52;

            worldLevels.forEach((level, li) => {
                const col = li % cols;
                const row = Math.floor(li / cols);
                const bx = 30 + col * (btnW + 5);
                const by = yPos + row * (btnH + 5);

                const completed = GameState.isLevelCompleted(level.id);
                const bestScore = GameState.getBestScore(level.id);
                const available = worldUnlocked;

                const btnBg = this.add.graphics();
                if (completed) {
                    btnBg.fillStyle(0x2a4a3a, 0.9);
                    btnBg.lineStyle(1, 0x4ecdc4, 0.6);
                } else if (available) {
                    btnBg.fillStyle(0x2a2a4a, 0.9);
                    btnBg.lineStyle(1, 0x444466, 0.4);
                } else {
                    btnBg.fillStyle(0x1a1a2a, 0.6);
                    btnBg.lineStyle(1, 0x333344, 0.2);
                }
                btnBg.fillRoundedRect(bx, by, btnW, btnH, 6);
                btnBg.strokeRoundedRect(bx, by, btnW, btnH, 6);
                this.container.add(btnBg);

                const num = this.add.text(bx + 8, by + 6, `${world.num}.${li + 1}`, {
                    fontSize: '10px',
                    fontFamily: 'Courier New, monospace',
                    color: completed ? '#4ecdc4' : (available ? '#8888aa' : '#444455')
                });
                this.container.add(num);

                const name = this.add.text(bx + 8, by + 22, level.name, {
                    fontSize: '11px',
                    fontFamily: 'Courier New, monospace',
                    fontStyle: 'bold',
                    color: completed ? '#ffffff' : (available ? '#cccccc' : '#555566')
                });
                this.container.add(name);

                const par = this.add.text(bx + 8, by + 36, `Par ${level.par}`, {
                    fontSize: '9px',
                    fontFamily: 'Courier New, monospace',
                    color: '#666688'
                });
                this.container.add(par);

                if (completed && bestScore < Infinity) {
                    const score = this.add.text(bx + btnW - 8, by + 6, `${bestScore}`, {
                        fontSize: '10px',
                        fontFamily: 'Courier New, monospace',
                        fontStyle: 'bold',
                        color: bestScore <= level.wizard ? '#ffd93d' : '#4ecdc4'
                    }).setOrigin(1, 0);
                    this.container.add(score);
                }

                const statusDot = this.add.graphics();
                const dotColor = completed ? 0x4ecdc4 : (available ? 0x888888 : 0x444444);
                statusDot.fillStyle(dotColor, 1);
                statusDot.fillCircle(bx + btnW - 10, by + btnH - 10, 4);
                this.container.add(statusDot);

                if (available) {
                    const hitArea = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH)
                        .setInteractive({ useHandCursor: true })
                        .setAlpha(0.01);
                    this.container.add(hitArea);

                    hitArea.on('pointerover', () => {
                        btnBg.clear();
                        btnBg.fillStyle(0x3a3a6a, 0.95);
                        btnBg.lineStyle(1, 0x6666aa, 0.8);
                        btnBg.fillRoundedRect(bx, by, btnW, btnH, 6);
                        btnBg.strokeRoundedRect(bx, by, btnW, btnH, 6);
                    });

                    hitArea.on('pointerout', () => {
                        btnBg.clear();
                        if (completed) {
                            btnBg.fillStyle(0x2a4a3a, 0.9);
                            btnBg.lineStyle(1, 0x4ecdc4, 0.6);
                        } else {
                            btnBg.fillStyle(0x2a2a4a, 0.9);
                            btnBg.lineStyle(1, 0x444466, 0.4);
                        }
                        btnBg.fillRoundedRect(bx, by, btnW, btnH, 6);
                        btnBg.strokeRoundedRect(bx, by, btnW, btnH, 6);
                    });

                    hitArea.on('pointerdown', () => {
                        this.scene.start('GameScene', { levelId: level.id, worldNum: world.num });
                    });
                }
            });

            const rows = Math.ceil(worldLevels.length / cols);
            yPos += rows * (btnH + 5) + 15;
        });

        this.maxScroll = Math.max(0, yPos - height + 80);

        const allUnlocked = Worlds.every(w => GameState.isWorldUnlocked(w.num));
        const unlockBtn = this.add.text(width / 2, height - 15, allUnlocked
            ? '✓ All worlds unlocked'
            : 'I already know Helix — unlock all', {
            fontSize: '11px',
            fontFamily: 'Courier New, monospace',
            color: allUnlocked ? '#4ecdc4' : '#555577',
            padding: { x: 10, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);

        if (!allUnlocked) {
            unlockBtn.on('pointerover', () => unlockBtn.setColor('#ffd93d'));
            unlockBtn.on('pointerout', () => unlockBtn.setColor('#555577'));
            unlockBtn.on('pointerdown', () => {
                GameState.data.unlockedWorlds = [1, 2, 3, 4, 5];
                GameState.save();
                this.scene.restart();
            });
        }

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
            this.container.y = -this.scrollY;
        });

        let dragStartY = 0;
        let dragging = false;

        this.input.on('pointerdown', (pointer) => {
            if (pointer.y < height - 40) {
                dragStartY = pointer.y;
                dragging = true;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (dragging && pointer.isDown) {
                const dy = dragStartY - pointer.y;
                if (Math.abs(dy) > 5) {
                    this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, 0, this.maxScroll);
                    this.container.y = -this.scrollY;
                    dragStartY = pointer.y;
                }
            }
        });

        this.input.on('pointerup', () => {
            dragging = false;
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    isWorldComplete(worldIndex) {
        const worldNum = Worlds[worldIndex].num;
        const worldLevels = Levels.filter(l => l.world === worldNum);
        return worldLevels.every(l => GameState.isLevelCompleted(l.id));
    }
}
