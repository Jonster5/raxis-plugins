import { Component, Resource, ECS, With, Entity, Vec2, MemPool } from 'raxis';
import { Transform } from '../transform';
import { MaterialType, Sprite, SpriteText, SpriteTextOptions } from './sprite';
import { type RenderMessageBody, type RenderObject } from './renderer';
import { checkTimer, setTimer } from 'raxis-plugins';
import { Handle } from './handle';
import Renderer from './renderer?worker&inline';

export class Canvas extends Component {
	constructor(
		public target: HTMLElement,
		public element: HTMLCanvasElement,
		public controller: Worker,
		public aspect: number,
		public zoom: number,
		public lastOpTime: number,
		public targetFrameTime: number,
		public readyToRender: boolean,
		public rop: MemPool<RenderObject>
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
			target?: HTMLElement;
			width?: number;
			rendering?: 'crisp-edges' | 'pixelated';
			extraStyling?: string;
			targetFPS?: number;
		}
	) {
		super();
	}
}

export function setupCanvas(ecs: ECS) {
	const {
		target = document.body,
		width = 1000,
		rendering = 'crisp-edges',
		extraStyling = '',
		targetFPS = 60,
	} = ecs.hasResource(CanvasSettings) ? ecs.getResource(CanvasSettings)!.settings : {};

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

	const controller = new Renderer();

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

	const canvas = new Canvas(
		target,
		element,
		controller,
		aspect,
		zoom,
		0,
		1000 / targetFPS,
		true,
		new MemPool(
			function () {
				return {
					sprite: {
						type: 'none',
						material: '',
						filter: undefined,
						visible: true,
						alpha: 1,
						borderColor: '',
						borderWidth: 0,
						ci: 0,
					},
					transform: {
						size: { x: 0, y: 0 },
						pos: { x: 0, y: 0 },
						angle: 0,
					},
					text: undefined,
					children: [],
				} as RenderObject;
			},
			{
				size: 50,
				growBy: 50,
			}
		)
	);

	controller.onmessage = ({ data }) => {
		const { body }: { body: number } = data;

		canvas.lastOpTime = body;
		canvas.readyToRender = true;
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

export async function render(ecs: ECS) {
	if (checkTimer(ecs)) return;

	const canvasQuery = ecs.query([Canvas, Transform, Sprite]);
	const [
		canvas,
		{ size, pos, angle },
		{ type, material, filter, visible, alpha, borderColor, borderWidth, index: ci },
	] = canvasQuery.single()!;
	const { controller, rop, targetFrameTime } = canvas;

	const root = rop.use();

	root.sprite.type = type;
	root.sprite.material = await createMaterial(material);
	root.sprite.filter = filter;
	root.sprite.visible = visible;
	root.sprite.alpha = alpha;
	root.sprite.borderColor = borderColor;
	root.sprite.borderWidth = borderWidth;
	root.sprite.ci = ci;

	root.transform.size = size;
	root.transform.pos = pos;
	root.transform.angle = angle;

	root.children = await Promise.all(
		ecs
			.roots(With(Transform), With(Sprite))
			.map((e) => ecs.entity(e))
			.sort((a, b) => a.get(Sprite)!.ZIndex - b.get(Sprite)!.ZIndex)
			.map((c) => createRenderObject(c, rop))
	);

	controller.postMessage({
		type: 'render',
		body: {
			size,
			root,
		} as RenderMessageBody,
	});
	canvas.readyToRender = false;

	freeRenderTree(root, rop);

	setTimer(ecs, targetFrameTime);
}

function freeRenderTree(obj: RenderObject, rop: MemPool<RenderObject>) {
	if (obj.children.length > 0) {
		for (let i = 0; i < obj.children.length; i++) {
			freeRenderTree(obj.children[i], rop);
		}
	}

	rop.free(obj);
}

async function createRenderObject(entity: Entity, rop: MemPool<RenderObject>): Promise<RenderObject> {
	const { type, material, filter, visible, alpha, borderColor, borderWidth, index: ci } = entity.get(Sprite)!;
	const { size, pos, angle } = entity.get(Transform)!;

	const obj = rop.use();

	obj.sprite.type = type;
	obj.sprite.material = await createMaterial(material);
	obj.sprite.filter = filter;
	obj.sprite.visible = visible;
	obj.sprite.alpha = alpha;
	obj.sprite.borderColor = borderColor;
	obj.sprite.borderWidth = borderWidth;
	obj.sprite.ci = ci;

	obj.transform.size = size;
	obj.transform.pos = pos;
	obj.transform.angle = angle;

	obj.children = await Promise.all(
		entity
			.children(With(Transform), With(Sprite))
			.map((c) => entity.ecs.entity(c))
			.sort((a, b) => a.get(Sprite)!.ZIndex - b.get(Sprite)!.ZIndex)
			.map((c) => createRenderObject(c, rop))
	);

	if (entity.has(SpriteText)) {
		const { font, color, strictWidth, textAlign, textBaseline } = material as SpriteTextOptions;

		obj.text = {
			content: entity.get(SpriteText)?.value ?? '',
			font: font ?? 'sans-serif',
			color: color ?? 'black',
			strictWidth: strictWidth ?? false,
			textAlign: textAlign ?? 'center',
			textBaseline: textBaseline ?? 'middle',
		};
	}

	return obj;
}

async function createMaterial(
	mat: MaterialType<any>
): Promise<(ImageBitmap | string)[] | string | CanvasGradient | CanvasPattern | SpriteTextOptions> {
	if (mat instanceof Array) {
		return Promise.all(
			mat.map((m) => {
				if (m instanceof Handle) {
					return m.id;
				} else {
					console.warn('bad');
					return createImageBitmap(m);
				}
			})
		);
	}

	return mat!;
}
