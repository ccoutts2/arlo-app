// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from "../prisma/src/generated/prisma/client";
import type { Session } from "../prisma/src/generated/prisma/client";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
