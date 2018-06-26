const $ = require('./jquery-2.1.4.min.js');
import UASSession from './UASSession';

import * as fs from 'fs';

interface Configuration {
    batteryTimer: number;
    fileLocation?: string;
}

let config: Configuration = require ('./UASLoggerConfig.json');

UASSession.maxFlightTime = config.batteryTimer;

$('#fileLoc').val(config.fileLocation || process.cwd() + '\\UASFlightInfo.json');
if (!config.fileLocation) {
    config.fileLocation = process.cwd() + '\\UASFlightInfo.json';
}
$('#maxTime').val(config.batteryTimer);
UASSession.batteryTimer = config.batteryTimer;

$('#fileLoc').on('keyup keydown', function () {
    UASSession.fileLocation = $(this).val();
    config.fileLocation = UASSession.fileLocation;
});

$('#maxTime').on('keyup keydown', function () {
    UASSession.maxFlightTime = parseInt($(this).val(), 10);
    config.batteryTimer = UASSession.maxFlightTime;
});

function saveConfig () {
    fs.writeFile(
        './UASLoggerConfig.json',
        JSON.stringify(config, null, 4),
        (err) => {
            if (err) {
                throw err;
            }
        }
    );
}

$(window).on('close', saveConfig);