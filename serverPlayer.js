var player = function(data) {
    this.x = data.x;
    this.y = data.y;
    this.facingRight = data.direction;
    this.id = data.id;
    this.HP = data.HP;
    this.team = data.team;

    return this;
};

module.exports.player = player;