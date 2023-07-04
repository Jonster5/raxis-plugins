import { Component, Entity, ECS } from 'raxis';

export type SocketData<T = any> = { type: string; body: T };

export class SocketManager extends Component {
	constructor(public sockets: Map<string, Socket> = new Map()) {
		super();
	}

	onDestroy(): void {
		this.sockets.forEach((s) => s.close());
	}
}

export class Socket {
	connection: WebSocket;
	url: string;

	constructor(url: string) {
		this.connection = new WebSocket(url);
		this.url = url;
	}

	isOpen() {
		return this.connection.readyState === 1;
	}

	send(type: string, data: string) {
		if (this.connection.readyState !== 1) return;

		this.connection.send(JSON.stringify({ type, body: data }));
	}

	close(code?: number, reason?: string) {
		this.connection.close(code, reason);
	}

	onOpen(cb: (socket: this) => void) {
		this.connection.onopen = () => {
			cb(this);
		};

		return this;
	}

	onMessage(cb: (data: SocketData, socket: this) => void) {
		this.connection.onmessage = ({ data }) => {
			const { type, body } = JSON.parse(data) as SocketData;

			cb({ type, body }, this);
		};

		return this;
	}

	onClose(cb: (reason: string, clean: boolean, socket: this) => void) {
		this.connection.onclose = ({ reason, wasClean: clean }) => {
			cb(reason, clean, this);
		};

		return this;
	}

	onerror(cb: (socket: this) => void) {
		this.connection.onerror = () => {
			cb(this);
		};

		return this;
	}
}

export function addSocket(e: Entity, label: string, socket: Socket) {
	if (!e.has(SocketManager)) e.insert(new SocketManager());

	const sockets = e.get(SocketManager)!.sockets;

	if (sockets.has(label)) {
		console.warn(`Socket label [${label}] already exists`);
		return;
	}

	sockets.set(label, socket);

	return socket;
}

export function getSocket(e: Entity, label: string) {
	if (!e.has(SocketManager)) return;

	return e.get(SocketManager)!.sockets.get(label);
}

export function removeSocket(e: Entity, label: string) {
	if (!e.has(SocketManager)) return;

	e.get(SocketManager)!.sockets.delete(label);
}

export function SocketPlugin(ecs: ECS) {
	ecs.addComponentType(SocketManager);
}
