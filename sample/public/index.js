(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
  };

  // node_modules/cuid/lib/pad.js
  var require_pad = __commonJS({
    "node_modules/cuid/lib/pad.js"(exports, module) {
      init_client();
      module.exports = function pad(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length - size);
      };
    }
  });

  // node_modules/cuid/lib/fingerprint.browser.js
  var require_fingerprint_browser = __commonJS({
    "node_modules/cuid/lib/fingerprint.browser.js"(exports, module) {
      init_client();
      var pad = require_pad();
      var env = typeof window === "object" ? window : self;
      var globalCount = Object.keys(env).length;
      var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
      var clientId = pad((mimeTypesLength + navigator.userAgent.length).toString(36) + globalCount.toString(36), 4);
      module.exports = function fingerprint() {
        return clientId;
      };
    }
  });

  // node_modules/cuid/lib/getRandomValue.browser.js
  var require_getRandomValue_browser = __commonJS({
    "node_modules/cuid/lib/getRandomValue.browser.js"(exports, module) {
      init_client();
      var getRandomValue;
      var crypto = typeof window !== "undefined" && (window.crypto || window.msCrypto) || typeof self !== "undefined" && self.crypto;
      if (crypto) {
        lim = Math.pow(2, 32) - 1;
        getRandomValue = function() {
          return Math.abs(crypto.getRandomValues(new Uint32Array(1))[0] / lim);
        };
      } else {
        getRandomValue = Math.random;
      }
      var lim;
      module.exports = getRandomValue;
    }
  });

  // node_modules/cuid/index.js
  var require_cuid = __commonJS({
    "node_modules/cuid/index.js"(exports, module) {
      init_client();
      var fingerprint = require_fingerprint_browser();
      var pad = require_pad();
      var getRandomValue = require_getRandomValue_browser();
      var c = 0;
      var blockSize = 4;
      var base = 36;
      var discreteValues = Math.pow(base, blockSize);
      function randomBlock() {
        return pad((getRandomValue() * discreteValues << 0).toString(base), blockSize);
      }
      function safeCounter() {
        c = c < discreteValues ? c : 0;
        c++;
        return c - 1;
      }
      function cuid2() {
        var letter = "c", timestamp = new Date().getTime().toString(base), counter = pad(safeCounter().toString(base), blockSize), print = fingerprint(), random = randomBlock() + randomBlock();
        return letter + timestamp + counter + print + random;
      }
      cuid2.slug = function slug() {
        var date = new Date().getTime().toString(36), counter = safeCounter().toString(36).slice(-4), print = fingerprint().slice(0, 1) + fingerprint().slice(-1), random = randomBlock().slice(-2);
        return date.slice(-2) + counter + print + random;
      };
      cuid2.isCuid = function isCuid(stringToCheck) {
        if (typeof stringToCheck !== "string")
          return false;
        if (stringToCheck.startsWith("c"))
          return true;
        return false;
      };
      cuid2.isSlug = function isSlug(stringToCheck) {
        if (typeof stringToCheck !== "string")
          return false;
        var stringLength = stringToCheck.length;
        if (stringLength >= 7 && stringLength <= 10)
          return true;
        return false;
      };
      cuid2.fingerprint = fingerprint;
      module.exports = cuid2;
    }
  });

  // lib/client.ts
  var import_cuid, defaultFSSClientOptions, Client;
  var init_client = __esm({
    "lib/client.ts"() {
      import_cuid = __toModule(require_cuid());
      defaultFSSClientOptions = {
        host: "ws://localhost:9998",
        key: ""
      };
      Client = class {
        constructor() {
          this.waiting = {
            directory: {},
            readFile: {},
            exists: {},
            writeFile: {}
          };
        }
        async connect(clientOptions = {}) {
          return new Promise((resolve) => {
            this.waiting.login = resolve;
            this.options = { ...defaultFSSClientOptions, ...clientOptions };
            this.ws = new WebSocket(this.options.host);
            this.ws.addEventListener("open", () => {
              if (this.options.debug) {
                console.log("WebSocket connection opened.");
              }
              this.ws.send(JSON.stringify({ type: "fss-login", key: clientOptions.key }));
            });
            this.ws.addEventListener("message", (message) => {
              this.handleMessage(JSON.parse(message.data));
            });
            this.ws.addEventListener("close", () => {
              if (clientOptions.onClose) {
                clientOptions.onClose();
              }
              if (this.waiting.login) {
                this.waiting.login(false);
                this.waiting.login = void 0;
              }
              this.ready = false;
            });
            this.ws.addEventListener("error", (e) => {
              if (clientOptions.onError) {
                clientOptions.onError(e);
              }
              if (this.options.debug) {
                console.warn(e);
              }
            });
          });
        }
        handleMessage(message) {
          if (this.options.debug) {
            console.log(`Received message ${message.type} from server`);
          }
          if (message.type === "fss-login") {
            if (this.waiting.login) {
              const results = message.results;
              this.ready = results;
              if (this.options.debug) {
                console.log(`Client login was ${results ? "successful" : "unsuccessful"}`);
              }
              this.waiting.login(results);
            }
          } else if (message.type === "fss-dir") {
            const messageDir = message;
            this.waiting.directory[messageDir.id](messageDir);
          } else if (message.type === "fss-readFile") {
            const file = message;
            this.waiting.readFile[file.id](file);
          } else if (message.type === "fss-exists") {
            const exists2 = message;
            this.waiting.exists[exists2.id](exists2);
          } else if (message.type === "fss-writeFile") {
            const write = message;
            this.waiting.writeFile[write.id](write);
          } else {
            console.warn(`Received unknown message ${message.type} from server`);
          }
        }
        async directory(directory2, recursive = true) {
          if (!this.ready) {
            if (this.options.debug) {
              console.log("Tried to request directory when socket connection was not ready");
            }
            return {
              type: "fss-dir",
              directory: directory2,
              recursive,
              id: "",
              error: "FSSClient is not ready"
            };
          }
          return new Promise((resolve) => {
            const id = (0, import_cuid.default)();
            this.ws.send(JSON.stringify({
              type: "fss-dir",
              directory: directory2,
              recursive,
              id
            }));
            this.waiting.directory[id] = resolve;
          });
        }
        async exists(file) {
          if (!this.ready) {
            if (this.options.debug) {
              console.log("Tried to request directory when socket connection was not ready");
            }
            return {
              type: "fss-exists",
              file,
              id: "",
              error: "FSSClient is not ready"
            };
          }
          return new Promise((resolve) => {
            const id = (0, import_cuid.default)();
            this.ws.send(JSON.stringify({
              type: "fss-exists",
              file,
              id
            }));
            this.waiting.exists[id] = resolve;
          });
        }
        async readFile(file, fileType = "json") {
          if (!this.ready) {
            if (this.options.debug) {
              console.log("Tried to readFile when socket connection was not ready");
            }
            return {
              type: "fss-readFile",
              id: "",
              file,
              fileType,
              error: "FSSClient is not ready"
            };
          }
          return new Promise((resolve) => {
            const id = (0, import_cuid.default)();
            this.ws.send(JSON.stringify({
              type: "fss-readFile",
              file,
              fileType: fileType || "json",
              id
            }));
            this.waiting.readFile[id] = resolve;
          });
        }
        async writeFile(file, data) {
          if (!this.ready) {
            if (this.options.debug) {
              console.log("Tried to writeFile when socket connection was not ready");
            }
            return {
              type: "fss-writeFile",
              id: "",
              file,
              data,
              error: "FSSClient is not ready"
            };
          }
          return new Promise((resolve) => {
            const id = (0, import_cuid.default)();
            this.ws.send(JSON.stringify({
              type: "fss-writeFile",
              file,
              data,
              id
            }));
            this.waiting.writeFile[id] = resolve;
          });
        }
      };
    }
  });

  // sample/client.ts
  init_client();
  init_client();
  var client;
  async function initWrongKey() {
    let s = '<div class="description">Initializing fs-socket with wrong key...</div>';
    s += '<div class="code">const client = new Client();</div>';
    client = new Client();
    const connected = await client.connect();
    if (connected) {
      s += '<div class="error">server accepted connection with wrong key</div>';
    } else {
      s += '<div class="server">server properly rejected connection with wrong key</div>';
    }
    return s;
  }
  async function initCorrectKey() {
    let s = "";
    s += '<div class="description">Initializing fs-socket with correct key...</div>';
    s += `<div class="code">const client = new Client({ key: 'this is a nice key...' });</div>`;
    const connected = await client.connect({
      debug: true,
      key: "this is a nice key..."
    });
    if (connected) {
      s += '<div class="server">client successfully connected</div>';
    } else {
      s += '<div class="error">client did not successfully connect!</div>';
    }
    return s;
  }
  async function directory() {
    let s = "";
    s += '<div class="description">recursive dir listing for "sample"...</div>';
    s += `<div class="code">client.directory('sample', true);</div>`;
    const dir = await client.directory("sample", true);
    s += '<div class="server">';
    for (const file of dir.files) {
      s += ` - ${file}<br>`;
    }
    s += "</div>";
    return s;
  }
  async function doesNotExist() {
    let s = "";
    s += '<div class="description">exists for "sample/does-not-exist...</div>';
    s += `<div class="code">client.exists('sample/does-not-exist');</div>`;
    const exists2 = await client.exists("sample/does-not-exist");
    s += `<div class="server">file ${exists2.exists ? "exists" : "does not exist"}</div>`;
    return s;
  }
  async function exists() {
    let s = "";
    s += '<div class="description">exists for "sample/test.json...</div>';
    s += `<div class="code">client.exists('sample/test.json');</div>`;
    const exists2 = await client.exists("sample/test.json");
    s += `<div class="server">file ${exists2.exists ? "exists" : "does not exist"}</div>`;
    return s;
  }
  async function readFileText() {
    let s = "";
    s += '<div class="description">readFile using text for "sample/server.ts...</div>';
    s += `<div class="code">client.readFile('sample/server.ts', 'text');</div>`;
    const dir = await client.readFile("sample/server.ts", "text");
    s += `<div class="server">${dir.data.substring(0, 30)}...</div></div>`;
    return s;
  }
  async function readFileJson() {
    let s = "";
    s += '<div class="description">readFile using json for "sample/test.json...</div>';
    s += `<div class="code">client.readFile('sample/test.json', true);</div>`;
    const dir = await client.readFile("sample/test.json", "json");
    s += `<div class="server">${JSON.stringify(dir.data).substring(0, 30)}...</div></div>`;
    return s;
  }
  async function readFileBinary() {
    let s = "";
    s += '<div class="description">readFile using binary for "sample/test.json...</div>';
    s += `<div class="code">client.readFile('sample/test.json', true);</div>`;
    const dir = await client.readFile("sample/test.json", "json");
    s += `<div class="server">${JSON.stringify(dir.data).substring(0, 30)}...</div></div>`;
    return s;
  }
  async function writeFile() {
    const r = Math.random();
    let s = "";
    s += '<div class="description">readFile using binary for "sample/test.json...</div>';
    s += `<div class="code">client.writeFile('sample/test.txt');</div>`;
    s += `<div class="code">// this is a test file...${r}</div>`;
    const write = await client.writeFile("sample/write-test.txt", `this is a text file...${r}`);
    if (write.error) {
      s += `<div class='server'>${write.error}</div>`;
    } else {
      s += '<div class="server">File successfully written.</div>';
    }
    return s;
  }
  async function start() {
    const s = await initWrongKey() + await initCorrectKey() + await directory() + await readFileText() + await readFileJson() + await readFileBinary() + await doesNotExist() + await exists() + await writeFile();
    document.querySelector(".results").innerHTML = s;
  }
  window.onload = start;
})();
//# sourceMappingURL=index.js.map
