import { WebSocketServer, ServerOptions, WebSocket } from 'ws';
import { SocketMessageLogin, SocketMessageType } from '../types';
export interface FSSServerOptions {
    webSocketServerOptions?: ServerOptions;
    port?: number;
    defaultDirectory?: string;
    authenticate?: (data: SocketMessageLogin) => string | false;
    handleOtherMessages?: (ws: WebSocket, message: SocketMessageType) => void;
    debug?: boolean;
}
export interface WebSocketUser extends WebSocket {
    authenticated: boolean;
    directory?: string;
}
export declare class Server {
    options: FSSServerOptions;
    server: WebSocketServer;
    webSockets: Set<WebSocketUser>;
    constructor(options?: FSSServerOptions);
    handleMessage(ws: WebSocketUser, message: SocketMessageType): void;
}
