import {transformErrorForSerialization} from "./common/errors"

interface IMessage {
	proto: number;
	req?: string;
	seq?: string;
}

interface IRequestMessage extends IMessage {
	req: string;
    moduleId: string;
	method: string;
	args: any[];
}

interface IReplyMessage extends IMessage {
	seq: string;
	err: any;
	res: any;
}

interface IMessageReply {
	resolve: (value?: any) => void;
	reject: (error?: any) => void;
}

interface IMessageHandler {
	sendMessage(msg: any, transfer?: ArrayBuffer[]): void;
	handleMessage(moduleId:string, method: string, args: any[]): Promise<any>;
}

export default class Protocol{
    private _protoId: number;
	private _lastSentReq: number;
	private _pendingReplies: { [req: string]: IMessageReply; };
	private _handler: IMessageHandler;

    constructor(handler: IMessageHandler) {
		this._protoId = -1;
		this._handler = handler;
		this._lastSentReq = 0;
		this._pendingReplies = Object.create(null);
	}

    public setProtoId(protoId: number): void{
		this._protoId = Number(protoId);
	}

	public sendMessage(moduleId: string, method: string, args: any[]): Promise<any> {
		let req = String(++this._lastSentReq);
		
		return new Promise<any>((resolve, reject) => {
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
    
	public handleMessage(message: IMessage): void {
		
		message.proto = Number(message.proto)
		if (!message || !message.proto) {
			return;
		}
		if (this._protoId !== -1 && message.proto !== this._protoId) {
			
			return;
		}
		this._handleMessage(message);
	}
    
	private _handleMessage(msg: IMessage): void {
		
		if (msg.seq) {
			let replyMessage = <IReplyMessage>msg;
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

		let requestMessage = <IRequestMessage>msg;
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

    private _send(msg: IRequestMessage | IReplyMessage): void {
		let transfer: ArrayBuffer[] = [];
		if (msg.req) {
			const m = <IRequestMessage>msg;
			for (let i = 0; i < m.args.length; i++) {
				if (m.args[i] instanceof ArrayBuffer) {
					transfer.push(m.args[i]);
				}
			}
		} else {
			const m = <IReplyMessage>msg;
			if (m.res instanceof ArrayBuffer) {
				transfer.push(m.res);
			}
		}
		this._handler.sendMessage(msg, transfer);
	}
}