# BC WooBoost AI API

Production backend API for the BC WooBoost AI WordPress plugin.

## Stack

- Next.js
- TypeScript
- Node.js runtime on Vercel
- PostgreSQL, ideally Neon
- OpenAI Responses API

## Public base URL

Set the WordPress plugin `api_base_url` to:

```text
https://api.bitwisecode.com/v1
```

## Endpoints

- `GET /v1/health`
- `POST /v1/site/connect`
- `GET /v1/credits/balance`
- `POST /v1/optimize-description`

## Features

- site registration and token issuance
- hashed site token authentication
- monthly free credits plus paid credits
- structured request logging
- credit deduction only after successful AI generation
- no OpenAI key exposure to the plugin frontend
- modular services so FAQ generation can be added later

## Environment

Copy `.env.example` to `.env` and fill in the real values.

## Database

Run the SQL migration after creating the database:

```bash
node scripts/migrate.mjs
```

## Local development

```bash
npm run dev
```

## Deployment

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add all environment variables from `.env.example`.
4. Create a Neon Postgres database and use its connection values.
5. Run the migration against production.
6. Attach `api.bitwisecode.com` in Vercel Domains.
7. Update the WordPress plugin `api_base_url` setting.

## Notes

- `own_api_key` mode currently supports a temporary `provider_api_key` in the server-to-server payload.
- A stronger future version should store merchant API keys encrypted at rest instead of accepting them on optimize calls.
- The in-memory rate limiter is a scaffold. For multi-instance production, replace it with Redis or Upstash.
# bc-wooboost-ai-api
