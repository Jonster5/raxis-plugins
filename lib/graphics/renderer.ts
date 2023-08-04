import { Vec2 } from 'raxis';
import { SpriteTextOptions, SpriteType } from '.';

type MessageData = {
	type: 'setup' | 'resize' | 'render';
	body: any;
};

type SetupMessageBody = {
	canvas: OffscreenCanvas;
	dims: [number, number];
	dpr: number;
};

type ResizeUpdateBody = {
	dims: [number, number];
	dpr: number;
};

export type RenderMessageBody = {
	size: Vec2;
	root: RenderObject;
};

export type RenderObject<T extends SpriteType = SpriteType> = {
	sprite: {
		type: T;
		material: ImageBitmap[] | string | CanvasGradient | CanvasPattern | SpriteTextOptions;
		filter: string | undefined;
		visible: boolean;
		alpha: number;
		borderColor: string;
		borderWidth: number;
		ci: number;
	};
	transform: {
		size: Vec2;
		pos: Vec2;
		angle: number;
	};
	text?: {
		content: string;
		font: string;
		color: string;
		strictWidth: boolean;
		textAlign: CanvasTextAlign;
		textBaseline: CanvasTextBaseline;
	};

	children: RenderObject[];
};

export function renderer() {
	let element: OffscreenCanvas;
	let ctx: OffscreenCanvasRenderingContext2D;

	self.onmessage = ({ data }) => {
		const { type, body } = data as MessageData;

		const start = performance.now();

		if (type === 'setup') {
			const { canvas, dims, dpr } = body as SetupMessageBody;

			element = canvas;
			ctx = canvas.getContext('2d')!;

			element.width = dims[0];
			element.height = dims[1];

			ctx.setTransform(dpr, 0, 0, -dpr, dims[0] / 2, dims[1] / 2);
		} else if (type === 'resize') {
			const { dims, dpr } = body as ResizeUpdateBody;

			element.width = dims[0];
			element.height = dims[1];

			ctx.setTransform(dpr, 0, 0, -dpr, dims[0] / 2, dims[1] / 2);
		} else if (type === 'render') {
			const { size, root } = body as RenderMessageBody;

			ctx.clearRect(-size.x / 2, -size.y / 2, size.x, size.y);

			draw(root);
		}

		queueMicrotask(() => {
			self.postMessage({ type: 'ready', body: performance.now() - start });
		});
	};

	function draw(obj: RenderObject) {
		const { sprite, transform, text, children } = obj;
		const { size, pos, angle } = transform;
		const { type, material, filter, visible, alpha, borderColor, borderWidth, ci } = sprite;

		if (!visible) return;

		ctx.save();

		ctx.translate(pos.x, pos.y);
		ctx.rotate(angle);

		ctx.save();
		ctx.scale(1, -1);

		if (filter) ctx.filter = filter;
		ctx.globalAlpha = alpha;

		ctx.beginPath();

		if (type === 'rectangle') {
			ctx.rect(-size.x / 2, -size.y / 2, size.x, size.y);
		} else if (type === 'ellipse') {
			ctx.ellipse(0, 0, size.x / 2, size.y / 2, 0, 0, 2 * Math.PI);
		}

		if (type === 'rectangle' || (type === 'ellipse' && !(material instanceof Array))) {
			if (material) {
				ctx.fillStyle = material as string | CanvasGradient | CanvasPattern;
				ctx.fill();
			}
			if (borderColor && borderColor !== 'none' && borderWidth) {
				ctx.strokeStyle = borderColor;
				ctx.lineWidth = borderWidth;
				ctx.stroke();
			}
		} else if (type === 'image' && material instanceof Array) {
			ctx.drawImage(material[ci], -size.x / 2, -size.y / 2, size.x, size.y);
		} else if (type === 'text' && material && material instanceof Object) {
			const { content, font, color, strictWidth, textAlign, textBaseline } = text!;

			ctx.font = `${transform.size.y}px ${font}`;
			ctx.fillStyle = color;
			ctx.textAlign = textAlign;
			ctx.textBaseline = textBaseline;

			if (strictWidth) ctx.fillText(content, 0, 0, transform.size.x);
			else ctx.fillText(content, 0, 0);
		}

		ctx.restore();

		if (children.length > 0) {
			for (let i = 0; i < children.length; i++) {
				draw(children[i]);
			}
		}

		ctx.restore();
	}
}
