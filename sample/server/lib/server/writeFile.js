import fs from 'fs-extra';
import path from 'path';
import { validate } from './validate';
export async function writeFile(ws, message, debug) {
    if (!validate(message.file))
        return;
    try {
        await fs.outputFile(path.join(ws.directory, message.file), message.data);
        ws.send(JSON.stringify({
            ...message,
        }));
        if (debug) {
            console.log(`Websocket wrote the contents of file ${message.file} (${message.data.length})`);
        }
    }
    catch (e) {
        ws.send(JSON.stringify({
            ...message,
            error: e.message,
        }));
    }
}
