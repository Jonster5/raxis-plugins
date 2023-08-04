import './style.scss';
import { Component, ECS, Resource, With } from 'raxis';
import {
	Assets,
	Canvas,
	CanvasSettings,
	InputEvent,
	Inputs,
	KeysToTrack,
	ParticleGenerator,
	ReadyToRenderEvent,
	SocketMessageEvent,
	Sprite,
	SpriteText,
	Time,
	Transform,
	checkTimer,
	createSocket,
	decodeString,
	defaultPlugins,
	encodeString,
	getSocket,
	loadImageFile,
	setTimer,
	stitch,
	unstitch,
} from 'raxis-plugins';
import { Vec2 } from 'raxis';

const app = document.getElementById('app')!;

class Square extends Component {}
class FPScounter extends Component {}

function makeFPSCounter(ecs: ECS) {
	const [{ size }] = ecs.query([Transform], With(Canvas)).single()!;

	ecs.spawn(
		new FPScounter(),
		new Transform(new Vec2(0, 30), new Vec2(-size.x / 2 + 5, size.y / 2 - 20)),
		new Sprite('text', { color: 'white', textAlign: 'left' }),
		new SpriteText('FPS: \nEntities: 1231')
	);
}

class FPSLog extends Resource {
	constructor(public updates: number[] = [], public frames: number[] = []) {
		super();
	}
}

function updateFPSCounter(ecs: ECS) {
	if (!ecs.hasLocalResource(FPSLog)) ecs.insertLocalResource(new FPSLog());
	const time = ecs.getResource(Time)!;
	const [{ lastOpTime }] = ecs.query([Canvas]).single()!;

	const { updates, frames } = ecs.getLocalResource(FPSLog)!;
	updates.push(1000 / time.delta);
	frames.push(1000 / lastOpTime);

	if (checkTimer(ecs)) return;
	const [text] = ecs.query([SpriteText], With(FPScounter)).single()!;

	text.value = `UPS: ${Math.round(updates.reduce((a, b) => a + b) / updates.length)} / FPS: ${Math.round(
		frames.reduce((a, b) => a + b) / frames.length
	)} / Entities: ${ecs.entityCount()} / REpU: ${ecs.getEventReader(ReadyToRenderEvent).get().length}`;

	ecs.removeLocalResource(FPSLog);
	setTimer(ecs, 1000);
}

async function loadSquareAssets(ecs: ECS) {
	const assets = ecs.getResource(Assets);

	assets['square'] = await loadImageFile('/image0.png');
}

function makeSquare(ecs: ECS) {
	const assets = ecs.getResource(Assets);

	const square = ecs.spawn(
		new Square(),
		new Transform(new Vec2(10, 10)),
		new Sprite('image', [assets['square']]),
		new ParticleGenerator(
			20,
			(t, s) => {
				s.type = 'rectangle';
				s.material = 'blue';

				t.size.set(10, 10);
				t.vel.random().mul(100);
				t.vel.clampMag(0, 100);

				if (Math.random() > 0.8) {
					s.material = 'white';
					s.ZIndex = 1;
				}
			},
			1000,
			80,
			true
		)
	);

	square.addChild(
		ecs.spawn(
			new Transform(new Vec2(0, 15), new Vec2(0, -30)),
			new Sprite('text', {
				font: 'Helvetica',
				color: 'white',
			}),
			new SpriteText('(0, 0)')
		)
	);
}

function controlPGen(ecs: ECS) {
	const [gen] = ecs.query([ParticleGenerator, Transform], With(Square)).single()!;

	ecs.getEventReader(InputEvent)
		.get()
		.forEach((e) => {
			const { type, event }: InputEvent<'pointerdown'> = e!;

			if (type === 'pointerdown') {
				if (event.button === 0) {
					gen.duration += 100;
				} else if (event.button === 2) {
					gen.duration -= 100;
				}
			}
		});
}

function moveSquare(ecs: ECS) {
	const [t] = ecs.query([Transform], With(Square)).single()!;
	const { pointer } = ecs.getResource(Inputs)!;

	t.pos.set(pointer.ray.pos);
}

function updateSquareText(ecs: ECS) {
	const [{ pos }] = ecs.query([Transform], With(Square)).single()!;
	const text = ecs.entity(ecs.query([], With(Square)).entity()!.children(With(SpriteText))[0]).get(SpriteText)!;

	text.value = `(${Math.round(pos.x)}, ${Math.round(pos.y)})`;
}

function wrapSquare(ecs: ECS) {
	const [{ pos }] = ecs.query([Transform], With(Square)).single()!;
	const [ct] = ecs.query([Transform], With(Canvas)).single()!;

	const hcs = ct.size.clone().div(2);

	if (pos.x > hcs.width) pos.x = -hcs.width;
	else if (pos.x < -hcs.width) pos.x = hcs.width;

	if (pos.y > hcs.height) pos.y = -hcs.height;
	else if (pos.y < -hcs.height) pos.y = hcs.height;
}

const ecs = new ECS()
	.insertPlugins(...defaultPlugins)
	.insertResource(new CanvasSettings({ target: app, width: 3000 }))
	.insertResource(new KeysToTrack([]))
	.addComponentTypes(Square, FPScounter)
	.addStartupSystems(loadSquareAssets, makeSquare, makeFPSCounter)
	.addMainSystems(moveSquare, wrapSquare, updateSquareText, updateFPSCounter, controlPGen);

ecs.run();
