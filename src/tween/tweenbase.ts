import { linear } from 'raxis-ecs/math';

export abstract class TweenBase {
	duration: number;

	protected _state: any;
	protected _value: any;

	ease: (x: number) => number;

	protected _onUpdate: Function;
	protected _onCompletion: Function;

	done: boolean;

	constructor(
		duration: number,
		easing: (x: number) => number = linear,
		onCompletion?: () => void,
		onUpdate?: Function
	) {
		this.duration = duration;

		this.ease = easing;
		this._onCompletion = onCompletion ?? (() => undefined);
		this._onUpdate = onUpdate ?? (() => undefined);

		this.done = false;
	}

	onUpdate(cb: Function) {
		this._onUpdate = cb;

		return this;
	}

	onCompletion(cb: Function) {
		this._onCompletion = cb;

		return this;
	}

	abstract update(dt: number): void;

	get state() {
		return this._state;
	}

	set state(v: any) {
		this._state = v;
	}

	get value() {
		return this._value;
	}
}
