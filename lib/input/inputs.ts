import { Resource, ECS, ECSEvent } from 'raxis';
import { KeyTracker } from './keytracker';
import { PointerTracker } from './pointertracker';
import { Vec2 } from 'raxis/math';
import { Canvas, Transform } from 'raxis-plugins';

export class Inputs extends Resource {
	constructor(
		public keymap: Map<string, KeyTracker> = new Map(),
		public pointer: PointerTracker = new PointerTracker()
	) {
		super();
	}
}

export class KeysToTrack extends Resource {
	constructor(public keys: string[]) {
		super();
	}
}

export type InputEventString = 'keydown' | 'keyup' | 'pointerdown' | 'pointerup' | 'pointermove' | 'wheel';
export type InputEventType<T extends InputEventString> = T extends 'keydown' | 'keyup'
	? KeyboardEvent
	: T extends 'pointerdown' | 'pointerup' | 'pointermove'
	? PointerEvent
	: T extends 'wheel'
	? WheelEvent
	: never;

export class InputEvent<T extends InputEventString> extends ECSEvent {
	constructor(readonly type: T, readonly event: InputEventType<T>) {
		super();
	}

	clone(): InputEvent<T> {
		return new InputEvent(this.type, this.event);
	}
}

/** @internal */
export function setupInputEventHandlers(ecs: ECS) {
	const inputEv = ecs.getEventWriter(InputEvent);

	window.addEventListener('keydown', (e) => inputEv.send(new InputEvent('keydown', e)));
	window.addEventListener('keyup', (e) => inputEv.send(new InputEvent('keyup', e)));
	window.addEventListener('pointerdown', (e) => inputEv.send(new InputEvent('pointerdown', e)));
	window.addEventListener('pointerup', (e) => inputEv.send(new InputEvent('pointerup', e)));
	window.addEventListener('pointermove', (e) => inputEv.send(new InputEvent('pointermove', e)));
	window.addEventListener('wheel', (e) => inputEv.send(new InputEvent('wheel', e)));
}

/** @internal */
export function setupKeyTrackers(ecs: ECS) {
	if (!ecs.hasResource(KeysToTrack)) return;
	const { keys } = ecs.getResource(KeysToTrack)!;
	const { keymap } = ecs.getResource(Inputs)!;

	keys.forEach((key) => {
		keymap.set(key, new KeyTracker(new Set([key])));
	});
}

/** @internal */
export function destroyKeyTrackers(ecs: ECS) {
	const { keymap } = ecs.getResource(Inputs)!;

	if (keymap.size === 0) return;

	for (let [, tracker] of keymap) {
		tracker.destroy();
	}
}

/** @internal */
export function updatePointerPos(ecs: ECS) {
	const { pointer } = ecs.getResource(Inputs)!;
	const { pos, last, delta, ray } = pointer;

	delta.set(pos.clone().sub(last));
	last.set(pos);

	const [canvas, ct] = ecs.query([Canvas, Transform]).single()!;

	const box = canvas.element.getBoundingClientRect();
	const halfElementSize = new Vec2(box.right - box.left, box.bottom - box.top).div(2);
	const offset = new Vec2(box.left, box.top);

	ray.pos.set(
		pos
			.clone()
			.sub(offset)
			.sub(halfElementSize)
			.mul(new Vec2(1, -1))
			.div(halfElementSize)
			.mul(ct.size.clone().div(2))
			.sub(ct.pos)
	);
	ray.delta.set(ray.pos.clone().sub(ray.last));
	ray.last.set(ray.pos);
}
