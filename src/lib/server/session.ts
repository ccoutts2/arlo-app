import type { RequestEvent } from '../../routes/(app)/$types';
import prisma from './prisma';

const inactivityTimeoutSeconds = 60 * 60 * 24 * 10;
const activityCheckIntervalSeconds = 60 * 60;

function generateSecureRandomString(): string {
    const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);

    let id= '';
    for (let i = 0; i < bytes.length; i++) {
        id += alphabet[bytes[i] >> 3];
    }

    return id;
}


export async function createSession(): Promise<SessionWithToken> {

    const now = new Date();

    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashSecret(secret);

    const token = id + "." + secret;


  await prisma.session.create({
		data: {
			id,
			secretHash: Buffer.from(secretHash),
			createdAt: now,
			lastVerifiedAt: now,
		}
	});

	return {
		id,
		secretHash,
		createdAt: now,
		lastVerifiedAt: now,
		token
	};

}

async function validateSessionToken(token: string): Promise<Session | null> {
	const now = new Date();
	const tokenParts = token.split(".");
	if (tokenParts.length !== 2) {
		return null;
	}
	const sessionId = tokenParts[0];
	const sessionSecret = tokenParts[1];

	const session = await getSession(sessionId);
	if (!session) {
		return null;
	}

	const tokenSecretHash = await hashSecret(sessionSecret);
	const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
	if (!validSecret) {
		return null;
	}

	if (now.getTime() - session.lastVerifiedAt.getTime() >= activityCheckIntervalSeconds * 1000) {
		session.lastVerifiedAt = now;

		await prisma.session.update({
			where: { id: session.id },
			data: {
				lastVerifiedAt: now
			}
		});
	}

	return session;
}

async function getSession(sessionId: string): Promise<Session | null> {
	const now = new Date();

	const session = await prisma.session.findUnique({
		where: { id: sessionId }
	});

	if (!session) {
		return null;
	};

	if (now.getTime() - session.lastVerifiedAt.getTime() >= inactivityTimeoutSeconds * 1000) {
		await deleteSession(session.id);
		return null;
	}

	return session;
}

async function deleteSession(sessionId: string): Promise<void> {
	 await prisma.session.delete({
		where: { id: sessionId }
	});
}

async function hashSecret(secret: string): Promise<Uint8Array> {
    const secretBytes = new TextEncoder().encode(secret);
    const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);

    return new Uint8Array(secretHashBuffer);

}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		maxAge: 0
	});
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}
	let c = 0;
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i];
	}
	return c === 0;
}

interface SessionWithToken extends Session {
	token: string;
}

interface Session {
    id: string;
    secretHash: Uint8Array;
    createdAt: Date;
	lastVerifiedAt: Date;  
}