import { ECS } from 'raxis';
import { Time } from '../time';
import { Transform } from '../transform';
import { Canvas, setupCanvas, updateCanvasDimensions, updateCanvasZoom, render } from './canvas';
import { Sprite, SpriteText } from './sprite';

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
	ecs.addComponentTypes(Canvas, Sprite, SpriteText)
		.addStartupSystems(checkGraphicsCompatibility, setupCanvas)
		.addMainSystems(updateCanvasDimensions, updateCanvasZoom, render);
}

export * from './canvas';
export * from './sprite';
export * from './handle';
