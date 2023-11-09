require("./build.js");

require("child_process")
    .spawn("npx" + (process.platform == "win32" ? ".cmd" : ""), [ "electron", "." ], {
        stdio: "inherit"
    });