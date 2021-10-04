import { IDisposable , Disposable} from "./common/lifecycle";
import * as types from "./common/types"
import Protocol from "./protocol";

const INITIALIZE = '$initialize';

export interface IPeer extends IDisposable {
	getId(): number;
	postMessage(message: any, transfer: ArrayBuffer[]): void;
}

export interface IPeerCallback {
	(message: any): void;
}

export interface IPeerFactory {
	create(moduleId: string, callback: IPeerCallback, onErrorCallback: (err: any) => void): IPeer;
}

export interface IPeerClient<W> {
	getProxyObject(): Promise<W>;
	dispose(): void;
}

export interface ModuleToShare{
    moduleId: string;
    module: any;
	methods?: string[];
    properties?: string[]
    shareProperties?: boolean
}

export interface SharedModule{
    moduleId: string;
    shareProperties?: boolean;
    methods: string[];
    properties?: string[]
}

export class SimplePeerClient <W extends object, H extends object> extends Disposable implements IPeerClient<W> {
    
    private readonly _peer: IPeer;
	private readonly _onModuleLoaded: Promise<SharedModule[]>;
	private readonly _protocol: Protocol;
	private readonly _lazyProxy: Promise<W>;

    constructor(peerFactory: IPeerFactory, type: string, host: H) {
		super();

		let lazyProxyReject: ((err: any) => void) | null = null;

		this._peer = this._register(peerFactory.create(
			type,
			(msg: any) => {
				this._protocol.handleMessage(msg);
			},
			(err: any) => {
				// in Firefox, web workers fail lazily :(
				// we will reject the proxy
				if (lazyProxyReject) {
					lazyProxyReject(err);
				}
			}
		));

		this._protocol = new Protocol({
			sendMessage: (msg: any, transfer: ArrayBuffer[]): void => {
				this._peer.postMessage(msg, transfer);
			},
			handleMessage: (moduleId: string, method: string, args: any[]): Promise<any> => {
				return Promise.reject("support for the method coming soon")
			}
		});
		this._protocol.setProtoId(this._peer.getId());

		
		// Send initialize message
		this._onModuleLoaded = this._protocol.sendMessage(INITIALIZE,String(this._peer.getId()), []);

		// Create proxy to loaded code
		const proxyMethodRequest = (moduleId: string,method: string, args: any[]): Promise<any> => {
			return this._request(moduleId, method, args);
		};

		this._lazyProxy = new Promise<W>((resolve, reject) => {
			lazyProxyReject = reject;
			this._onModuleLoaded.then((sharedModules: SharedModule[]) => {
				let proxy = Object.create(null)
				sharedModules.forEach(mod=>{
					proxy[mod.moduleId] = types.createProxyObject(mod.moduleId,mod.methods,proxyMethodRequest)
				})
                resolve(proxy)
			}, (e) => {
				reject(e);
				this._onError('Peer failed to load ', e);
			});
		});
	}

	public getProxyObject(): Promise<W> {
		return this._lazyProxy;
	}

	private _request(moduleId: string, method: string, args: any[]): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			this._onModuleLoaded.then(() => {
				this._protocol.sendMessage(moduleId,method, args).then(resolve, reject);
			}, reject);
		});
	}

	private _onError(message: string, error?: any): void {
		console.error(message);
		console.info(error);
	}

}

export interface IRequestHandler {
	_requestHandlerBrand: any;
	[prop: string]: any;
}

export interface IRequestHandlerFactory<H> {
	(host: H): IRequestHandler;
}

export class SimplePeerServer {
    
    private _modulesToShare: ModuleToShare[] | null;
	private _protocol: Protocol;
	private _module: any
    //@ts-ignore
    private _sharedModules: SharedModule[]

    constructor(postMessage: (msg: any, transfer?: ArrayBuffer[]) => void, requestHandlerFactory: (host: any)=>(ModuleToShare[] | null)) {
		this._modulesToShare = requestHandlerFactory(null);
		this._protocol = new Protocol({
			sendMessage: (msg: any, transfer: ArrayBuffer[]): void => {
				postMessage(msg, transfer);
			},
			handleMessage: (moduleId:string, method: string, args: any[]): Promise<any> => this._handleMessage(moduleId,method, args)
		});

	}
    
	public onmessage(msg: any): void {
		
		this._protocol.handleMessage(msg);
	}

	private _handleMessage(moduleId: string, method: string, args: any[]): Promise<any> {
		if (moduleId === INITIALIZE) {
			return this.initialize(<number><unknown>method);
		}

		this._module = (this._modulesToShare||[]).filter(m=>m.moduleId == moduleId)[0]?.module

		if (!this._module || typeof this._module[method] !== 'function') {
			return Promise.reject(new Error('Missing module '+moduleId+' or method: ' + method));
		}

		try {
			return Promise.resolve(this._module[method].apply(this._module, args));
		} catch (e) {
			return Promise.reject(e);
		}
	}
    
	private initialize(protoId: number): Promise<SharedModule[]> {
		this._protocol.setProtoId(protoId);

		if (this._modulesToShare) {
			// static request handler
            this._sharedModules = this._modulesToShare.map(({module,moduleId, methods, properties, shareProperties})=>({
                methods: methods || types.getAllMethodNames(module),
                properties: shareProperties? properties || types.getAllPropertyNames(module):void 0,
                moduleId,
                shareProperties
            }))
            
			return Promise.resolve(this._sharedModules);
		}

        return Promise.reject('unexpected usage')
	}
}