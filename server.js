/* =========== 配置 ============ */
const config = {
    port: 4100,  // 运行端口
    openBrowser: true,  // 自动打开浏览器
};

/* =========== 以下内容无需更改 ============ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const { port, openBrowser } = config;

const mapContentType = {
    htm: 'text/html',
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    json: 'application/json',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    xml: 'application/xml',
    tar: 'application/x-tar',
    sh: 'application/x-sh'
};

const sendFile = (pathname, res) => new Promise(resolve => {
    let result;
    const suffix = pathname.match(/\.(\w+)$/)?.[1];
    // 文件路径
    // 后缀为 undefined 时说明 pathname 类似 /aaa/bbb，应读取 index.html
    const filePath = decodeURIComponent(
        path.join(__dirname, suffix ? pathname : 'index.html')
    );
    // Content-Type
    const type = mapContentType[suffix] || 'text/html';
    try {
        const file = fs.readFileSync(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Type', type);
        res.write(file);
        result = true;
    } catch (e) {
        res.writeHead(404);
        result = false;
    }
    res.end();
    resolve(result);
});

const server = http.createServer((req, res) => {
    const { url } = req;
    const pathname = url.match(/[\/\w\-\.%!_:\(\)]+/)?.[0] || '';
    sendFile(pathname, res).then(result => {
        // result && console.log(`[Server OK]: ${url}`);
        !result && console.log(`[Server ERR]: ${url}`);
    });
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
    !err && openBrowser && exec(`start http://localhost:${port}`);
});