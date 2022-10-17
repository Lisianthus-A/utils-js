/* =========== 配置 ============ */
const config = {
    // 服务运行端口
    // 端口被占用时会自动寻找下一个端口
    port: 4111,
    // 请求目标地址
    targetHost: 'example.com',
    // 请求目标端口
    targetPort: 9007,
    // 需要 mock 的地址和数据
    // 优先级比 proxyUrl 高
    mock: {
        // '/api/user/detail': {
        //     code: 0,
        //     data: {
        //         id: 1,
        //         name: 'admin'
        //     }
        // },
    },
    // 需要额外代理到其他地址的 url
    // 如以 /api/user 开头的地址代理到 192.168.1.1:5000
    proxyUrl: {
        // '/api/user': '192.168.1.1:5000',
        // '/api/login': 'example.com',
        // '/api/upload': 'example.com:1000'
    },
};

/* =========== 以下内容无需更改 ============ */
const http = require("http");

const { port, targetHost, targetPort, mock = {}, proxyUrl = {} } = config;

// 合并 headers & 处理成 lowerCase
const mergeHeaders = (target, source) => {
    const res = {};
    for (const key in target) {
        const lowerCaseKey = key.toLowerCase();
        res[lowerCaseKey] = target[key];
    }
    for (const key in source) {
        const lowerCaseKey = key.toLowerCase();
        res[lowerCaseKey] = source[key];
    }
    return res;
};

// 生成请求的 headers
const buildRequestHeader = (headers = {}) => {
    return mergeHeaders(headers, {
        "content-type": headers["content-type"] || "application/json;charset=utf-8",
    });
};

// 生成响应的 headers
const buildResponseHeader = (headers, origin = "*") => {
    return mergeHeaders(headers, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "X-Requested-With,Content-Type,Authorization,jwt",
        "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
        "Content-Type": "application/json; charset=utf-8",
    });
};

// 生成请求的 host 和 port
const buildRequestHostAndPort = (url) => {
    const defaultValue = [targetHost, targetPort];
    for (const [prefix, target] of Object.entries(proxyUrl)) {
        if (url.startsWith(prefix)) {
            const [host, port = 80] = target.split(":");
            return [host, port];
        }
    }

    return defaultValue;
};

// 生成请求配置
const buildRequestOptions = (req) => {
    const { method, headers, url } = req;
    const [host, port] = buildRequestHostAndPort(url);

    const options = {
        method,
        headers: buildRequestHeader(headers),
        hostname: host,
        port: port,
        path: url,
    };

    return options;
};

// 查看端口是否可用
const isPortUseable = (p) => {
    return new Promise((resolve) => {
        const s = http.createServer().listen(p);
        // 端口可用
        s.on("listening", () => {
            s.close();
            resolve(true);
        });
        // 端口不可用
        s.on("error", () => {
            resolve(false);
        });
    });
};

const server = http.createServer((req, res) => {
    const { method, url } = req;

    // 使用 mock 的数据进行响应
    for (const [mockUrl, data] of Object.entries(mock)) {
        if (url.startsWith(mockUrl)) {
            console.log(`[Mock] ${mockUrl}`);
            res.writeHead(200, buildResponseHeader({ "Content-Type": "application/json" }, req.headers.origin));
            res.write(JSON.stringify(data));
            res.end();
            return;
        }
    }

    if (method === "OPTIONS") {
        res.writeHead(200, buildResponseHeader({}, req.headers.origin));
        res.end();
        return;
    }

    // 接收客户端发送过来的数据
    const clientData = [];
    req.on("data", (chunk) => {
        clientData.push(chunk);
    });

    // 接收完毕
    req.on("end", () => {
        const clientBuffer = Buffer.concat(clientData);
        // 请求配置
        const options = buildRequestOptions(req);

        // 发起请求
        const httpReq = http.request(options, (httpRes) => {
            const serverData = [];
            httpRes.on("data", (chunk) => {
                serverData.push(chunk);
            });

            // 服务端数据接收完毕，返回客户端
            httpRes.on("end", () => {
                console.log(`[OK] ${method} ${url}`);
                const serverBuffer = Buffer.concat(serverData);
                res.writeHead(httpRes.statusCode, buildResponseHeader(httpRes.headers, req.headers.origin));
                res.write(serverBuffer);
                res.end();
            });
        });

        httpReq.on("error", (err) => {
            console.log(`[Error] ${method} ${url}: ${err}`);
            res.writeHead(500, buildResponseHeader({}, req.headers.origin));
            res.write(JSON.stringify({ error: err }));
            res.end();
        });

        httpReq.write(clientBuffer);
        httpReq.end();
    });
});

const listen = async () => {
    // 在 port ~ port + 10 中寻找可用的端口进行监听
    for (let p = port; p < port + 10; ++p) {
        const isUseable = await isPortUseable(p);
        if (isUseable) {
            server.listen(p, (err) => {
                err && console.log(err);
                !err && console.log(`server runing on port: ${p}`);
            });
            return;
        }
    }

    console.error(`Err: Port ${port} ~ ${port + 10} are disabled!`);
};

listen();
