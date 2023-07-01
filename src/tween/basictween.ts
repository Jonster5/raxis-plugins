import { linear } from 'raxis-ecs/math';
import { TweenBase } from './tweenbase';

export class BasicTween extends TweenBase {
	start: number;
	finish: number;

	distance: number;

	protected declare _state: number;
	protected declare _value: number;

	constructor(
		start: number,
		finish: number,
		duration: number,
		easing: (x: number) => number = linear,
		onCompletion?: () => void,
		onUpdate?: (val: number) => void
	) {
		super(duration, easing, onCompletion, onUpdate);

		this.start = start;
		this.finish = finish;
		this.duration = duration;

		this.distance = this.finish - this.start;
		this._state = 0;
		this._value = start;
		this.done = false;
	}

	update(dt: number) {
		if (this.done) return;

		if (this._state >= 1) {
			this.done = true;
			this._onCompletion();
		}

		this._state += (1 / this.duration) * dt;

		this._state = Math.min(this._state, 1);

		this._value = this.ease(this._state) * this.distance + this.start;

		this._onUpdate(this._value);
	}
}
