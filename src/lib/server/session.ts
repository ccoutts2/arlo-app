import type { RequestEvent } from '@sveltejs/kit';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { User } from '$lib/server/generated/prisma/client';
import prisma from './prisma';

const DAY = 1000 * 60 * 60 * 24;
const SESSION_LENGTH = 30 * DAY;
const RENEW_WITHIN = 15 * DAY;
export const SESSION_COOKIE = 'session';

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
}

export type SessionUser = Pick<User, 'id' | 'email' | 'givenName' | 'familyName'>;
export type SessionValidationResult =
	| { session: Session; user: SessionUser }
	| { session: null; user: null };

const hashToken = (token: string) => encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(token: string, userId: string): Promise<Session> {
	const session: Session = {
		id: hashToken(token),
		userId,
		expiresAt: new Date(Date.now() + SESSION_LENGTH)
	};
	await prisma.session.create({ data: session });
	return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const id = hashToken(token);
	const row = await prisma.session.findUnique({
		where: { id },
		include: { user: { select: { id: true, email: true, givenName: true, familyName: true } } }
	});
	if (!row) return { session: null, user: null };

	if (Date.now() >= row.expiresAt.getTime()) {
		// Expired sessions are removed, not just ignored.
		await prisma.session.delete({ where: { id } }).catch(() => {});
		return { session: null, user: null };
	}

	const { user, ...session } = row;
	if (Date.now() >= session.expiresAt.getTime() - RENEW_WITHIN) {
		session.expiresAt = new Date(Date.now() + SESSION_LENGTH);
		await prisma.session.update({ where: { id }, data: { expiresAt: session.expiresAt } });
	}
	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	await prisma.session.deleteMany({ where: { userId } });
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		path: '/',
		secure: !import.meta.env.DEV,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set(SESSION_COOKIE, '', {
		httpOnly: true,
		path: '/',
		secure: !import.meta.env.DEV,
		sameSite: 'lax',
		maxAge: 0
	});
}

/** Shared by sign-up and log-in: create a session and set its cookie. */
export async function startSession(event: RequestEvent, userId: string): Promise<void> {
	const token = generateSessionToken();
	const session = await createSession(token, userId);
	setSessionTokenCookie(event, token, session.expiresAt);
}
