import type { User } from '../../../prisma/src/generated/prisma/client';
import type { RequestEvent } from "@sveltejs/kit";
import prisma from './prisma';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session = await prisma.session.findUnique({
		where: { 
			id: sessionId,
			expiresAt: {
				gt: new Date()
			},
		},
		include: {
			user: true 
		}
	});

	if (session === null) {
		return { session: null, user: null}
	}

	const { user, ...sessionData } = session;

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

		await prisma.session.update({
			where: { id: sessionId},
			data: { 
				expiresAt: session.expiresAt
			}
		})
	}

	return {
		session: sessionData,
		user
	}
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.session.delete({
		where: { id: sessionId }
	})
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	await prisma.session.deleteMany({
		where: { userId: userId }
	})
}

export async function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): Promise<void> {
	event.cookies.set("session", token, {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		expires: expiresAt
	})
}

export async function deleteSessionTokenCookie(event: RequestEvent): Promise<void> {
	event.cookies.set("session", "", {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 0
	})
}

export async function generateSessionToken(): Promise<string> {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
	return token;
}

export async function createSession(token: string, userId: string): Promise<Session | null> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	}

	await prisma.session.create({
	
		data: { 
			id: session.id,
			userId: session.userId,
			expiresAt: session.expiresAt	
		}
	})

	return session;
}

interface Session {
    id: string;
    expiresAt: Date;
	userId: string;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };