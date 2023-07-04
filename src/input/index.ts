import { ECS } from 'raxis';
import { Inputs, setupKeyTrackers, updatePointerPos, destroyKeyTrackers } from './inputs';

export * from './keytracker';
export * from './pointertracker';
export * from './inputs';

export function InputPlugin(ecs: ECS) {
	ecs.insertResource(new Inputs())
		.addStartupSystem(setupKeyTrackers)
		.addMainSystem(updatePointerPos)
		.addShutdownSystem(destroyKeyTrackers);
}
