import { initialize } from "../../lib/esm/index";

function fact(n) {
    return n < 1 ? 1 : fact(n - 1) * n
}

async function times(a, b) {
    return a * b
}

initialize(self, "webworker", [{
    moduleId: "demo",
    module: { fact, times }
}])