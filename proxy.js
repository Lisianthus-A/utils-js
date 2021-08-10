const http = require('http');

const port = 4111;  // 服务运行端口

const targetServer = 'example.com';  // 请求目标地址
const targetPort = 9007;  // 请求目标端口

const buildResponseHeader = (headers = {}) => ({
    ...headers,
    'Access-Control-Allow-Origin': headers.origin || '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
    'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
});

const server = http.createServer((req, res) => {

    const { method, url, headers } = req;

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
            headers,
            hostname: targetServer,
            port: targetPort,
            path: url,
        };

        // 发起请求
        const httpReq = http.request(options, (httpRes) => {
            const serverData = [];
            httpRes.on('data', (chunk) => {
                serverData.push(chunk);
            });

            httpRes.on('end', () => {
                console.log(`[OK] ${method} ${url}`);
                const serverBuffer = Buffer.concat(serverData);
                res.writeHead(httpRes.statusCode, buildResponseHeader(httpRes.headers));
                res.write(serverBuffer);
                res.end();
            })
        });

        httpReq.on('error', (err) => {
            console.log(`[Error] ${method} ${url}: ${err}`);
            res.writeHead(httpRes.statusCode, buildResponseHeader(httpRes.headers));
            res.write(JSON.stringify({ error: err }));
            res.end();
        });

        httpReq.write(clientBuffer);
        httpReq.end();
    });
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
});