class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.levelId = data.levelId;
        this.worldNum = data.worldNum;
        this.keystrokes = data.keystrokes;
        this.par = data.par;
        this.wizard = data.wizard;
    }

    create() {
        const { width, height } = this.cameras.main;
        const levelData = Levels.find(l => l.id === this.levelId);
        const world = Worlds.find(w => w.num === this.worldNum);

        GameState.completeLevel(this.levelId, this.worldNum, this.keystrokes);

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        let rank, rankColor, stars;
        if (this.keystrokes <= this.wizard) {
            rank = 'WIZARD';
            rankColor = '#9b5de5';
            stars = 3;
        } else if (this.keystrokes <= this.par) {
            rank = 'CLEVER';
            rankColor = '#4ecdc4';
            stars = 2;
        } else {
            rank = 'COMPLETED';
            rankColor = '#ffd93d';
            stars = 1;
        }

        this.add.text(width / 2, height * 0.15, 'LEVEL COMPLETE!', {
            fontSize: '32px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.25, `${world.icon} ${levelData.name}`, {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#aaaacc'
        }).setOrigin(0.5);

        const rankText = this.add.text(width / 2, height * 0.38, rank, {
            fontSize: '42px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: rankColor,
            stroke: '#1a1a2e',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: rankText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: rankText,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200
                });
            }
        });

        const starY = height * 0.5;
        for (let i = 0; i < 3; i++) {
            const starX = width / 2 + (i - 1) * 60;
            const earned = i < stars;
            const star = this.add.image(starX, starY, earned ? 'star' : 'star')
                .setDisplaySize(48, 48)
                .setAlpha(0);

            if (!earned) {
                star.setTint(0x333355);
            }

            this.tweens.add({
                targets: star,
                alpha: 1,
                scaleX: earned ? 1.1 : 0.8,
                scaleY: earned ? 1.1 : 0.8,
                duration: 300,
                delay: 300 + i * 200,
                ease: 'Back.easeOut'
            });
        }

        const statsY = height * 0.62;
        this.add.text(width / 2, statsY, `Keystrokes: ${this.keystrokes}`, {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, statsY + 30, `Par: ${this.par}  |  Wizard: ${this.wizard}`, {
            fontSize: '14px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa'
        }).setOrigin(0.5);

        if (this.keystrokes <= this.wizard) {
            this.add.text(width / 2, statsY + 60, '⚡ Under wizard par!', {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                color: '#9b5de5'
            }).setOrigin(0.5);
        } else if (this.keystrokes <= this.par) {
            this.add.text(width / 2, statsY + 60, '✓ Under par!', {
                fontSize: '14px',
                fontFamily: 'Courier New, monospace',
                color: '#4ecdc4'
            }).setOrigin(0.5);
        }

        const btnY = height * 0.82;

        const retryBtn = this.add.text(width / 2 - 140, btnY, '[ Retry ]', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#ff6b6b',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
        retryBtn.on('pointerout', () => retryBtn.setColor('#ff6b6b'));
        retryBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { levelId: this.levelId, worldNum: this.worldNum });
        });

        const nextLevel = Levels.find(l => l.world === this.worldNum && Levels.indexOf(l) === Levels.indexOf(levelData) + 1);

        const nextBtn = this.add.text(width / 2, btnY, nextLevel ? '[ Next Level ]' : '[ World Map ]', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
        nextBtn.on('pointerout', () => nextBtn.setColor('#4ecdc4'));
        nextBtn.on('pointerdown', () => {
            if (nextLevel) {
                this.scene.start('GameScene', { levelId: nextLevel.id, worldNum: this.worldNum });
            } else {
                this.scene.start('LevelSelectScene');
            }
        });

        const mapBtn = this.add.text(width / 2 + 140, btnY, '[ Map ]', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        mapBtn.on('pointerover', () => mapBtn.setColor('#ffffff'));
        mapBtn.on('pointerout', () => mapBtn.setColor('#8888aa'));
        mapBtn.on('pointerdown', () => {
            this.scene.start('LevelSelectScene');
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            if (nextLevel) {
                this.scene.start('GameScene', { levelId: nextLevel.id, worldNum: this.worldNum });
            } else {
                this.scene.start('LevelSelectScene');
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('LevelSelectScene');
        });
    }
}
