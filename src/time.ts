import { ECS } from 'raxis-ecs';
import { Resource } from 'raxis-ecs';

export class Time extends Resource {
	constructor(
		public elapsed: number = 0,
		public delta: number = 0,
		public last: number = 0,
		public speed: number = 1
	) {
		super();
	}
}

function startTime(ecs: ECS) {
	const time = ecs.getResource(Time)!;

	time.last = performance.now();
}

function updateTime(ecs: ECS) {
	const time = ecs.getResource(Time)!;
	const now = performance.now();

	time.delta = now - time.last;
	time.elapsed += time.delta;
	time.last = now;
}

export function TimePlugin(ecs: ECS) {
	ecs.insertResource(new Time()).addStartupSystem(startTime).addMainSystem(updateTime);
}
