import fs from 'fs-extra';
import path from 'path';
import { validate } from './validate';
async function readdir(dir, recursive, files, directories) {
    const f = await fs.readdir(dir);
    for (const file of f) {
        const filename = path.join(dir, file);
        const stat = await fs.stat(filename);
        if (stat.isDirectory()) {
            if (recursive) {
                await readdir(filename, true, files, directories);
            }
            directories.push(filename);
        }
        else {
            files.push(filename);
        }
    }
}
export async function dir(ws, message, debug) {
    if (debug) {
        console.log(`Websocket requested a ${message.recursive ? 'recursive' : 'non-recursive'} dir listing of ${message.directory}`);
    }
    if (!validate(message.directory))
        return;
    const base = path.join(ws.directory, message.directory);
    const files = [];
    const directories = [];
    try {
        await readdir(base, !!message.recursive, files, directories);
        ws.send(JSON.stringify({
            ...message,
            files,
            directories,
        }));
    }
    catch (e) {
        console.warn('Error in fs operation', e.message);
        ws.send(JSON.stringify({
            ...message,
            error: e.message,
        }));
    }
}
