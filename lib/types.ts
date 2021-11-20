export type FSSErrors =
    'FSSClient is not ready' |
    ''

export interface SocketMessageType {
    type: string
}

export interface SocketMessageLogin extends SocketMessageType {
    type: 'fss-login'
    key?: string
    results?: boolean
}

export interface SocketMessageDir extends SocketMessageType {
    type: 'fss-dir'
    id: string
    directory: string
    recursive?: boolean
    files?: []
    directories?: []
    error?: FSSErrors
}

export interface SocketMessageReadFile extends SocketMessageType {
    type: 'fss-readFile'
    id: string
    file: string
    fileType: 'binary' | 'json' | 'text'
    data?: string
    error?: FSSErrors
}

export interface SocketMessageExists extends SocketMessageType {
    type: 'fss-exists'
    id: string
    file: string
    error?: FSSErrors
    exists?: boolean
}

export interface SocketMessageWriteFile extends SocketMessageType {
    type: 'fss-writeFile'
    id: string
    file: string
    data: any
    error?: FSSErrors
}