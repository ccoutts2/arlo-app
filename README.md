# Lead

Your dog's reminders, training and log, shared with your household. An installable PWA (iPhone first), built with SvelteKit 5, Tailwind v4, Prisma 7 on Neon, and Vercel.

## Setup

```sh
npm install
npx vercel link            # project: arlo-app
npx vercel env pull .env.local   # Development env = the DEV database and dev Blob store
```

`.prod-host` (git-ignored) holds the production database endpoint id. `scripts/guard-dev-db.mjs` uses it to refuse migrations or tests against production.

## Scripts

| Command              | What it does                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Dev server                                                                                                                             |
| `npm run check`      | Generate the Prisma client, then type-check                                                                                            |
| `npm run db:migrate` | Create and apply a migration on the **dev** database (guarded)                                                                         |
| `npm run db:deploy`  | Apply pending migrations (used for production on deploy)                                                                               |
| `npm run test:unit`  | Vitest                                                                                                                                 |
| `npm run test:e2e`   | Playwright on a production build against the **dev** database (guarded). Test users use `@lead.test` emails and are removed afterwards |

## Databases

- **lead-prod**: Vercel Production environment.
- **lead-dev**: Vercel Development and Preview environments, and local `.env.local`.

Vercel runs `npm run vercel-build`, which applies committed migrations with `prisma migrate deploy` (never a reset) before building. Any migration that drops or rewrites data is called out in its PR and needs sign-off before it reaches `main`.

Nothing is ever deleted from production without explicit sign-off.
