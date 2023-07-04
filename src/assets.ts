import { Resource, ECS } from 'raxis';

export class Assets extends Resource {
	[key: string]: any;
}

export function loadImageFile(url: string): Promise<HTMLElement> {
	return new Promise((res) => {
		const i = new Image(100, 100);
		i.src = url;

		i.onload = () => res(i);
	});
}

export async function loadImages(...urls: string[]) {
	return Promise.all(urls.map(loadImageFile));
}

export async function loadJSONFile(url: string): Promise<any> {
	const r = await fetch(url);
	return await r.json();
}

export function loadJSON(...urls: string[]) {
	return Promise.all(urls.map(loadJSONFile));
}

export async function loadSoundFile(url: string) {
	const f = await fetch(url);

	return new AudioContext().decodeAudioData(await f.arrayBuffer(), null, (error) => console.error(error));
}

export async function loadSounds(...urls: string[]) {
	return Promise.all(urls.map((url) => loadSoundFile(url)));
}

export function AssetsPlugin(ecs: ECS) {
	ecs.insertResource(new Assets());
}
