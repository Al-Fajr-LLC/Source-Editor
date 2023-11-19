import electron, { BrowserWindow } from "electron";
import path from "path";
import Command from "./command";
import {EventEmitter} from "events";
import real_main from "./main";

export const handler_emitter = new EventEmitter();

handler_emitter.setMaxListeners(Infinity);

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
        handler_emitter.emit("recv", packet);
        return {} as unknown as any;
    }
}

export let handler: Handler;
export let window: BrowserWindow;

export function send_async<ReturnType extends Command.Return>(packet: Command.Packet) {
    return new Promise<ReturnType>((resolve, reject) => {
        handler.send(packet, (element_return) => resolve(element_return as unknown as any));
    });
} 

electron.app.once("ready", () => {
    window = new electron.BrowserWindow({
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

    // window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));
    window.show();

    electron.ipcMain.on("packet", (event, tp) => {
        handler.on_raw_return(tp);
    });

    window.webContents.on("dom-ready", () => {
        main();
    });

    window.webContents.on("devtools-reload-page", () => {
        main();
    });
});

async function main() {
    console.log("Wrapping main function");
    console.log("Element program started");
    await real_main();
    console.log("Done");
} 