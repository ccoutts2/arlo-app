import { z } from 'zod/v4';

// Trim and lower-case first (iOS autofill can add spaces), then check the format.
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.'));

export const signupSchema = z.object({
	givenName: z.string().trim().min(1, 'Tell us your first name.').max(60),
	email,
	password: z.string().min(8, 'Use at least 8 characters.').max(200)
});

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Enter your password.').max(200)
});
