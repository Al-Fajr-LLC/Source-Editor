import electron from "electron";
import Commands from "./commands";

const beat = document.createElement("p");

function set_beat(val: string) {
    beat.innerText = "packet: " + val;
}

electron.ipcRenderer.on("command", (event, data: Commands.Packet) => {
    set_beat(JSON.stringify(data));

    switch (data.command) {
        case Commands.Names.CreateElement:
            console.log("Create Element");
            break;
        case Commands.Names.RegisterEventListener:
            console.log("Register event listener");
            break;
    }
});

document.body.appendChild(beat);