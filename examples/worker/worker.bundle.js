var SuportedType;
(function (SuportedType) {
    SuportedType["REACTWEBVIEW"] = "react-native";
    SuportedType["WEBSOCKET"] = "websocket";
    SuportedType["WEBWORKER"] = "webworker";
    SuportedType["SOCKETIO"] = "socket.io";
})(SuportedType || (SuportedType = {}));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var Iterable;
(function (Iterable) {
    function is(thing) {
        return thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function';
    }
    Iterable.is = is;
    const _empty = Object.freeze([]);
    function empty() {
        return _empty;
    }
    Iterable.empty = empty;
    function* single(element) {
        yield element;
    }
    Iterable.single = single;
    function from(iterable) {
        return iterable || _empty;
    }
    Iterable.from = from;
    function isEmpty(iterable) {
        return !iterable || iterable[Symbol.iterator]().next().done === true;
    }
    Iterable.isEmpty = isEmpty;
    function first(iterable) {
        return iterable[Symbol.iterator]().next().value;
    }
    Iterable.first = first;
    function some(iterable, predicate) {
        for (const element of iterable) {
            if (predicate(element)) {
                return true;
            }
        }
        return false;
    }
    Iterable.some = some;
    function find(iterable, predicate) {
        for (const element of iterable) {
            if (predicate(element)) {
                return element;
            }
        }
        return undefined;
    }
    Iterable.find = find;
    function* filter(iterable, predicate) {
        for (const element of iterable) {
            if (predicate(element)) {
                yield element;
            }
        }
    }
    Iterable.filter = filter;
    function* map(iterable, fn) {
        let index = 0;
        for (const element of iterable) {
            yield fn(element, index++);
        }
    }
    Iterable.map = map;
    function* concat(...iterables) {
        for (const iterable of iterables) {
            for (const element of iterable) {
                yield element;
            }
        }
    }
    Iterable.concat = concat;
    function* concatNested(iterables) {
        for (const iterable of iterables) {
            for (const element of iterable) {
                yield element;
            }
        }
    }
    Iterable.concatNested = concatNested;
    function reduce(iterable, reducer, initialValue) {
        let value = initialValue;
        for (const element of iterable) {
            value = reducer(value, element);
        }
        return value;
    }
    Iterable.reduce = reduce;
    /**
     * Returns an iterable slice of the array, with the same semantics as `array.slice()`.
     */
    function* slice(arr, from, to = arr.length) {
        if (from < 0) {
            from += arr.length;
        }
        if (to < 0) {
            to += arr.length;
        }
        else if (to > arr.length) {
            to = arr.length;
        }
        for (; from < to; from++) {
            yield arr[from];
        }
    }
    Iterable.slice = slice;
    /**
     * Consumes `atMost` elements from iterable and returns the consumed elements,
     * and an iterable for the rest of the elements.
     */
    function consume(iterable, atMost = Number.POSITIVE_INFINITY) {
        const consumed = [];
        if (atMost === 0) {
            return [consumed, iterable];
        }
        const iterator = iterable[Symbol.iterator]();
        for (let i = 0; i < atMost; i++) {
            const next = iterator.next();
            if (next.done) {
                return [consumed, Iterable.empty()];
            }
            consumed.push(next.value);
        }
        return [consumed, { [Symbol.iterator]() { return iterator; } }];
    }
    Iterable.consume = consume;
    /**
     * Returns whether the iterables are the same length and all items are
     * equal using the comparator function.
     */
    function equals(a, b, comparator = (at, bt) => at === bt) {
        const ai = a[Symbol.iterator]();
        const bi = b[Symbol.iterator]();
        while (true) {
            const an = ai.next();
            const bn = bi.next();
            if (an.done !== bn.done) {
                return false;
            }
            else if (an.done) {
                return true;
            }
            else if (!comparator(an.value, bn.value)) {
                return false;
            }
        }
    }
    Iterable.equals = equals;
})(Iterable || (Iterable = {}));

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.freeze({ dispose() { } });

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function getAllPropertyNames(obj) {
    let res = [];
    let proto = Object.getPrototypeOf(obj);
    while (Object.prototype !== proto) {
        res = res.concat(Object.getOwnPropertyNames(proto));
        proto = Object.getPrototypeOf(proto);
    }
    return res;
}
function getAllMethodNames(obj) {
    const methods = [];
    for (const prop of getAllPropertyNames(obj)) {
        if (typeof obj[prop] === 'function') {
            methods.push(prop);
        }
    }
    return !methods.length ? dangerouslyGetAllMethodNames(obj) : methods;
}
function dangerouslyGetAllMethodNames(obj) {
    const methods = [];
    for (const prop in obj) {
        if (typeof obj[prop] === 'function') {
            methods.push(prop);
        }
    }
    return methods;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function transformErrorForSerialization(error) {
    if (error instanceof Error) {
        let { name, message } = error;
        const stack = error.stacktrace || error.stack;
        return {
            $isError: true,
            name,
            message,
            stack
        };
    }
    // return as is
    return error;
}

class Protocol {
    constructor(handler) {
        this._protoId = -1;
        this._handler = handler;
        this._lastSentReq = 0;
        this._pendingReplies = Object.create(null);
    }
    setProtoId(protoId) {
        this._protoId = Number(protoId);
    }
    sendMessage(moduleId, method, args) {
        let req = String(++this._lastSentReq);
        return new Promise((resolve, reject) => {
            this._pendingReplies[req] = {
                resolve: resolve,
                reject: reject
            };
            this._send({
                proto: this._protoId,
                req: req,
                moduleId,
                method: method,
                args: args
            });
        });
    }
    handleMessage(message) {
        message.proto = Number(message.proto);
        if (!message || !message.proto) {
            return;
        }
        if (this._protoId !== -1 && message.proto !== this._protoId) {
            return;
        }
        this._handleMessage(message);
    }
    _handleMessage(msg) {
        if (msg.seq) {
            let replyMessage = msg;
            if (!this._pendingReplies[replyMessage.seq]) {
                console.warn('Got reply to unknown seq');
                return;
            }
            let reply = this._pendingReplies[replyMessage.seq];
            delete this._pendingReplies[replyMessage.seq];
            if (replyMessage.err) {
                let err = replyMessage.err;
                if (replyMessage.err.$isError) {
                    err = new Error();
                    err.name = replyMessage.err.name;
                    err.message = replyMessage.err.message;
                    err.stack = replyMessage.err.stack;
                }
                reply.reject(err);
                return;
            }
            reply.resolve(replyMessage.res);
            return;
        }
        let requestMessage = msg;
        let req = requestMessage.req;
        let result = this._handler.handleMessage(requestMessage.moduleId, requestMessage.method, requestMessage.args);
        result.then((r) => {
            this._send({
                proto: this._protoId,
                seq: req,
                res: r,
                err: undefined
            });
        }, (e) => {
            if (e.detail instanceof Error) {
                // Loading errors have a detail property that points to the actual error
                e.detail = transformErrorForSerialization(e.detail);
            }
            this._send({
                proto: this._protoId,
                seq: req,
                res: undefined,
                err: transformErrorForSerialization(e)
            });
        });
    }
    _send(msg) {
        let transfer = [];
        if (msg.req) {
            const m = msg;
            for (let i = 0; i < m.args.length; i++) {
                if (m.args[i] instanceof ArrayBuffer) {
                    transfer.push(m.args[i]);
                }
            }
        }
        else {
            const m = msg;
            if (m.res instanceof ArrayBuffer) {
                transfer.push(m.res);
            }
        }
        this._handler.sendMessage(msg, transfer);
    }
}

const INITIALIZE = '$initialize';
class SimplePeerServer {
    constructor(postMessage, requestHandlerFactory) {
        this._modulesToShare = requestHandlerFactory(null);
        this._protocol = new Protocol({
            sendMessage: (msg, transfer) => {
                postMessage(msg, transfer);
            },
            handleMessage: (moduleId, method, args) => this._handleMessage(moduleId, method, args)
        });
    }
    onmessage(msg) {
        this._protocol.handleMessage(msg);
    }
    _handleMessage(moduleId, method, args) {
        var _a;
        if (moduleId === INITIALIZE) {
            return this.initialize(method);
        }
        this._module = (_a = (this._modulesToShare || []).filter(m => m.moduleId == moduleId)[0]) === null || _a === void 0 ? void 0 : _a.module;
        if (!this._module || typeof this._module[method] !== 'function') {
            return Promise.reject(new Error('Missing module ' + moduleId + ' or method: ' + method));
        }
        try {
            return Promise.resolve(this._module[method].apply(this._module, args));
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    initialize(protoId) {
        this._protocol.setProtoId(protoId);
        if (this._modulesToShare) {
            // static request handler
            this._sharedModules = this._modulesToShare.map(({ module, moduleId, methods, properties, shareProperties }) => ({
                methods: methods || getAllMethodNames(module),
                properties: shareProperties ? properties || getAllPropertyNames(module) : void 0,
                moduleId,
                shareProperties
            }));
            return Promise.resolve(this._sharedModules);
        }
        return Promise.reject('unexpected usage');
    }
}

(undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function initialize(obj, type, moduleToShare) {
    const peerServer = new SimplePeerServer((msg) => {
        switch (type) {
            case SuportedType.WEBSOCKET: return obj.send(JSON.stringify(msg));
            case SuportedType.REACTWEBVIEW: return obj.postMessage(JSON.stringify(msg));
            case SuportedType.WEBWORKER: return (obj || self).postMessage(msg);
            case SuportedType.SOCKETIO: return obj.emit("p2p-event", JSON.stringify(msg));
        }
    }, host => moduleToShare);
    switch (type) {
        case SuportedType.WEBSOCKET: return obj.on("message", (data) => {
            try {
                peerServer.onmessage(JSON.parse(data.toString()));
            }
            catch (err) { }
        });
        case SuportedType.REACTWEBVIEW: return obj.onMessage = function (ev) {
            try {
                peerServer.onmessage(JSON.parse(ev.nativeEvent.data));
            }
            catch (err) { }
        };
        case SuportedType.WEBWORKER: return (obj || self).onmessage = (ev) => {
            peerServer.onmessage(ev.data);
        };
        case SuportedType.SOCKETIO: return obj.on("p2p-event", (data) => {
            try {
                peerServer.onmessage(JSON.parse(data));
            }
            catch (err) { }
        });
    }
}

function fact(n) {
    return n < 1 ? 1 : fact(n - 1) * n
}

async function times(a, b) {
    return a * b
}

initialize(self, "webworker", [{
    moduleId: "demo",
    module: { fact, times }
}]);
