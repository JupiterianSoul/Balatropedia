# Balatropedia

[![Live Site](https://img.shields.io/badge/Live%20Site-balatro--explorer--m22k.onrender.com-blue)](https://balatro-explorer-m22k.onrender.com)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Backend-Express-000000?logo=express)](https://expressjs.com)

**Balatropedia** is a fan-made strategy reference and companion for [Balatro](https://www.playbalatro.com/), the indie deckbuilder by LocalThunk and Playstack. It covers every joker, synergy, combo blueprint, and game mechanic in one searchable, Balatro-styled interface, with full English, French, and Spanish localization.

**Live:** https://balatro-explorer-m22k.onrender.com

> **Note:** The site runs on Render's free tier (Frankfurt region). After a period of inactivity, the first request may take up to 30 seconds while the server cold-starts. Subsequent requests are fast.

---

## Features

### Reference Library

- **150 Jokers** with full effect descriptions, scaling behavior, archetypes, and tags
- **Boss Blinds, Decks, Stakes, Vouchers** with mechanics and notes
- **Consumables** (Tarots, Planets, Spectrals)
- **Modifiers** covering enhancements, editions, seals, and tags
- **Archetypes and Glossary** for terminology and build concepts

### Strategy Tools

- **Synergy Explorer** with curated joker pairings and citations to community sources
- **Combos tab** for archetype combo blueprints and multi-joker setups
- **My Run planner**: pick your deck, stake, and vouchers, then fill up to 10 joker slots with live synergy detection as you build
- **Compare**: put 2 to 6 jokers side-by-side to evaluate their interactions
- **Skeleton builder**: design engine-category builds from the ground up
- **Heatmap**: visualize how a single joker pairs with every other joker in the pool

### User Experience

- **Favorites**: star any joker, card, or item for quick access
- **Saved runs**: sign in to sync your run planners across devices
- **Theme selector**: Felt, Midnight, or Parchment
- **Sound effects**: synthesized in-browser, no external audio assets
- **Full localization**: English, French, Spanish (Spanish partly machine-translated)
- **About tab** with sourced citations for all strategy content

### Accounts

Sign in with email and password to:
- Sync favorites across devices
- Save and reload run configurations

No third-party OAuth required. Account data is stored in a Neon Postgres database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Express (Node.js) |
| Database | Neon Postgres via `@neondatabase/serverless`, Drizzle ORM |
| Auth | Email/password with bearer-token sessions |
| i18n | Custom `t()` / `useT()` hook backed by JSON dictionaries |
| Hosting | Render (free tier, Frankfurt region) |

---

## Local Development

### Prerequisites

- Node.js 18 or later
- A free [Neon](https://neon.tech) Postgres project for the database

### Setup

```bash
git clone https://github.com/JupiterianSoul/Balatropedia.git
cd Balatropedia
npm install
```

Create a `.env` file (see [`.env.example`](./.env.example)) with the following variables:

```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
PORT=5000
```

Then start the development server:

```bash
npm run dev
```

This runs Express and the Vite dev server together on port `5000`. Open http://localhost:5000.

### Neon Database Setup

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, copy the **Connection string** (use the psql / non-pooled format).
3. Paste it as `DATABASE_URL` in your `.env` file.

The server automatically creates all required tables on first boot using `CREATE TABLE IF NOT EXISTS`, so no separate migration step is needed.

> Neon's free tier suspends the database after roughly 5 minutes of inactivity. The first query after suspension adds about 1 second of latency. The free tier has no time limit.

---

## Production Build

```bash
npm run build                           # bundles server to dist/index.cjs, client to dist/public
NODE_ENV=production node dist/index.cjs # or: npm run start
```

Type-check the project:

```bash
npm run check
```

### Deploying to Render

This repo ships a [`render.yaml`](./render.yaml) Blueprint for one-click deploy:

1. Push the repo to GitHub.
2. In the Render dashboard, choose **New** then **Blueprint** and point it at the repo.
3. Render reads `render.yaml` and provisions a web service with:
   - **Build:** `npm install && npm run build`
   - **Start:** `NODE_ENV=production node dist/index.cjs`
   - **Health check:** `GET /api/auth/me`
4. Set the `DATABASE_URL` environment variable in Render to your Neon connection string. Render will prompt for this automatically.

No persistent disk is needed. All data lives in Neon.

---

## Contributing

Balatropedia aims to be accurate. If you spot a wrong synergy description, an outdated mechanic, or a missing interaction:

1. Open an issue at https://github.com/JupiterianSoul/Balatropedia/issues
2. Describe what is wrong and include the source you are citing (wiki URL, patch notes, community guide, etc.)

Pull requests for bug fixes or new content are welcome. Please keep changes focused and include a brief description of what was changed and why.

> Found a wrong synergy? Open an issue with the source you are citing.

---

## Credits and Attribution

- **Game:** Balatro is created by LocalThunk and published by Playstack. This project is not affiliated with or endorsed by either.
- **Pixel font:** m6x11plus by [Daniel Linssen](https://managore.itch.io/m6x11).
- **Joker text:** Adapted from the [Balatro Wiki](https://balatrogame.fandom.com/) under [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- **Joker and card sprites:** Proxied from the Balatro Wiki (`static.wikia.nocookie.net/balatrogame/`). Sprites remain the property of LocalThunk and Playstack.
- **Strategy commentary:** Cross-referenced with community sources including [dood.gg](https://dood.gg), [Balatro HQ](https://balatroHQ.com), [Mobalytics](https://mobalytics.gg), [Two Average Gamers](https://twoaveragegamers.com), and [TheGamer](https://www.thegamer.com).

---

## Disclaimer

Balatropedia is a fan-made, non-commercial project. It is not affiliated with, endorsed by, or in any way connected to LocalThunk or Playstack. All Balatro trademarks, game assets, and related intellectual property belong to their respective owners. Joker descriptions adapted from the Balatro Wiki are used under CC-BY-SA 3.0.

---

*Built by [JupiterianSoul](https://github.com/JupiterianSoul). Questions or corrections: gabriel.quart.15@gmail.com*
