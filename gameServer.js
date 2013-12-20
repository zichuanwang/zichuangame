var util = require('util'),
		player = require("./serverPlayer").player,
		io = require("socket.io");

var players = [];
var teamACount = 0;
var teamBCount = 0;

function listen(app) {

	io = io.listen(app);

	io.configure(function() {
		io.set("transports", ["websocket"]);
		io.set("log level", 0);
	});

	io.sockets.on("connection", onSocketConnection);
}

function onSocketConnection(client) {
	util.log("New player has connected: " + client.id);
	client.on("disconnect", onClientDisconnect);
	client.on("move player", onMovePlayer);
	client.on("punch player", onPunchPlayer);
	client.on("stand player", onStandPlayer);

	onNewPlayer(client);
}

function onClientDisconnect() {
	util.log("Player has disconnected: " + this.id);

	var removePlayer = playerById(this.id);

	if (!removePlayer) {
		util.log("Player not found: " + this.id);
		return;
	}

	if (removePlayer.team == "A") teamACount--;
	else teamBCount--;

	players.splice(players.indexOf(removePlayer), 1);
	this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(client) {

	var posX = 300, posY = 300, facingRight = true, newTeam = "A";
	if (teamACount > teamBCount) {
		posX = 1024 - 300;
		facingRight = false;
		newTeam = "B";
		teamBCount++;
	} else {
		teamACount++;
	}

	var playerInfo = {
		id: client.id,
		x: posX,
		y: posY,
		direction: facingRight,
		HP: 100, // TODO
		team: newTeam
	};

	var newPlayer = new player(playerInfo);
	players.push(newPlayer);
	client.emit("new local player", playerInfo);
	client.broadcast.emit("new remote player", playerInfo);

	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		if (existingPlayer.id == newPlayer.id) continue;
		client.emit("new remote player", {
			id: existingPlayer.id,
			x: existingPlayer.x,
			y: existingPlayer.y,
			direction: existingPlayer.facingRight,
			HP: existingPlayer.HP,
			team: existingPlayer.team
		});
	}
}

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
		var player = players[i];
		if (player.id == this.id) continue;
			// util.log("distance:" + Math.pow(punchPlayer.x - player.x, 2) + Math.pow(punchPlayer.y - player.y, 2).toString());
			if (Math.pow(punchPlayer.x - player.x, 2) + 
				Math.pow(punchPlayer.y - player.y, 2) < Math.pow(70, 2)) {
				if (!punchPlayer.facingRight && player.facingRight && punchPlayer.x > player.x ||
					punchPlayer.facingRight && !player.facingRight && punchPlayer.x < player.x || 
					punchPlayer.facingRight && player.facingRight && punchPlayer.x < player.x ||
					!punchPlayer.facingRight && !player.facingRight && punchPlayer.x > player.x) {

					util.log("Player hurt: " + player.id);

				player.HP -= 10;
				if (player.HP < 0) player.HP = 0;

				if (player.HP == 0) {
					util.log("Player " + this.id + " is dead.");
				}

				io.sockets.emit("hurt player", {
					id: player.id,
					HP: player.HP
				});
			}
		}			
	}
}

function onStandPlayer(data) {
	var standPlayer = playerById(this.id);

	if (!standPlayer) {
		util.log("Player not found: " + this.id);
		return;
	}

	this.broadcast.emit("stand player", {
		id: standPlayer.id, 
	});
}

function onMovePlayer(data) {
	var movePlayer = playerById(this.id);

	if (!movePlayer) {
		util.log("Player not found: " + this.id);
		return;
	}

	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.facingRight = data.direction;

	this.broadcast.emit("move player", {
		id: movePlayer.id, 
		x: movePlayer.x, 
		y: movePlayer.y,
		direction: movePlayer.facingRight
	});
}

function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	}

	return false;
}

exports.listen = listen;
