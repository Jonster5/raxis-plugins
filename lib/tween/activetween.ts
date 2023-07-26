import { TweenBase } from './tweenbase';
import { BasicTween } from './basictween';
import { linear } from 'raxis/math';

export class Tween<T extends { [key: string]: number }> extends TweenBase {
	obj: T;
	target: T;

	fields: {
		name: string;
		tween: BasicTween;
	}[];

	protected declare _state: number;

	protected declare _onUpdate: (obj: T) => void;

	constructor(
		obj: any,
		to: T,
		duration: number,
		easing: (x: number) => number = linear,
		onCompletion?: () => void,
		onUpdate?: (obj: T) => void
	) {
		super(duration, easing, onCompletion, onUpdate);

		this.obj = obj as T;
		this.target = to;
		this.duration = duration;
		this._value = undefined;

		this._state = 0;

		this.fields = [];

		for (const [key, value] of Object.entries(this.target)) {
			if (!(key in obj)) throw new Error(`Key [${key}] does not exist on ${obj.constructor.name}`);

			this.fields.push({
				name: key,
				tween: new BasicTween(this.obj[key], value, this.duration, this.ease),
			});
		}
	}

	update(dt: number) {
		if (this.done) return;

		if (!this.fields.map(({ tween }) => tween.done).includes(false)) {
			this.done = true;
			this._onCompletion();
		}

		this._state += (1 / this.duration) * dt;
		this._state = Math.min(this._state, 1);

		this.fields.forEach(({ tween }) => tween.update(dt));

		this.fields.forEach((field) => {
			(this.obj as any)[field.name] = field.tween.value;
		});

		this._onUpdate(this.obj);
	}

	get state() {
		return this._state;
	}

	set state(v: number) {
		this._state = Math.max(Math.min(v, 1), 0);
	}

	get value() {
		return this._value;
	}
}
