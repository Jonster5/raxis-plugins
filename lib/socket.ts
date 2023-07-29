import { ECS, ECSEvent, EventWriter, Resource } from 'raxis';

export type SocketData = { type: string; body: ArrayBuffer };

export class SocketManager extends Resource {
	constructor(public sockets: Map<string, Socket> = new Map()) {
		super();
	}

	onDestroy(): void {
		this.sockets.forEach((s) => s.close());
	}
}

export class SocketOpenEvent extends ECSEvent {
	constructor(public socket: Socket) {
		super();
	}

	clone() {
		return new SocketOpenEvent(this.socket);
	}
}

export class SocketMessageEvent extends ECSEvent {
	constructor(public type: string, public body: ArrayBufferLike, public socket: Socket) {
		super();
	}

	clone() {
		return new SocketMessageEvent(this.type, structuredClone(this.body), this.socket);
	}
}

export class SocketCloseEvent extends ECSEvent {
	constructor(public reason: string, public clean: boolean, public socket: Socket) {
		super();
	}

	clone() {
		return new SocketCloseEvent(this.reason, this.clean, this.socket);
	}
}

export class SocketErrorEvent extends ECSEvent {
	constructor(public socket: Socket) {
		super();
	}

	clone() {
		return new SocketErrorEvent(this.socket);
	}
}

export class Socket {
	connection: WebSocket;

	constructor(
		private soe: EventWriter<SocketOpenEvent>,
		private sme: EventWriter<SocketMessageEvent>,
		private sce: EventWriter<SocketCloseEvent>,
		private see: EventWriter<SocketErrorEvent>,
		readonly label: string,
		readonly url: string
	) {
		this.connection = new WebSocket(url);
		this.connection.binaryType = 'arraybuffer';

		this.connection.onopen = () => {
			this.soe.send(new SocketOpenEvent(this));
		};

		this.connection.onmessage = ({ data }: { data: ArrayBuffer }) => {
			const length = new Uint8Array(data)[0];
			const type = new TextDecoder().decode(data.slice(1, 1 + length));
			const body = data.slice(1 + length);

			this.sme.send(new SocketMessageEvent(type, body, this));
		};

		this.connection.onclose = ({ reason, wasClean }) => {
			this.sce.send(new SocketCloseEvent(reason, wasClean, this));
		};

		this.connection.onerror = () => {
			this.see.send(new SocketErrorEvent(this));
		};
	}

	isOpen() {
		return this.connection.readyState === 1;
	}

	send(type: string, data: ArrayBufferLike) {
		if (this.connection.readyState !== 1) return;

		const length = new Uint8Array([type.length]);
		const text = new TextEncoder().encode(type);
		const message = new Uint8Array(length.byteLength + text.byteLength + data.byteLength);

		message.set(length, 0);
		message.set(text, length.byteLength);
		message.set(new Uint8Array(data), length.byteLength + text.byteLength);

		this.connection.send(message.buffer);
	}

	close(code?: number, reason?: string) {
		this.connection.close(code, reason);
	}
}

export function createSocket(ecs: ECS, label: string, url: string) {
	const sockets = ecs.getResource(SocketManager)!.sockets;

	if (sockets.has(label)) {
		console.warn(`Socket label [${label}] already exists`);
		return;
	}

	const socket = new Socket(
		ecs.getEventWriter(SocketOpenEvent),
		ecs.getEventWriter(SocketMessageEvent),
		ecs.getEventWriter(SocketCloseEvent),
		ecs.getEventWriter(SocketErrorEvent),
		label,
		url
	);

	sockets.set(label, socket);

	return socket;
}

export function encodeString(str: string): ArrayBuffer {
	return new TextEncoder().encode(str).buffer;
}

export function decodeString(buffer: ArrayBuffer): string {
	return new TextDecoder().decode(buffer);
}

export function stitch(...buffers: ArrayBuffer[]): ArrayBuffer {
	const message = new Uint8Array(2 + buffers.length * 2 + buffers.reduce((a, b) => a + b.byteLength, 0));

	const hlength = new Uint16Array([buffers.length]).buffer;
	const psizes = new Uint16Array(buffers.map((b) => b.byteLength)).buffer;

	message.set(new Uint8Array(hlength), 0);
	message.set(new Uint8Array(psizes), 2);

	let offset = hlength.byteLength + psizes.byteLength;
	for (let i = 0; i < buffers.length; i++) {
		message.set(new Uint8Array(buffers[i]), offset);
		offset += buffers[i].byteLength;
	}

	return message.buffer;
}

export function unstitch(buffer: ArrayBuffer): ArrayBuffer[] {
	const hlength = new Uint16Array(buffer)[0];
	const psizes = new Uint16Array(buffer.slice(2, 2 + hlength * 2));

	const data = new Array(psizes.length);

	let offset = 2 + hlength * 2;
	for (let i = 0; i < psizes.length; i++) {
		data[i] = buffer.slice(offset, (offset += psizes[i]));
	}

	return data;
}

export function getSocket(ecs: ECS, label: string) {
	return ecs.getResource(SocketManager)!.sockets.get(label);
}

export function removeSocket(ecs: ECS, label: string) {
	ecs.getResource(SocketManager)!.sockets.delete(label);
}

export function SocketPlugin(ecs: ECS) {
	ecs.insertResource(new SocketManager()).addEventTypes(
		SocketOpenEvent,
		SocketMessageEvent,
		SocketCloseEvent,
		SocketErrorEvent
	);
}
