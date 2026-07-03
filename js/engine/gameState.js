const GameState = {
    STORAGE_KEY: 'helixert-progress',

    data: null,

    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data = this.getDefault();
        }
    },

    getDefault() {
        return {
            unlockedWorlds: [1],
            completedLevels: {},
            bestScores: {}
        };
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    isLevelCompleted(levelId) {
        return !!this.data.completedLevels[levelId];
    },

    isWorldUnlocked(worldNum) {
        return this.data.unlockedWorlds.includes(worldNum);
    },

    completeLevel(levelId, worldNum, keystrokes) {
        this.data.completedLevels[levelId] = true;

        if (!this.data.bestScores[levelId] || keystrokes < this.data.bestScores[levelId]) {
            this.data.bestScores[levelId] = keystrokes;
        }

        const totalLevelsInWorld = 5;
        const completedInWorld = Object.keys(this.data.completedLevels)
            .filter(id => id.startsWith(`w${worldNum}-`))
            .length;

        if (completedInWorld >= totalLevelsInWorld) {
            const nextWorld = worldNum + 1;
            if (nextWorld <= 5 && !this.data.unlockedWorlds.includes(nextWorld)) {
                this.data.unlockedWorlds.push(nextWorld);
            }
        }

        this.save();
    },

    getBestScore(levelId) {
        return this.data.bestScores[levelId] || Infinity;
    },

    reset() {
        this.data = this.getDefault();
        this.save();
    }
};

GameState.init();
