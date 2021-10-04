import { IPeerCallback, IPeerFactory } from "./simplePeer";

export interface WorkerLike {
    addEventListener: any;
    postMessage: (msg: any, transfer?: Transferable[]) => void;
    onmessage: (ev: { data: any }) => void;
    onmessageerror: (err: any) => void;
    terminate: () => void
}

export enum SuportedType{
    REACTWEBVIEW = "react-native",
    WEBSOCKET = "websocket",
    WEBWORKER = "webworker",
    SOCKETIO = "socket.io"
}

interface ReactNativeWebview {
    postMessage: (msg: any) => void
}

export interface SocketIo{
    emit: (name: "p2p-event", data: string) => void;
    on: (name: "p2p-event", callback: (data: string)=>void) => void;
}

/**
 * transform the initial object to get a workerLike peer
 * 
 * @param {SuportedType} type the type of baseObject ( websocket | webworker | socket.io | react-native  )
 * @param {Worker | SocketIo | WebSocket | ReactNativeWebview } baseObject the initial object on which we want to listen (window.ReactNativeWebview in case of react-native)
 */
function getPeer(type: SuportedType, baseObject: Worker | SocketIo | WebSocket | ReactNativeWebview): WorkerLike {
    
    if(type == SuportedType.WEBWORKER) return baseObject as WorkerLike
    
    let peer: WorkerLike = Object.create(null)
    peer.onmessage = console.log

    if (type == SuportedType.WEBSOCKET) {

        peer.postMessage = function (msg, transfer) {
            if ([(baseObject as WebSocket).CLOSED, (baseObject as WebSocket).CLOSING].includes((baseObject as WebSocket).readyState)) { return peer.terminate() }
            (baseObject as WebSocket).send(JSON.stringify(msg))
        };

        (baseObject as WebSocket).onmessage = (ev) => {
            peer.onmessage({ data: JSON.parse(ev.data) })
        }

        peer.terminate = function () {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); }
            (baseObject as WebSocket).close()
        };

        (baseObject as WebSocket).onclose = function () {
            peer.terminate()
        }
    } else if (type == SuportedType.REACTWEBVIEW) {
        peer.postMessage = function (msg, transfer) {
            (baseObject as ReactNativeWebview).postMessage(JSON.stringify(msg))
        }

        function onReceive(ev: MessageEvent) {
            peer.onmessage({ data: JSON.parse(ev.data) })
        }
        //@ts-ignore
        document.addEventListener("message", onReceive, false)

        peer.terminate = function () {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); }
            //@ts-ignore
            document.removeEventListener("message", onReceive)
        }
    } else if (type == SuportedType.SOCKETIO) {

        peer.postMessage = function (msg, transfer) {
            (baseObject as SocketIo).emit('p2p-event',JSON.stringify(msg))
        };

        (baseObject as SocketIo).on("p2p-event", data => {
            peer.onmessage({ data: JSON.parse(data) })
        })

        peer.terminate = function () {
            peer.postMessage = () => { throw new Error("can't postMessage on terminated peer "); }
            
        };

    } else {
        throw new Error("Unsuported type " + type + " .");
    }
    return peer
}

/**
 * The Peer object for the communication 
 */
class Peer {
    private id: number
    private peer: Promise<WorkerLike> | null
    /**
     * 
     * @param {SuportedType} type the type of baseObject ( websocket | webworker | socket.io | react-native  )
     * @param {number} id an unique id of the peer
     * @param {Worker | SocketIo | WebSocket | ReactNativeWebview } baseObject the initial object on which we want to listen (window.ReactNativeWebview in case of react-native) 
     * @param {IPeerCallback} onMessageCallback the function to call when the peer will receive a message
     * @param {Function} onErrorCallback call when the peer reiceve an error mesage
     */
    constructor(type: SuportedType, id: number, baseObject: WebSocket | ReactNativeWebview, onMessageCallback: IPeerCallback, onErrorCallback: (err: any) => void) {
        this.id = id;
        this.peer = Promise.resolve(getPeer(type, baseObject));

        this.peer.then((w) => {
            w.onmessage = function (ev) {
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
    public getId(): number {
        return this.id;
    }

    /**
     * Clones message and transmits it to another peer. transfer can be passed as a list of objects that are to be transferred rather than cloned.
     */
    public postMessage(message: any, transfer: Transferable[]): void {
        if (this.peer) {
            this.peer.then(w => w.postMessage(message, transfer));
        }
    }

    /**
     * delete and close the comunication with other peers
     */
    public dispose(): void {
        if (this.peer) {
            this.peer.then(w => w.terminate());
        }
        this.peer = null;
    }
}

export class DefaultPeerFactory implements IPeerFactory {

    private static LAST_WORKER_ID = 0;

    private _baseObject: WebSocket | ReactNativeWebview;
    private _webWorkerFailedBeforeError: any;

    constructor(baseObject: WebSocket | ReactNativeWebview) {
        this._baseObject = baseObject;
        this._webWorkerFailedBeforeError = false;
    }

    public create(type: SuportedType, onMessageCallback: IPeerCallback, onErrorCallback: (err: any) => void): Peer {
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