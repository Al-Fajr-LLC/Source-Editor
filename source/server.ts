import electron, { BrowserWindow } from "electron";
import path from "path";
import Command from "./command";
import Common from "./common";
import {EventEmitter} from "events";

const handler_emitter = new EventEmitter();
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
    }
}

let handler: Handler;
let window: BrowserWindow;
let dialog: BrowserWindow;

function send_async<ReturnType extends Command.Return>(packet: Command.Packet) {
    return new Promise<ReturnType>((resolve, reject) => {
        handler.send(packet, (element_return) => resolve(element_return as unknown as any));
    });
} 

electron.app.once("ready", () => {
    window = new electron.BrowserWindow({
        width: 1200,
        height: 800,
        // frame: false,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    dialog = new electron.BrowserWindow({
        width: 500,
        height: 300,
        // frame: false,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    handler = new Handler(window);

    // window.maximize();
    window.loadFile(path.join(__dirname, "../source/source.html"));
    dialog.loadFile(path.join(__dirname, "../source/dialog.html"));
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

interface EventListenerNode {
    event_name: string,
    listener_id: number,
    callback: any
}

class Element {
    private element_id: number;
    private readonly execution_gate = new Common.ExecutionGate();
    private readonly event_listeners: EventListenerNode[] = [];

    public constructor(type: Command.CreateElementType = Command.CreateElementType.Div) {
        handler_emitter.on("recv", (p) => this.on_handler_packet(p));

        send_async<Command.CreateElementReturn>({
            command: Command.Names.CreateElement,
            element_type: type
        }).then((element_id) => {
            this.element_id = element_id.element_id;
            this.execution_gate.start();
        });
    }

    private on_handler_packet(packet: Command.Packet) {
        if (!this.event_listeners) return;
        if (packet.command == Command.Names.EventListenerTrigger) {
            this.event_listeners.find(el => el.listener_id == packet.listener_id)?.callback();
        }
    }

    public append_to_root() {
        this.execution_gate.execute(() => {
            send_async({
                command: Command.Names.AppendElementToRoot,
                element_id: this.element_id
            });
        });
    }

    private async register_event_listener(event_name: string, callback: () => void) {
        return new Promise((resolve, reject) => {
            this.execution_gate.execute(() => {
                send_async<Command.RegisterEventListenerReturn>({
                    command: Command.Names.RegisterEventListener,
                    element_id: this.element_id,
                    event_name: event_name
                }).then((event_listener) => {
                    this.event_listeners.push({
                        listener_id: event_listener.listener_id,
                        event_name: event_name,
                        callback
                    });

                    resolve(event_listener.listener_id);
                });
            });
        });
    }

    public async on_click(callback: () => void) {
        return await this.register_event_listener("click", callback);
    }

    public async on_mouse_enter(callback: () => void) {
        return await this.register_event_listener("mouseenter", callback);
    }

    public async on_mouse_leave(callback: () => void) {
        return await this.register_event_listener("mouseleave", callback);
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

function show_dialog(title: string, body: string) {
    dialog.show();

    dialog.webContents.send("title-set", title);
    dialog.webContents.send("body-set", body);
}

function main() {
    const body = new Element();
    const el_2 = new Element();

    body.append_to_root();

    body.set_styles(`width: 100px; height: 100px; background: red;`);
    el_2.set_styles(`width: 100px; height: 100px; background: blue;`);

    el_2.on_mouse_enter(() => {
        el_2.set_styles(`width: 100px; height: 100px; background: darkblue;`);
    });

    el_2.on_mouse_leave(() => {
        el_2.set_styles(`width: 100px; height: 100px; background: blue;`);
    })

    el_2.on_click(() => {
        show_dialog("EL 2 Click", "EL2 was clicked remotely");
    });

    body.on_click(() => {
        console.log("Body clicked");
    });

    body.on_click(() => {
        console.log("2 Body clicked");
    });

    el_2.append_to_root();
}