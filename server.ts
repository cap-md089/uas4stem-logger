import * as net from 'net';
import * as fs from 'fs';
import { createSocket } from 'dgram';

// const utm = require('utm-latlng');
// const utmObj = new utm();

import * as $ from './jquery-2.1.4.min';

import UASSession from './UASSession';

interface CurrentState {
	timeInAir: number;
	lat: number;
	lng: number;
	armed: boolean;
	batteryVoltage: number;
	batteryRemaining: number;
	altitude: number;
	groundspeed: number;
	throttle: number;
	distToHome: number;
	verticalSpeed: number;
	rtlSpeed: number;
	rtlLandSpeed: number;
	roll: number;
	pitch: number;
	yaw: number;
	offsetx?: number;
	offsety?: number;
	timeRequired: number;
}

const columnHeads: string[] = [
	'timeInAir',
	'lat',
	'lng',
	'armed',
	'batteryVoltage',
	'alt',
	'batteryRemaining',
	'groundspeed',
	'throttle',
	'dth',
	'verticalSpeed',
	'rtlSpeed',
	'rtlLandSpeed',
	'roll',
	'yaw',
	'pitch',
	'timeRequired'
];

function parseCSV(csv: string): CurrentState {
	let results = csv.split(',');
	let result = {} as CurrentState;
	for (let i in results) {
		if (results.hasOwnProperty(i)) {
			result[columnHeads[i]] = results[i];
			if (i === '3') {
				// tslint:disable-next-line:no-any
				result.armed = ((result.armed as any) as string) === 'true';
			} else {
				result[columnHeads[i]] = parseFloat(results[i]);
			}
		}
	}
	return result;
}

const start = Math.round(Date.now() / 1000);

let currentState: CurrentState = {
	timeInAir: 0,
	lat: 0,
	lng: 0,
	armed: false,
	batteryVoltage: 0,
	altitude: 0,
	batteryRemaining: 0,
	groundspeed: 0,
	throttle: 0,
	distToHome: 0,
	verticalSpeed: 0,
	rtlSpeed: 0,
	rtlLandSpeed: 0,
	roll: 0,
	pitch: 0,
	yaw: 0,
	timeRequired: 0
};

let packetCount = 0;

const checkTime = 10;

setInterval(() => {
	let npc = packetCount;
	UASSession.connection.packets += npc;
	UASSession.connection.packetsPerSecond = npc * (1000 / checkTime);
	packetCount = 0;
}, checkTime);

const server = createSocket('udp4');

server.on('message', buff => {
	packetCount += 1;
	let data = buff.toString();
	try {
		data = data.toString();
		let bestData = data;
		let ncs: CurrentState = parseCSV(bestData);
		if (
			(ncs.throttle > 12 || ncs.groundspeed > 3) &&
			ncs.armed &&
			!UASSession.flying
		) {
			UASSession.prepare();
			UASSession.flightCount++;
			UASSession.flying = true;
			$('#battLog').append(
				'--Flight ' + UASSession.flightCount + '--<br />'
			);
			log('--Flight ' + UASSession.flightCount + ' started--');
		} else if (
			((ncs.throttle < 12 && ncs.groundspeed < 3) || !ncs.armed) &&
			UASSession.flying
		) {
			UASSession.reset();
			UASSession.volts.push(currentState.batteryVoltage);
			$('#battLog').append(currentState.batteryVoltage + '<br />');
			save($('#fileLoc').val() as string);
			log(
				'--Flight ' +
					UASSession.flightCount +
					' ended (' +
					(Math.round(Date.now() / 1000) -
						start -
						UASSession.flightTimer) +
					's, ' +
					(Math.round(Date.now() / 1000) -
						start -
						UASSession.batteryTimer) +
					's total)--'
			);
		}

		currentState = ncs;

		/*if (queue.length > 0) {
				socket.write(JSON.stringify(queue[0]));
				queue.splice(0);
			} else {
				socket.write('');
			}*/
	} catch (e) {
		error(e.stack);
	}

	$('#currentcoords').html(
		`${currentState.lat.toFixed(6)}, ${currentState.lng.toFixed(6)}`
	);
	$('#connection').html(
		`Connection speed: ${('000' + UASSession.connection.packetsPerSecond.toString()).substr(-3)} packet/s`
	);
	$('#armed').html(currentState.armed ? 'ARMED' : 'DISARMED');

	if (UASSession.flying) {
		update();
	}
});

server.bind(54248, '127.0.0.1');

let listeningSockets: net.Socket[] = [];
net.createServer((socket: net.Socket) => {
	listeningSockets.push(socket);
}).listen(1337, '127.0.0.1');

// function map (i: number, a: number, b: number, c: number, d: number) {
// 	return c + (d - c) * ((i - a) / (b - a));
// }

var log = function(text: string) {
	$('#console').append(text + '<br />');
};

var warn = function(text: string) {
	log('<span style="color:#880">' + text + '</span>');
};

var error = function(text: string) {
	log('<span style="color:red">' + text + '</span>');
};

$('#batteryIdSel').change(function() {
	UASSession.batteryId = parseInt(
		$('#batteryIdSel')
			.find(':selected')
			.text(),
		10
	);
	log('New UAS battery ID ' + UASSession.batteryId);
});

$('#cameracalci').on('keydown keyup', function() {
	let cameraValues = UASSession.getCameraValues(
		parseFloat($('#cameracalci').val())
	);

	$('#cameracalco').html(
		'Width: ' +
			cameraValues.width.toFixed(1) +
			'm; ' +
			'Depth: ' +
			cameraValues.depth.toFixed(1) +
			'm; ' +
			'Area: ' +
			(cameraValues.width * cameraValues.depth).toFixed(1) +
			'm<sup>2</sup>'
	);
});

{
	let cameraValues = UASSession.getCameraValues(25);

	$('#cameracalco').html(
		'Width: ' +
			cameraValues.width.toFixed(1) +
			'm; ' +
			'Depth: ' +
			cameraValues.depth.toFixed(1) +
			'm; ' +
			'Area: ' +
			(cameraValues.width * cameraValues.depth).toFixed(1) +
			'm<sup>2</sup>'
	);
}

// var mtan = function (v: number): number {
// 	return Math.tan(v * (Math.PI / 180));
// };

function update() {
	if (Math.round(Date.now() / 1000) - start - UASSession.voltageTimer >= 20) {
		UASSession.voltageTimer = Math.round(Date.now() / 1000) - start;
		UASSession.volts.push(currentState.batteryVoltage);
		$('#battLog').append(currentState.batteryVoltage + '<br />');
	}

	if (UASSession.recordingCoords) {
		// offsetx = -currentState.offsetx;
		// offsety = -currentState.offsety;
		// var coordinates = utmObj.convertLatLngToUtm(currentState.lat, currentState.lng);
		// coordinates.Easting += offsetx;
		// coordinates.Northing += ofssety;
		// var coordinates = utmObj.convertUtmToLatLng(
		// 		coordinates.Easting, coordinates.Northing, coordinates.ZoneNumber, coordinates.ZoneLetter
		// );

		// UAS.rlats.push(coordinates.lat);
		// UAS.rlongs.push(coordinates.lang);

		UASSession.recordingLats.push(currentState.lat);
		UASSession.recordingLongs.push(currentState.lng);
	}

	let cameraValues = UASSession.getCameraValues(currentState.altitude);

	$('#cameracalco').html(
		'Width: ' +
			cameraValues.width.toFixed(1) +
			'm; ' +
			'Depth: ' +
			cameraValues.depth.toFixed(1) +
			'm; ' +
			'Area: ' +
			(cameraValues.width * cameraValues.depth).toFixed(1) +
			'm<sup>2</sup>'
	);

	let timeLeft =
		UASSession.maxFlightTime -
		Math.round(Date.now() / 1000 - start - UASSession.batteryTimer);
	let timeNow = Math.round(
		Date.now() / 1000 - start - UASSession.batteryTimer
	);
	let timeRequired = Math.round(currentState.timeRequired);
	let secondsRequired = Math.floor(timeRequired % 60);
	$('#timeleft').html(
		'<p style="margin:0px">Time in air: ' +
			Math.floor(timeNow / 60) +
			':' +
			('0' + (timeNow % 60)).substr(-2) +
			'</p>' +
			'<p style="margin:0px">Time left: ' +
			Math.floor(timeLeft / 60) +
			':' +
			('0' + (timeLeft % 60)).substr(-2) +
			'</p>' +
			'<p style="margin:0px;' +
			(timeRequired > timeLeft
				? 'color:red'
				: timeRequired + 30 > timeLeft
					? 'color:#880'
					: '') +
			'">Time required to land: ' +
			Math.floor(timeRequired / 60) +
			':' +
			('0' + secondsRequired).substr(-2) +
			'</p>'
	);
}

function save(file?: string) {
	file = file || $('#fileLoc').val() || UASSession.fileLocation;
	let sessions: {
		[key: string]: {
			coordinates: {
				latitude: number;
				longitude: number;
				time: number;
				description: string;
			}[];
			batteryLog: number[];
			timeInAir: number;
			batteryId: number;
		};
	} = {};
	fs.stat(file, (err1, _) => {
		if (err1 && err1.code === 'ENOENT') {
			log('File not found, creating');
			sessions = {};
			sessions[UASSession.sessionID] = {
				coordinates: UASSession.coords,
				batteryLog: UASSession.volts,
				timeInAir:
					Math.round(Date.now() / 1000) -
					start -
					UASSession.flightTimer,
				batteryId: UASSession.batteryId
			};
			let sessionsString = JSON.stringify(sessions, null, 4);
			fs.writeFile(file, sessionsString, (err2: Error) => {
				if (err2) {
					warn('Could not save to file');
				}
			});
		} else if (err1) {
			throw err1;
		} else {
			fs.readFile(file, (err, buff) => {
				let data: string;
				if (err) {
					warn('Cannot read file');
					data = '';
				}
				data = buff.toString();
				if (data === '') {
					data = '{}';
				}
				try {
					sessions = JSON.parse(data);
				} catch (e) {
					sessions = {};
				}
				sessions[UASSession.sessionID] = {
					coordinates: UASSession.coords,
					batteryLog: UASSession.volts,
					timeInAir:
						Math.round(Date.now() / 1000) -
						start -
						UASSession.batteryTimer,
					batteryId: UASSession.batteryId
				};
				let sessionsString = JSON.stringify(sessions, null, 4);
				fs.writeFile(file, sessionsString, (err2: Error) => {
					if (err2) {
						warn('Could not write data');
					}
				});
			});
		}
	});
}

function startRecording() {
	$('#startstop').text('Stop recording');
	$('#coordoutput').text('Recording coordinates...');
	UASSession.recordingCoords = true;
}

function stopRecording() {
	$('#startstop').text('Start recording');
	UASSession.recordingCoords = false;
	let lat = average(UASSession.recordingLats);
	let lng = average(UASSession.recordingLongs);
	$('#coordoutput').text(lat.toFixed(9) + ', ' + lng.toFixed(9));
	UASSession.coords.push({
		latitude: lat,
		longitude: lng,
		time: Math.round(Date.now() / 1000) - start - UASSession.flightTimer,
		description: $('#coorddescinput').val()
	});
	log(
		'"' +
			$('#coorddescinput').val() +
			'": ' +
			lat.toFixed(7) +
			', ' +
			lng.toFixed(7) +
			' (' +
			(Math.round(Date.now() / 1000) - start - UASSession.flightTimer) +
			') ' +
			'[' +
			UASSession.recordingLats.length +
			'/' +
			UASSession.recordingLongs.length +
			']'
	);
	UASSession.recordingLats = [];
	UASSession.recordingLongs = [];
	save();
}

export function toggleRecording() {
	if (UASSession.recordingCoords) {
		stopRecording();
	} else {
		startRecording();
	}
}

function average(arr: number[]): number {
	if (arr.length === 0) {
		return 0;
	}
	let sum = 0;
	for (let i = 0; i < arr.length; i++) {
		sum += arr[i];
	}
	return sum / arr.length;
}

$(window).on('close', save);

export function sendRC(...data: number[]) {
	listeningSockets.forEach(sock => sock.write(new Buffer(data)));
}

// function timeSpentInAir () {
// 	return Math.round(Date.now() / 1000) - start - UASSession.batteryTimer;
// }

{
	let timeLeft = UASSession.maxFlightTime;
	let timeNow = 0;
	let timeRequired = 0;
	let secondsRequired = Math.floor(timeRequired % 60);
	$('#timeleft').html(
		'<p style="margin:0px">Time in air: ' +
			Math.floor(timeNow / 60) +
			':' +
			('0' + (timeNow % 60)).substr(-2) +
			'</p>' +
			'<p style="margin:0px">Time left: ' +
			Math.floor(timeLeft / 60) +
			':' +
			('0' + (timeLeft % 60)).substr(-2) +
			'</p>' +
			'<p style="margin:0px;' +
			(timeRequired > timeLeft
				? 'color:red'
				: timeRequired - 30 > timeLeft
					? 'color:yellow'
					: '') +
			'">Time required to land: ' +
			Math.floor(timeRequired / 60) +
			':' +
			('0' + secondsRequired).substr(-2) +
			'</p>'
	);
}

$('#continueFlightButton').on('click', () => {
	$('#continueFlightStatus').text('YES');
	UASSession.continuingFlight = true;
});
