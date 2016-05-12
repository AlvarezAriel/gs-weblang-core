function Board(sizeX, sizeY) {
    this.x = 0;
    this.y = 0;

    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.blue = 0;
    this.red = 1;
    this.black = 2;
    this.green = 3;
}

Board.prototype.init = function () {
    var table = [];
    for (var i = 0; i < this.sizeX; i++) {
        table[i] = [];
        for (var j = 0; j < this.sizeY; j++) {
            table[i][j] = 0;
        }
    }
    this.table = [table.slice(), table.slice(), table.slice(), table.slice()];
};

Board.prototype.clone = function () {
    var c = new Board(this.sizeX, this.sizeY);
    for (var i = 0; i < this.table.length; i++) {
        c.table[i] = this.table[i].slice();
    }
    c.x = this.x;
    c.y = this.y;
};

Board.prototype.putStone = function (color) {
    this.table[color][this.x][this.y] += 1;
};

Board.prototype.removeStone = function (color) {
    this.table[color][this.x][this.y] -= 1;
};

Board.prototype.move = function (dx, dy) {
    this.x += dx;
    this.y += dy;
};

module.exports = Board;
