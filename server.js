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

const sendFile = (filePath, res) => new Promise(resolve => {
    let result;
    const suffix = filePath.match(/\.(\w+)$/)?.[1];
    // console.info(filePath, '------->', suffix);
    const type = mapContentType[suffix];
    filePath = decodeURIComponent(filePath);
    try {
        const file = fs.readFileSync(filePath);
        res.statusCode = 200;
        type && res.setHeader('content-type', type);
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
    let filePath;
    if (url === '/') {  // 根地址，返回 index.html
        filePath = path.join(__dirname, 'index.html');
    } else {  // 返回相应文件
        const pathname = url.match(/[\/\w\-\.%!_:\(\)]+/)?.[0] || '';
        filePath = path.join(__dirname, pathname);
    }
    sendFile(filePath, res).then(result => {
        // result && console.log(`[OK]: ${url}`);
        !result && console.log(`[Error]: ${url}`);
    })
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
    !err && openBrowser && exec(`start http://localhost:${port}`);
});