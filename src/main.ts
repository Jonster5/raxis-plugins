import { ECSPlugin } from 'raxis-ecs';
import { AssetsPlugin } from './assets';
import { AudioPlugin } from './audio';
import { GraphicsPlugin } from './graphics';
import { InputPlugin } from './input';
import { ParticlePlugin } from './particle';
import { SocketPlugin } from './socket';
import { TimePlugin } from './time';
import { TransformPlugin } from './transform';
import { TweenPlugin } from './tween';

export * from './audio';
export * from './graphics';
export * from './input';
export * from './tween';
export * from './assets';
export * from './particle';
export * from './socket';
export * from './time';
export * from './transform';

export const defaultPlugins: ECSPlugin[] = [
	AssetsPlugin,
	TimePlugin,
	TransformPlugin,
	GraphicsPlugin,
	AudioPlugin,
	InputPlugin,
	TweenPlugin,
	ParticlePlugin,
	SocketPlugin,
];
