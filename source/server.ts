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

    function send_async(packet: Command.Packet) {
        return new Promise<Command.Return>((resolve, reject) => {
            handler.send(packet, (element_return) => resolve(element_return));
        });
    } 

    (async () => {
        send_async({
            command: Command.Names.CreateElement,
            element_type: Command.CreateElementType.P
        }).then((el) => {
            console.log("Successfully created P, ID = " + el.id);
        });

        send_async({
            command: Command.Names.CreateElement,
            element_type: Command.CreateElementType.Div
        }).then((el) => {
            console.log("Successfully created DIV, ID = " + el.id);
        });

        let i = 0;
        let max = 30;

        function go() {
            send_async({
                command: Command.Names.CreateElement,
                element_type: Command.CreateElementType.Div
            }).then((el) => {
                console.log("Successfully created DIV, ID = " + el.id);
            });

            if (i > max) return;
            i++;

            setTimeout(() => {
                go();
            }, 0);
        }

        go();
    })();
});