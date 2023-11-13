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
        element_id: number
    }

    export enum CreateElementType {
        Div,
        Span,
        P
    }

    // Append element to root
    export interface AppendElementToRootPacket {
        command: Names.AppendElementToRoot,
        element_id: number
    } 

    export interface AppendElementToRootReturn {
        command: Names.AppendElementToRoot
    }

    // Register event listener
    export interface RegisterEventListenerPacket {
        command: Names.RegisterEventListener,
        event_name: string,
        element_id: number
    }

    export interface RegisterEventListenerReturn {
        command: Names.RegisterEventListener,
        listener_id: number
    }

    // Set element styles
    export interface SetElementStylesPacket {
        command: Names.SetElementStyles,
        element_id: number,
        styles: string
    }

    export interface SetElementStylesReturn {
        command: Names.SetElementStyles
    }

    // Commands
    export enum Names {
        CreateElement,
        RegisterEventListener,
        AppendElementToRoot,
        SetElementStyles
    }
    
    export type Packet = CreateElementPacket 
        | RegisterEventListenerPacket 
        | AppendElementToRootPacket
        | SetElementStylesPacket;

    // Return
    export type Return = CreateElementReturn 
        | RegisterEventListenerReturn 
        | AppendElementToRootReturn
        | SetElementStylesReturn;

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
        private readonly polling_interval = 0;
        private readonly unique_identifier_generator = new Common.UniqueIdentifierGenerator();

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

                    this.unique_identifier_generator.deallocate_identifier(this.send_queue[this.send_queue.length - 1].id);
                    this.send_queue.shift();

                    queue_node?.on_return(tp.packet as Return);
                    this.poll_next();
                    break;
            }
        }

        public send(packet: Packet, callback: (return_data: Return) => void) {
            this.send_queue.push({
                packet,
                on_return: callback,
                id: this.unique_identifier_generator.get_identifier(),
                status: SendQueueStatus.WaitingForSend
            });
        }
    }
}

export default Command;