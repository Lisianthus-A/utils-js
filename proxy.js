const http = require('http');

const port = 4100;  // 服务运行端口

const targetServer = 'example.com';  // 请求目标地址
const targetPort = 9007;  // 请求目标端口

const server = http.createServer((req, res) => {

    const { method, url } = req;

    // 设置响应头
    res.writeHead(200, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
    });

    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }

    // 接收客户端发送过来的数据
    let clientData = '';
    req.on('data', (chunk) => {
        clientData += chunk;
    });

    // 接收完毕
    req.on('end', () => {
        // 请求配置
        const options = {
            method,
            hostname: targetServer,
            port: targetPort,
            path: url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': clientData.length,
            },
        };

        // 发起请求
        const httpReq = http.request(options, (httpRes) => {
            let data = '';
            httpRes.on('data', (chunk) => {
                data += chunk;
            });

            httpRes.on('end', () => {
                console.log(`[OK] ${method} ${url}`);
                res.write(data);
                res.end();
            })
        });

        httpReq.on('error', (err) => {
            console.log(`[Error] ${method} ${url}: ${err}`);
            res.write(JSON.stringify({ error: err }));
            res.end();
        });

        httpReq.write(clientData);
        httpReq.end();
    });
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
});