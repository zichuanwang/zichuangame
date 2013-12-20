var BloodBarSprite = cc.Sprite.extend({

    HP: 100,
    maxHP: 100,

    ctor: function() {
        this._super();
        this.initWithSpriteFrameName("BloodBarInner.png");
        this.setScaleX(80);
        this.setScaleY(3);
        this.setPosition(58, 130);
        this.anchorPoint = new cc.Point(1, 1);
    },

    getHP: function() {
        return this.HP;
    },

    setHP: function(newHP) {
        this.setScaleX(newHP / this.maxHP * 80);
        this.setPositionX(this.getPositionX() - (this.HP - newHP) / this.maxHP * 80 / 2);
        this.HP = newHP;
    }
});

var GameCharacter = cc.Sprite.extend({

    facingRight: true,
    animFrame: 0,
    animPrefix: "Walk",
    id:0,
    bloodBar: null,
    attack: 10,
    defense: 5,

    ctor: function(data) {
        this._super();
        var cache = cc.SpriteFrameCache.getInstance();
        cache.addSpriteFrames(s_spritesheet, "res/spritesheet.png");

        this.facingRight = data.direction;
        var direction = "Left";
        if (this.facingRight) direction = "Right";
        this.initWithSpriteFrameName("Walk" + direction + "00.png");

        this.setPosition(new cc.Point(data.x, data.y));
        this.id = data.id;

        this.bloodBar = new BloodBarSprite();
        this.addChild(this.bloodBar);
    },

    getHP: function() {
        return this.bloodBar.getHP();
    },

    setHP: function(newHP) {
        this.bloodBar.setHP(newHP);
    },

    setDirection: function(right) {
        this.facingRight = right;
    },

    walk: function() {
        this.animFrame++;
        if (this.animFrame > 3)
            this.animFrame = 0;

        if (this.animPrefix != "Walk") {
            this.animPrefix = "Walk";
            this.animFrame = 1;
        }
        var direction = "Left";
        if (this.facingRight) direction = "Right";
        this.initWithSpriteFrameName("Walk" + direction + "0" + this.animFrame + ".png");
    },

    stand: function() {
        this.animPrefix = "Stand";
        var direction = "Left";
        if (this.facingRight) direction = "Right";
        this.initWithSpriteFrameName("Stand" + direction + "00.png");
    },

    punch: function() {
        this.animPrefix = "Punch"
        var direction = "Left";
        if (this.facingRight) direction = "Right";
        this.initWithSpriteFrameName("Punch" + direction + "01.png");
    },

    hurt: function() {
        this.animPrefix = "Hurt"
        var direction = "Left";
        if (this.facingRight) direction = "Right";
        this.initWithSpriteFrameName("Hurt" + direction + "01.png");
    }
});

var GameLayer = InputLayer.extend({

    localPlayer: null,
    remotePlayers: [],
    socket: null,
    scoreLabel: null,

    setEventHandlers: function() {
        this.socket.on("connect", this.onSocketConnected.bind(this));
        this.socket.on("disconnect", this.onSocketDisconnect.bind(this));
        this.socket.on("new remote player", this.onNewRemotePlayer.bind(this));
        this.socket.on("new local player", this.onNewLocalPlayer.bind(this));
        this.socket.on("move player", this.onMovePlayer.bind(this));
        this.socket.on("remove player", this.onRemovePlayer.bind(this));
        this.socket.on("punch player", this.onPunchPlayer.bind(this));
        this.socket.on("hurt player", this.onHurtPlayer.bind(this));
        this.socket.on("stand player", this.onStandPlayer.bind(this));
        this.socket.on("dead player", this.onDeadPlayer.bind(this));
    },

    onSocketConnected: function() {
        cc.log("Connected to socket server");
    },

    onNewLocalPlayer: function(data) {

        cc.log("New local player: " + data.id);

        this.localPlayer = new GameCharacter(data);
        this.addChild(this.localPlayer);
    },

    onNewRemotePlayer: function(data) {
        cc.log("New remote player: " + data.id);

        var newPlayer = new GameCharacter(data);
        this.remotePlayers.push(newPlayer);
        this.addChild(newPlayer);
    },

    onSocketDisconnect: function() {
        cc.log("Disconnected from socket server");
    },

    onStandPlayer: function(data) {
        cc.log("Stand player: " + data.id);

        var standPlayer = this.playerById(data.id);

        if (!standPlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        standPlayer.stand();
    },

    onMovePlayer: function(data) {
        cc.log("On player move: " + data.id);
        var movePlayer = this.playerById(data.id);

        if (!movePlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        movePlayer.setPosition(new cc.Point(data.x, data.y));
        movePlayer.setDirection(data.direction);
        movePlayer.walk();
    },

    onRemovePlayer: function(data) {
        var removePlayer = this.playerById(data.id);

        if (!removePlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        this.remotePlayers.splice(this.remotePlayers.indexOf(removePlayer), 1);
        this.removeChild(removePlayer);
    },

    onPunchPlayer: function(data) {
        var punchPlayer = this.playerById(data.id);

        if (!punchPlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        punchPlayer.punch();
    },

    onHurtPlayer: function(data) {
        cc.log("Player hurt:" + data.id);
        var hurtPlayer = this.playerById(data.id);

        if (!hurtPlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        hurtPlayer.hurt();

        hurtPlayer.setHP(data.HP);
    },

    onDeadPlayer: function(data) {
        cc.log("Player dead: " + data.id);

        var deadPlayer = this.playerById(data.id);

        if (!deadPlayer) {
            console.log("Player not found: " + data.id);
            return;
        };

        deadPlayer.stand();
        deadPlayer.setHP(data.HP);
        deadPlayer.setPositionX(data.x);
        deadPlayer.setPositionY(data.y);
        deadPlayer.setDirection(data.direction);

        this.scoreLabel.setString(data.scoreA.toString() + " : " + data.scoreB.toString());
    },

    playerById: function(id) {

        if (this.localPlayer.id == id)
            return this.localPlayer;

        var i;
        for (i = 0; i < this.remotePlayers.length; i++) {
            if (this.remotePlayers[i].id == id)
                return this.remotePlayers[i];
        };

        return false;
    },

    init: function() {
        this._super();

        var winSize = cc.Director.getInstance().getWinSize();
        cc.log(winSize.width.toString() + ", " + winSize.height.toString());

        var bgLayer = cc.LayerColor.create(
            new cc.Color4B(255, 255, 255, 255), winSize.width, winSize.height);
        this.addChild(bgLayer);

        this.scoreLabel = cc.LabelTTF.create("0 : 0", "Arial", 30);
        this.scoreLabel.setPosition(new cc.Point(
            winSize.width / 2,
            winSize.height / 2 + 300));
        this.scoreLabel.setColor(new cc.Color3B(0, 0, 0));
        this.addChild(this.scoreLabel);

        this.socket = io.connect("http://zichuanwang.com", {
            port: 80,
            transports: ["websocket"],
            rememberTransport: true
        });

        // Start listening for events
        this.setEventHandlers();
    },
    
    onKeyUp: function(e) {
        this._super(e);
        if (!this.keyboardStatus.space && !this.keyboardStatus.left && 
            !this.keyboardStatus.right && !this.keyboardStatus.up && !this.keyboardStatus.down) {
            this.localPlayer.stand();
            this.socket.emit("stand player", {});
        }
    },

    onKeyDown: function(e) {
        this._super(e);
        if (this.keyboardStatus.space) {
            this.localPlayer.punch();
            this.keyboardStatus.up = false;
            this.keyboardStatus.down = false;
            this.keyboardStatus.right = false;
            this.keyboardStatus.left = false;
            this.keyboardStatus.space = false;
            this.socket.emit("punch player", {});
        }

        prevPos = new cc.Point(this.localPlayer.getPosition().x, 
            this.localPlayer.getPosition().y);

        var winSize = cc.Director.getInstance().getWinSize();
        if (this.keyboardStatus.up && this.localPlayer.getPosition().y < winSize.height) {
            this.localPlayer.setPositionY(this.localPlayer.getPosition().y + 10);
        }
        if (this.keyboardStatus.down && this.localPlayer.getPosition().y > 0) {
            this.localPlayer.setPositionY(this.localPlayer.getPosition().y - 10);
        }
        if (this.keyboardStatus.left && this.localPlayer.getPosition().x > 0) {
            this.localPlayer.setPositionX(this.localPlayer.getPosition().x - 10);
            this.localPlayer.setDirection(false);
        }
        if (this.keyboardStatus.right && this.localPlayer.getPosition().x < winSize.width) {
            this.localPlayer.setPositionX(this.localPlayer.getPosition().x + 10);
            this.localPlayer.setDirection(true);
        }
        if (this.keyboardStatus.right || this.keyboardStatus.left || 
            this.keyboardStatus.up || this.keyboardStatus.down)
            this.localPlayer.walk();

        if (prevPos.x != this.localPlayer.getPosition().x ||
            prevPos.y != this.localPlayer.getPosition().y)
            this.socket.emit("move player", {
                x: this.localPlayer.getPosition().x, 
                y: this.localPlayer.getPosition().y,
                direction: this.localPlayer.facingRight
            });
    }
});

var GameScene = cc.Scene.extend({
    onEnter: function() {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer);
        layer.init();
    }
});

