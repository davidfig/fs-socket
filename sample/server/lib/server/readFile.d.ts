import { WebSocketUser } from './server';
import { SocketMessageReadFile } from '../types';
export declare function readFile(ws: WebSocketUser, message: SocketMessageReadFile, debug: boolean): Promise<void>;
