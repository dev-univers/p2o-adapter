import { initializeWeb } from "../../lib/esm/index"

let ws = new WebSocket("ws://localhost:8080");

(async _ => {
    let proxy = await initializeWeb(ws, "websocket")

    console.log(await proxy.fs.readdirSync("/"))
})()