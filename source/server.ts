import electron from "electron";
import path from "path";

electron.app.once("ready", () => {
    const window = new electron.BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        show: true
    });

    window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));

    window.show();
});