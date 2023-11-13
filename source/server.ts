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

let handler: Handler;

function send_async<ReturnType extends Command.Return>(packet: Command.Packet) {
    return new Promise<ReturnType>((resolve, reject) => {
        handler.send(packet, (element_return) => resolve(element_return as unknown as any));
    });
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

    handler = new Handler(window);

    window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));
    window.show();
    window.webContents.openDevTools();

    electron.ipcMain.on("packet", (event, tp) => {
        handler.on_raw_return(tp);
    });

    window.webContents.once("dom-ready", () => {
        main();
    });
});

enum ElementErrors {
    ElementNotReady
}

enum ElementEvent {
    Click
}

class Element {
    private element_id: number;
    private readonly execution_gate = new Common.ExecutionGate();

    public constructor(type: Command.CreateElementType = Command.CreateElementType.Div) {
        send_async<Command.CreateElementReturn>({
            command: Command.Names.CreateElement,
            element_type: type
        }).then((element_id) => {
            this.element_id = element_id.element_id;
            this.execution_gate.start();
        });
    }

    public append_to_root() {
        this.execution_gate.execute(() => {
            send_async({
                command: Command.Names.AppendElementToRoot,
                element_id: this.element_id
            });
        });
    }

    public on_click(callback: () => void) {
        this.execution_gate.execute(() => {
            send_async({
                command: Command.Names.RegisterEventListener,
                element_id: this.element_id,
                event_name: "click"
            });
        });
    }

    public set_styles(styles: string) {
        this.execution_gate.execute(() => {
            send_async({
                command: Command.Names.SetElementStyles,
                element_id: this.element_id,
                styles
            });
        });
    }
}

function main() {
    const body = new Element();

    body.append_to_root();

    body.set_styles(`width: 100px; height: 100px; background: red;`);

    body.on_click(() => {
        console.log("Body clicked");
    });

    body.on_click(() => {
        console.log("2 Body clicked");
    });
}