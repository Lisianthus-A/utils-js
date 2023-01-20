"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonParse = (str) => {
    try {
        const json = JSON.parse(str);
        return json;
    }
    catch (e) {
        return {};
    }
};
const bodyParser = (req, res, next) => {
    const data = [];
    req.on('data', (chunk) => {
        data.push(chunk);
    });
    req.on('end', () => {
        const buffer = Buffer.concat(data);
        const body = jsonParse(buffer);
        req.body = body;
        req.bodyBuffer = buffer;
        next();
    });
    req.on('error', (e) => {
        console.error(e);
        next();
    });
};
exports.default = bodyParser;
