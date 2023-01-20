"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const proto = Object.create(http.ServerResponse.prototype);
proto.status = function (code) {
    if (code) {
        this.statusCode = code;
    }
    return this;
};
proto.header = function (headers) {
    Object.entries(headers).forEach(([field, value]) => {
        this.setHeader(field, value);
    });
    return this;
};
proto.send = function (data) {
    if (Object.prototype.toString.call(data) === '[object Object]') {
        return this.json(data);
    }
    this.end(data);
};
proto.json = function (obj) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(obj));
};
exports.default = proto;
