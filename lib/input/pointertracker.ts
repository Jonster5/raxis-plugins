import { Vec2 } from 'raxis/math';

export class PointerTracker {
	isDown: boolean;
	isUp: boolean;

	leftIsDown: boolean;
	leftIsUp: boolean;
	rightIsDown: boolean;
	rightIsUp: boolean;
	midIsDown: boolean;
	midIsUp: boolean;

	pos: Vec2;
	last: Vec2;
	delta: Vec2;

	ray: {
		pos: Vec2;
		last: Vec2;
		delta: Vec2;
	};

	private md: (e: PointerEvent) => void;
	private mu: (e: PointerEvent) => void;
	private mm: (e: PointerEvent) => void;

	constructor() {
		this.isDown = false;
		this.isUp = true;

		this.leftIsDown = false;
		this.leftIsUp = true;
		this.rightIsDown = false;
		this.rightIsUp = true;
		this.midIsDown = false;
		this.midIsUp = true;

		this.pos = new Vec2(0, 0);
		this.last = new Vec2(0, 0);
		this.delta = new Vec2(0, 0);

		this.ray = {
			pos: new Vec2(0, 0),
			last: new Vec2(0, 0),
			delta: new Vec2(0, 0),
		};

		this.md = this.onPointerDown.bind(this);
		this.mu = this.onPointerUp.bind(this);
		this.mm = this.onPointerMove.bind(this);

		window.addEventListener('pointerdown', this.md);
		window.addEventListener('pointerup', this.mu);
		window.addEventListener('pointermove', this.mm);
	}

	private onPointerDown(e: MouseEvent) {
		const button = e.button;

		this.isDown = true;
		this.isUp = false;

		if (button === 0) {
			this.leftIsDown = true;
			this.leftIsUp = false;
		} else if (button === 1) {
			this.midIsDown = true;
			this.midIsUp = false;
		} else if (button === 2) {
			this.rightIsDown = true;
			this.rightIsUp = false;
		}
	}

	private onPointerUp(e: MouseEvent) {
		const button = e.button;

		this.isDown = false;
		this.isUp = true;

		if (button === 0) {
			this.leftIsDown = false;
			this.leftIsUp = true;
		} else if (button === 1) {
			this.midIsDown = false;
			this.midIsUp = true;
		} else if (button === 2) {
			this.rightIsDown = false;
			this.rightIsUp = true;
		}
	}

	private onPointerMove(e: MouseEvent) {
		const { clientX, clientY } = e;

		this.pos.set(clientX, clientY);
	}
}
