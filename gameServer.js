var util = require('util'),
player = require("./serverPlayer");

var gameServer = function(socket) {

	function init() {
		players = [];

		socket.configure(function() {
			socket.set("transports", ["websocket"]);
			socket.set("log level", 0);
		});

		setEventHandlers();
	};

	var setEventHandlers = function() {
		socket.on("connection", onSocketConnection);
	};

	init();

	function onSocketConnection(client) {
		util.log("New player has connected: " + client.id);
		client.on("disconnect", onClientDisconnect);
		client.on("new player", onNewPlayer);
		client.on("move player", onMovePlayer);
		client.on("punch player", onPunchPlayer);
		client.on("stand player", onStandPlayer);

		client.emit("client id", {
			id: client.id
		});
	};

	function onClientDisconnect() {
		util.log("Player has disconnected: " + this.id);

		var removePlayer = playerById(this.id);

		if (!removePlayer) {
			util.log("Player not found: " + this.id);
			return;
		};

		players.splice(players.indexOf(removePlayer), 1);
		this.broadcast.emit("remove player", {id: this.id});
	};

	function onNewPlayer(data) {
		var newPlayer = new player(data.x, data.y);
		newPlayer.id = this.id;

		this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.x, y: newPlayer.y});

		var i, existingPlayer;
		for (i = 0; i < players.length; i++) {
			existingPlayer = players[i];
			this.emit("new player", {id: existingPlayer.id, x: existingPlayer.x, y: existingPlayer.y});
		};
		players.push(newPlayer);
	};

	function onPunchPlayer(data) {

		util.log("Player punch: " + this.id);

		var punchPlayer = playerById(this.id);

		if (!punchPlayer) {
			util.log("Player not found: " + this.id);
			return;
		}

		this.broadcast.emit("punch player", {
			id: punchPlayer.id
		});

		var i;
		for (i = 0; i < players.length; i++) {
			player = players[i];
			if (player.id == this.id) continue;
			util.log("distance:" + Math.pow(punchPlayer.x - player.x, 2) + Math.pow(punchPlayer.y - player.y, 2).toString());
			if (Math.pow(punchPlayer.x - player.x, 2) + 
				Math.pow(punchPlayer.y - player.y, 2) < Math.pow(70, 2)) {
				if (!punchPlayer.facingRight && player.facingRight && punchPlayer.x < player.x ||
					punchPlayer.facingRight && !player.facingRight && punchPlayer.x > player.x) continue;

				util.log("Player hurt: " + player.id);

				this.emit("hurt player", {
					id: player.id
				});
				this.broadcast.emit("hurt player", {
					id: player.id
				});
			}
		}
	}

	function onStandPlayer(data) {
		var standPlayer = playerById(this.id);

		if (!standPlayer) {
			util.log("Player not found: " + this.id);
			return;
		};

		this.broadcast.emit("stand player", {
			id: standPlayer.id, 
		});
	}

	function onMovePlayer(data) {
		var movePlayer = playerById(this.id);

		if (!movePlayer) {
			util.log("Player not found: " + this.id);
			return;
		};

		movePlayer.x = data.x;
		movePlayer.y = data.y;
		movePlayer.facingRight = data.direction;

		util.log(movePlayer.id + ":" + movePlayer.facingRight.toString());

		this.broadcast.emit("move player", {
			id: movePlayer.id, 
			x: movePlayer.x, 
			y: movePlayer.y,
			direction: movePlayer.facingRight
		});
	};

	function playerById(id) {
		var i;
		for (i = 0; i < players.length; i++) {
			if (players[i].id == id)
				return players[i];
		};

		return false;
	};
}

exports.gameServer =  gameServer;

