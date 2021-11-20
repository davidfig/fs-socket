import { Server } from '../lib/server'
import { SocketMessageLogin } from '../lib/types'

async function start() {
    new Server({
        debug: true,
        authenticate: (data: SocketMessageLogin) => {
            return data.key === 'this is a nice key...' ? '' : false
        }
    })
    console.log('fs-socket test server started...')
}

start()