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
    mock: {
        // '/api/user/detail': {
        //     code: 0,
        //     data: {
        //         id: 1,
        //         name: 'admin'
        //     }
        // },
    },
}

/* =========== 以下内容无需更改 ============ */
const http = require('http');

const { port, targetHost, targetPort, mock = {} } = config;

const buildRequestHeader = (headers = {}) => {
    const originHeaders = {
        ...headers,
        'Content-Type': headers['content-type'] || 'application/json;charset=utf-8',
        Host: targetHost,
        Referer: `http://${target}${targetPort === 80 ? '' : `:${targetPort}`}/`
    };
    return originHeaders;
}

const buildResponseHeader = (headers = {}) => ({
    ...headers,
    'Access-Control-Allow-Origin': headers.origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
    'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
});

// 查看端口是否可用
const isPortUseable = (p) => {
    return new Promise(resolve => {
        const s = http.createServer().listen(p);
        // 端口可用
        s.on('listening', () => {
            s.close();
            resolve(true);
        });
        // 端口不可用
        s.on('error', () => {
            resolve(false);
        });
    });
}

const server = http.createServer((req, res) => {
    const { method, url, headers } = req;
    
    // 使用 mock 的数据进行响应
    for (const [mockUrl, data] of Object.entries(mock)) {
        if (url.startsWith(mockUrl)) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.write(JSON.stringify(data));
            res.end();
            return;
        }
    }

    if (method === 'OPTIONS') {
        res.writeHead(200, buildResponseHeader());
        res.end();
        return;
    }

    // 接收客户端发送过来的数据
    const clientData = [];
    req.on('data', (chunk) => {
        clientData.push(chunk);
    });

    // 接收完毕
    req.on('end', () => {
        const clientBuffer = Buffer.concat(clientData);
        // 请求配置
        const options = {
            method,
            headers: buildRequestHeader(headers),
            hostname: targetHost,
            port: targetPort,
            path: url,
        };

        // 发起请求
        const httpReq = http.request(options, (httpRes) => {
            const serverData = [];
            httpRes.on('data', (chunk) => {
                serverData.push(chunk);
            });

            // 服务端数据接收完毕，返回客户端
            httpRes.on('end', () => {
                // console.log(`[OK] ${method} ${url}`);
                const serverBuffer = Buffer.concat(serverData);
                res.writeHead(httpRes.statusCode, buildResponseHeader(httpRes.headers));
                res.write(serverBuffer);
                res.end();
            })
        });

        httpReq.on('error', (err) => {
            console.log(`[Error] ${method} ${url}: ${err}`);
            res.writeHead(500, buildResponseHeader());
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
}

listen();