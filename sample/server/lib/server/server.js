import { WebSocketServer } from 'ws';
import { dir } from './dir';
import { exists } from './exists';
import { readFile } from './readFile';
import { writeFile } from './writeFile';
const defaultFSSServerOptions = {
    port: 9998,
    defaultDirectory: '',
};
export class Server {
    options;
    server;
    webSockets = new Set();
    constructor(options = {}) {
        this.options = { ...defaultFSSServerOptions, ...options };
        this.server = new WebSocketServer({ ...this.options.webSocketServerOptions, port: this.options.port });
        this.server.on('connection', (ws) => {
            ws.directory = this.options.defaultDirectory;
            ws.authenticated = false;
            this.webSockets.add(ws);
            if (this.options.debug)
                console.log('Websocket connected');
            ws.on('message', (data, isBinary) => {
                const message = JSON.parse(data.toString());
                if (this.options.debug) {
                    console.log(`Received message from websocket of type ${message.type}`);
                }
                this.handleMessage(ws, message);
            });
            ws.on('error', (e) => console.warn(`Websocket error: ${e.message}`));
        });
    }
    handleMessage(ws, message) {
        if (message.type === 'fss-login') {
            if (this.options.authenticate) {
                const authenticatedOrDirectory = this.options.authenticate(message);
                if (authenticatedOrDirectory === false) {
                    ws.close();
                    this.webSockets.delete(ws);
                    if (this.options.debug) {
                        console.log(`Websocket closed because of a failed authentication`);
                    }
                }
                else {
                    ws.directory = authenticatedOrDirectory;
                    ws.authenticated = true;
                    if (this.options.debug) {
                        console.log(`Websocket properly authenticated and ready`);
                    }
                    ws.send(JSON.stringify({
                        type: 'fss-login',
                        results: true,
                    }));
                }
            }
            else {
                ws.authenticated = true;
                if (this.options.debug) {
                    console.log(`Websocket properly authenticated and ready`);
                }
                ws.send(JSON.stringify({
                    type: 'fss-login',
                    results: true,
                }));
            }
            return;
        }
        if (!ws.authenticated) {
            console.log('Received a message from an authenticated websocket');
            return;
        }
        switch (message.type) {
            case 'fss-dir':
                dir(ws, message, !!this.options.debug);
                break;
            case 'fss-readFile':
                readFile(ws, message, !!this.options.debug);
                break;
            case 'fss-exists':
                exists(ws, message, !!this.options.debug);
                break;
            case 'fss-writeFile':
                writeFile(ws, message, !!this.options.debug);
                break;
            default:
                if (this.options.handleOtherMessages) {
                    this.options.handleOtherMessages(ws, message);
                    if (this.options.debug) {
                        console.log(`Client message ${message.type} sent to user for handling`);
                    }
                }
                else {
                    if (this.options.debug) {
                        console.warn(`Unknown client message received: ${message.type}`);
                    }
                }
        }
    }
}
