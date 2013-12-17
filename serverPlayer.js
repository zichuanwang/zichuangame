var player = function(startX, startY, initid, initDirection) {
    this.x = startX;
    this.y = startY;
    this.facingRight = initDirection;
    this.id = initid;

    return this;
};

module.exports = player;