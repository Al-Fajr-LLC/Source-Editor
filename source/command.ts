import Common from "./common";
import wait_sync from "wait-sync";

namespace Command {
    // Create element
    export interface CreateElementPacket {
        command: Names.CreateElement,
        element_type: CreateElementType
    }

    export interface CreateElementReturn {
        command: Names.CreateElement,
        id: number
    }

    export enum CreateElementType {
        Div,
        Span,
        P
    }

    // Register event listener
    export interface RegisterEventListenerPacket {
        command: Names.RegisterEventListener,
        event_name: RegisterEventListenerNames
    }

    export interface RegisterEventListenerReturn {
        command: Names.RegisterEventListener,
        id: number
    }

    export enum RegisterEventListenerNames {
        Click,
        MouseEnter,
        MouseLeave
    }

    // Commands
    export enum Names {
        CreateElement,
        RegisterEventListener
    }
    
    export type Packet = CreateElementPacket | RegisterEventListenerPacket;

    // Return
    export type Return = CreateElementReturn | RegisterEventListenerReturn;

    // Transporter 
    export interface TransportPacket {
        packet: Packet | Return,
        type: Types,
        id: number
    }

    export enum Types {
        Return,
        Send
    }

    // Handler
    enum SendQueueStatus {
        WaitingForSend,
        WaitingForReturn
    }

    interface SendQueueNode {
        packet: Packet,
        status: SendQueueStatus,
        id: number,
        on_return: (return_packet: Return) => void
    }

    export abstract class Handler {
        private send_queue: SendQueueNode[] = [];
        private readonly polling_interval = 1000;
        private waiter_timer: NodeJS.Timer | null = null;

        public constructor() {
            this.execute_next_queue();
        }

        private poll_next() {
            this.waiter_timer = setTimeout(() => {
                this.waiter_timer = null;
                this.execute_next_queue()
            }, this.polling_interval);
        }

        private execute_next_queue() {
            if (this.send_queue.length == 0) {
                console.log("Queue empty, trying again");
                this.poll_next();
                return;
            }
            
            console.log("Sending packet");
            const queue_el = this.send_queue[0];

            console.log(queue_el);

            this.send_to_renderer({
                type: Types.Send,
                packet: queue_el.packet,
                id: 0
            });

            this.send_queue.shift();
            this.poll_next();
        }

        protected abstract send_to_renderer(tp: TransportPacket): void;

        public abstract on_receive(packet: Packet): Return;

        public on_raw_return(tp: TransportPacket) {
            if (tp.type == Command.Types.Send) {
                const return_data = this.on_receive(tp.packet as Command.Packet);

                this.send_to_renderer({
                    id: tp.id,
                    packet: return_data,
                    type: Command.Types.Return
                });

                console.log("Returning packet");
            }
        }

        public send(packet: Packet, callback: (return_data: Return) => void) {
            this.send_queue.push({
                packet,
                on_return: callback,
                id: Common.get_unique_id(this.send_queue.map(sq => sq.id)),
                status: SendQueueStatus.WaitingForSend
            });
        }
    }
}

export default Command;