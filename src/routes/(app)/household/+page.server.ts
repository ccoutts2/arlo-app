import { error, fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireMember } from '$lib/server/access';
import { createInvite } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { householdId } = await requireMember(locals);
	const invites = await prisma.invite.findMany({
		where: { householdId, revokedAt: null, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: 'desc' },
		select: { id: true, expiresAt: true, uses: true, createdBy: { select: { givenName: true } } }
	});
	return { invites };
};

export const actions = {
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
