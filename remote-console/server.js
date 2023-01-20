const { exec } = require("node:child_process");
const fs = require("node:fs");
const miniApp = require("./mini-app");
const ws = new require("./ws");
const wss = new ws.Server({ noServer: true });

// 存储所有 WebSocket 连接端 - Console
const consoleClients = [];
// 存储所有 WebSocket 连接端 - IPTV
const iptvClients = [];
// 存储需要执行的命令
const MAX_COMMAND_LENGTH = 5;
const commandStack = [];

const app = miniApp();

// CORS
app.use((req, res, next) => {
    res.header({
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "X-Requested-With,Content-Type,Authorization",
        "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
        "Content-Type": "application/json; charset=utf-8",
    });
    next();
});

// 处理 WebSocket 连接请求
// type: console | iptv
app.get("/ws/[type]", (req, res) => {
    if (req.headers.upgrade.toLowerCase() !== "websocket") {
        return res.status(404).end();
    }

    const { type } = req.params;

    if (type === "console" || type === "iptv") {
        wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (wsClient) => {
            const isConsole = type === "console";
            const clients = isConsole ? consoleClients : iptvClients;

            clients.push(wsClient);

            wsClient.on("message", (_message) => {
                try {
                    const message = _message.toString();
                    if (isConsole) {
                        // 来自控制台的消息
                        commandStack.push(message);
                        commandStack.length > MAX_COMMAND_LENGTH && commandStack.shift();

                        iptvClients.forEach((client) => {
                            client.send(message);
                        });
                    } else {
                        // 来自 IPTV 的消息
                        consoleClients.forEach((client) => {
                            client.send(message);
                        });
                    }
                } catch (e) {
                    console.log(`[sendMessage Error]: ${e}`);
                }
            });

            wsClient.on("close", () => {
                const index = clients.indexOf(wsClient);
                if (index >= 0) {
                    clients.splice(index, 1);
                }
            });
        });
    } else {
        res.status(400).end();
    }
});

app.post("/api/print", (req, res) => {
    console.log('apiPrint');
    const { message } = req.body;
    consoleClients.forEach((client) => {
        client.send(message);
    });
    res.status(200).json({
        code: 0,
    });
});

app.post("/api/getCommand", (req, res) => {
    res.json({
        code: 0,
        data: commandStack,
    });
    commandStack.length = 0;
});

app.get("*", (req, res) => {
    res
        .header({
            "Content-Type": "text/html",
        })
        .send(fs.readFileSync("./index.html"));
});

app.options("*", (req, res) => {
    res.status(200).end();
});

app.listen(3200, () => {
    console.log(`server is running on port: 3200`);
    exec(`start http://127.0.0.1:3200`);
});
