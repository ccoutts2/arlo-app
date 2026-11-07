import { hash, verify } from '@node-rs/argon2';

// OWASP-recommended argon2id parameters.
const OPTIONS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const hashPassword = (password: string) => hash(password, OPTIONS);
export const verifyPasswordHash = (hashed: string, password: string) => verify(hashed, password);
