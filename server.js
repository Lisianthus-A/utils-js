const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const port = 4100;  //运行端口
const openBrowser = true;  //自动打开浏览器

const sendFile = (filePath, res) => {
    try {
        const file = fs.readFileSync(filePath);
        res.write(file);
    } catch (e) {
        console.log(e);
        res.writeHead(404);
    }
    res.end();
}

const server = http.createServer((req, res) => {
    const { url } = req;
    if (url === '/') {  // 根地址，返回 index.html
        const filePath = path.join(__dirname, 'index.html');
        sendFile(filePath, res);
    } else {  // 返回相应文件
        const pathname = url.match(/[\/\w\-\.]+/)?.[0] || '';
        const filePath = path.join(__dirname, pathname);
        sendFile(filePath, res);
    }
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
    !err && openBrowser && exec(`start http://localhost:${port}`);
});