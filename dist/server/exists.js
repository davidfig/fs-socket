import fs from 'fs-extra';
import path from 'path';
import { validate } from './validate';
export async function exists(ws, message, debug) {
    if (debug) {
        console.log(`Websocket received an exist request for ${message.file}`);
    }
    if (!validate(message.file))
        return false;
    const file = path.join(ws.directory, message.file);
    try {
        const results = await fs.access(file);
        console.log(results);
        ws.send(JSON.stringify({
            ...message,
            exists: true,
        }));
    }
    catch (e) {
        ws.send(JSON.stringify({
            ...message,
            exists: false
        }));
    }
}
