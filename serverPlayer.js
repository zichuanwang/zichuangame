var player = function(startX, startY) {
    var x = startX,
        y = startY,
        facingRight = true,
        id;

    return {
        x: x,
        y: y,
        id: id,
        facingRight: facingRight
    }
};

module.exports = player;