import electron from "electron";
import path from "path";
import Command from "./command";
import Common from "./common";

class Handler extends Command.Handler {
    private readonly window: electron.BrowserWindow;

    public constructor(window: electron.BrowserWindow) {
        super();

        this.window = window;
    }

    protected send_to_renderer(tp: Command.TransportPacket): void {
        this.window.webContents.send("packet", tp);
    }

    public on_receive(packet: Command.Packet): Command.Return {
        console.log("REC CLEAN PACKET", packet);
    }
}

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

    // window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));
    window.show();
    window.webContents.openDevTools();

    const handler = new Handler(window);

    electron.ipcMain.on("packet", (event, tp) => {
        handler.on_raw_return(tp);
    });

    handler.send({
        command: Command.Names.CreateElement,
        element_type: Command.CreateElementType.Div
    }, (element_return) => {
        console.log("ER", element_return);
    });
});