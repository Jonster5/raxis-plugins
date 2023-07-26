import { Component } from 'raxis';

export type SpriteType = 'none' | 'rectangle' | 'ellipse' | 'image' | 'text';
export type MaterialType<T extends SpriteType> = T extends 'none'
	? undefined
	: T extends 'rectangle' | 'ellipse'
	? string | CanvasGradient | CanvasPattern
	: T extends 'image'
	? CanvasImageSource[]
	: T extends 'text'
	? SpriteTextOptions
	: never;

export type SpriteTextOptions = {
	font?: string;
	color?: string;
	strictWidth?: boolean;
	textAlign?: CanvasTextAlign;
	textBaseline?: CanvasTextBaseline;
};

export class Sprite<T extends SpriteType = SpriteType> extends Component {
	constructor(
		public type: T,
		public material: MaterialType<T> | undefined = undefined,
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

export class SpriteText extends Component {
	constructor(public value: string) {
		super();
	}
}

export function startImageAnimation(sprite: Sprite<'image'>, delay: number) {
	if (sprite.type !== 'image') return;

	sprite.shifter = setInterval(() => {
		sprite.ci!++;
		if (sprite.ci >= sprite.material!.length) sprite.ci = 0;
	}, delay) as unknown as number;
}

export function stopImageAnimation(sprite: Sprite) {
	if (sprite.shifter !== undefined) clearInterval(sprite.shifter);
	sprite.shifter = undefined;
}

export function gotoImageFrame(sprite: Sprite, index: number) {
	sprite.ci = index;
}
