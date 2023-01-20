/// <reference types="node" />
import * as http from 'http';
interface Proto extends http.ServerResponse {
    status: (code?: number) => Proto;
    header: (headers: Record<string, any>) => Proto;
    send: (data: any) => void;
    json: (obj: Record<string, any>) => void;
}
declare const proto: Proto;
export default proto;
