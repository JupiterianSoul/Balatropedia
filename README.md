# Balatropedia

The unofficial [Balatro](https://www.playbalatro.com/) reference — jokers, synergies, combos, decks, stakes, vouchers, boss blinds, and build helpers.
A Balatro-styled pixel UI with full English / French / Spanish localization.

## Tech Stack

- **Server:** Express (Node.js), serving the API and the pre-built static client in production
- **Client:** React + Vite, Tailwind CSS, shadcn/ui
- **Database:** Neon Postgres via `@neondatabase/serverless` (HTTP driver) with Drizzle ORM (accounts, favorites, saved runs)
- **Auth:** Email/password with bearer-token sessions (token returned by the API and sent via the `Authorization` header)
- **i18n:** Custom `t()` / `useT()` hook backed by JSON dictionaries (EN/FR/ES)

## Local Development

```bash
npm install
npm run dev
```

This runs Express + Vite on the same port (default `5000`). Open http://localhost:5000.

Optional configuration via a `.env` file — see [`.env.example`](./.env.example):

- `NODE_ENV` — `production` serves the built client from `dist/public`; otherwise the Vite dev server runs.
- `DATABASE_URL` — Neon Postgres connection string (required). See setup below.
- `PORT` — listen port. Defaults to `5000`.

## Neon Database Setup

1. Create a free Neon project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, copy the **Connection string** — use the **psql** (non-pooled) format, e.g.:
   ```
   postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   ```
3. Set `DATABASE_URL` in your `.env` (local) or as an environment variable in Render (production).

The server automatically creates all tables on first boot (`CREATE TABLE IF NOT EXISTS`), so no separate migration step is needed.

> **Note:** Neon's free tier suspends the database after ~5 minutes of inactivity. The first request after suspension incurs ~1 s cold start. The free tier is permanent — no time limit.

## Production Build

```bash
npm run build                              # bundles server -> dist/index.cjs, client -> dist/public
NODE_ENV=production node dist/index.cjs    # or: npm run start
```

The build (`script/build.ts`) emits the backend bundle at `dist/index.cjs` and the
static client at `dist/public`. In production the Express server serves both the
API and the static assets on a single port.

Type-check the project with:

```bash
npm run check
```

## Deploying to Render

This repo ships a [`render.yaml`](./render.yaml) Blueprint:

1. Push the project to a GitHub repository.
2. In the Render dashboard choose **New → Blueprint** and point it at the repo.
   Render reads `render.yaml` and provisions a single web service:
   - **Build:** `npm install && npm run build`
   - **Start:** `NODE_ENV=production node dist/index.cjs`
   - **Health check:** `GET /api/auth/me`
   - **Region:** Frankfurt, **Plan:** free
3. In the Render dashboard, set the `DATABASE_URL` environment variable to your Neon connection string. Render prompts for this automatically since `sync: false` is set in `render.yaml`.

> The free plan spins the service down after inactivity; the first request after idle will be slow as it cold-starts. No persistent disk is needed — all data lives in Neon.

## Sprite Proxy & Attribution

Joker and card sprites are proxied through the backend route `GET /api/sprite` to
keep requests same-origin. The proxy only allows images from
`static.wikia.nocookie.net/balatrogame/`. Sprite imagery is sourced from the
[Balatro Wiki](https://balatrogame.fandom.com/) and remains the property of its
respective owners; this project is an unofficial fan-made tool and is not
affiliated with or endorsed by LocalThunk or Playstack.
