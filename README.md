# Balatropedia

[![Live Site](https://img.shields.io/badge/Live%20Site-balatro--explorer--m22k.onrender.com-blue)](https://balatro-explorer-m22k.onrender.com)
[![Version](https://img.shields.io/badge/version-1.8.0-red)](https://github.com/JupiterianSoul/Balatropedia/releases)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Backend-Express-000000?logo=express)](https://expressjs.com)

**Balatropedia** is a fan-made reference and companion for [Balatro](https://www.playbalatro.com/), the indie deckbuilder by LocalThunk and Playstack. It indexes every joker, deck, stake, voucher, boss blind, consumable, edition, and enhancement, then layers planning, analysis, and seed-engine tools on top, with full English, Français, and Español localization.

**Live:** https://balatro-explorer-m22k.onrender.com

> The site runs on Render's free tier (Frankfurt region). After idle periods the first request may take up to 30 seconds while the server cold-starts; subsequent requests are fast.

---

## Features

### Reference

- **150 Jokers** with full effect text, scaling formulas, archetypes, tags, source citations
- **Decks, Stakes, Vouchers, Boss Blinds, Consumables, Editions, Enhancements** indexed end to end
- **Archetypes** grouping jokers by the role they fill in a build
- **Glossary** of every gameplay term used in the app

### Planning Tools

- **My Run** notebook for an active session: deck, stake, ante, current jokers, live synergy and counter notes
- **Build Lab** sandbox for theorycrafting a 5-joker board with chip/mult/X-mult breakdown
- **Score Calculator** showing Balatro's exact scoring order of operations
- **Skeleton** run planner: ante-by-ante structural check against boss blind effects
- **Compare** view: side-by-side for jokers, decks, vouchers, bosses
- **Synergies** graph drawn from community guides with engine type, popularity, difficulty
- **Combos** for three-plus joker setups with win-rate notes where known

### Seed Engine

- **Analyzer**: paste a seed, simulate antes ahead with the WASM engine, see shops, packs, vouchers, Soul resolutions
- **Finder**: search the entire seed space against constraints (joker in ante 1, guaranteed Negative tag, etc.), tunable CPU workers and tries per batch
- **Library**: curated and user-saved notable seeds

### Tier List & Community

- Interactive S/A/B/C/D ranking, defaulting to community consensus from cited third-party guides
- Drag jokers freely; signed-in users sync custom orderings to their account
- Persistent dismissable disclaimer plus a short reminder at the bottom of the tab

### Account & UX

- Google sign-in: syncs favorites, saved runs, Build Lab state, custom tier list
- Three themes: Felt, Midnight, Parchment
- UI scale slider (80% to 160%) for high-DPI desktops and large mobile screens
- In-browser synthesized sound effects, no external audio assets
- Full keyboard navigation, mobile responsive

---

## Sources & Attribution

Joker data and synergy notes are cross-referenced against:

- [Balatro Fandom Wiki](https://balatrogame.fandom.com/wiki/Jokers) (CC-BY-SA)
- [dood.gg](https://dood.gg/en/balatro/) joker synergy, deck strategies and poker hand guides
- [Balatro HQ](https://www.balatrohq.com/guides/advanced-strategies/) advanced strategies
- [Mobalytics Balatro Joker Tier List](https://mobalytics.gg/blog/tier-lists/best-balatro-jokers/)
- [Two Average Gamers Strategy Guide](https://www.twoaveragegamers.com/balatro-strategy-guide-the-joker-combos-that-actually-win-runs/)
- [TheGamer Joker Tier List](https://www.thegamer.com/balatro-joker-tier-list/)
- Validated discussion threads on r/balatro

Per-joker source links are listed in each detail sheet. Tier list ordering reflects aggregated community opinion, not authoritative ranking.

---

## Disclaimer

Balatropedia is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by LocalThunk, Playstack, or any joker tier-list author. All Balatro names, art references, and gameplay mechanics belong to their respective owners and are used here under fair-use for reference and educational purposes. Joker sprites are reduced-scale identifiers; rights holders may request removal of any asset via the issue tracker and it will be removed promptly. No ads, no analytics beyond what Google sign-in carries server-side, no third-party trackers, no monetization.

---

## Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter routing
- **Backend**: Express, Drizzle ORM, Neon Postgres
- **Seed Engine**: Rust compiled to WebAssembly, Web Worker pool
- **Auth**: Google OAuth via Passport
- **i18n**: in-tree JSON dictionaries (English, Français, Español)
- **Hosting**: Render (Frankfurt)
- **Font**: m6x11plus by Daniel Linssen

---

## Development

```bash
git clone https://github.com/JupiterianSoul/Balatropedia.git
cd Balatropedia
npm install
cp .env.example .env  # fill DATABASE_URL with a Neon Postgres connection string
npm run dev           # runs Express + Vite on the same port
```

Build for production:

```bash
npm run build    # outputs dist/public (client) and dist/index.cjs (server)
npm start        # serves the production build
```

---

## Contributing

Spotted a wrong number, a missing joker, or a broken synergy? Open an issue: https://github.com/JupiterianSoul/Balatropedia/issues/new

The project welcomes PRs against `main`. Keep changes focused; avoid sweeping refactors.

---

## License

MIT. See [LICENSE](./LICENSE) if present, or assume MIT for source contributions. All Balatro IP belongs to LocalThunk and Playstack.

---

Made by [JupiterianSoul](https://github.com/JupiterianSoul). If Balatropedia is useful to you, a Ko-fi tip helps keep the Render dyno warm: links live in the in-app About tab.
