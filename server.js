"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var fs = require("fs");
var $ = require('./jquery-2.1.4.min.js');
var UASSession_1 = require("./UASSession");
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
net.createServer(function (socket) {
    UASSession_1.default.connection.start = Date.now() / 1000;
    socket.on('data', function (buff) {
        UASSession_1.default.connection.packets += 1;
        var data = buff.toString();
        try {
            data = data.toString();
            var bestData = data.split('\n');
            var ncs = parseCSV(bestData[0]);
            if ((ncs.throttle > 12 || ncs.groundspeed > 3) &&
                ncs.armed &&
                !UASSession_1.default.flying) {
                UASSession_1.default.reset();
                UASSession_1.default.flightCount++;
                UASSession_1.default.flying = true;
                $('#battLog').append('--Flight ' + UASSession_1.default.flightCount + '--<br />');
                log('--Flight ' + UASSession_1.default.flightCount + ' started--');
            }
            else if ((ncs.throttle < 12 && ncs.groundspeed < 3 || !ncs.armed) &&
                UASSession_1.default.flying) {
                UASSession_1.default.flying = false;
                UASSession_1.default.volts.push(currentState.batteryVoltage);
                $('#battLog').append(currentState.batteryVoltage + '<br />');
                save($('#fileLoc').val());
                log('--Flight ' + UASSession_1.default.flightCount + ' ended (' +
                    (Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer) +
                    's)--');
            }
            currentState = ncs;
        }
        catch (e) {
            error(e.stack);
        }
        $('#currentcoords').html(currentState.lat.toFixed(6) + ", " + currentState.lng.toFixed(6));
        $("#connection").html('Connection speed: ' +
            (UASSession_1.default.connection.packets / (Date.now() / 1000 - UASSession_1.default.connection.start)).toFixed(0) +
            ' packet/s');
        $('#armed').html(currentState.armed ? 'ARMED' : 'DISARMED');
        if (UASSession_1.default.flying) {
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
    UASSession_1.default.batteryId = parseInt($('#batteryIdSel').find(':selected').text(), 10);
    log('New UAS battery ID ' + UASSession_1.default.batteryId);
});
$('#cameracalci').on('keydown keyup', function () {
    var cameraValues = UASSession_1.default.getCameraValues(parseFloat($('#cameracalci').val()));
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
});
{
    var cameraValues = UASSession_1.default.getCameraValues(parseFloat($('#cameracalci').val()));
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
}
function update() {
    if (Math.round(Date.now() / 1000) - start - UASSession_1.default.voltageTimer >= 20) {
        UASSession_1.default.voltageTimer = Math.round(Date.now() / 1000) - start;
        UASSession_1.default.volts.push(currentState.batteryVoltage);
        $('#battLog').append(currentState.batteryVoltage + '<br />');
    }
    if (UASSession_1.default.recordingCoords) {
        UASSession_1.default.recordingLats.push(currentState.lat);
        UASSession_1.default.recordingLongs.push(currentState.lng);
    }
    var cameraValues = UASSession_1.default.getCameraValues(currentState.altitude);
    $('#cameracalco').html('Width: ' + cameraValues.width.toFixed(1) + 'm; ' +
        'Depth: ' + cameraValues.depth.toFixed(1) + 'm; ' +
        'Area: ' + (cameraValues.width * cameraValues.depth).toFixed(1) + 'm<sup>2</sup>');
    var timeLeft = UASSession_1.default.maxFlightTime - (Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer);
    var timeNow = Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer;
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
    file = file || $('#fileLoc').val() || UASSession_1.default.fileLocation;
    var sessions = {};
    fs.stat(file, function (err1, _) {
        if (err1 && err1.code === 'ENOENT') {
            log('File not found, creating');
            sessions = {};
            sessions[UASSession_1.default.sessionID] = {
                coordinates: UASSession_1.default.coords,
                batteryLog: UASSession_1.default.volts,
                timeInAir: Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer,
                batteryId: UASSession_1.default.batteryId
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
                sessions[UASSession_1.default.sessionID] = {
                    'coordinates': UASSession_1.default.coords,
                    'batteryLog': UASSession_1.default.volts,
                    'timeInAir': Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer,
                    'batteryId': UASSession_1.default.batteryId
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
    $('#startstop').text('Stop recording');
    $('#coordoutput').text('Recording coordinates...');
    UASSession_1.default.recordingCoords = true;
}
;
function stopRecording() {
    $('#startstop').text('Start recording');
    UASSession_1.default.recordingCoords = false;
    var lat = average(UASSession_1.default.recordingLats);
    var lng = average(UASSession_1.default.recordingLongs);
    $('#coordoutput').text(lat.toFixed(9) + ', ' + lng.toFixed(9));
    UASSession_1.default.coords.push({
        latitude: lat,
        longitude: lng,
        time: Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer,
        description: $('#coorddescinput').val()
    });
    log('"' + $('#coorddescinput').val() + '": ' +
        lat.toFixed(7) + ', ' + lng.toFixed(7) +
        ' (' + (Math.round(Date.now() / 1000) - start - UASSession_1.default.batteryTimer) + ') ' +
        '[' + UASSession_1.default.recordingLats.length + '/' + UASSession_1.default.recordingLongs.length + ']');
    UASSession_1.default.recordingLats = [];
    UASSession_1.default.recordingLongs = [];
    save();
}
;
function toggleRecording() {
    if (UASSession_1.default.recordingCoords) {
        stopRecording();
    }
    else {
        startRecording();
    }
}
exports.toggleRecording = toggleRecording;
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
exports.sendRC = sendRC;
{
    var timeLeft = UASSession_1.default.maxFlightTime;
    var timeNow = 0;
    var timeRequired = 0;
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
