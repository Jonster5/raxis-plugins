import { Vec2 } from 'raxis-ecs/math';

export class PointerTracker {
	leftIsDown: boolean;
	leftIsUp: boolean;
	rightIsDown: boolean;
	rightIsUp: boolean;
	midIsDown: boolean;
	midIsUp: boolean;

	pos: Vec2;
	last: Vec2;

	offset: Vec2;

	private oldc!: () => void;
	private oluc!: () => void;
	private ordc!: () => void;
	private oruc!: () => void;
	private omdc!: () => void;
	private omuc!: () => void;

	private md: (e: MouseEvent) => void;
	private mu: (e: MouseEvent) => void;
	private mm: (e: MouseEvent) => void;

	constructor() {
		this.leftIsDown = false;
		this.leftIsUp = true;
		this.rightIsDown = false;
		this.rightIsUp = true;
		this.midIsDown = false;
		this.midIsUp = true;

		this.pos = new Vec2(0, 0);
		this.last = new Vec2(0, 0);
		this.offset = new Vec2(0, 0);

		this.md = this.onMouseDown.bind(this);
		this.mu = this.onMouseUp.bind(this);
		this.mm = this.onMouseMove.bind(this);

		window.addEventListener('mousedown', this.md);
		window.addEventListener('mouseup', this.mu);
		window.addEventListener('mousemove', this.mm);

		window.addEventListener('contextmenu', this.ctm);
	}

	private ctm(e: Event) {
		e.preventDefault();
	}

	private onMouseDown(e: MouseEvent) {
		const button = e.button;

		if (button === 0) {
			this.leftIsDown = true;
			this.leftIsUp = false;

			if (this.oldc) this.oldc();
		} else if (button === 1) {
			this.midIsDown = true;
			this.midIsUp = false;

			if (this.omdc) this.omdc();
		} else if (button === 2) {
			this.rightIsDown = true;
			this.rightIsUp = false;

			if (this.ordc) this.ordc();
		}
	}

	private onMouseUp(e: MouseEvent) {
		const button = e.button;

		if (button === 0) {
			this.leftIsDown = false;
			this.leftIsUp = true;

			if (this.oluc) this.oluc();
		} else if (button === 1) {
			this.midIsDown = false;
			this.midIsUp = true;

			if (this.omuc) this.omuc();
		} else if (button === 2) {
			this.rightIsDown = false;
			this.rightIsUp = true;

			if (this.oruc) this.oruc();
		}
	}

	private onMouseMove(e: MouseEvent) {
		const { clientX, clientY } = e;

		this.pos.set(clientX, clientY);
	}

	onLeftDown(cb: () => void, thisArg?: any) {
		this.oldc = cb.bind(thisArg ?? cb);
	}

	onLeftUp(cb: () => void, thisArg?: any) {
		this.oluc = cb.bind(thisArg ?? cb);
	}

	onRightDown(cb: () => void, thisArg?: any) {
		this.ordc = cb.bind(thisArg ?? cb);
	}

	onRightUp(cb: () => void, thisArg?: any) {
		this.oruc = cb.bind(thisArg ?? cb);
	}

	onMidDown(cb: () => void, thisArg?: any) {
		this.omdc = cb.bind(thisArg ?? cb);
	}

	onMidUp(cb: () => void, thisArg?: any) {
		this.omuc = cb.bind(thisArg ?? cb);
	}
}
