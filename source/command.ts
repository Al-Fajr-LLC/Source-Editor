import Common from "./common";

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

    // Event listener triggered callback
    export interface ElementListenerTriggerPacket {
        command: Names.EventListenerTrigger,
        listener_id: number,
        event_name: string
    }

    export interface ElementListenerTriggerReturn {
        command: Names.EventListenerTrigger,
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

    // Execute code on an element
    export interface ExecElementPacket {
        command: Names.ExecElement,
        element_id: number,
        code: string
    }

    export interface ExecElementReturn {
        command: Names.ExecElement,
        return_code: string
    }

    // Append element
    export interface AppendElementTargetPacket {
        command: Names.AppendElementTarget,
        source_element_id: number,
        target_element_id: number
    }

    export interface AppendElementTargetReturn {
        command: Names.AppendElementTarget
    }

    // Set element html content
    export interface SetElementInnerHTMLPacket {
        command: Names.SetElementInnerHTML,
        element_id: number,
        inner_html: string
    }

    export interface SetElementInnerHTMLReturn {
        command: Names.SetElementInnerHTML
    }

    // Set element text content
    export interface SetElementInnerTextPacket {
        command: Names.SetElementInnerText,
        element_id: number,
        inner_text: string
    }

    export interface SetElementInnerTextReturn {
        command: Names.SetElementInnerText
    }

    // Commands
    export enum Names {
        CreateElement,
        RegisterEventListener,
        AppendElementToRoot,
        SetElementStyles,
        EventListenerTrigger,
        ExecElement,
        AppendElementTarget,
        SetElementInnerHTML,
        SetElementInnerText
    }
    
    export type Packet = CreateElementPacket 
        | RegisterEventListenerPacket 
        | AppendElementToRootPacket
        | SetElementStylesPacket
        | ElementListenerTriggerPacket
        | ExecElementPacket
        | AppendElementTargetPacket
        | SetElementInnerHTMLPacket
        | SetElementInnerTextPacket;

    // Return
    export type Return = CreateElementReturn 
        | RegisterEventListenerReturn 
        | AppendElementToRootReturn
        | SetElementStylesReturn
        | ElementListenerTriggerReturn
        | ExecElementReturn
        | AppendElementTargetReturn
        | SetElementInnerHTMLReturn
        | SetElementInnerTextReturn;

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