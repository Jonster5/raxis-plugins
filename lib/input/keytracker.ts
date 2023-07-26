export class KeyTracker {
	keys: Set<string>;

	isDown: boolean;
	isUp: boolean;

	private kdb: (e: KeyboardEvent) => void;
	private kub: (e: KeyboardEvent) => void;

	constructor(keys: Set<string>) {
		this.keys = keys;

		this.isDown = false;
		this.isUp = true;

		this.kdb = this.kd.bind(this);
		this.kub = this.ku.bind(this);

		window.addEventListener('keydown', this.kdb);
		window.addEventListener('keyup', this.kub);
	}

	destroy() {
		window.removeEventListener('keydown', this.kdb);
		window.removeEventListener('keyup', this.kub);
	}

	private kd(e: KeyboardEvent) {
		if (!this.keys.has(e.code)) return;
		this.isDown = true;
		this.isUp = false;
	}
	private ku(e: KeyboardEvent) {
		if (!this.keys.has(e.code)) return;
		this.isDown = false;
		this.isUp = true;
	}
}
