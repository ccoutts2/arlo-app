import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import prisma from './prisma';

const INVITE_DAYS = 7;
const hash = (token: string) => encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

export async function createInvite(householdId: string, createdById: string) {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	const invite = await prisma.invite.create({
		data: {
			tokenHash: hash(token),
			householdId,
			createdById,
			expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000)
		}
	});
	return { token, invite };
}

/** A usable invite for this token, with who sent it and the household, or null. */
export async function findInvite(token: string) {
	const invite = await prisma.invite.findUnique({
		where: { tokenHash: hash(token) },
		include: {
			household: { select: { id: true, name: true } },
			createdBy: { select: { givenName: true } }
		}
	});
	if (!invite || invite.revokedAt || invite.expiresAt < new Date()) return null;
	return invite;
}

/**
 * Moves a user into the invite's household. People belong to one household, so their old one is
 * deleted if it's just them and has no dogs; otherwise we ask them to leave it first.
 */
export async function acceptInvite(token: string, userId: string) {
	const invite = await findInvite(token);
	if (!invite)
		return { ok: false as const, reason: 'This invite link has expired or been cancelled.' };

	return prisma.$transaction(async (tx) => {
		const current = await tx.householdMember.findMany({
			where: { userId },
			include: {
				household: { select: { id: true, _count: { select: { members: true, pets: true } } } }
			}
		});
		if (current.some((m) => m.householdId === invite.householdId)) {
			return { ok: true as const, householdId: invite.householdId };
		}
		for (const m of current) {
			const { members, pets } = m.household._count;
			if (members > 1 || pets > 0) {
				return {
					ok: false as const,
					reason: 'You already share dogs in another household. Leave it first, then use this link.'
				};
			}
		}
		// The user's own empty household goes; they join the inviting one.
		await tx.household.deleteMany({ where: { id: { in: current.map((m) => m.householdId) } } });
		await tx.householdMember.create({
			data: { householdId: invite.householdId, userId, role: 'MEMBER' }
		});
		await tx.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
		return { ok: true as const, householdId: invite.householdId };
	});
}
