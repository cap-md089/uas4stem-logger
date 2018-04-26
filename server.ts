import * as net from 'net';
import * as fs from 'fs';

// const utm = require('utm-latlng');
// const utmObj = new utm();

const $ = require('./jquery-2.1.4.min.js');

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

function parseCSV (csv: string): CurrentState {
	let results = csv.split(',');
	let result = {} as CurrentState;
	for (let i in results) {
		if (results.hasOwnProperty(i)) {
			result[columnHeads[i]] = results[i];
			if (i === '3') {
				// tslint:disable-next-line:no-any
				result.armed = (result.armed as any as string) === 'true';
			} else {
				result[columnHeads[i]] = parseFloat(results[i]);
			}
		}
	}
	return result;
}

const start = Math.round(Date.now() / 1000);

var currentState: CurrentState = {
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

class UASSession {
	public static coords: {
		latitude: number,
		longitude: number,
		time: number,
		description: string
	}[] = [];
	
	public static recordingLats: number[] = [];
	public static recordingLongs: number[] = [];

	public static volts: number[] = [];

	public static recordingCoords: boolean = false;

	public static batteryTimer: number = Math.round(
		Date.now() / 1000
	) - start;
	public static voltageTimer: number = Math.round(
		Date.now() / 1000
	) - start;

	public static batteryId: number = 1;
	
	public static fileLocation: string = process.cwd() + '\\UASFlightInfo.json';

	public static sessionID: string = new Date().toISOString().slice(0, 16);

	public static readonly FRONT_CAMERA_ANGLE: number = 26.064664078303848196356278789571;
	public static readonly SIDE_CAMERA_ANGLE: number = 46.367543999867315345946421705557;

	public static flying: boolean = false;

	public static flightCount: number = 0;

	public static queue: number[][] = [];

	public static connection: {
		packets: number,
		start: number
	} = {
		packets: 0,
		start: 0
	};

	public static getCameraValues (altitude: number): {
		width: number;
		depth: number;
	} {
		return {
			width: 2 * 1.04891304331  * altitude,
			depth: 2 * 0.489130434783 * altitude
		};
	}

	public static reset (): void {
		this.coords = [];
		this.recordingLats = [];
		this.recordingLongs = [];
		this.volts = [];
		this.recordingCoords = false;
		this.batteryTimer = Math.round(Date.now() / 1000) - start;
		this.batteryId = 1;
		this.sessionID = new Date().toISOString().slice(0, 16);
		this.flying = false;
	}
}

$('#fileLoc').val(process.cwd() + '\\UASFlightInfo.json');

net.createServer((socket: net.Socket) => {
	UASSession.connection.start = Date.now() / 1000;
	socket.on('data', buff => {
		UASSession.connection.packets += 1;
		let data = buff.toString();
		try {
			data = data.toString();
			let bestData = data.split('\n');
			let ncs: CurrentState = parseCSV(bestData[0]);
			if (
				(ncs.throttle > 12 || ncs.groundspeed > 3) &&
				ncs.armed &&
				!UASSession.flying
			) {
				UASSession.reset();
				UASSession.flightCount++;
				UASSession.flying = true;
				$('#battLog').append('--Flight ' + UASSession.flightCount + '--<br />');
				log ('--Flight ' + UASSession.flightCount + ' started--');
			} else if (
				(ncs.throttle < 12 && ncs.groundspeed < 3 || !ncs.armed) &&
				UASSession.flying
			) {
				UASSession.flying = false;
				UASSession.volts.push(currentState.batteryVoltage);
				$('#battLog').append(currentState.batteryVoltage + '<br />');
				save($('#fileLoc').val() as string);
				log (
					'--Flight ' + UASSession.flightCount + ' ended (' +
					(Math.round(Date.now() / 1000) - start - UASSession.batteryTimer) +
					's)--'
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
		
		$('#currentcoords').html(`${currentState.lat.toFixed(6)}, ${currentState.lng.toFixed(6)}`);
		$("#connection").html(
			'Connection speed: ' +
			(UASSession.connection.packets / (Date.now() / 1000 - UASSession.connection.start)).toFixed(0) +
			' packet/s'
		);

		if (UASSession.flying) {
			update();
		}
	});
	log('Connection');
}).listen(54248, '127.0.0.1');

let listeningSockets: net.Socket[] = [];
net.createServer((socket: net.Socket) => {
	listeningSockets.push(socket);
}).listen(1337, '127.0.0.1');

// function map (i: number, a: number, b: number, c: number, d: number) {
// 	return c + (d - c) * ((i - a) / (b - a));
// }

var log = function (text: string) {
	$('#console').append(text + '<br />');    
};

var warn = function (text: string) {
	log ('<span style=\'color:#880\'>' + text + '</span>');
};

var error = function (text: string) {
	log ('<span style=\'color:red\'>' + text + '</span>');
};

$('#batteryIdSel').change(function () {
	UASSession.batteryId = parseInt($('#batteryIdSel').find(':selected').text(), 10);
	log('New UAS battery ID ' + UASSession.batteryId);
});

$('#cameracalci').on('keydown keyup', function () {
	
	let cameraValues = UASSession.getCameraValues(
		parseFloat(
			$('#cameracalci').val()
		)
	);

	$('#cameracalco').html(
		'Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
		'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
		'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>'
	);
});

{
	let cameraValues = UASSession.getCameraValues(
		parseFloat(
			$('#cameracalci').val()
		)
	);	

	$('#cameracalco').html(
		'Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
		'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
		'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>'
	);
}

// var mtan = function (v: number): number {
// 	return Math.tan(v * (Math.PI / 180));
// };

function update () {
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
		'Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
		'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
		'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>'
	);

	let timeLeft = 480 - (Math.round(Date.now() / 1000) - start - UASSession.batteryTimer);
	let timeNow = Math.round(Date.now() / 1000) - start - UASSession.batteryTimer;
	let timeRequired = currentState.timeRequired;
	let secondsRequired = Math.floor(timeRequired % 60);
	$('#timeleft').html(
		'<p style=\'margin:0px\'>Time in air: ' +
			Math.floor(timeNow / 60) + ':' + ('0' + timeNow % 60).substr(-2) +
		'</p>' +
	
		'<p style=\'margin:0px\'>Time left: ' +
			Math.floor(timeLeft / 60) + ':' + ('0' + timeLeft % 60).substr(-2) +
		'</p>' +
		
		'<p style=\'margin:0px;' + 
			(timeRequired > timeLeft ?
				'color:red' : (timeRequired - 30 > timeLeft ?
					'color:yellow' : ''
				)
			) + '\'>Time required to land: ' +
			Math.floor(timeRequired / 60) + ':' + ('0' + secondsRequired).substr(-2) +
		'</p>'
	);
};

function save (file?: string) {
	file = file || $('#fileLoc').val() || UASSession.fileLocation;
	let sessions: {
		[key: string]: {
			coordinates: {
				latitude: number,
				longitude: number,
				time: number,
				description: string
			}[],
			batteryLog: number[],
			timeInAir: number,
			batteryId: number
		}
	} = {};
	fs.stat(file, (err1, _) => {
		if (err1 && err1.code === 'ENOENT') {
			log('File not found, creating');
			sessions = {};
			sessions[UASSession.sessionID] = {
				coordinates : UASSession.coords,
				batteryLog : UASSession.volts,
				timeInAir : Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
				batteryId : UASSession.batteryId
			};
			let sessionsString = JSON.stringify(sessions, null, 4);
			fs.writeFile(file, sessionsString, (err2: Error) => {
				if (err2) {
					warn('Could not save to file');
				}
			});
		} else if (err1) {
			throw err1;
		} else  {
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
					'coordinates' : UASSession.coords,
					'batteryLog' : UASSession.volts,
					'timeInAir' : Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
					'batteryId' : UASSession.batteryId
				};
				data = JSON.stringify(data, null, 4);
				fs.writeFile(file, data, (err2: Error) => {
					if (err2) {
						warn('Could not write data');
					}
				});
			});
		}
	});
};

function startRecording () {
	$('#start').prop('disabled', true);
	$('#stop').prop('disabled', false);
	$('#coordoutput').text('Recording coordinates...');
	UASSession.recordingCoords = true;
};

function stopRecording () {
	$('#start').prop('disabled', false);
	$('#stop').prop('disabled', true);
	UASSession.recordingCoords = false;
	let lat = average(UASSession.recordingLats);
	let lng = average(UASSession.recordingLongs);
	$('#coordoutput').text(lat.toFixed(9) + ', ' + lng.toFixed(9));
	UASSession.coords.push({
		latitude : lat,
		longitude : lng,
		time: Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
		description : $('#coorddescinput').val()
	});
	log(
		'"' + $('#coorddescinput').val() + '": ' + 
		lat.toFixed(7) + ', ' + lng.toFixed(7) +
		' (' + (Math.round(Date.now() / 1000) - start - UASSession.batteryTimer) + ') ' +
		'[' + UASSession.recordingLats.length + '/' + UASSession.recordingLongs.length + ']'
	);
	UASSession.recordingLats = [];
	UASSession.recordingLongs = [];
	save();
};

function average (arr: number[]): number {
	if (arr.length === 0) {
		return 0;
	}
	let sum = 0;
	for (let i = 0; i < arr.length; i++) {
		sum += arr[i];
	}
	return sum / arr.length;
};

$(window).on('close', save);

function sendRC (...data) {
	listeningSockets.forEach(sock => sock.write(new Buffer(data)));
}

// function timeSpentInAir () {
// 	return Math.round(Date.now() / 1000) - start - UASSession.batteryTimer;
// }