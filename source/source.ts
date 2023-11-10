import electron from "electron";
import Command from "./command";
import Common from "./common";

interface HTMLElementContainer {
    html_element: HTMLElement,
    id: number
}

const element_table_chart = document.createElement("table");
document.body.appendChild(element_table_chart);

class Handler extends Command.Handler {
    private html_elements: HTMLElementContainer[] = [];

    protected send_to_renderer(tp: Command.TransportPacket): void {
        electron.ipcRenderer.send("packet", tp);
    }

    private render_table() {
        element_table_chart.innerHTML = "";

        // Render header
        const header_rows = document.createElement("tr");
        const properties = ["id", "name"];

        properties.forEach((property) => {
            const type = document.createElement("th");
            type.innerText = property;

            header_rows.appendChild(type);
        });

        element_table_chart.appendChild(header_rows);

        // Render data
        this.html_elements.forEach((el) => {
            const row = document.createElement("tr");
            const name = document.createElement("td");
            const id = document.createElement("td");

            name.innerText = el.html_element.tagName;
            id.innerText = el.id + "";

            row.appendChild(id);
            row.appendChild(name);

            element_table_chart.appendChild(row);
        });
    }

    public on_receive(packet: Command.Packet): Command.Return {
        switch (packet.command) {
            case Command.Names.CreateElement:
                const element = document.createElement(Handler.stringify_element_name(packet.element_type));
                const id = Common.get_unique_id(this.html_elements.map(he => he.id));

                if (id == 12) {
                    this.html_elements.splice(3, 1);
                }

                this.html_elements.push({
                    html_element: element,
                    id
                });

                this.render_table();
                return {
                    command: packet.command,
                    id
                }
        }
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