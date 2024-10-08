const http = require("http");
const path = require("path");
const fs = require("fs");

const PORT = 8200;
const DIRPATH = path.join(__dirname, "./upload");

if (!fs.existsSync(DIRPATH)) {
  fs.mkdirSync(DIRPATH, { recursive: true });
  console.log(`directory ${DIRPATH} created`);
}

const random = (min, max) => {
  const dif = max - min + 1;
  return (min + Math.random() * dif) >> 0;
};

const randomString = (len) => {
  let str = "";

  while (str.length < len) {
    if (random(0, 1) === 1) {
      str += String.fromCharCode(random(97, 122));
    } else {
      str += String.fromCharCode(random(48, 57));
    }
  }

  return str;
};

const htmlString = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Upload</title>
  </head>
  <body>
    <input id="i" type="file" />
    <button id="b">上传</button>
    <script>
      const el = document.getElementById("b");
      el.onclick = async () => {
        const file = document.getElementById("i").files[0];
        if (!file) {
          alert("未选择文件");
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("name", file.name);
        const res = await fetch("/upload", { method: "POST", body: fd });
        alert(res.status === 200 ? "done" : "failed");
      };
    </script>
  </body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.write(htmlString);
    res.end();
  }
  if (req.method === "POST" && req.url === "/upload") {
    console.log("uploading");
    req.setEncoding("binary");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("error", (err) => {
      console.log(err);
      res.statusCode = 500;
      res.end();
    });
    req.on("end", () => {
      // 解析 multipart/form-data 数据
      const boundary = req.headers["content-type"]
        .split("; ")[1]
        .replace("boundary=", "");
      const parts = body.split(`--${boundary}`);
      parts.pop();
      parts.shift();

      const fields = {};
      parts.forEach((part) => {
        const [header, value] = part.split("\r\n\r\n");
        const nameMatch = header.match(/name="([^"]+)"/);
        if (nameMatch) {
          const name = nameMatch[1];
          fields[name] = value.trim();
        }
      });

      const id = randomString(16);
      const writerStream = fs.createWriteStream(
        path.join(DIRPATH, `${id}-${fields.name}`)
      );
      writerStream.write(fields.file, "binary");
      writerStream.end();
      writerStream.on("error", (err) => {
        console.log(err);
      });
      writerStream.on("finish", () => {
        console.log("done. receive file:", fields.name);
      });

      res.statusCode = 200;
      res.end();
    });
  }
});

server.listen(PORT, () => {
  console.log(`Send Server is Running on ${PORT}`);
});
