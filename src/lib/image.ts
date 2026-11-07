/**
 * Shrinks a photo in the browser before upload (long edge 1600 px, JPEG ~0.82).
 * Safari decodes HEIC from the iPhone camera, so this also converts those to JPEG.
 */
export async function shrinkPhoto(file: File, maxEdge = 1600): Promise<File> {
	if (!file.type.startsWith('image/')) return file;
	const bitmap = await createImageBitmap(file).catch(() => null);
	if (!bitmap) return file;
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
	if (!blob) return file;
	return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}
