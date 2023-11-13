import { Element } from "./server";

export default async function main() {
    const body = new Element();
    await body.set_styles(`
        top: 0px;
        left: 0;
        width: 100vw;
        height: 100vh;
        position: fixed;
        display: flex;
        background: #0B0B0B
    `);
    await body.append_to_root();

    const title_bar = new Element();
    await title_bar.set_styles(`
        width: 100vw;
        height: 32px;
        background: #0b0b0b;
        -webkit-app-region: drag;
    `);
    await body.append_child(title_bar);

    const close_button = new Element();
    await close_button.set_styles(`
        color: #FFF;
        width: 64px;
        height: 32px;
        -webkit-app-region: no-drag;
    `);

    await close_button.on_mouse_enter(() => {
        close_button.set_styles(`
            color: #FFF;
            width: 64px;
            height: 32px;
            -webkit-app-region: no-drag;
            background: rgba(255, 255, 255, 6%);
        `);
    }); 

    await close_button.on_mouse_leave(() => {
        close_button.set_styles(`
            color: #FFF;
            width: 64px;
            height: 32px;
            -webkit-app-region: no-drag;
            background: rgba(255, 255, 255, 0%);
        `);
    });

    await title_bar.append_child(close_button);
}