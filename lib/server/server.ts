import { WebSocketServer, ServerOptions, WebSocket, RawData } from 'ws'
import { dir } from './dir'
import { exists } from './exists'
import { readFile } from './readFile'
import {
    SocketMessageLogin,
    SocketMessageType,
    SocketMessageDir,
    SocketMessageReadFile,
    SocketMessageExists,
    SocketMessageWriteFile,
} from '../types'
import { writeFile } from './writeFile'

export interface FSSServerOptions {
    webSocketServerOptions?: ServerOptions
    port?: number
    defaultDirectory?: string
    authenticate?: (data: SocketMessageLogin) => string | false
    handleOtherMessages?: (ws: WebSocket, message: SocketMessageType) => void;
    debug?: boolean
}

const defaultFSSServerOptions: FSSServerOptions = {
    port: 9998,
    defaultDirectory: '',
}

export interface WebSocketUser extends WebSocket {
    authenticated: boolean
    directory?: string
}

export class Server {
    options: FSSServerOptions
    server: WebSocketServer
    webSockets = new Set<WebSocketUser>()

    constructor(options: FSSServerOptions = {}) {
        this.options = { ...defaultFSSServerOptions, ...options }
        this.server = new WebSocketServer({ ...this.options.webSocketServerOptions, port: this.options.port })
        this.server.on('connection', (ws: WebSocketUser) => {
            ws.directory = this.options.defaultDirectory
            ws.authenticated = false
            this.webSockets.add(ws)
            if (this.options.debug) console.log('Websocket connected')
            ws.on('message', (data: RawData, isBinary: boolean) => {
                const message = JSON.parse(data.toString()) as SocketMessageType
                if (this.options.debug) {
                    console.log(`Received message from websocket of type ${message.type}`)
                }
                this.handleMessage(ws, message)
            })
            ws.on('error', (e: Error) => console.warn(`Websocket error: ${e.message}`))
        })
        if (this.options.debug) {
            console.log(`fs-socket server listening on ${this.options.webSocketServerOptions?.host || 'http://localhost'}:${this.options.port}`)
        }
    }

    handleMessage(ws: WebSocketUser, message: SocketMessageType) {
        if (message.type === 'fss-login') {
            if (this.options.authenticate) {
                const authenticatedOrDirectory = this.options.authenticate(message as SocketMessageLogin)
                if (authenticatedOrDirectory === false) {
                    ws.close()
                    this.webSockets.delete(ws)
                    if (this.options.debug) {
                        console.log(`Websocket closed because of a failed authentication`)
                    }
                } else {
                    ws.directory = authenticatedOrDirectory
                    ws.authenticated = true
                    if (this.options.debug) {
                        console.log(`Websocket properly authenticated and ready`)
                    }
                    ws.send(JSON.stringify({
                        type: 'fss-login',
                        results: true,
                    } as SocketMessageLogin))
                }
            } else {
                ws.authenticated = true
                if (this.options.debug) {
                    console.log(`Websocket properly authenticated and ready`)
                }
                ws.send(JSON.stringify({
                    type: 'fss-login',
                    results: true,
                } as SocketMessageLogin))
            }
            return
        }
        if (!ws.authenticated) {
            console.log('Received a message from an authenticated websocket')
            return
        }
        switch (message.type) {
            case 'fss-dir':
                dir(ws, message as SocketMessageDir, !!this.options.debug)
                break

            case 'fss-readFile':
                readFile(ws, message as SocketMessageReadFile, !!this.options.debug)
                break

            case 'fss-exists':
                exists(ws, message as SocketMessageExists, !!this.options.debug)
                break

            case 'fss-writeFile':
                writeFile(ws, message as SocketMessageWriteFile, !!this.options.debug)
                break

            default:
                if (this.options.handleOtherMessages) {
                    this.options.handleOtherMessages(ws, message)
                    if (this.options.debug) {
                        console.log(`Client message ${message.type} sent to user for handling`)
                    }
                } else {
                    if (this.options.debug) {
                        console.warn(`Unknown client message received: ${message.type}`)
                    }
                }
        }
    }
}