import { Component, ECS, Entity, MemPool } from 'raxis';
import { Vec2 } from 'raxis';
import { Time } from './time';

export class Transform extends Component {
	private static sbuf: Float64Array = new Float64Array(new ArrayBuffer(88));
	static readonly pool: MemPool<Transform> = new MemPool(() => new Transform(), {
		size: 100,
		growBy: 250,
		sanitizer: (t) => {
			t.size.x = 0;
			t.size.y = 0;
			t.pos.x = 0;
			t.pos.y = 0;
			t.angle = 0;
			t.vel.x = 0;
			t.vel.y = 0;
			t.avel = 0;
			t.last.pos.x = 0;
			t.last.pos.y = 0;
			t.last.angle = 0;
			t.poolAllocated = true;
		},
	});

	private poolAllocated: boolean;

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
		this.poolAllocated = false;
	}

	static create(
		size: Vec2 = new Vec2(0, 0),
		pos: Vec2 = new Vec2(0, 0),
		angle: number = 0,
		vel: Vec2 = new Vec2(0, 0),
		avel: number = 0,
		last: {
			pos: Vec2;
			angle: number;
		} = {
			pos: pos.clone(),
			angle,
		}
	) {
		const nt = this.pool.use();

		nt.size = size;
		nt.pos = pos;
		nt.angle = angle;
		nt.vel = vel;
		nt.avel = avel;
		nt.last = last;
		nt.poolAllocated = true;

		return nt;
	}

	onDestroy(): void {
		if (this.poolAllocated) Transform.pool.free(this);
	}

	clone() {
		return new Transform(this.size.clone(), this.pos.clone(), this.angle, this.vel.clone(), this.avel, {
			pos: this.last.pos.clone(),
			angle: this.last.angle,
		});
	}

	cloneInto(other: Transform): Transform {
		other.size.x = this.size.x;
		other.size.y = this.size.y;
		other.pos.x = this.pos.x;
		other.pos.y = this.pos.y;
		other.angle = this.angle;
		other.vel.x = this.vel.x;
		other.vel.y = this.vel.y;
		other.avel = this.avel;
		other.last.pos.x = this.last.pos.x;
		other.last.pos.y = this.last.pos.y;
		other.last.angle = this.last.angle;

		return other;
	}

	serialize() {
		return new Float64Array([
			...this.size,
			...this.pos,
			this.angle,
			...this.vel,
			this.avel,
			...this.last.pos,
			this.last.angle,
		]).buffer;
	}

	serializeUnsafe(): ArrayBuffer {
		Transform.sbuf[0] = this.size.x;
		Transform.sbuf[1] = this.size.y;
		Transform.sbuf[2] = this.pos.x;
		Transform.sbuf[3] = this.pos.y;
		Transform.sbuf[4] = this.angle;
		Transform.sbuf[5] = this.vel.x;
		Transform.sbuf[6] = this.vel.y;
		Transform.sbuf[7] = this.avel;
		Transform.sbuf[8] = this.last.pos.x;
		Transform.sbuf[9] = this.last.pos.y;
		Transform.sbuf[10] = this.last.angle;

		return Transform.sbuf.buffer;
	}

	setFromBuffer(buffer: ArrayBuffer) {
		if (buffer.byteLength !== 88) {
			throw new Error('Buffer must be 88 bytes');
		}

		const view = new Float64Array(buffer);

		this.size.x = view[0];
		this.size.y = view[1];
		this.pos.x = view[2];
		this.pos.y = view[3];
		this.angle = view[4];
		this.vel.x = view[5];
		this.vel.y = view[6];
		this.avel = view[7];
		this.last.pos.x = view[8];
		this.last.pos.y = view[9];
		this.last.angle = view[10];
	}

	static deserialize(buffer: ArrayBuffer): Transform {
		if (!(buffer instanceof ArrayBuffer)) throw new Error('An ArrayBuffer must be used');
		const v = new Float64Array(buffer);

		return new Transform(new Vec2(v[0], v[1]), new Vec2(v[2], v[3]), v[4], new Vec2(v[5], v[6]), v[7], {
			pos: new Vec2(v[8], v[9]),
			angle: v[10],
		});
	}
}

function updateTransform(ecs: ECS) {
	const time = ecs.getResource(Time)!;

	const transforms = ecs.query([Transform]).results();
	const mul = (time.delta * time.speed) / 1000;

	for (const [t] of transforms) {
		t.last.pos.set(t.pos);
		t.last.angle = t.angle;

		t.pos.x += t.vel.x * mul;
		t.pos.y += t.vel.y * mul;
		t.angle += t.avel * mul;
	}
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
