import { error } from '@sveltejs/kit';
import { get } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

// Private files are only ever served to members of the household that owns them.
export const GET: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) error(404, 'Not found');
	const file = await prisma.file.findFirst({
		where: { id: params.id, household: { members: { some: { userId: locals.user.id } } } }
	});
	if (!file) error(404, 'Not found');

	const result = await get(file.pathname, {
		access: 'private',
		token: env.BLOB_READ_WRITE_TOKEN,
		ifNoneMatch: request.headers.get('if-none-match') ?? undefined
	});
	if (!result) error(404, 'Not found');
	const headers = { 'cache-control': 'private, max-age=86400', vary: 'cookie' };
	if (result.statusCode === 304)
		return new Response(null, { status: 304, headers: { ...headers, etag: result.blob.etag } });
	return new Response(result.stream, {
		headers: { ...headers, 'content-type': file.contentType, etag: result.blob.etag }
	});
};
