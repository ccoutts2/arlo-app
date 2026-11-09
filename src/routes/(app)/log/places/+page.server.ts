import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { verdict } from '$lib/server/places';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { householdId } = await requireMember(locals);
	const status = url.searchParams.get('status');
	const places = await prisma.place.findMany({
		where: { householdId, ...(status === 'WISHLIST' || status === 'BEEN' ? { status } : {}) },
		orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
		include: {
			walks: { select: { rating: true, occurredAt: true }, orderBy: { occurredAt: 'desc' } }
		}
	});
	return {
		status,
		places: places.map((p) => ({
			id: p.id,
			name: p.name,
			status: p.status,
			lat: p.lat,
			lng: p.lng,
			recommendedBy: p.recommendedBy,
			tags: p.tags,
			verdict: verdict(p.walks.map((w) => w.rating)),
			lastWalk:
				p.walks[0]?.occurredAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) ??
				null
		}))
	};
};
