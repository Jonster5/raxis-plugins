import { Resource, ECS } from 'raxis';

export class Assets extends Resource {
	[key: string]: any;
}

export async function loadImageFile(url: string): Promise<HTMLImageElement> {
	const img: Promise<HTMLImageElement> = new Promise((res) => {
		const i = new Image(100, 100);
		i.src = url;

		i.onload = () => res(i);
	});

	return img;
}

export async function loadImages(...urls: string[]): Promise<HTMLImageElement[]> {
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
