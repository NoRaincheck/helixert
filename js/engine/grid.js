const TileType = {
    EMPTY: '.',
    WALL: '#',
    TARGET: 'T',
    START: 'S',
    DOOR: 'D',
    BONUS: '*',
    COLLECTED: 'C',
    SWITCH: 'X',
    FLOOR_MARK: 'F'
};

class Grid {
    constructor(levelData) {
        this.width = levelData.grid.width;
        this.height = levelData.grid.height;
        this.tiles = [];
        this.startPos = { ...levelData.grid.start };
        this.playerPos = { ...levelData.grid.start };

        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = levelData.grid.tiles[y][x];
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return TileType.WALL;
        }
        return this.tiles[y][x];
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = type;
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return true;
    }

    isTarget(x, y) {
        const tile = this.getTile(x, y);
        return tile === TileType.TARGET;
    }

    collectTarget(x, y) {
        if (this.isTarget(x, y)) {
            this.setTile(x, y, TileType.COLLECTED);
            return true;
        }
        return false;
    }

    getTargetsRemaining() {
        let count = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === TileType.TARGET) count++;
            }
        }
        return count;
    }

    findCharInDirection(startX, startY, dirX, dirY, char) {
        let x = startX + dirX;
        let y = startY + dirY;
        while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            if (this.tiles[y][x] === char) {
                return { x, y };
            }
            x += dirX;
            y += dirY;
        }
        return null;
    }

    findCharTill(startX, startY, dirX, dirY, char) {
        let x = startX + dirX;
        let y = startY + dirY;
        let prevX = startX;
        let prevY = startY;
        while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            if (this.tiles[y][x] === char) {
                return { x: prevX, y: prevY };
            }
            prevX = x;
            prevY = y;
            x += dirX;
            y += dirY;
        }
        return null;
    }

    getFirstNonWallInRow(y, direction) {
        if (direction > 0) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        } else {
            for (let x = this.width - 1; x >= 0; x--) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        }
        return -1;
    }

    getLastNonWallInRow(y, direction) {
        if (direction > 0) {
            for (let x = this.width - 1; x >= 0; x--) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        } else {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] !== TileType.WALL) return x;
            }
        }
        return -1;
    }

    isFloorMark(x, y) {
        return this.getTile(x, y) === TileType.FLOOR_MARK;
    }
}
