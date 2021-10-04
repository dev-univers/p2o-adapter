import { DefaultPeerFactory, SocketIo, SuportedType } from "./defaultPeerFactory";
import { ModuleToShare, SimplePeerClient, SimplePeerServer } from "./simplePeer";

interface ReactNativeWebview {
    postMessage: (msg: any) => void,
    onMessage: (msg: any) => void
}

export function initialize(obj: any, type: SuportedType, moduleToShare: ModuleToShare[]) {

    const peerServer = new SimplePeerServer((msg: any) => {
        switch(type){
            case SuportedType.WEBSOCKET: return (obj as WebSocket).send(JSON.stringify(msg))
            case SuportedType.REACTWEBVIEW: return (obj as ReactNativeWebview).postMessage(JSON.stringify(msg))
            case SuportedType.WEBWORKER: return ((obj || self) as any).postMessage(msg)
            case SuportedType.SOCKETIO: return (obj as SocketIo).emit("p2p-event", JSON.stringify(msg))
        }
    }, host => moduleToShare);

    switch(type){
        case SuportedType.WEBSOCKET: return obj.on("message", (data: string)=>{
                try {
                    peerServer.onmessage(JSON.parse(data.toString()));
                } catch (err) {}
            })
        case SuportedType.REACTWEBVIEW: return (obj as ReactNativeWebview).onMessage = function(ev){
                try {
                    peerServer.onmessage(JSON.parse(ev.nativeEvent.data));
                } catch (err) {}
            }
        case SuportedType.WEBWORKER: return ((obj || self) as any).onmessage = (ev: MessageEvent)=>{
                peerServer.onmessage(ev.data);
            }
        case SuportedType.SOCKETIO: return (obj as SocketIo).on("p2p-event", (data: string)=>{
                try {
                    peerServer.onmessage(JSON.parse(data));
                } catch (err) {}
            })
    }
}

export async function initializeWeb(obj: any, type: SuportedType): Promise<any>{
    
    let App = await new Promise<SimplePeerClient<any,any>>((resolve, reject) => {
        if(type == SuportedType.WEBSOCKET) return obj.onopen = (_: any)=> resolve(new SimplePeerClient(new DefaultPeerFactory(obj),type,{})) 
        resolve(new SimplePeerClient(new DefaultPeerFactory(obj),type,{}))
    })

    return await App.getProxyObject()
}