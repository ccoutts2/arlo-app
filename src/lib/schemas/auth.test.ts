import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from './auth';

describe('signupSchema', () => {
	it('normalises email to lower case without spaces', () => {
		const r = signupSchema.parse({
			givenName: ' Chris ',
			email: ' Chris@Example.COM ',
			password: 'longenough'
		});
		expect(r.email).toBe('chris@example.com');
		expect(r.givenName).toBe('Chris');
	});
	it('rejects short passwords and missing names', () => {
		const r = signupSchema.safeParse({ givenName: '', email: 'a@b.co', password: 'short' });
		expect(r.success).toBe(false);
		const fields = r.error!.issues.map((i) => i.path[0]);
		expect(fields).toContain('givenName');
		expect(fields).toContain('password');
	});
	it('rejects invalid email', () => {
		expect(
			signupSchema.safeParse({ givenName: 'A', email: 'nope', password: 'longenough' }).success
		).toBe(false);
	});
});

describe('loginSchema', () => {
	it('accepts any non-empty password (length rules only apply at sign-up)', () => {
		expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
	});
	it('requires a password', () => {
		expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
	});
});
