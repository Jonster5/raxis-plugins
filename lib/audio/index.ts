import { ECS } from 'raxis';
import { SoundManager } from './soundmanager';

export * from './soundmanager';

export * from './sound';
export * from './soundeffect';

export function AudioPlugin(ecs: ECS) {
	ecs.addComponentTypes(SoundManager);
}
