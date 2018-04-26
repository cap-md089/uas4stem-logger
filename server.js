"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var fs = require("fs");
var $ = require('./jquery-2.1.4.min.js');
var columnHeads = [
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
function parseCSV(csv) {
    var results = csv.split(',');
    var result = {};
    for (var i in results) {
        if (results.hasOwnProperty(i)) {
            result[columnHeads[i]] = results[i];
            if (i === '3') {
                result.armed = result.armed === 'true';
            }
            else {
                result[columnHeads[i]] = parseFloat(results[i]);
            }
        }
    }
    return result;
}
var start = Math.round(Date.now() / 1000);
var currentState = {
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
var UASSession = (function () {
    function UASSession() {
    }
    UASSession.getCameraValues = function (altitude) {
        return {
            width: 2 * 1.04891304331 * altitude,
            depth: 2 * 0.489130434783 * altitude
        };
    };
    UASSession.reset = function () {
        this.coords = [];
        this.recordingLats = [];
        this.recordingLongs = [];
        this.volts = [];
        this.recordingCoords = false;
        this.batteryTimer = Math.round(Date.now() / 1000) - start;
        this.batteryId = 1;
        this.sessionID = new Date().toISOString().slice(0, 16);
        this.flying = false;
    };
    UASSession.coords = [];
    UASSession.recordingLats = [];
    UASSession.recordingLongs = [];
    UASSession.volts = [];
    UASSession.recordingCoords = false;
    UASSession.batteryTimer = Math.round(Date.now() / 1000) - start;
    UASSession.voltageTimer = Math.round(Date.now() / 1000) - start;
    UASSession.batteryId = 1;
    UASSession.fileLocation = process.cwd() + '\\UASFlightInfo.json';
    UASSession.sessionID = new Date().toISOString().slice(0, 16);
    UASSession.FRONT_CAMERA_ANGLE = 26.064664078303848196356278789571;
    UASSession.SIDE_CAMERA_ANGLE = 46.367543999867315345946421705557;
    UASSession.flying = false;
    UASSession.flightCount = 0;
    UASSession.queue = [];
    UASSession.connection = {
        packets: 0,
        start: 0
    };
    return UASSession;
}());
$('#fileLoc').val(process.cwd() + '\\UASFlightInfo.json');
net.createServer(function (socket) {
    UASSession.connection.start = Date.now() / 1000;
    socket.on('data', function (buff) {
        UASSession.connection.packets += 1;
        var data = buff.toString();
        try {
            data = data.toString();
            var bestData = data.split('\n');
            var ncs = parseCSV(bestData[0]);
            if ((ncs.throttle > 12 || ncs.groundspeed > 3) &&
                ncs.armed &&
                !UASSession.flying) {
                UASSession.reset();
                UASSession.flightCount++;
                UASSession.flying = true;
                $('#battLog').append('--Flight ' + UASSession.flightCount + '--<br />');
                log('--Flight ' + UASSession.flightCount + ' started--');
            }
            else if ((ncs.throttle < 12 && ncs.groundspeed < 3 || !ncs.armed) &&
                UASSession.flying) {
                UASSession.flying = false;
                UASSession.volts.push(currentState.batteryVoltage);
                $('#battLog').append(currentState.batteryVoltage + '<br />');
                save($('#fileLoc').val());
                log('--Flight ' + UASSession.flightCount + ' ended (' +
                    (Math.round(Date.now() / 1000) - start - UASSession.batteryTimer) +
                    's)--');
            }
            currentState = ncs;
        }
        catch (e) {
            error(e.stack);
        }
        $('#currentcoords').html(currentState.lat.toFixed(6) + ", " + currentState.lng.toFixed(6));
        $("#connection").html('Connection speed: ' +
            (UASSession.connection.packets / (Date.now() / 1000 - UASSession.connection.start)).toFixed(0) +
            ' packet/s');
        if (UASSession.flying) {
            update();
        }
    });
    log('Connection');
}).listen(54248, '127.0.0.1');
var listeningSockets = [];
net.createServer(function (socket) {
    listeningSockets.push(socket);
}).listen(1337, '127.0.0.1');
var log = function (text) {
    $('#console').append(text + '<br />');
};
var warn = function (text) {
    log('<span style=\'color:#880\'>' + text + '</span>');
};
var error = function (text) {
    log('<span style=\'color:red\'>' + text + '</span>');
};
$('#batteryIdSel').change(function () {
    UASSession.batteryId = parseInt($('#batteryIdSel').find(':selected').text(), 10);
    log('New UAS battery ID ' + UASSession.batteryId);
});
$('#cameracalci').on('keydown keyup', function () {
    var cameraValues = UASSession.getCameraValues(parseFloat($('#cameracalci').val()));
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
});
{
    var cameraValues = UASSession.getCameraValues(parseFloat($('#cameracalci').val()));
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
}
function update() {
    if (Math.round(Date.now() / 1000) - start - UASSession.voltageTimer >= 20) {
        UASSession.voltageTimer = Math.round(Date.now() / 1000) - start;
        UASSession.volts.push(currentState.batteryVoltage);
        $('#battLog').append(currentState.batteryVoltage + '<br />');
    }
    if (UASSession.recordingCoords) {
        UASSession.recordingLats.push(currentState.lat);
        UASSession.recordingLongs.push(currentState.lng);
    }
    var cameraValues = UASSession.getCameraValues(currentState.altitude);
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
    var timeLeft = 480 - (Math.round(Date.now() / 1000) - start - UASSession.batteryTimer);
    var timeNow = Math.round(Date.now() / 1000) - start - UASSession.batteryTimer;
    var timeRequired = currentState.timeRequired;
    var secondsRequired = Math.floor(timeRequired % 60);
    $('#timeleft').html('<p style=\'margin:0px\'>Time in air: ' +
        Math.floor(timeNow / 60) + ':' + ('0' + timeNow % 60).substr(-2) +
        '</p>' +
        '<p style=\'margin:0px\'>Time left: ' +
        Math.floor(timeLeft / 60) + ':' + ('0' + timeLeft % 60).substr(-2) +
        '</p>' +
        '<p style=\'margin:0px;' +
        (timeRequired > timeLeft ?
            'color:red' : (timeRequired - 30 > timeLeft ?
            'color:yellow' : '')) + '\'>Time required to land: ' +
        Math.floor(timeRequired / 60) + ':' + ('0' + secondsRequired).substr(-2) +
        '</p>');
}
;
function save(file) {
    file = file || $('#fileLoc').val() || UASSession.fileLocation;
    var sessions = {};
    fs.stat(file, function (err1, _) {
        if (err1 && err1.code === 'ENOENT') {
            log('File not found, creating');
            sessions = {};
            sessions[UASSession.sessionID] = {
                coordinates: UASSession.coords,
                batteryLog: UASSession.volts,
                timeInAir: Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
                batteryId: UASSession.batteryId
            };
            var sessionsString = JSON.stringify(sessions, null, 4);
            fs.writeFile(file, sessionsString, function (err2) {
                if (err2) {
                    warn('Could not save to file');
                }
            });
        }
        else if (err1) {
            throw err1;
        }
        else {
            fs.readFile(file, function (err, buff) {
                var data;
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
                }
                catch (e) {
                    sessions = {};
                }
                sessions[UASSession.sessionID] = {
                    'coordinates': UASSession.coords,
                    'batteryLog': UASSession.volts,
                    'timeInAir': Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
                    'batteryId': UASSession.batteryId
                };
                var sessionsString = JSON.stringify(sessions, null, 4);
                fs.writeFile(file, sessionsString, function (err2) {
                    if (err2) {
                        warn('Could not write data');
                    }
                });
            });
        }
    });
}
;
function startRecording() {
    $('#start').prop('disabled', true);
    $('#stop').prop('disabled', false);
    $('#coordoutput').text('Recording coordinates...');
    UASSession.recordingCoords = true;
}
;
function stopRecording() {
    $('#start').prop('disabled', false);
    $('#stop').prop('disabled', true);
    UASSession.recordingCoords = false;
    var lat = average(UASSession.recordingLats);
    var lng = average(UASSession.recordingLongs);
    $('#coordoutput').text(lat.toFixed(9) + ', ' + lng.toFixed(9));
    UASSession.coords.push({
        latitude: lat,
        longitude: lng,
        time: Math.round(Date.now() / 1000) - start - UASSession.batteryTimer,
        description: $('#coorddescinput').val()
    });
    log('"' + $('#coorddescinput').val() + '": ' +
        lat.toFixed(7) + ', ' + lng.toFixed(7) +
        ' (' + (Math.round(Date.now() / 1000) - start - UASSession.batteryTimer) + ') ' +
        '[' + UASSession.recordingLats.length + '/' + UASSession.recordingLongs.length + ']');
    UASSession.recordingLats = [];
    UASSession.recordingLongs = [];
    save();
}
;
function average(arr) {
    if (arr.length === 0) {
        return 0;
    }
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}
;
$(window).on('close', save);
function sendRC() {
    var data = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        data[_i] = arguments[_i];
    }
    listeningSockets.forEach(function (sock) { return sock.write(new Buffer(data)); });
}
