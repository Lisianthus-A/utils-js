/// <reference types="node" />
import * as http from 'http';
import responseProto from './responseProto';
export interface wrapReq extends http.IncomingMessage {
    query: Record<string, string>;
    params: Record<string, string>;
    body: Record<string, any>;
    bodyBuffer: Buffer;
}
export declare type wrapRes = typeof responseProto;
export declare type Middleware = (req: wrapReq, res: wrapRes, next: (value?: any) => void, value: any) => void;
export declare type RouteHandler = (req: wrapReq, res: wrapRes) => void;
export interface Route {
    path: string;
    handler: RouteHandler;
    parts: string[];
}
declare class MiniApp {
    private server;
    private middlewares;
    private staticRoutes;
    private dynamicRoutes;
    constructor();
    private methodWraper;
    use(fn: Middleware): void;
    get(path: string, fn: RouteHandler): void;
    post(path: string, fn: RouteHandler): void;
    options(path: string, fn: RouteHandler): void;
    put(path: string, fn: RouteHandler): void;
    delete(path: string, fn: RouteHandler): void;
    listen(port: number, callback?: () => void): void;
    close(callback?: () => void): void;
}
declare const _default: () => MiniApp;
export default _default;
