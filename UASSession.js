"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var start = Math.round(Date.now() / 1000);
var jquery = require("./jquery-2.1.4.min.js");
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
        this.previousFlightTime = Math.round(Date.now() / 1000 - start - this.batteryTimer);
        this.batteryId = 1;
        this.sessionID = new Date().toISOString().slice(0, 16);
        this.flying = false;
    };
    UASSession.prepare = function () {
        this.batteryTimer = Math.round(Date.now() / 1000 - start);
        this.flightTimer = Math.round(Date.now() / 1000 - start);
        if (this.continuingFlight) {
            this.batteryTimer -= this.previousFlightTime;
            this.continuingFlight = false;
            this.previousFlightTime = 0;
            jquery('#continueFlightStatus').text('NO');
        }
    };
    UASSession.coords = [];
    UASSession.recordingLats = [];
    UASSession.recordingLongs = [];
    UASSession.volts = [];
    UASSession.recordingCoords = false;
    UASSession.batteryTimer = Math.round(Date.now() / 1000) - start;
    UASSession.flightTimer = Math.round(Date.now() / 1000) - start;
    UASSession.voltageTimer = Math.round(Date.now() / 1000) - start;
    UASSession.batteryId = 1;
    UASSession.fileLocation = process.cwd() + '\\UASFlightInfo.json';
    UASSession.sessionID = new Date().toISOString().slice(0, 16);
    UASSession.FRONT_CAMERA_ANGLE = 26.064664078303848196356278789571;
    UASSession.SIDE_CAMERA_ANGLE = 46.367543999867315345946421705557;
    UASSession.flying = false;
    UASSession.flightCount = 0;
    UASSession.queue = [];
    UASSession.continuingFlight = false;
    UASSession.previousFlightTime = 0;
    UASSession.connection = {
        packets: 0,
        packetsPerSecond: 0
    };
    UASSession.maxFlightTime = 480;
    return UASSession;
}());
exports.default = UASSession;
//# sourceMappingURL=UASSession.js.map