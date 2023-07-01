import { Component, ECS, Entity } from 'raxis-ecs';
import { Vec2 } from 'raxis-ecs/math';
import { Time } from './time';

export class Transform extends Component {
	constructor(
		public size: Vec2 = new Vec2(0, 0),
		public pos: Vec2 = new Vec2(0, 0),
		public angle: number = 0,
		public vel: Vec2 = new Vec2(0, 0),
		public avel: number = 0,
		public last: {
			pos: Vec2;
			angle: number;
		} = {
			pos: pos.clone(),
			angle,
		}
	) {
		super();
	}

	clone() {
		return new Transform(this.size.clone(), this.pos.clone(), this.angle, this.vel.clone(), this.avel, {
			pos: this.last.pos.clone(),
			angle: this.last.angle,
		});
	}

	serialize(): string {
		const s = {
			size: this.size.serialize(),
			pos: this.pos.serialize(),
			angle: this.angle,
			vel: this.vel.serialize(),
			avel: this.avel,
			last: {
				pos: this.last.pos.serialize(),
				angle: this.last.angle,
			},
		};

		return JSON.stringify(s);
	}

	static deserialize(str: string) {
		const d = JSON.parse(str);

		return new Transform(
			Vec2.fromString(d.size),
			Vec2.fromString(d.pos),
			parseFloat(d.angle),
			Vec2.fromString(d.vel),
			parseFloat(d.avel),
			{ pos: Vec2.fromString(d.last.pos), angle: parseFloat(d.last.angle) }
		);
	}
}

function updateTransform(ecs: ECS) {
	const time = ecs.getResource(Time)!;

	const transforms = ecs.query([Transform]).results(([x]) => x);

	transforms.forEach((t) => {
		t.last.pos.set(t.pos);
		t.last.angle = t.angle;

		t.pos.add(t.vel.clone().mul((time.delta * time.speed) / 1000));
		t.angle += ((time.delta * time.speed) / 1000) * t.avel;
	});
}

export function globalPos(e: Entity): Vec2 {
	if (!e.has(Transform)) throw new Error(`Entity ${e.id()} must have component [Transform]`);

	const t = e.get(Transform)!;

	if (e.parent() !== undefined && e.ecs.entity(e.parent()!).has(Transform)) {
		return globalPos(e.ecs.entity(e.parent()!)).add(t.pos);
	} else {
		return new Vec2(0, 0);
	}
}

export function globalAngle(e: Entity): number {
	const t = e.get(Transform)!;

	if (e.parent() !== undefined && e.ecs.entity(e.parent()!).has(Transform)) {
		return globalAngle(e.ecs.entity(e.parent()!)) + t.angle;
	} else {
		return 0;
	}
}

export function globalVel(e: Entity): Vec2 {
	const t = e.get(Transform)!;

	if (e.parent() !== undefined && e.ecs.entity(e.parent()!).has(Transform)) {
		return globalVel(e.ecs.entity(e.parent()!)).add(t.vel);
	} else {
		return new Vec2(0, 0);
	}
}

export function globalAvel(e: Entity): number {
	const t = e.get(Transform)!;

	if (e.parent() !== undefined && e.ecs.entity(e.parent()!).has(Transform)) {
		return globalAvel(e.ecs.entity(e.parent()!)) + t.avel;
	} else {
		return 0;
	}
}

function checkTransformCompatibility(ecs: ECS) {
	const hasTime = !!ecs.getResource(Time);

	if (!hasTime) {
		throw new Error(`raxis-plugin-transform requires plugin [raxis-plugin-time]`);
	}
}

export function TransformPlugin(ecs: ECS) {
	ecs.addComponentType(Transform).addStartupSystem(checkTransformCompatibility).addMainSystem(updateTransform);
}
