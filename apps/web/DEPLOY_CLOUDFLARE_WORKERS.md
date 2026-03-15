# Cloudflare Workers Deployment (Web)

## 1. Prerequisites

- Cloudflare account
- `apps/web` Next.js app builds successfully
- API endpoint already deployed (or available publicly)

## 2. Prepare env files

1. Create `.dev.vars` from `.dev.vars.example` for local worker testing.
2. Create `.env.production` with production values for `NEXT_PUBLIC_*` variables.

Example `.env.production`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

## 3. Login to Cloudflare

```bash
cd apps/web
npx -y wrangler@latest login
```

## 4. Build for Workers

```bash
npm run cf:build
```

This generates `.open-next/worker.js` and `.open-next/assets` used by `wrangler.toml`.

## 5. Local test on Workers runtime

```bash
npm run cf:dev
```

## 6. Deploy

```bash
npm run cf:deploy
```

## 7. Optional: set runtime vars/secrets in Cloudflare

Add non-secret runtime vars in `wrangler.toml` as needed:

```toml
[vars]
SUPABASE_URL = "https://your-project.supabase.co"
```

For sensitive values used server-side, set secrets:

```bash
npx -y wrangler@latest secret put SUPABASE_SERVICE_ROLE_KEY
```

## Notes

- This setup targets `apps/web` deployment on Cloudflare Workers.
- `apps/api` is Express-based and is not directly converted to a Worker in this change.
- If you also want API on Workers, a separate refactor (e.g. Hono/Fetch handler) is required.
