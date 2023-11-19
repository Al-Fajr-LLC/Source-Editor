import Element from "./element";

export default async function main() {
    const root = new Element.Container();
    await root.append_to_root();

    async function draw_grid(width: number, height: number) {
        const rows = new Element.Container();

        await rows.set_styles(`
            display: flex;
            gap: 1px;
            flex-direction: column;
        `);

        for (let row = 0; row < height; row++) {
            const rc = new Element.Container();
            await rows.append_child(rc);

            await rc.set_styles(`
                display: flex;
                gap: 1px;
            `);
            
            for (let col = 0; col < width; col++) {
                const block = new Element.Container();
                await rc.append_child(block);

                const dstyle = `
                    width: 30px;
                    height: 30px;
                    background: grey;
                `;

                await block.set_styles(dstyle);

                await block.on_mouse_enter(async () => {
                    await block.set_styles(dstyle + "background: pink;");
                });

                await block.on_mouse_leave(async () => {
                    await block.set_styles(dstyle);
                });
            }
        }

        return rows;
    }

    await root.append_child(await draw_grid(2, 2));
}