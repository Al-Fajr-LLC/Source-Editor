import electron from "electron";
import Command from "./command";
import Common from "./common";

interface HTMLElementContainer {
    html_element: HTMLElement,
    id: number
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
                id
            });

            return {
                command: Command.Names.CreateElement,
                id
            }
        } else if (packet.command == Command.Names.RegisterEventListener) {
            const element = this.get_element_index_by_id(packet.element_id);

            return {
                command: Command.Names.RegisterEventListener,

            }
        }

        return {}
    }

    private get_element_index_by_id(id: number) {
        return this.html_elements.find(el => el.id == id);
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