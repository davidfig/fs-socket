import { WebSocketUser } from './server';
import { SocketMessageExists } from '../types';
export declare function exists(ws: WebSocketUser, message: SocketMessageExists, debug: boolean): Promise<boolean>;
