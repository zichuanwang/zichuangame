/**
 * Created with JetBrains WebStorm.
 * User: Chris
 * Date: 8/3/12
 * Time: 7:21 PM
 * To change this template use File | Settings | File Templates.
 */
var express = require("express"),
    server = express(),
    app = server.listen(80),
    io = require("socket.io"),
    gameServer = require("./gameServer").gameServer;

var socket = io.listen(app);

server.use('/', express.static(__dirname + '/') );

server.get('/', function(req,res){
    res.sendfile('index.html');
    console.log('Sent index.html');
});

gameServer(socket);