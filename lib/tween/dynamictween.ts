import { linear } from 'raxis';
import { TweenBase } from './tweenbase';

type OnlyNumberProps<T extends object> = {
	[P in keyof T as T[P] extends number ? P : never]: number;
};

export class DynamicTween<T extends object, P extends [...(keyof OnlyNumberProps<T>)[]]> extends TweenBase {
	obj: T;

	start: { [key: PropertyKey]: number };
	target: T;

	fields: (keyof T)[];

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

		props.forEach((prop: keyof T) => {
			if (!isValidProp(prop)) throw new Error(`Key [${prop}] does not exist on ${obj.constructor.name}`);
			if (typeof obj[prop] !== 'number') throw new Error(`All input object properties must be of type number`);

			this.start[prop] = obj[prop];
			this.fields.push(prop);
		});

		function isValidProp(prop: PropertyKey): prop is keyof T {
			return prop in obj;
		}
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
