/* =========== 配置 ============ */
const config = {
    port: 4111, // 服务运行端口
    targetHost: 'example.com', // 请求目标地址
    targetPort: 9007, // 请求目标端口
}

/* =========== 以下内容无需更改 ============ */
const http = require('http');

const { port, targetHost, targetPort } = config;

const buildRequestHeader = (headers = {}) => {
    const { cookie } = headers;
    const originHeaders = {
        accept: 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
        'content-type': headers['content-type'] || 'application/json;charset=utf-8',
        host: targetHost,
        referer: `http://${target}${targetPort === 80 ? '' : `:${targetPort}`}/`
    };
    cookie && (originHeaders.cookie = cookie);
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