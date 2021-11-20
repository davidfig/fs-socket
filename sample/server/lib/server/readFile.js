import fs from 'fs-extra';
import path from 'path';
import { validate } from './validate';
export async function readFile(ws, message, debug) {
    if (!validate(message.file))
        return;
    try {
        const file = await fs.readFile(path.join(ws.directory, message.file));
        let data;
        if (message.fileType === 'text') {
            data = file.toString();
        }
        else if (message.fileType === 'json') {
            data = file.toJSON();
        }
        else if (message.fileType === 'binary') {
            data = file;
        }
        ws.send(JSON.stringify({
            ...message,
            data,
        }));
        if (debug) {
            console.log(`Websocket requested the contents of file ${message.file} in ${message.fileType} format`);
        }
    }
    catch (e) {
        ws.send(JSON.stringify({
            ...message,
            error: e.message,
        }));
    }
}
