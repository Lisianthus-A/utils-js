const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const port = 4100;  //运行端口
const openBrowser = true;  //自动打开浏览器

const sendFile = (filePath, res) => new Promise(resolve => {
    let result;
    filePath = decodeURIComponent(filePath);
    try {
        const file = fs.readFileSync(filePath);
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
        // result && console.log(`[ok]: ${url}`);
        !result && console.log(`[err]: ${url}`);
    })
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
    !err && openBrowser && exec(`start http://localhost:${port}`);
});