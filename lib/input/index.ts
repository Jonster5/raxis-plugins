import { ECS } from 'raxis';
import {
	Inputs,
	InputEvent,
	setupKeyTrackers,
	updatePointerPos,
	destroyKeyTrackers,
	setupInputEventHandlers,
} from './inputs';

export * from './keytracker';
export * from './pointertracker';
export * from './inputs';

export function InputPlugin(ecs: ECS) {
	ecs.insertResource(new Inputs())
		.addEventType(InputEvent)
		.addStartupSystems(setupKeyTrackers, setupInputEventHandlers)
		.addMainSystem(updatePointerPos)
		.addShutdownSystem(destroyKeyTrackers);
}
