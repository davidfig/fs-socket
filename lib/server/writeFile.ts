import fs from 'fs-extra'
import path from 'path'
import { WebSocketUser } from './server'
import { SocketMessageWriteFile } from '../types';
import { validate } from './validate';

export async function writeFile(ws: WebSocketUser, message: SocketMessageWriteFile, debug: boolean) {
    if (!validate(message.file!)) return
    try {
        await fs.outputFile(path.join(ws.directory!, message.file), message.data)
        ws.send(JSON.stringify({
            ...message,
        }))
        if (debug) {
            console.log(`Websocket wrote the contents of file ${message.file} (${message.data.length})`)
        }
    } catch (e: any) {
        ws.send(JSON.stringify({
            ...message,
            error: e.message,
        } as SocketMessageWriteFile))
    }
}