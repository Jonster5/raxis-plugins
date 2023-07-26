import { ECS } from 'raxis';
import { Resource } from 'raxis';

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

export class SystemTimer extends Resource {
	constructor(public remaining: number) {
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

/**
 * @returns `true` if the current system's timer still has time left, `false` if the system is ready or if there is no system timer available
 */
export function checkTimer(ecs: ECS) {
	if (!ecs.hasLocalResource(SystemTimer)) ecs.insertLocalResource(new SystemTimer(0));

	const timer = ecs.getLocalResource(SystemTimer)!;
	timer.remaining -= ecs.getResource(Time)!.delta;

	return timer.remaining > 0;
}

/**
 * To be used in conjunction with `checkTimer`
 * @param ecs A reference to the ECS
 * @param delay The amount of time in milliseconds to wait before running this system again
 */
export function setTimer(ecs: ECS, delay: number) {
	ecs.insertLocalResource(new SystemTimer(delay), true);
}
