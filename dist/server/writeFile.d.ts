import { WebSocketUser } from './server';
import { SocketMessageWriteFile } from '../types';
export declare function writeFile(ws: WebSocketUser, message: SocketMessageWriteFile, debug: boolean): Promise<void>;
