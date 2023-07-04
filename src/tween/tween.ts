import { Component, ECS, Entity } from 'raxis';
import { Time } from '../time';
import type { TweenBase } from './tweenbase';

export class TweenManager extends Component {
	constructor(public tweens: Map<string, TweenBase> = new Map()) {
		super();
	}
}

export function updateTweens(ecs: ECS) {
	const managers = ecs.query([TweenManager]).results(([x]) => x);
	const time = ecs.getResource(Time)!;

	managers.forEach(({ tweens }) => {
		tweens.forEach((tween) => {
			if (tween.done) return;

			tween.update(time.delta);
		});
	});
}

export function addTween<T extends TweenBase>(entity: Entity, label: string, tween: T): T {
	if (!entity.has(TweenManager)) entity.insert(new TweenManager());

	entity.get(TweenManager)!.tweens.set(label, tween);

	return tween;
}

export function tweenIsDone(entity: Entity, label: string) {
	if (!entity.has(TweenManager)) return true;
	if (!entity.get(TweenManager)!.tweens.has(label)) return true;
	if (entity.get(TweenManager)!.tweens.get(label)!.done) return true;

	return false;
}

export function getTween(entity: Entity, label: string): TweenBase | null {
	if (!entity.has(TweenManager)) return null;

	return entity.get(TweenManager)!.tweens.get(label)!;
}

export function removeTween(entity: Entity, label: string) {
	if (!entity.has(TweenManager)) return;

	entity.get(TweenManager)!.tweens.delete(label);
}
