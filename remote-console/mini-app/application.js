"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const responseProto_1 = require("./responseProto");
const index_1 = require("./utils/index");
class MiniApp {
    constructor() {
        this.server = null;
        this.middlewares = [index_1.bodyParser, index_1.queryParser];
        this.staticRoutes = {};
        this.dynamicRoutes = {};
    }
    methodWraper(type, path, fn) {
        const isDynamic = /\[[^\/]+\]/.test(path);
        const routeKey = `${type}_${path}`;
        const route = {
            path,
            parts: isDynamic ? path.split('/').filter(item => item) : [],
            handler: fn
        };
        if (isDynamic) {
            this.dynamicRoutes[routeKey] = route;
        }
        else {
            this.staticRoutes[routeKey] = route;
        }
    }
    use(fn) {
        this.middlewares.push(fn);
    }
    get(path, fn) {
        this.methodWraper('GET', path, fn);
    }
    post(path, fn) {
        this.methodWraper('POST', path, fn);
    }
    options(path, fn) {
        this.methodWraper('OPTIONS', path, fn);
    }
    put(path, fn) {
        this.methodWraper('PUT', path, fn);
    }
    delete(path, fn) {
        this.methodWraper('DELETE', path, fn);
    }
    listen(port, callback) {
        this.server = http.createServer(async (req, res) => {
            var _a;
            Object.setPrototypeOf(res, responseProto_1.default);
            const method = req.method || 'GET';
            const url = req.url || '';
            const path = decodeURI(((_a = url.match(/[^?&]+/)) === null || _a === void 0 ? void 0 : _a[0]) || '');
            const routeKey = `${method}_${path}`;
            let routeHandler = null;
            req.params = {};
            const staticRoute = this.staticRoutes[routeKey];
            if (staticRoute) {
                routeHandler = staticRoute.handler;
            }
            else {
                for (const key in this.dynamicRoutes) {
                    const routeMethod = key.split('_')[0];
                    const { handler, parts: routeParts } = this.dynamicRoutes[key];
                    const parts = path.split('/').filter(item => item);
                    if (method !== routeMethod || parts.length !== routeParts.length) {
                        continue;
                    }
                    const params = {};
                    let paramNotMatch = false;
                    for (let i = 0; i < parts.length; ++i) {
                        const isParam = routeParts[i][0] === '[' && routeParts[i].slice(-1)[0] === ']';
                        if (isParam) {
                            const field = routeParts[i].slice(1, -1);
                            params[field] = parts[i];
                        }
                        else if (parts[i] !== routeParts[i]) {
                            paramNotMatch = true;
                            break;
                        }
                    }
                    if (paramNotMatch) {
                        continue;
                    }
                    req.params = params;
                    routeHandler = handler;
                    break;
                }
            }
            const key = `${method}_*`;
            if (routeHandler === null && this.staticRoutes[key]) {
                routeHandler = this.staticRoutes[key].handler;
            }
            let value;
            for (let i = 0; i < this.middlewares.length; ++i) {
                const middleware = this.middlewares[i];
                value = await new Promise((resolve) => {
                    middleware(req, res, resolve, value);
                }).catch(console.log);
            }
            if (routeHandler) {
                try {
                    routeHandler(req, res);
                }
                catch (e) {
                    console.log(e);
                }
            }
            else {
                res.status(404).end('404');
            }
        });
        this.server.listen(port, callback);
    }
    close(callback) {
        this.server && this.server.close(callback);
    }
}
exports.default = () => new MiniApp();
