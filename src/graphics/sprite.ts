import { Component } from 'raxis';

export class Sprite extends Component {
	constructor(
		public type: 'rectangle' | 'ellipse' | 'image' | 'none',
		public material: string | CanvasGradient | CanvasPattern | CanvasImageSource[] | undefined = undefined,
		public visible: boolean = true,
		public filter: string | undefined = undefined,
		public alpha: number = 1,
		public borderColor: string = 'none',
		public borderWidth: number = 0,

		public shifter: number | undefined = undefined,
		public delay: number | undefined = 100,
		public ci: number = 0
	) {
		super();
	}

	onDestroy() {
		stopImageAnimation(this);
	}
}

export function startImageAnimation(sprite: Sprite, delay: number) {
	if (sprite.type !== 'image') return;

	sprite.shifter = setInterval(() => {
		sprite.ci!++;
		if (sprite.ci >= (sprite.material as CanvasImageSource[]).length) sprite.ci = 0;
	}, delay) as unknown as number;
}

export function stopImageAnimation(sprite: Sprite) {
	if (sprite.shifter !== undefined) clearInterval(sprite.shifter);
	sprite.shifter = undefined;
}

export function gotoImageFrame(sprite: Sprite, index: number) {
	sprite.ci = index;
}
