import { Component } from 'raxis';
import { Handle } from './handle';

export type SpriteType = 'none' | 'rectangle' | 'ellipse' | 'image' | 'text';
export type MaterialType<T extends SpriteType> = T extends 'none'
	? undefined
	: T extends 'rectangle' | 'ellipse'
	? string | CanvasGradient | CanvasPattern
	: T extends 'image'
	? (CanvasImageSource | Handle)[]
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
	shifter: number | undefined = undefined;
	delay: number | undefined = 100;
	index: number = 0;
	visible: boolean = true;
	filter: string | undefined = undefined;

	constructor(
		public type: T,
		public material: MaterialType<T> | undefined = undefined,
		public ZIndex: number = 0,
		public alpha: number = 1,
		public borderColor: string = 'none',
		public borderWidth: number = 0
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
		sprite.index!++;
		if (sprite.index >= sprite.material!.length) sprite.index = 0;
	}, delay) as unknown as number;
}

export function stopImageAnimation(sprite: Sprite) {
	if (sprite.shifter !== undefined) clearInterval(sprite.shifter);
	sprite.shifter = undefined;
}

export function gotoImageFrame(sprite: Sprite, index: number) {
	sprite.index = index;
}
