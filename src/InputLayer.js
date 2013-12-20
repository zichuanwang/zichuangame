InputLayer = cc.Layer.extend({
    keyboardStatus: {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false
    },

    spaceLock: false,

    init: function() {
        this._super();
        this.setKeyboardEnabled(true);
    },

    onKeyDown: function(key) {
        switch (key) {
        case cc.KEY.left:
            this.keyboardStatus.left = true;
            break;
        case cc.KEY.up:
            this.keyboardStatus.up = true;
            break;
        case cc.KEY.right:
            this.keyboardStatus.right = true;
            break;
        case cc.KEY.down:
            this.keyboardStatus.down = true;
            break;
        case cc.KEY.space:
            if (this.spaceLock) break;
            this.keyboardStatus.space = true;
            this.spaceLock = true;
            break;
        }
    },

    onKeyUp: function(key) {
        switch (key) {
        case cc.KEY.left:
            this.keyboardStatus.left = false;
            break;
        case cc.KEY.up:
            this.keyboardStatus.up = false;
            break;
        case cc.KEY.right:
            this.keyboardStatus.right = false;
            break;
        case cc.KEY.down:
            this.keyboardStatus.down = false;
            break;
        case cc.KEY.space:
            this.keyboardStatus.space = false;
            this.spaceLock = false;
            break;
        }
    }
});