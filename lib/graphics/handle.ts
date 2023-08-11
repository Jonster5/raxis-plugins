import { Canvas } from './canvas';

export class Handle {
	readonly id: `${string}-${string}-${string}-${string}-${string}` = crypto.randomUUID();
}

export async function loadImageInto(canvas: Canvas, image: ImageBitmapSource): Promise<Handle> {
	const handle = new Handle();
	const bitmap = await createImageBitmap(image);

	canvas.controller.postMessage({
		type: 'load-image',
		body: {
			id: handle.id,
			image: bitmap,
		},
	});

	return handle;
}
