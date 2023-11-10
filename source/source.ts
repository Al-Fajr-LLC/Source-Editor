import electron from "electron";
import Command from "./command";

class Handler extends Command.Handler {
    protected send_to_renderer(tp: Command.TransportPacket): void {
        electron.ipcRenderer.send("packet", tp);
    }

    public on_receive(packet: Command.Packet): Command.Return {
        console.log("GOT THE PACKET", packet);
        
        return {
            command: Command.Names.CreateElement,
            id: 0
        }
    }
}

const handler = new Handler();

electron.ipcRenderer.on("packet", (event, tp: Command.TransportPacket) => {
    handler.on_raw_return(tp);
});