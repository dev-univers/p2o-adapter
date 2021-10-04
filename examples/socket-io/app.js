import { initializeWeb } from "../../lib/esm/index"
import "./node_modules/socket.io-client/dist/socket.io"

let ws = io();

(async _ => {
    let proxy = await initializeWeb(ws, "socket.io")

    console.log(await proxy.fs.readdirSync("/"))
})()