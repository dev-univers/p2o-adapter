import { initializeWeb } from "../../lib/esm/index"

const wk = new Worker("./worker.bundle.js");

(async _ => {
    let proxy = await initializeWeb(wk, "webworker")

    console.log(await proxy.demo.fact(5))
})()