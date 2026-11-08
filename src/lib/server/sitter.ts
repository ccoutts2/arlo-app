import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import prisma from './prisma';

const hash = (token: string) => encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

export async function createSitterLink(
	householdId: string,
	createdById: string,
	sitterName: string,
	days: number
) {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	await prisma.sitterLink.create({
		data: {
			tokenHash: hash(token),
			sitterName,
			householdId,
			createdById,
			expiresAt: new Date(Date.now() + days * 86400000)
		}
	});
	return token;
}

/** The live sitter link for a token, or null if it's unknown, cancelled or expired. */
export async function findSitterLink(token: string) {
	const link = await prisma.sitterLink.findUnique({
		where: { tokenHash: hash(token) },
		include: { household: { select: { id: true, name: true, timezone: true } } }
	});
	if (!link || link.revokedAt || link.expiresAt < new Date()) return null;
	return link;
}
