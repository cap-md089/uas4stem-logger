const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow ({
        width: 1600,
        height: 900,
        x: 0,
        y: 0
    });

    mainWindow.loadURL(url.format({
        "pathname" : path.join(__dirname, "index.html"),
        "protocol" : "file:",
        "slashes" : true
    }));

    mainWindow;

    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
    app.quit();
});