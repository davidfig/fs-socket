import cuid from 'cuid'
import {
    FSSErrors,
    SocketMessageDir,
    SocketMessageExists,
    SocketMessageLogin,
    SocketMessageReadFile,
    SocketMessageType,
    SocketMessageWriteFile,
} from './types'

export interface FSSClientOptions {
    host?: string
    key?: string
    authenticate?: string
    onClose?: () => void
    onError?: (e: Event) => void
    debug?: boolean
}

const defaultFSSClientOptions = {
    host: 'ws://localhost:9998',
    key: '',
}

export interface dir {
    files?: string[]
    directories?: string[]
    error: FSSErrors
}

export class Client {
    connectionResolve: (results: boolean) => void
    options: FSSClientOptions
    ws: WebSocket
    ready: boolean
    waiting: {
        login?: (results: boolean) => void,
        directory: { [key: string]: (message: SocketMessageDir) => void },
        readFile: { [key: string]: (message: SocketMessageReadFile) => void }
        exists: { [key: string]: (message: SocketMessageExists) => void }
        writeFile: { [key: string]: (message: SocketMessageWriteFile) => void }
    } = {
            directory: {},
            readFile: {},
            exists: {},
            writeFile: {},
        }

    async connect(clientOptions: FSSClientOptions = {}): Promise<boolean> {
        return new Promise(resolve => {
            this.waiting.login = resolve
            this.options = { ...defaultFSSClientOptions, ...clientOptions }
            this.ws = new WebSocket(this.options.host)
            this.ws.addEventListener('open', () => {
                if (this.options.debug) {
                    console.log('WebSocket connection opened.')
                }
                this.ws.send(JSON.stringify({ type: 'fss-login', key: clientOptions.key }))
            })
            this.ws.addEventListener('message', (message: any) => {
                this.handleMessage(JSON.parse(message.data))
            })
            this.ws.addEventListener('close', () => {
                if (clientOptions.onClose) {
                    clientOptions.onClose()
                }
                if (this.waiting.login) {
                    this.waiting.login(false)
                    this.waiting.login = undefined
                }
                this.ready = false
            })
            this.ws.addEventListener('error', (e: Event) => {
                if (clientOptions.onError) {
                    clientOptions.onError(e)
                }
                if (this.options.debug) {
                    console.warn(e)
                }
            })
        })
    }

    handleMessage(message: SocketMessageType) {
        if (this.options.debug) {
            console.log(`Received message ${message.type} from server`)
        }
        if (message.type === 'fss-login') {
            if (this.waiting.login) {
                const results = (message as SocketMessageLogin).results
                this.ready = results
                if (this.options.debug) {
                    console.log(`Client login was ${results ? 'successful' : 'unsuccessful'}`)
                }
                this.waiting.login(results)
            }
        } else if (message.type === 'fss-dir') {
            const messageDir = message as SocketMessageDir
            this.waiting.directory[messageDir.id](messageDir)
        } else if (message.type === 'fss-readFile') {
            const file = message as SocketMessageReadFile
            this.waiting.readFile[file.id](file)
        } else if (message.type === 'fss-exists') {
            const exists = message as SocketMessageExists
            this.waiting.exists[exists.id](exists)
        } else if (message.type === 'fss-writeFile') {
            const write = message as SocketMessageWriteFile
            this.waiting.writeFile[write.id](write)
        } else {
            console.warn(`Received unknown message ${message.type} from server`)
        }
    }

    async directory(directory: string, recursive: boolean = true): Promise<SocketMessageDir> {
        if (!this.ready) {
            if (this.options.debug) {
                console.log('Tried to request directory when socket connection was not ready')
            }
            return {
                type: 'fss-dir',
                directory,
                recursive,
                id: '',
                error: 'FSSClient is not ready',
            }
        }
        return new Promise(resolve => {
            const id = cuid()
            this.ws.send(JSON.stringify({
                type: 'fss-dir',
                directory,
                recursive,
                id,
            } as SocketMessageDir))
            this.waiting.directory[id] = resolve
        })
    }

    async exists(file: string): Promise<SocketMessageExists> {
        if (!this.ready) {
            if (this.options.debug) {
                console.log('Tried to request directory when socket connection was not ready')
            }
            return {
                type: 'fss-exists',
                file,
                id: '',
                error: 'FSSClient is not ready',
            } as SocketMessageExists
        }
        return new Promise(resolve => {
            const id = cuid()
            this.ws.send(JSON.stringify({
                type: 'fss-exists',
                file,
                id
            } as SocketMessageExists))
            this.waiting.exists[id] = resolve
        })
    }

    async readFile(file: string, fileType: 'binary' | 'json' | 'text' = 'json'): Promise<SocketMessageReadFile> {
        if (!this.ready) {
            if (this.options.debug) {
                console.log('Tried to readFile when socket connection was not ready')
            }
            return {
                type: 'fss-readFile',
                id: '',
                file,
                fileType,
                error: 'FSSClient is not ready',
            }
        }
        return new Promise(resolve => {
            const id = cuid()
            this.ws.send(JSON.stringify({
                type: 'fss-readFile',
                file,
                fileType: fileType || 'json',
                id,
            } as SocketMessageReadFile))
            this.waiting.readFile[id] = resolve
        })
    }

    async writeFile(file: string, data: any): Promise<SocketMessageWriteFile> {
        if (!this.ready) {
            if (this.options.debug) {
                console.log('Tried to writeFile when socket connection was not ready')
            }
            return {
                type: 'fss-writeFile',
                id: '',
                file,
                data,
                error: 'FSSClient is not ready',
            }
        }
        return new Promise(resolve => {
            const id = cuid()
            this.ws.send(JSON.stringify({
                type: 'fss-writeFile',
                file,
                data,
                id,
            } as SocketMessageWriteFile))
            this.waiting.writeFile[id] = resolve
        })
    }
}