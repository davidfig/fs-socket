import { WebSocketUser } from './server';
import { SocketMessageDir } from '../types';
export declare function dir(ws: WebSocketUser, message: SocketMessageDir, debug: boolean): Promise<void>;
