import { error } from '@sveltejs/kit';
import { get } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import prisma from '$lib/server/prisma';
import { findSitterLink } from '$lib/server/sitter';
import type { RequestHandler } from './$types';

// Dog photos for the sitter card: only files belonging to the link's household.
export const GET: RequestHandler = async ({ params }) => {
	const link = await findSitterLink(params.token);
	if (!link) error(404, 'Not found');
	const file = await prisma.file.findFirst({
		where: { id: params.fileId, householdId: link.householdId, kind: 'PHOTO' }
	});
	if (!file) error(404, 'Not found');
	const result = await get(file.pathname, { access: 'private', token: env.BLOB_READ_WRITE_TOKEN });
	if (!result || result.statusCode !== 200) error(404, 'Not found');
	return new Response(result.stream, {
		headers: { 'content-type': file.contentType, 'cache-control': 'private, max-age=3600' }
	});
};
