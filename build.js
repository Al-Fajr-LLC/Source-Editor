const esbuild = require("esbuild");
const path = require("path");

function build(targets) {
    targets.forEach((target) => {
        esbuild.build({
            entryPoints: [path.join(__dirname, target.entry)],
            outfile: path.join(__dirname, "target", target.out),
            external: (target.external ?? []),
            bundle: true,
            platform: target.platform,
        });
    })
}

build([
    {
        entry: "source/server.ts",
        out: "server.js",
        platform: "node",
        external: ["electron", "wait-sync"]
    },
    {
        entry: "source/source.ts",
        out: "source.js",
        platform: "node",
        external: ["electron", "wait-sync"]
    }
]);