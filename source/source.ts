import electron from "electron";
import Command from "./command";
import Common from "./common";

interface EventListenerNode {
    event_name: string,
    html_ev_id: any,
    listener_id: number
}

interface HTMLElementContainer {
    html_element: HTMLElement,
    id: number,
    listeners: EventListenerNode[]
}

class Handler extends Command.Handler {
    private readonly html_elements: HTMLElementContainer[] = [];
    private readonly element_unique_identifier_generator = new Common.UniqueIdentifierGenerator();
    private readonly event_listener_unique_identifier_generator = new Common.UniqueIdentifierGenerator();

    protected send_to_renderer(tp: Command.TransportPacket): void {
        electron.ipcRenderer.send("packet", tp);
    }

    public on_receive(packet: Command.Packet): Command.Return {
        if (packet.command == Command.Names.CreateElement) {
            const element = document.createElement(Handler.stringify_element_name(packet.element_type));
            const id = this.element_unique_identifier_generator.get_identifier();

            if (id == 12) {
                this.element_unique_identifier_generator.deallocate_identifier(this.html_elements[3].id);
                this.html_elements.splice(3, 1);
            }

            this.html_elements.push({
                html_element: element,
                id,
                listeners: []
            });

            return {
                command: Command.Names.CreateElement,
                element_id: id
            }
        } else if (packet.command == Command.Names.RegisterEventListener) {
            const element = this.get_element_index_by_id(packet.element_id);
            const id = this.event_listener_unique_identifier_generator.get_identifier();

            const listener_function = () => {
                this.send({
                    command: Command.Names.EventListenerTrigger,
                    event_name: packet.event_name,
                    listener_id: id
                }, () => {});
            }

            element.html_element.addEventListener(packet.event_name, listener_function);

            element.listeners.push({
                event_name: packet.event_name,
                html_ev_id: listener_function,
                listener_id: id
            });

            return {
                command: Command.Names.RegisterEventListener,
                listener_id: id
            }
        } else if (packet.command == Command.Names.AppendElementToRoot) {
            const element = this.get_element_index_by_id(packet.element_id);
            document.body.appendChild(element.html_element);

            return {
                command: Command.Names.AppendElementToRoot
            }
        } else if (packet.command == Command.Names.SetElementStyles) {
            const element = this.get_element_index_by_id(packet.element_id);
            (element.html_element as any).style = packet.styles;

            return {
                command: Command.Names.SetElementStyles
            }
        }

        return {}
    }

    private get_element_index_by_id(id: number) {
        return this.html_elements.find(el => el.id == id)!;
    }

    private static stringify_element_name(element: Command.CreateElementType) {
        switch (element) {
            case Command.CreateElementType.Div:
                return "div";
                
            case Command.CreateElementType.Span:
                return "span";

            case Command.CreateElementType.P:
                return "p";
        }
    }
}

const handler = new Handler();

electron.ipcRenderer.on("packet", (event, tp: Command.TransportPacket) => {
    handler.on_raw_return(tp);
});