const net = require("net");
const fs = require("fs");

const utm = require("utm-latlng");
const utmObj = new utm();

const $ = require("./jquery-2.1.4.min.js");

const electron = require("electron");

window.columnHeads = [
    "timeInAir",
    "lat",
    "lng",
    "armed",
    "battery_voltage",
    "alt",
    "battery_remaining",
    "groundspeed",
    "throttle",
    "dth",
    "vertspeed",
    "rtlspeed",
    "rtllandspeed",
    "roll",
    "yaw",
    "pitch",
    "timeRequired"
];

function parseCSV (csv) {
    let results = csv.split(',');
    let result = {};
    for (let i in results) {
        result[window.columnHeads[i]] = results[i];
        if (i == 3) { result.armed = result.armed == 'true'; }
        else { result[window.columnHeads[i]] = parseFloat(results[i]); }
    }
    return result;
}


window.start = Math.round(Date.now()/1000);
window.flights = 0;
window.cs = {
    timeInAir: 0.0,
    lat: 0.0,
    lng: 0.0,
    armed: false,
    battery_voltage: 0.0,
    alt: 0.0,
    battery_remaining: 0.0,
    groundspeed : 0.0,
    throttle : 0.0,
    distToHome : 0.0,
    verticalspeed : 0.0,
    rtlspeed : 0.0,
    rtllandspeed : 0.0,
    roll: 0.0,
    pitch: 0.0,
    yaw: 0.0,
    offsetx: 0.0,
    offsety: 0.0,
    timeRequired: 0.0
}; 
window.UAS = {
    coords : [],
    rlats: [],
    rlongs: [],
    volts: [],
    recordingCoords: false,
    batteryTimer: Math.round(Date.now()/1000)-window.start,
    battTimer2 : Math.round(Date.now()/1000)-window.start,
    batteryId: 1,
    startFlying: 0,
    startRecording: 0,

    fileLocation: $("#fileLoc").val(),
    sessionID: new Date().toISOString().slice(0, 16),

    FRONT_CAMERA_ANGLE: 26.064664078303848196356278789571,
    SIDE_CAMERA_ANGLE: 46.367543999867315345946421705557
};

window.flying = false;

$("#fileLoc").val(process.cwd()+"\\UASFlightInfo.json");

window.server = net.createServer((socket) => {
    window.cs.lastUpdate = Date.now();
    socket.on("data", (data) => {
        data = data.toString();
        try {
            data = data.toString();
            data = data.split('\n');
            ncs = parseCSV(data[0]);
            $("#flying").html(((parseFloat(ncs.throttle) > 12 ? 8 : 0) | (parseFloat(ncs.groundspeed) > 3 ? 4 : 0) | (ncs.armed.toString().toLowerCase() == 'true' ? 2 : 0) | (!window.flying ? 1 : 0)).toString());
            $("#flying").append(parseFloat(ncs.throttle)+', '+parseFloat(ncs.groundspeed)+', '+ncs.armed.toString().toLowerCase()+', '+window.flying?'flying' : 'not flying');
            if ((parseFloat(ncs.throttle) > 12 || parseFloat(ncs.groundspeed) > 3) && ncs.armed.toString().toLowerCase() == 'true' && !window.flying) {
                window.flights++;
                window.flying = true;
                window.cs = {
                    timeInAir: 0.0,
                    lat: 0.0,
                    lng: 0.0,
                    armed: false,
                    battery_voltage: 0.0,
                    alt: 0.0,
                    battery_remaining: 0.0,
                    groundspeed : 0.0,
                    throttle : 0.0,
                    distToHome : 0.0,
                    verticalspeed : 0.0,
                    rtlspeed : 0.0,
                    rtllandspeed : 0.0,
                    roll: 0.0,
                    pitch: 0.0,
                    yaw: 0.0,
                    offsetx: 0.0,
                    offsety: 0.0,
                    timeRequired: 0.0
                }; 
                window.UAS = {
                    coords : [],
                    rlats: [],
                    rlongs: [],
                    volts: [],
                    recordingCoords: false,
                    batteryTimer: Math.round(Date.now()/1000)-start,
                    battTimer2 : Math.round(Date.now()/1000)-start,
                    batteryId: 1,
                    startFlying: 0,
                    startRecording: 0,

                    fileLocation: $("#fileLoc").val(),
                    sessionID: new Date().toISOString().slice(0, 16),

                    FRONT_CAMERA_ANGLE: 26.064664078303848196356278789571,
                    SIDE_CAMERA_ANGLE: 46.367543999867315345946421705557
                };
                $("#battLog").append("--Flight "+window.flights+"--<br />");
                log ("--Flight "+window.flights+" started--");
            } else if ((parseFloat(ncs.throttle) < 12 && parseFloat(ncs.groundspeed) < 3 || !ncs.armed.toString().toLowerCase() == 'false') && window.flying) {
                window.flying = false;
                UAS.volts.push(window.cs.battery_voltage);
                $("#battLog").append(window.cs.battery_voltage+"<br />");
                save();
                log ("--Flight "+window.flights+" ended ("+(Math.round(Date.now()/1000)-start-UAS.batteryTimer)+"s)--");
            }
            
            window.cs.timeInAir =  parseFloat(ncs.timeInAir);
            window.cs.lat =        parseFloat(ncs.lat);
            window.cs.lng =        parseFloat(ncs.lng);
            window.cs.armed = ncs.armed.toString().toLowerCase() == 'true';
            window.cs.battery_voltage = parseFloat(ncs.battery_voltage);
            window.cs.alt = parseFloat(ncs.alt);
            window.cs.battery_remaining = parseFloat(ncs.battery_remaining);
            window.cs.lastUpdate = Date.now() - window.cs.lastUpdate;
            window.cs.groundspeed = parseFloat(ncs.groundspeed);
            window.cs.throttle = parseFloat(ncs.throttle);
            window.cs.distToHome = parseFloat(ncs.dth);
            window.cs.verticalspeed = parseFloat(ncs.vertspeed);
            window.cs.rtlspeed = parseFloat(ncs.rtlspeed);
            window.cs.rtllandspeed = parseFloat(ncs.rtllandspeed);
            window.cs.roll = parseFloat(ncs.roll);
            window.cs.yaw = parseFloat(ncs.yaw);
            window.cs.pitch = parseFloat(ncs.pitch);
            window.cs.offsetx = parseFloat(ncs.offsetX);
            window.cs.offsety = parseFloat(ncs.offsetY);
            window.cs.timeRequired = parseFloat(ncs.timeRequired);
            
            /*if (queue.length > 0) {
                socket.write(JSON.stringify(queue[0]));
                queue.splice(0);
            } else {
                socket.write("");
            }*/
        } catch (e) {
            error(e.stack);
        }
        
        $("#currentcoords").html(`${window.cs.lat.toFixed(6)}, ${window.cs.lng.toFixed(6)}`);

        if (flying) {
            update();
        }
    });
    log("Connection");
}).listen(54248, '127.0.0.1').on('error', function (err) {
    error(runs+':' +err.toString());
});

Number.prototype.map=function(a,b,c,d){return c+(d-c)*((this-a)/(b-a))}; 
function map (i, a, b, c, d) {
    return i.map(a, b, c, d);
}

var log = function (text) {
    $("#console").append(text+"<br />");    
}

var warn = function (text) {
    log ("<span style=\"color:#880\">"+text+"</span>");
}

var error = function (text) {
    log ("<span style=\"color:red\">"+text+"</span>");
}

$("#batteryIdSel").change(function () {
    window.UAS.batteryId = parseInt($('#batteryIdSel').find(":selected").text(), 10);
    log("New UAS battery ID "+window.UAS.batteryId);
});

$("#cameracalci").on("keydown keyup", function () {
    var cameraWidth = 2 * 1.04891304331  * $("#cameracalci").val();
    var cameraDepth = 2 * 0.489130434783 * $("#cameracalci").val();
    
    UAS.cameraWidth = cameraWidth;
    UAS.cameraDepth = cameraDepth;

    $("#cameracalco").html("Width: "+cameraWidth.toFixed(1)+"m; Depth: "+cameraDepth.toFixed(1)+"m; Area: "+(cameraWidth*cameraDepth).toFixed(1)+"m<sup>2</sup>");
});
var cameraWidth = 2 * 1.04891304331  * $("#cameracalci").val();
var cameraDepth = 2 * 0.489130434783 * $("#cameracalci").val();

UAS.cameraWidth = cameraWidth;
UAS.cameraDepth = cameraDepth;

$("#cameracalco").html("Width: "+cameraWidth.toFixed(1)+"m; Depth: "+cameraDepth.toFixed(1)+"m; Area: "+(cameraWidth*cameraDepth).toFixed(1)+"m<sup>2</sup>");

var mtan = function (v) {
    return Math.tan(v * (Math.PI/180));
}

var update = function () {
    if (Math.round(Date.now()/1000) - start - UAS.battTimer2 >= 20) {
        UAS.battTimer2 = Math.round(Date.now()/1000) - start;
        UAS.volts.push(window.cs.battery_voltage);
        $("#battLog").append(window.cs.battery_voltage+"<br />");
    }

    if (UAS.recordingCoords) {
        // offsetx = -window.cs.offsetx;
        // offsety = -window.cs.offsety;
        // var coordinates = utmObj.convertLatLngToUtm(window.cs.lat, window.cs.lng);
        // coordinates.Easting += offsetx;
        // coordinates.Northing += ofssety;
        // var coordinates = utmObj.convertUtmToLatLng(coordinates.Easting, coordinates.Northing, coordinates.ZoneNumber, coordinates.ZoneLetter);

        // UAS.rlats.push(coordinates.lat);
        // UAS.rlongs.push(coordinates.lang);
        
        console.log(window.cs.lat, window.cs.lng);

        UAS.rlats.push(window.cs.lat);
        UAS.rlongs.push(window.cs.lng);
    }

    var cameraWidth = 2 * 1.04891304331  * window.cs.alt;
    var cameraDepth = 2 * 0.489130434783 * window.cs.alt;

    $("#cameraopts").html("Width: "+cameraWidth.toFixed(1)+"m; Depth: "+cameraDepth.toFixed(1)+"m; Area: "+(cameraWidth*cameraDepth).toFixed(1)+"m<sup>2</sup>");

    timeLeft = 480 - (Math.round(Date.now()/1000)-start-UAS.batteryTimer);
    timeNow = Math.round(Date.now()/1000)-start-UAS.batteryTimer;
    timeRequired = window.cs.timeRequired;
    secondsRequired = parseInt(timeRequired % 60);
    $("#timedebug").html(window.cs.distToHome + ', '+window.cs.rtlspeed+', '+window.cs.alt+', '+window.cs.rtllandspeed);
    $("#timeleft").html("<p style=\"margin:0px\">Time in air: "+Math.floor((timeNow)/60)+":"+("0"+(timeNow)%60).substr(-2)+"</p>"+
    "<p style=\"margin:0px\">Time left: "+Math.floor(timeLeft/60)+":"+("0"+timeLeft%60).substr(-2)+"</p>"+
    "<p style=\"margin:0px;"+(timeRequired > timeLeft ? "color:red" : (timeRequired - 30 > timeLeft ? "color:yellow" : ""))+"\">Time required to land: "+Math.floor(timeRequired/60)+":"+("0"+(secondsRequired)).substr(-2)+" ("+timeRequired+")</p>");
};

var save = function (file) {
    file = file || $("#fileLoc").val() || UAS.fileLocation;
    data = {};
    fs.stat(file, (err, data) => {
        if (err && err.code == 'ENOENT') {
            log("File not found, creating");
            data = {};
            data[UAS.sessionID] = {
                "coordinates" : UAS.coords,
                "batteryLog" : UAS.volts,
                "timeInAir" : Math.round(Date.now()/1000)-start-UAS.batteryTimer,
                "batteryId" : UAS.batteryId
            }
            data = JSON.stringify(data, null, 4);
            fs.writeFile(file, data, (err) => {
                if (err) warn("Could not save to file");
            });
        } else if (err) {
            throw err
        } else  {
            fs.readFile(file, (err, data) => {
                if (err) {
                    warn("Cannot read file")
                    data = '';
                }
                if (data == '') data = '{}';
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {};
                }
                data[UAS.sessionID] = {
                    "coordinates" : UAS.coords,
                    "batteryLog" : UAS.volts,
                    "timeInAir" : Math.round(Date.now()/1000)-start-UAS.batteryTimer,
                    "batteryId" : UAS.batteryId
                }
                data = JSON.stringify(data, null, 4);
                fs.writeFile(file, data, (err) => {
                    if (err) {
                        warn("Could not write data");
                    }
                });
            });
        }
    });
};

var startRecording = function () {
    $("#start").prop("disabled", true);
    $("#stop").prop("disabled", false);
    $("#coordoutput").text("Recording coordinates...");
    UAS.recordingCoords = true;
}

var stopRecording = function () {
    $("#start").prop("disabled", false);
    $("#stop").prop("disabled", true);
    UAS.recordingCoords = false;
    lat = average(UAS.rlats);
    lng = average(UAS.rlongs);
    $("#coordoutput").text(lat.toFixed(9)+', '+lng.toFixed(9));
    UAS.coords.push({
        "latitude" : lat.toFixed(9).toString(),
        "longitude" : lng.toFixed(9).toString(),
        "time": Math.round(Date.now()/1000)-start-UAS.batteryTimer,
        "description" : $("#coorddescinput").val()
    });
    log('"'+$("#coorddescinput").val()+'": '+lat.toFixed(7)+', '+lng.toFixed(7)+' ('+(Math.round(Date.now()/1000)-start-UAS.batteryTimer)+') ['+UAS.rlats.length+'/'+UAS.rlongs.length+']');
    UAS.rlats = []
    UAS.rlongs = []
    save();
}

var average = function (arr) {
    if (arr.length == 0) return 0;
    for (sum = 0, i = 0; i < arr.length; i++) {
        sum+=arr[i];
    }
    return sum/arr.length;
}

$(window).on('close', save)

function sendRC (a, b, c) {
    queue.push([a, b, c]);
}

function loop () {
    try {
        $("#times").html("batteryTimer: "+UAS.batteryTimer+"<br />battTimer2: "+UAS.battTimer2+"<br />start: "+start+"<br />now: "+Math.round(Date.now() * 0.001)+"<br />difference: "+start-Math.round(Date.now()*0.001));
    } catch (e) {
        warn (e.toString());
    }
    setTimeout(loop, 50);
}
loop();

function timeSpentInAir () {
    return Math.round(Date.now()/1000) - start - UAS.batteryTimer;
}
