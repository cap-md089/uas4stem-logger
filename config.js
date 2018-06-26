"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require('./jquery-2.1.4.min.js');
var UASSession_1 = require("./UASSession");
var fs = require("fs");
var config = require('./UASLoggerConfig.json');
UASSession_1.default.maxFlightTime = config.batteryTimer;
$('#fileLoc').val(config.fileLocation || process.cwd() + '\\UASFlightInfo.json');
if (!config.fileLocation) {
    config.fileLocation = process.cwd() + '\\UASFlightInfo.json';
}
$('#maxTime').val(config.batteryTimer);
UASSession_1.default.batteryTimer = config.batteryTimer;
$('#fileLoc').on('keyup keydown', function () {
    UASSession_1.default.fileLocation = $(this).val();
    config.fileLocation = UASSession_1.default.fileLocation;
});
$('#maxTime').on('keyup keydown', function () {
    UASSession_1.default.maxFlightTime = parseInt($(this).val(), 10);
    config.batteryTimer = UASSession_1.default.maxFlightTime;
});
function saveConfig() {
    fs.writeFile('./UASLoggerConfig.json', JSON.stringify(config, null, 4), function (err) {
        if (err) {
            throw err;
        }
    });
}
$(window).on('close', saveConfig);
