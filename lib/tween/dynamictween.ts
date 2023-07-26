import { linear } from 'raxis/math';
import { TweenBase } from './tweenbase';

export class DynamicTween<T extends { [key: string]: number }, P extends [...string[]]> extends TweenBase {
	obj: T;

	start: { [key: string]: number };
	target: T;

	fields: string[];

	protected declare _state: number;

	protected declare _onUpdate: (obj: T) => void;

	constructor(
		obj: T,
		target: T,
		props: [...P],
		duration: number,
		easing: (x: number) => number = linear,
		onCompletion?: () => void,
		onUpdate?: (obj: T) => void
	) {
		super(duration, easing, onCompletion, onUpdate);

		this.obj = obj;

		this.start = {};
		this.target = target;
		this.fields = [];
		this._state = 0;

		if (props.length < 1) {
			throw new Error(`Prop list must contain at least one item`);
		}

		props.forEach((prop: string) => {
			if (!(prop in obj)) throw new Error(`Key [${prop}] does not exist on ${obj.constructor.name}`);
			if (typeof obj[prop] !== 'number') throw new Error(`All input object properties must be of type number`);

			this.start[prop] = obj[prop];
			this.fields.push(prop);
		});
	}

	update(dt: number) {
		if (this.done) return;

		if (this._state >= 1) {
			this.done = true;
			this._onCompletion();
		}

		this._state += (1 / this.duration) * dt;
		this._state = Math.min(this._state, 1);

		this.fields.forEach((key) => {
			const start = this.start[key] as number;
			const distance = (this.target[key] as number) - start;

			(this.obj as any)[key] = this.ease(this._state) * distance + start;
		});

		this._onUpdate(this.obj);
	}
}
