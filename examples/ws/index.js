const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const { initialize } = require('../..');
const { parse } = require('url');
const { resolve } = require('path');

const server = createServer((req, res) => {

    let { pathname } = parse(req.url)
    if (pathname == "/app.bundle.js") {
        res.writeHead(200, { "content-type": "application/javascript" })
        return res.end(fs.readFileSync(resolve(__dirname, "./app.bundle.js")))
    }

    res.writeHead(200, { "content-type": "text/html" })
    res.end(fs.readFileSync(resolve(__dirname, "./index.html")))

});
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
    initialize(ws, "websocket", [{
        moduleId: "fs",
        module: fs
    }])
});

server.listen(8080, _ => console.log("demo is listening on http//localhost:8080"));