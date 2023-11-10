import electron from "electron";
import path from "path";
import commands from "./commands";
import Commands from "./commands";

electron.app.once("ready", () => {
    const window = new electron.BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));

    window.show();

    window.webContents.openDevTools();

    let val = false;
    setInterval(() => {
        const packet: Commands.Packet = {
            command: Commands.Names.CreateElement,
            element_type: Commands.CreateElementType.Div
        }

        window.webContents.send("command", packet);

        val = !val;
    }, 1000);

    setInterval(() => {
        const packet: Commands.Packet = {
            command: Commands.Names.RegisterEventListener,
            event_name: Commands.RegisterEventListenerNames.Click
        }
        
        window.webContents.send("command", packet);

        val = !val;
    }, 700);
});