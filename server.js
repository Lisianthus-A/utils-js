const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const port = 4100;  //运行端口
const openBrowser = true;  //自动打开浏览器

const server = http.createServer((req, res) => {
    console.log(decodeURI(req.url));  //请求地址
    if (req.url === '/') {  //根地址，返回index.html
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.log(err);
                res.write('error');
                res.end();
                return;
            }
            res.write(data);
            res.end();
        });
    } else {  //返回相应文件
        const { pathname } = url.parse(req.url);
        const filePath = path.join(__dirname, decodeURI(pathname));
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.log(err);
                res.end();
                return;
            }
            res.write(data);
            res.end();
        });
    }
});

server.listen(port, (err) => {
    err && console.log(err);
    !err && console.log(`server runing on port: ${port}`);
    !err && openBrowser && exec(`start http://localhost:${port}`);
});