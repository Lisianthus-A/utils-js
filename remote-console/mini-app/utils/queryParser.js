"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queryParser = (req, res, next) => {
    const queryArray = (req.url || '').match(/[?&]([^?&]+)=([^?&]+)/g) || [];
    const query = queryArray.reduce((acc, cur) => {
        const [key, value] = cur.slice(1).split('=');
        acc[key] = value;
        return acc;
    }, {});
    req.query = query;
    next();
};
exports.default = queryParser;
