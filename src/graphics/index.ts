import { ECS } from 'raxis-ecs';
import { Time } from '../time';
import { Transform } from '../transform';
import { Canvas, setupCanvas, updateCanvasDimensions, updateCanvasZoom, renderCanvas } from './canvas';
import { Sprite, Root } from './sprite';

export function checkGraphicsCompatibility(ecs: ECS) {
	const hasTime = !!ecs.getResource(Time);

	const hasTransform = ecs.hasComponent(Transform);

	if (!hasTime) {
		throw new Error(`raxis-graphics requires plugin [raxis-time]`);
	}

	if (!hasTransform) {
		throw new Error(`raxis-graphics requires plugin [raxis-transform]`);
	}
}

export function GraphicsPlugin(ecs: ECS) {
	ecs.addComponentTypes(Canvas, Sprite, Root)
		.addStartupSystems(checkGraphicsCompatibility, setupCanvas)
		.addMainSystems(updateCanvasDimensions, updateCanvasZoom, renderCanvas);
}

export * from './canvas';
export * from './sprite';
