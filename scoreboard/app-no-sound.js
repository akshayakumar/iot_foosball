const request = require('request');
const express = require('express');
const path = require('path');
const app = express();
const _ = require('lodash');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const play = require('play');

const mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://128.107.70.30');
var winningTimeout = 10 //number of seconds to flash winner

server.listen(3003, function(err){
	if(!err)
		console.log('Listening on port 3003');
});

app.use('/', express.static(path.join(__dirname, 'public')));

var foosballScores = {
	'team1Score' : 0,
	'team2Score' : 0,
	'winner': false,
	'winningTeam': null
};

io.on('connection', function (socket) {
	socket.emit('hello', {winningTimeout: winningTimeout});
	socket.emit('scoreUpdate', foosballScores);
});

client.on('connect', function () {
	client.subscribe(['foosball/score','foosball/speed']);
	//client.publish('presence', 'Hello mqtt')
});

client.on('message', function (topic, rawMessage) {
	console.log('MQTT message received');

	// message is Buffer, parse to JSON
	try {
		var message = JSON.parse(rawMessage);
	} catch(e) {
		console.error('Invalid JSON in MQTT Message'); // error in the above string (in this case, yes)!
		console.error(e);
	}

	if (message) {	
		processMQTT();
	}

	function processMQTT() {
		console.log(JSON.stringify(message));
		if (topic == 'foosball/score') {
			processScore(message);
		}
		else if (topic == 'foosball/speed' && message.Speed < 30 && message.Speed > .1) {
			message.Event = 'speed';
			processSpeed(message.Speed);
		}
	}
});

var processSpeed = (speed) => {
	io.emit('speedUpdate', {'speed':speed});
};

function processScore(message) {
	

	//increment score
	if (message.Player == '1') {
		foosballScores.team1Score = foosballScores.team1Score+1;
	}
	else if (message.Player == '2') {
		foosballScores.team2Score = foosballScores.team2Score+1;
	}
    
	console.log('Team 1 Score from MQTT: '+foosballScores.team1Score);
	console.log('Team 2 Score from MQTT: '+foosballScores.team2Score);

	if (foosballScores.team1Score < 5 && foosballScores.team2Score < 5) {
		//ding bell
		// play.sound('./sounds/single_ding.wav');
		
		//emit websocket with scores to all connected clients
		io.emit('scoreUpdate', foosballScores);

	}
    
	else if (foosballScores.team1Score == 5 && foosballScores.team2Score < 5  || foosballScores.team2Score == 5 && foosballScores.team1Score < 5) {
		setWinner(foosballScores.team1Score, foosballScores.team2Score);
	}
	else if (foosballScores.team1Score > 5 || foosballScores.team2Score > 5) {
		console.log('Ignoring large score - game over');
		//gameOn = false
		//resetScore();
		//resetGame();
	}  
}

function resetScore() {
	foosballScores.team1Score = 0;
	foosballScores.team2Score = 0;
	foosballScores.winner = false;
	foosballScores.winningTeam = null;
	io.emit('scoreUpdate', foosballScores);
}

function setWinner (team1, team2) {
	//Play winning sound
	//ding bell
	// play.sound('./sounds/single_ding.wav');
	
	setTimeout(() => {
		// play.sound('./sounds/win.wav')
	}, 500);
	

	//Call DX
	
	//emit websocket with winner if want to do animation for winner
	foosballScores.winner = true;
	
	if (foosballScores.team1Score == 5){
		foosballScores.winningTeam = 1;
	}
	else if (foosballScores.team2Score == 5){
		foosballScores.winningTeam = 2;
	}
	
	io.emit('scoreUpdate', foosballScores);

	//Wait specific # of seconds in winningTimeout to reset score
	setTimeout(() => {
		resetScore();
	}, (winningTimeout + 2) * 1000);

}

function callDX() {
	var options = { method: 'POST',
		url: 'http://10.10.20.10:8181/AutomationFX/api/cti/calls/SEP881DFC60ED16/5555?apikey=endpoint12345' };

	request(options, function (error, response, body) {
		if (error) throw new Error(error);

		console.log('Called DX');
	});
}