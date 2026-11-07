import type { Session, SessionUser } from '$lib/server/session';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
			session: Session | null;
		}
	}
}

export {};
