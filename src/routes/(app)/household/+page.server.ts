import { error, fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { createInvite } from '$lib/server/invites';
import { createSitterLink } from '$lib/server/sitter';
import { usage } from '$lib/server/maps/usage';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { householdId } = await requireMember(locals);
	const invites = await prisma.invite.findMany({
		where: { householdId, revokedAt: null, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: 'desc' },
		select: { id: true, expiresAt: true, uses: true, createdBy: { select: { givenName: true } } }
	});
	const sitterLinks = await prisma.sitterLink.findMany({
		where: { householdId, revokedAt: null, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: 'desc' },
		select: { id: true, sitterName: true, expiresAt: true }
	});
	const me = await prisma.user.findUnique({
		where: { id: locals.user!.id },
		select: { calendarTokenHash: true }
	});
	return {
		invites,
		sitterLinks,
		calendarOn: Boolean(me?.calendarTokenHash),
		mapUsage: { maps: await usage('MAP_LOAD'), searches: await usage('GEOCODE') }
	};
};

export const actions = {
	calendar: async ({ locals, url }) => {
		const { user } = await requireMember(locals);
		const bytes = new Uint8Array(20);
		crypto.getRandomValues(bytes);
		const token = encodeBase32LowerCaseNoPadding(bytes);
		await prisma.user.update({
			where: { id: user.id },
			data: { calendarTokenHash: encodeHexLowerCase(sha256(new TextEncoder().encode(token))) }
		});
		const feed = `${url.host}/api/calendar/${token}.ics`;
		return { calendarUrl: `https://${feed}`, webcalUrl: `webcal://${feed}` };
	},
	calendarOff: async ({ locals }) => {
		const { user } = await requireMember(locals);
		await prisma.user.update({ where: { id: user.id }, data: { calendarTokenHash: null } });
		return { calendarOff: true };
	},
	sitter: async ({ locals, request, url }) => {
		const { householdId, user } = await requireMember(locals);
		const f = await request.formData();
		const name = String(f.get('sitterName') ?? '').trim();
		const days = Number(f.get('days'));
		if (!name || name.length > 40) return fail(400, { sitterError: 'Add the sitter’s name.' });
		if (![1, 2, 3, 7, 14].includes(days))
			return fail(400, { sitterError: 'Pick how long the link should last.' });
		const token = await createSitterLink(householdId, user.id, name, days);
		return { sitterUrl: `${url.origin}/sitter/${token}`, sitterName: name };
	},
	revokeSitter: async ({ locals, request }) => {
		const { householdId } = await requireMember(locals);
		const id = String((await request.formData()).get('id') ?? '');
		await prisma.sitterLink.updateMany({
			where: { id, householdId },
			data: { revokedAt: new Date() }
		});
		return { sitterRevoked: true };
	},
	invite: async ({ locals, url }) => {
		const { householdId, user } = await requireMember(locals);
		const { token } = await createInvite(householdId, user.id);
		return { inviteUrl: `${url.origin}/join/${token}` };
	},
	revoke: async ({ locals, request }) => {
		const { householdId } = await requireMember(locals);
		const id = String((await request.formData()).get('id') ?? '');
		await prisma.invite.updateMany({ where: { id, householdId }, data: { revokedAt: new Date() } });
		return { revoked: true };
	},
	rename: async ({ locals, request }) => {
		const { householdId } = await requireMember(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name || name.length > 60) return fail(400, { renameError: 'Use 1 to 60 characters.' });
		await prisma.household.update({ where: { id: householdId }, data: { name } });
		return { renamed: true };
	},
	remove: async ({ locals, request }) => {
		const { householdId, user, role } = await requireMember(locals);
		if (role !== 'OWNER') error(403, 'Only the owner can remove people.');
		const userId = String((await request.formData()).get('userId') ?? '');
		if (userId === user.id)
			return fail(400, { removeError: 'Use “Leave household” to remove yourself.' });
		await moveToOwnHousehold(userId, householdId);
		return { removed: true };
	},
	leave: async ({ locals }) => {
		const { householdId, user, role } = await requireMember(locals);
		const others = await prisma.householdMember.findMany({
			where: { householdId, userId: { not: user.id } },
			orderBy: { createdAt: 'asc' }
		});
		if (!others.length)
			return fail(400, { leaveError: 'You’re the only person here, so there’s nothing to leave.' });
		if (role === 'OWNER') {
			await prisma.householdMember.update({ where: { id: others[0].id }, data: { role: 'OWNER' } });
		}
		await moveToOwnHousehold(user.id, householdId);
		redirect(303, '/');
	}
} satisfies Actions;

/** Takes someone out of a household and gives them a fresh one of their own. */
async function moveToOwnHousehold(userId: string, fromHouseholdId: string) {
	const member = await prisma.householdMember.findUnique({
		where: { householdId_userId: { householdId: fromHouseholdId, userId } },
		include: { user: { select: { givenName: true } } }
	});
	if (!member) return;
	await prisma.$transaction([
		prisma.householdMember.delete({ where: { id: member.id } }),
		prisma.household.create({
			data: {
				name: `${member.user.givenName}’s household`,
				members: { create: { userId, role: 'OWNER' } }
			}
		})
	]);
}
