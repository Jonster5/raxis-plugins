import { Resource, ECS } from 'raxis';
import { KeyTracker } from './keytracker';
import { PointerTracker } from './pointertracker';

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

export function setupKeyTrackers(ecs: ECS) {
	const ktt = ecs.getResource(KeysToTrack)!;
	if (!ktt) return;

	const { keys } = ktt;
	const { keymap } = ecs.getResource(Inputs)!;

	keys.forEach((key) => {
		if (key.length === 1) {
			if (key === '=' || key === '+') {
				keymap.set(key.toLowerCase(), new KeyTracker('+', '='));
			} else if (key === '-' || key === '_') {
				keymap.set(key.toLowerCase(), new KeyTracker('-', '_'));
			} else {
				keymap.set(key.toLowerCase(), new KeyTracker(key.toLowerCase(), key.toUpperCase()));
			}
		} else {
			keymap.set(key, new KeyTracker(key));
		}
	});
}

export function destroyKeyTrackers(ecs: ECS) {
	const { keymap } = ecs.getResource(Inputs)!;

	if (keymap.size === 0) return;

	for (let [, tracker] of keymap) {
		tracker.destroy();
	}
}

export function updatePointerPos(ecs: ECS) {
	const { pointer } = ecs.getResource(Inputs)!;
	const { pos, last, offset } = pointer;

	offset.set(pos.clone().sub(last));
	last.set(pos);
}
