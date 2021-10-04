var SuportedType;
(function(SuportedType) {
    SuportedType["REACTWEBVIEW"] = "react-native";
    SuportedType["WEBSOCKET"] = "websocket";
    SuportedType["WEBWORKER"] = "webworker";
    SuportedType["SOCKETIO"] = "socket.io";
})(SuportedType || (SuportedType = {}));
/**
 * transform the initial object to get a workerLike peer
 *
 * @param {SuportedType} type the type of baseObject ( websocket | webworker | socket.io | react-native  )
 * @param {Worker | SocketIo | WebSocket | ReactNativeWebview } baseObject the initial object on which we want to listen (window.ReactNativeWebview in case of react-native)
 */
function getPeer(type, baseObject) {
    if (type == SuportedType.WEBWORKER)
        return baseObject;
    let peer = Object.create(null);
    peer.onmessage = console.log;
    if (type == SuportedType.WEBSOCKET) {
        peer.postMessage = function(msg, transfer) {
            if ([baseObject.CLOSED, baseObject.CLOSING].includes(baseObject.readyState)) {
                return peer.terminate();
            }
            baseObject.send(JSON.stringify(msg));
        };
        baseObject.onmessage = (ev) => {
            peer.onmessage({ data: JSON.parse(ev.data) });
        };
        peer.terminate = function() {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); };
            baseObject.close();
        };
        baseObject.onclose = function() {
            peer.terminate();
        };
    } else if (type == SuportedType.REACTWEBVIEW) {
        peer.postMessage = function(msg, transfer) {
            baseObject.postMessage(JSON.stringify(msg));
        };

        function onReceive(ev) {
            peer.onmessage({ data: JSON.parse(ev.data) });
        }
        //@ts-ignore
        document.addEventListener("message", onReceive, false);
        peer.terminate = function() {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); };
            //@ts-ignore
            document.removeEventListener("message", onReceive);
        };
    } else if (type == SuportedType.SOCKETIO) {
        peer.postMessage = function(msg, transfer) {
            baseObject.emit('p2p-event', JSON.stringify(msg));
        };
        baseObject.on("p2p-event", data => {
            peer.onmessage({ data: JSON.parse(data) });
        });
        peer.terminate = function() {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); };
        };
    } else {
        throw new Error("Unsuported type " + type + " .");
    }
    return peer;
}
/**
 * The Peer object for the communication
 */
class Peer {
    /**
     *
     * @param {SuportedType} type the type of baseObject ( websocket | webworker | socket.io | react-native  )
     * @param {number} id an unique id of the peer
     * @param {Worker | SocketIo | WebSocket | ReactNativeWebview } baseObject the initial object on which we want to listen (window.ReactNativeWebview in case of react-native)
     * @param {IPeerCallback} onMessageCallback the function to call when the peer will receive a message
     * @param {Function} onErrorCallback call when the peer reiceve an error mesage
     */
    constructor(type, id, baseObject, onMessageCallback, onErrorCallback) {
            this.id = id;
            this.peer = Promise.resolve(getPeer(type, baseObject));
            this.peer.then((w) => {
                w.onmessage = function(ev) {
                    onMessageCallback(ev.data);
                };
                w.onmessageerror = onErrorCallback;
                if (typeof w.addEventListener === 'function') {
                    w.addEventListener('error', onErrorCallback);
                }
            });
        }
        /**
         * get the id of current peer
         * @returns {Number}
         */
    getId() {
            return this.id;
        }
        /**
         * Clones message and transmits it to another peer. transfer can be passed as a list of objects that are to be transferred rather than cloned.
         */
    postMessage(message, transfer) {
            if (this.peer) {
                this.peer.then(w => w.postMessage(message, transfer));
            }
        }
        /**
         * delete and close the comunication with other peers
         */
    dispose() {
        if (this.peer) {
            this.peer.then(w => w.terminate());
        }
        this.peer = null;
    }
}
class DefaultPeerFactory {
    constructor(baseObject) {
        this._baseObject = baseObject;
        this._webWorkerFailedBeforeError = false;
    }
    create(type, onMessageCallback, onErrorCallback) {
        let workerId = (++DefaultPeerFactory.LAST_WORKER_ID);
        if (this._webWorkerFailedBeforeError) {
            throw this._webWorkerFailedBeforeError;
        }
        return new Peer(type, workerId, this._baseObject, onMessageCallback, (err) => {
            this._webWorkerFailedBeforeError = err;
            onErrorCallback(err);
        });
    }
}
DefaultPeerFactory.LAST_WORKER_ID = 0;

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var Iterable;
(function(Iterable) {
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
        } else if (to > arr.length) {
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
        return [consumed, {
            [Symbol.iterator]() { return iterator; } }];
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
            } else if (an.done) {
                return true;
            } else if (!comparator(an.value, bn.value)) {
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
(undefined && undefined.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function(resolve) { resolve(value); }); }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }

        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }

        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function setParentOfDisposable(child, parent) {}
class MultiDisposeError extends Error {
    constructor(errors) {
        super(`Encountered errors while disposing of store. Errors: [${errors.join(', ')}]`);
        this.errors = errors;
    }
}

function dispose(arg) {
    if (Iterable.is(arg)) {
        let errors = [];
        for (const d of arg) {
            if (d) {
                try {
                    d.dispose();
                } catch (e) {
                    errors.push(e);
                }
            }
        }
        if (errors.length === 1) {
            throw errors[0];
        } else if (errors.length > 1) {
            throw new MultiDisposeError(errors);
        }
        return Array.isArray(arg) ? [] : arg;
    } else if (arg) {
        arg.dispose();
        return arg;
    }
}
class DisposableStore {
    constructor() {
            this._toDispose = new Set();
            this._isDisposed = false;
        }
        /**
         * Dispose of all registered disposables and mark this object as disposed.
         *
         * Any future disposables added to this object will be disposed of on `add`.
         */
    dispose() {
            if (this._isDisposed) {
                return;
            }
            this._isDisposed = true;
            this.clear();
        }
        /**
         * Dispose of all registered disposables but do not mark this object as disposed.
         */
    clear() {
        try {
            dispose(this._toDispose.values());
        } finally {
            this._toDispose.clear();
        }
    }
    add(o) {
        if (!o) {
            return o;
        }
        if (o === this) {
            throw new Error('Cannot register a disposable on itself!');
        }
        if (this._isDisposed) {
            if (!DisposableStore.DISABLE_DISPOSED_WARNING) {
                console.warn(new Error('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!').stack);
            }
        } else {
            this._toDispose.add(o);
        }
        return o;
    }
}
DisposableStore.DISABLE_DISPOSED_WARNING = false;
class Disposable {
    constructor() {
        this._store = new DisposableStore();
        setParentOfDisposable(this._store);
    }
    dispose() {
        this._store.dispose();
    }
    _register(o) {
        if (o === this) {
            throw new Error('Cannot register a disposable on itself!');
        }
        return this._store.add(o);
    }
}
Disposable.None = Object.freeze({ dispose() {} });

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function createProxyObject(moduleId, methodNames, invoke) {
    const createProxyMethod = (method) => {
        return function() {
            const args = Array.prototype.slice.call(arguments, 0);
            return invoke(moduleId, method, args);
        };
    };
    let result = {};
    for (const methodName of methodNames) {
        result[methodName] = createProxyMethod(methodName);
    }
    return result;
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
        } else {
            const m = msg;
            if (m.res instanceof ArrayBuffer) {
                transfer.push(m.res);
            }
        }
        this._handler.sendMessage(msg, transfer);
    }
}

const INITIALIZE = '$initialize';
class SimplePeerClient extends Disposable {
    constructor(peerFactory, type, host) {
        super();
        let lazyProxyReject = null;
        this._peer = this._register(peerFactory.create(type, (msg) => {
            this._protocol.handleMessage(msg);
        }, (err) => {
            // in Firefox, web workers fail lazily :(
            // we will reject the proxy
            if (lazyProxyReject) {
                lazyProxyReject(err);
            }
        }));
        this._protocol = new Protocol({
            sendMessage: (msg, transfer) => {
                this._peer.postMessage(msg, transfer);
            },
            handleMessage: (moduleId, method, args) => {
                return Promise.reject("support for the method coming soon");
            }
        });
        this._protocol.setProtoId(this._peer.getId());
        // Send initialize message
        this._onModuleLoaded = this._protocol.sendMessage(INITIALIZE, String(this._peer.getId()), []);
        // Create proxy to loaded code
        const proxyMethodRequest = (moduleId, method, args) => {
            return this._request(moduleId, method, args);
        };
        this._lazyProxy = new Promise((resolve, reject) => {
            lazyProxyReject = reject;
            this._onModuleLoaded.then((sharedModules) => {
                let proxy = Object.create(null);
                sharedModules.forEach(mod => {
                    proxy[mod.moduleId] = createProxyObject(mod.moduleId, mod.methods, proxyMethodRequest);
                });
                resolve(proxy);
            }, (e) => {
                reject(e);
                this._onError('Peer failed to load ', e);
            });
        });
    }
    getProxyObject() {
        return this._lazyProxy;
    }
    _request(moduleId, method, args) {
        return new Promise((resolve, reject) => {
            this._onModuleLoaded.then(() => {
                this._protocol.sendMessage(moduleId, method, args).then(resolve, reject);
            }, reject);
        });
    }
    _onError(message, error) {
        console.error(message);
        console.info(error);
    }
}

var __awaiter = (undefined && undefined.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function(resolve) { resolve(value); }); }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }

        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }

        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function initializeWeb(obj, type) {
    return __awaiter(this, void 0, void 0, function*() {
        let App = yield new Promise((resolve, reject) => {
            if (type == SuportedType.WEBSOCKET)
                return obj.onopen = (_) => resolve(new SimplePeerClient(new DefaultPeerFactory(obj), type, {}));
            resolve(new SimplePeerClient(new DefaultPeerFactory(obj), type, {}));
        });
        return yield App.getProxyObject();
    });
}

const wk = new Worker("./worker.bundle.js");

(async _ => {
    let proxy = await initializeWeb(wk, "webworker");

    console.log(await proxy.demo.fact(5));
})();