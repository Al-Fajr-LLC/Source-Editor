import Command from "./command";
import Common from "./common";
import { handler_emitter, send_async } from "./server";

namespace Element {
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

    export class Container extends Element {

    }
}

export default Element;