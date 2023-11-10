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
        private readonly polling_interval = 500;

        public constructor() {
            this.execute_next_queue();
        }

        private poll_next() {
            setTimeout(() => {
                this.execute_next_queue()
            }, this.polling_interval);
        }

        private execute_next_queue() {
            if (this.send_queue.length == 0) {
                console.log("Queue empty, trying again");
                this.poll_next();
                return;
            }
            
            const queue_el = this.send_queue[0];

            this.send_to_renderer({
                type: Types.Send,
                packet: queue_el.packet,
                id: queue_el.id
            });
        }

        protected abstract send_to_renderer(tp: TransportPacket): void;

        public abstract on_receive(packet: Packet): Return;

        public on_raw_return(tp: TransportPacket) {
            switch (tp.type) {
                case Command.Types.Send:
                    const return_data = this.on_receive(tp.packet as Command.Packet);

                    this.send_to_renderer({
                        id: tp.id,
                        packet: return_data,
                        type: Command.Types.Return
                    });
                        break;

                case Command.Types.Return:
                    const queue_node = this.send_queue.find(sq => sq.id == tp.id);

                    this.send_queue.shift();

                    queue_node?.on_return(tp.packet as Return);
                    this.poll_next();
                    break;
            }
        }

        public send(packet: Packet, callback: (return_data: Return) => void) {
            const id = Common.get_unique_id(this.send_queue.map(sq => sq.id));

            this.send_queue.push({
                packet,
                on_return: callback,
                id,
                status: SendQueueStatus.WaitingForSend
            });
        }
    }
}

export default Command;