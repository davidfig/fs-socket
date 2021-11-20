import { Client } from '../../lib/client'

let client: Client

async function initWrongKey() {
    let s = '<div class="description">Initializing fs-socket with wrong key...</div>'
    s += '<div class="code">const client = new Client();</div>'
    client = new Client()
    const connected = await client.connect()
    if (connected) {
        s += '<div class="error">server accepted connection with wrong key</div>'
    } else {
        s += '<div class="server">server properly rejected connection with wrong key</div>'
    }
    return s
}

async function initCorrectKey() {
    let s = ''
    s += '<div class="description">Initializing fs-socket with correct key...</div>'
    s += '<div class="code">const client = new Client({ key: \'this is a nice key...\' });</div>'
    const connected = await client.connect({
        debug: true,
        key: "this is a nice key...",
    })
    if (connected) {
        s += '<div class="server">client successfully connected</div>'
    } else {
        s += '<div class="error">client did not successfully connect!</div>'
    }
    return s
}

async function directory() {
    let s = ''
    s += '<div class="description">recursive dir listing for "sample"...</div>'
    s += '<div class="code">client.directory(\'sample\', true);</div>'
    const dir = await client.directory('sample', true)
    s += '<div class="server">'
    for (const file of dir.files) {
        s += ` - ${file}<br>`
    }
    s += '</div>'
    return s
}

async function doesNotExist() {
    let s = ''
    s += '<div class="description">exists for "sample/does-not-exist...</div>'
    s += '<div class="code">client.exists(\'sample/does-not-exist\');</div>'
    const exists = await client.exists('sample/does-not-exist')
    s += `<div class="server">file ${exists.exists ? 'exists' : 'does not exist'}</div>`
    return s
}

async function exists() {
    let s = ''
    s += '<div class="description">exists for "sample/test.json...</div>'
    s += '<div class="code">client.exists(\'sample/test.json\');</div>'
    const exists = await client.exists('sample/test.json')
    s += `<div class="server">file ${exists.exists ? 'exists' : 'does not exist'}</div>`
    return s
}

async function readFileText() {
    let s = ''
    s += '<div class="description">readFile using text for "sample/server.ts...</div>'
    s += '<div class="code">client.readFile(\'sample/server.ts\', \'text\');</div>'
    const dir = await client.readFile('sample/server.ts', 'text')
    s += `<div class="server">${dir.data.substring(0, 30)}...</div>` +
        '</div>'
    return s
}

async function readFileJson() {
    let s = ''
    s += '<div class="description">readFile using json for "sample/test.json...</div>'
    s += '<div class="code">client.readFile(\'sample/test.json\', true);</div>'
    const dir = await client.readFile('sample/test.json', 'json')
    s += `<div class="server">${JSON.stringify(dir.data).substring(0, 30)}...</div>` +
        '</div>'
    return s
}

async function readFileBinary() {
    let s = ''
    s += '<div class="description">readFile using binary for "sample/test.json...</div>'
    s += '<div class="code">client.readFile(\'sample/test.json\', true);</div>'
    const dir = await client.readFile('sample/test.json', 'json')
    s += `<div class="server">${JSON.stringify(dir.data).substring(0, 30)}...</div>` +
        '</div>'
    return s
}

async function writeFile() {
    const r = Math.random()
    let s = ''
    s += '<div class="description">readFile using binary for "sample/test.json...</div>'
    s += `<div class="code">client.writeFile('sample/test.txt');</div>`
    s += `<div class="code">// this is a test file...${r}</div>`
    const write = await client.writeFile('sample/write-test.txt', `this is a text file...${r}`)
    if (write.error) {
        s += `<div class='server'>${write.error}</div>`
    } else {
        s += '<div class="server">File successfully written.</div>'
    }
    return s
}

async function start() {
    const s = await initWrongKey() +
        await initCorrectKey() +
        await directory() +
        await readFileText() +
        await readFileJson() +
        await readFileBinary() +
        await doesNotExist() +
        await exists() +
        await writeFile()
    document.querySelector('.results').innerHTML = s
}

window.onload = start