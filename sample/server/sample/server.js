import { Server } from '../lib/server/server';
async function start() {
    new Server({
        debug: true,
        authenticate: (data) => {
            return data.key === 'this is a nice key...' ? '' : false;
        }
    });
    console.log('fs-socket test server started...');
}
start();
