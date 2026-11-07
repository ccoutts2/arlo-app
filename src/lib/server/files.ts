import { del, put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import prisma from './prisma';

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Vercel functions accept bodies up to 4.5 MB.
const PHOTO_TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

export function photoProblem(file: File | null): string | null {
	if (!file || file.size === 0) return null;
	if (!PHOTO_TYPES[file.type]) return 'Use a JPEG, PNG or WebP photo.';
	if (file.size > MAX_PHOTO_BYTES) return 'That photo is too large. Try one under 4 MB.';
	return null;
}

/** Stores a photo in the private Blob store and records it. Call photoProblem() first. */
export async function savePhoto(
	file: File,
	ctx: { householdId: string; petId: string; userId: string }
) {
	const ext = PHOTO_TYPES[file.type];
	const pathname = `households/${ctx.householdId}/pets/${ctx.petId}/${crypto.randomUUID()}.${ext}`;
	await put(pathname, file, {
		access: 'private',
		contentType: file.type,
		token: env.BLOB_READ_WRITE_TOKEN
	});
	return prisma.file.create({
		data: {
			kind: 'PHOTO',
			pathname,
			contentType: file.type,
			size: file.size,
			householdId: ctx.householdId,
			petId: ctx.petId,
			uploadedById: ctx.userId
		}
	});
}

/** Removes files from Blob and the database. */
export async function deleteFiles(files: { id: string; pathname: string }[]) {
	if (!files.length) return;
	await del(
		files.map((f) => f.pathname),
		{ token: env.BLOB_READ_WRITE_TOKEN }
	).catch((e) => console.error('blob delete failed', e));
	await prisma.file.deleteMany({ where: { id: { in: files.map((f) => f.id) } } });
}
