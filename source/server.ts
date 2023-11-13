import electron, { BrowserWindow } from "electron";
import path from "path";
import Command from "./command";
import Common from "./common";
import {EventEmitter} from "events";
import { WebSocket, WebSocketServer } from "ws";
import real_main from "./main";

const handler_emitter = new EventEmitter();
class Handler extends Command.Handler {
    private readonly window: electron.BrowserWindow;
    private readonly protocol_server = new WebSocketServer({ port: 2345 });

    public constructor(window: electron.BrowserWindow) {
        super();

        this.window = window;
    }

    protected send_to_renderer(tp: Command.TransportPacket): void {
        console.log(tp);
        this.protocol_server.clients.forEach((client) => {
            client.send(JSON.stringify(tp));
        });
    }

    public on_receive(packet: Command.Packet): Command.Return {
        handler_emitter.emit("recv", packet);
    }

    public get_server() {
        return this.protocol_server;
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
        frame: false,
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

    // electron.ipcMain.on("packet", (event, tp) => {
    //     handler.on_raw_return(tp);
    // });

    handler.get_server().on("connection", (conn) => {
        conn.on("message", (jstring) => {
            try {
                const obj = JSON.parse(jstring.toString());
                handler.on_raw_return(obj);
            } catch (e) {
                console.error(e);
            }
        });

        main();
    });

    // window.webContents.on("dom-ready", () => {
    //     main();
    // });

    // window.webContents.on("devtools-reload-page", () => {
    //     main();
    // });
});

interface EventListenerNode {
    event_name: string,
    listener_id: number,
    callback: any
}

export class Element {
    private element_id: number;
    private readonly execution_gate = new Common.ExecutionGate();
    private readonly event_listeners: EventListenerNode[] = [];
    public readonly children: Element[] = [];

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
        return new Promise((resolve, reject) => {
            this.execution_gate.execute(() => {
                send_async({
                    command: Command.Names.AppendElementToRoot,
                    element_id: this.element_id
                }).then((return_data) => resolve(return_data));
            });
        });
    }

    public async exec_code(code: string) {
        return new Promise((resolve, reject) => {
            this.execution_gate.execute(() => {
                send_async<Command.ExecElementReturn>({
                    command: Command.Names.ExecElement,
                    element_id: this.element_id,
                    code
                }).then((return_data) => {
                    resolve(return_data.return_code)
                })
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

    public async set_styles(styles: string) {
        return new Promise((resolve, reject) => {
            this.execution_gate.execute(() => {
                send_async({
                    command: Command.Names.SetElementStyles,
                    element_id: this.element_id,
                    styles
                }).then((return_data) => {
                    resolve(return_data);
                });
            });
        });
    }

    public async append_child(element: Element) {
        return new Promise((resolve, reject) => {
            this.execution_gate.execute(() => {
                send_async({
                    command: Command.Names.AppendElementTarget,
                    source_element_id: element.element_id,
                    target_element_id: this.element_id
                }).then((return_data) => resolve(return_data));
            });
        });
    }
}

function show_dialog(title: string, body: string) {
    dialog.show();

    dialog.webContents.send("title-set", title);
    dialog.webContents.send("body-set", body);
}

async function main() {
    console.log("Wrapping main function");
    console.log("Element program started");
    await real_main();
    console.log("Done");
}