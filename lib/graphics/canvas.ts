import { Component, Resource, ECS, With, Entity, ECSEvent, Vec2 } from 'raxis';
import { Transform } from '../transform';
import { Sprite, SpriteText, SpriteTextOptions } from './sprite';
import { RenderMessageBody, RenderObject, renderer } from './renderer';

export class Canvas extends Component {
	constructor(
		public target: HTMLElement,
		public element: HTMLCanvasElement,
		public controller: Worker,
		public aspect: number,
		public zoom: number,
		public lastOpTime: number
	) {
		super();
	}

	onDestroy(): void {
		this.controller.terminate();
	}
}

export class CanvasSettings extends Resource {
	constructor(
		public settings: {
			target: HTMLElement;
			width: number;
			rendering?: 'crisp-edges' | 'pixelated';
			extraStyling?: string;
		}
	) {
		super();
	}
}

export class ReadyToRenderEvent extends ECSEvent {}

export function setupCanvas(ecs: ECS) {
	let { target, width, rendering, extraStyling } = ecs.getResource(CanvasSettings)!.settings;

	target = target ?? document.body;
	width = width ?? 1000;
	rendering = rendering ?? 'crisp-edges';

	const element = document.createElement('canvas');
	const offscreen = element.transferControlToOffscreen();

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;

	const size = new Vec2(width, width * aspect);

	const zoom = 1;

	// ctx.imageSmoothingEnabled = false;

	element.setAttribute(
		'style',
		`display: block; width: 100%; height: 100%; border: none; background: transparent; image-rendering: ${rendering}; ${extraStyling}`
	);

	target.appendChild(element);

	const url = URL.createObjectURL(new Blob(['(', renderer.toString(), ')()'], { type: 'application/javascript' }));

	const controller = new Worker(url);

	URL.revokeObjectURL(url);

	controller.postMessage(
		{
			type: 'setup',
			body: {
				canvas: offscreen,
				dims: [size.width * dpr, size.height * dpr],
				dpr,
			},
		},
		[offscreen]
	);

	const canvas = new Canvas(target, element, controller, aspect, zoom, 0);

	controller.onmessage = ({ data }) => {
		const { body }: { body: number } = data;

		canvas.lastOpTime = body;

		ecs.getEventWriter(ReadyToRenderEvent).send();
	};

	ecs.spawn(canvas, new Sprite('none'), new Transform(size));
}

class LastZoomTracker extends Resource {
	constructor(public zoom: number) {
		super();
	}
}

export function updateCanvasZoom(ecs: ECS) {
	const [canvas, { size }] = ecs.query([Canvas, Transform]).single()!;
	const { target, zoom, controller } = canvas;
	if (!ecs.hasLocalResource(LastZoomTracker)) ecs.insertLocalResource(new LastZoomTracker(zoom));
	const last = ecs.getLocalResource(LastZoomTracker)!;

	if (zoom === last.zoom) return;

	const zratio = zoom / last.zoom;

	const width = size.width / zratio;

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;

	const nsize = new Vec2(width, width * aspect);

	controller.postMessage({
		type: 'resize',
		body: {
			dims: [nsize.width * dpr, nsize.height * dpr],
			dpr,
		},
	});

	canvas.aspect = aspect;
	size.set(nsize);

	last.zoom = zoom;
}

class LastDimTracker extends Resource {
	constructor(public tcw: number, public tch: number) {
		super();
	}
}

export function updateCanvasDimensions(ecs: ECS) {
	const [canvas, { size }] = ecs.query([Canvas, Transform]).single()!;
	const { target, controller } = canvas;
	if (!ecs.hasLocalResource(LastDimTracker))
		ecs.insertLocalResource(new LastDimTracker(target.clientWidth, target.clientHeight));
	const last = ecs.getLocalResource(LastDimTracker)!;

	if (target.clientWidth === last.tcw && target.clientHeight === last.tch) return;

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;

	const nsize = new Vec2(size.width, size.width * aspect);

	controller.postMessage({
		type: 'resize',
		body: {
			dims: [nsize.width * dpr, nsize.height * dpr],
			dpr,
		},
	});

	size.set(nsize);
	last.tcw = target.clientWidth;
	last.tch = target.clientHeight;
}

export function render(ecs: ECS) {
	if (ecs.getEventReader(ReadyToRenderEvent).empty()) return;

	const canvasQuery = ecs.query([Canvas, Transform, Sprite]);
	const [
		{ controller },
		{ size, pos, angle },
		{ type, material, filter, visible, alpha, borderColor, borderWidth, ci },
	] = canvasQuery.single()!;

	const renderTree: RenderObject = {
		sprite: {
			type,
			material,
			filter,
			visible,
			alpha,
			borderColor,
			borderWidth,
			ci,
		},
		transform: {
			size,
			pos,
			angle,
		},
		children: ecs
			.roots(With(Transform), With(Sprite))
			.map((e) => ecs.entity(e))
			.map(createRenderObject),
	};

	controller.postMessage({
		type: 'render',
		body: {
			size,
			root: renderTree,
		} as RenderMessageBody,
	});
}

function createRenderObject(entity: Entity): RenderObject {
	const { type, material, filter, visible, alpha, borderColor, borderWidth, ci } = entity.get(Sprite)!;
	const { size, pos, angle } = entity.get(Transform)!;

	const renderObj: RenderObject = {
		sprite: {
			type,
			material,
			filter,
			visible,
			alpha,
			borderColor,
			borderWidth,
			ci,
		},
		transform: {
			size,
			pos,
			angle,
		},
		children: entity
			.children(With(Transform), With(Sprite))
			.map((c) => entity.ecs.entity(c))
			.map(createRenderObject),
	};

	if (entity.has(SpriteText)) {
		const { font, color, strictWidth, textAlign, textBaseline } = material as SpriteTextOptions;

		renderObj.text = {
			content: entity.get(SpriteText)?.value ?? '',
			font: font ?? 'sans-serif',
			color: color ?? 'black',
			strictWidth: strictWidth ?? false,
			textAlign: textAlign ?? 'center',
			textBaseline: textBaseline ?? 'middle',
		};
	}

	return renderObj;
}
