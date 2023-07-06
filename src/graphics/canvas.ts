import { Component, Resource, ECS, With } from 'raxis';
import { Vec2 } from 'raxis/math';
import { Time } from '../time';
import { Transform } from '../transform';
import { Sprite } from './sprite';

export class Canvas extends Component {
	constructor(
		public target: HTMLElement,
		public element: HTMLCanvasElement,
		public ctx: CanvasRenderingContext2D,
		public aspect: number,
		public size: Vec2,
		public zoom: number,
		public def: DOMMatrix,
		public last: {
			zoom: number;
			tcw: number;
			tch: number;
		}
	) {
		super();
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

export function setupCanvas(ecs: ECS) {
	let { target, width, rendering, extraStyling } = ecs.getResource(CanvasSettings)!.settings;

	target = target ?? document.body;
	width = width ?? 1000;
	rendering = rendering ?? 'crisp-edges';

	const element = document.createElement('canvas');
	const ctx = element.getContext('2d')!;

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;
	const tcw = target.clientWidth,
		tch = target.clientHeight;

	const size = new Vec2(width, width * aspect).freeze();

	const zoom = 1;

	element.width = size.width * dpr;
	element.height = size.height * dpr;

	ctx.setTransform(dpr, 0, 0, -dpr, element.width / 2, element.height / 2);
	// ctx.imageSmoothingEnabled = false;

	const def = ctx.getTransform();

	element.setAttribute(
		'style',
		`display: block; width: 100%; height: 100%; border: none; background: transparent; image-rendering: ${rendering}; ${extraStyling}`
	);

	element.addEventListener('contextmenu', (e) => e.preventDefault());

	target.appendChild(element);

	ecs.spawn(
		new Canvas(target, element, ctx, aspect, size, zoom, def, { zoom, tcw, tch }),
		new Sprite('none'),
		new Transform()
	);
}

export function updateCanvasZoom(ecs: ECS) {
	const [canvas] = ecs.query([Canvas]).single()!;
	const { target, element, ctx, size, zoom, last } = canvas;

	if (zoom === last.zoom) return;

	const zratio = zoom / last.zoom;

	const width = size.width / zratio;

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;

	const nsize = new Vec2(width, width * aspect);

	element.width = nsize.width * dpr;
	element.height = nsize.height * dpr;
	ctx.setTransform(dpr, 0, 0, -dpr, element.width / 2, element.height / 2);

	canvas.aspect = aspect;
	canvas.size = nsize;
	canvas.def = ctx.getTransform();

	last.zoom = zoom;
}

export function updateCanvasDimensions(ecs: ECS) {
	const [canvas] = ecs.query([Canvas]).single()!;
	const { target, element, ctx, size, last } = canvas;

	if (target.clientWidth === last.tcw && target.clientHeight === last.tch) return;

	const dpr = window.devicePixelRatio ?? 1;
	const aspect = target.clientHeight / target.clientWidth;

	const nsize = new Vec2(size.width, size.width * aspect);

	element.width = nsize.width * dpr;
	element.height = nsize.height * dpr;
	ctx.setTransform(dpr, 0, 0, -dpr, element.width / 2, element.height / 2);

	canvas.size = nsize;
	canvas.last.tcw = target.clientWidth;
	canvas.last.tch = target.clientHeight;
	canvas.def = ctx.getTransform();
}

export function renderCanvas(ecs: ECS) {
	const canvasQuery = ecs.query([Canvas]);
	const [c] = canvasQuery.single()!;
	const time = ecs.getResource(Time)!;

	const { ctx } = c;

	c.ctx.setTransform(c.def);

	c.ctx.clearRect(-c.size.x, -c.size.y, c.size.x * 2, c.size.y * 2);

	c.ctx.save();

	draw(time, canvasQuery.entities()[0], false);

	ecs.roots(With(Sprite), With(Transform)).forEach((root) => {
		draw(time, root, true);
	});

	c.ctx.restore();

	function draw(time: Time, sid: number, save: boolean) {
		const e = ecs.entity(sid);
		const sprite = e.get(Sprite);
		const transform = e.get(Transform);

		if (!sprite || !transform) return;

		if (!sprite.visible) return;

		const { pos, angle, size } = transform;
		const { type, material, filter, alpha, borderColor, borderWidth, ci } = sprite;

		if (save) ctx.save();

		ctx.translate(pos.x, pos.y);
		ctx.rotate(angle);

		if (filter) ctx.filter = filter;
		ctx.globalAlpha = alpha;

		ctx.save();
		ctx.scale(1, -1);

		ctx.beginPath();

		if (type === 'rectangle') ctx.rect(-size.x / 2, -size.y / 2, size.x, size.y);
		else if (type === 'ellipse') ctx.ellipse(0, 0, size.x / 2, size.y / 2, 0, 0, 2 * Math.PI);

		if ((type === 'rectangle' || type === 'ellipse') && !(material instanceof Array)) {
			if (material) {
				ctx.fillStyle = material as string | CanvasGradient | CanvasPattern;
				ctx.fill();
			}
			if (borderColor && borderWidth) {
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = borderWidth;
				ctx.stroke();
			}
		} else if (type === 'image' && material instanceof Array) {
			ctx.drawImage(material[ci], -size.x / 2, -size.y / 2, size.x, size.y);
		}

		ctx.restore();

		if (e.children().length > 0) {
			for (let child of e.children()) draw(time, child, true);
		}

		if (save) ctx.restore();
	}
}
