class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const { width, height } = this.cameras.main;

        const barBg = this.add.rectangle(width / 2, height / 2 + 40, 300, 20, 0x333355);
        const bar = this.add.rectangle(width / 2 - 150, height / 2 + 40, 0, 16, 0x4ecdc4);
        bar.setOrigin(0, 0.5);

        const loadingText = this.add.text(width / 2, height / 2 - 20, 'Loading Helixert...', {
            fontSize: '20px',
            fontFamily: 'Courier New, monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.width = 300 * value;
        });

        this.load.on('complete', () => {
            loadingText.setText('Ready!');
        });

        const sprites = [
            { key: 'player', file: 'assets/sprites/player.png' },
            { key: 'target', file: 'assets/sprites/target.png' },
            { key: 'wall', file: 'assets/sprites/house.png' },
            { key: 'door', file: 'assets/sprites/door.png' },
            { key: 'star', file: 'assets/sprites/star.png' },
            { key: 'check', file: 'assets/sprites/check.png' },
            { key: 'flag', file: 'assets/sprites/flag.png' },
            { key: 'sparkle', file: 'assets/sprites/sparkle.png' },
            { key: 'ground', file: 'assets/sprites/ground.png' },
            { key: 'cake', file: 'assets/sprites/cake.png' },
            { key: 'chocolate', file: 'assets/sprites/chocolate.png' },
            { key: 'lollipop', file: 'assets/sprites/lollipop.png' },
        ];

        sprites.forEach(s => this.load.image(s.key, s.file));
    }

    create() {
        this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
        });
    }
}
