# Deployment Guide

## Recommended setup

- GitHub repository: `bc-wooboost-ai-api`
- Hosting: Vercel
- Domain: `api.bitwisecode.com`
- Database: Neon Postgres

## Deploy on Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables from `.env.example`.
4. Set the framework to Next.js if Vercel does not auto-detect it.
5. Deploy once so the app is live.

## Database

1. Create a Neon Postgres database.
2. Copy the host, port, database name, user, and password into Vercel env vars.
3. Run the SQL in `database/schema.sql` against that database.
4. Optionally run `node scripts/migrate.mjs` from a local machine or CI job with the same env values.

## Domain

1. In Vercel, open the project `Domains` section.
2. Add `api.bitwisecode.com`.
3. Update DNS at BitwiseCode to the Vercel target shown there.
4. Wait for SSL issuance to complete.

## WordPress plugin

After deployment, set the plugin `api_base_url` to:

```text
https://api.bitwisecode.com/v1
```

## Production follow-up

- Replace the in-memory rate limiter with Redis or Upstash.
- Add encrypted storage for merchant-provided API keys if you keep `own_api_key` mode.
- Add admin tooling for paid-credit top-ups and reporting.
