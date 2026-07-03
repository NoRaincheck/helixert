class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, width, height);

        const title = this.add.text(width / 2, height * 0.2, 'HELIX MAZE', {
            fontSize: '48px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            stroke: '#1a1a2e',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            y: title.y + 8,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        const subtitle = this.add.text(width / 2, height * 0.32, 'Learn Helix Editor Keybindings', {
            fontSize: '18px',
            fontFamily: 'Courier New, monospace',
            color: '#8888aa'
        }).setOrigin(0.5);

        const playerSprite = this.add.image(width / 2, height * 0.48, 'player')
            .setDisplaySize(64, 64);

        this.tweens.add({
            targets: playerSprite,
            x: width / 2 + 20,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        const instructions = [
            'Drive the van through mazes using Helix keybindings',
            'h j k l to move, w b e for word jumps',
            'f <char> to find, g goto mode, and more!',
            '',
            'Match the keystroke par to earn Wizard rank'
        ];

        this.add.text(width / 2, height * 0.6, instructions.join('\n'), {
            fontSize: '13px',
            fontFamily: 'Courier New, monospace',
            color: '#aaaacc',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        const playBtn = this.add.text(width / 2, height * 0.82, '[ PLAY ]', {
            fontSize: '28px',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            color: '#4ecdc4',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => {
            playBtn.setColor('#ffffff');
            playBtn.setScale(1.1);
        });

        playBtn.on('pointerout', () => {
            playBtn.setColor('#4ecdc4');
            playBtn.setScale(1);
        });

        playBtn.on('pointerdown', () => {
            this.scene.start('LevelSelectScene');
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('LevelSelectScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('LevelSelectScene');
        });

        this.add.text(width / 2, height * 0.94, 'Press ENTER or SPACE to start', {
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            color: '#666688'
        }).setOrigin(0.5);
    }
}
