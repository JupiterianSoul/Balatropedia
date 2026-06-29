# Balatropedia

Balatropedia is a fan-made reference and companion app for Balatro, the deckbuilder by LocalThunk and Playstack. It catalogs every joker, deck, stake, voucher, boss blind, consumable, edition, enhancement and seal in the game, then layers planning and analysis tools on top. The app runs in the browser and on Android as a Capacitor build with no account, no ads, no analytics and no online dependency.

## What it covers

Reference data:

* 150 jokers with full effect text, scaling notes, rarity, cost, archetype tags, sticker rules and source citations
* All 15 decks
* All 8 stakes with inherited modifiers laid out per row
* 32 vouchers across the two tiers
* All 28 boss blinds
* Tarots, planets, spectrals and Soul/Wraith resolutions
* All editions (foil, holographic, polychrome, negative) and enhancements (bonus, mult, wild, glass, steel, stone, gold, lucky)
* All seals (gold, red, blue, purple)
* Archetypes that group jokers by the role they fill in a build
* Glossary covering every gameplay term used in the app

Planning tools:

* My Run notebook for an active session with deck, stake, ante, current jokers and free-form notes, all saved locally
* Build Lab sandbox for theorycrafting a five joker board with chip, mult and X-mult breakdown
* Score Calculator showing the exact scoring order used by the game
* Skeleton run planner for ante by ante checks against boss blind effects
* Compare view for side by side reads on jokers, decks, vouchers and bosses
* Synergies graph drawn from community guides with engine type, popularity and difficulty
* Combos page for three plus joker setups with notes on what wins runs

Seed tools:

* Analyzer for pasting a seed and walking shops, packs, vouchers and Soul resolutions ante by ante
* Finder driven by the in-house Balatro Seed Searcher engine (Rust compiled to WebAssembly with SIMD when the browser supports it). Filter rows for jokers (with edition and sticker), vouchers, tags with small or big blind position, bosses and standard pack cards. Soul resolves to a specific legendary; Wraith resolves to a specific Rare.
* Verify Seed inspector that shows clause by clause matches for any seed
* Shareable filter URLs through a single `seedfinder` query parameter
* Device aware worker count from Eco on low end phones to Extreme on multi core desktops
* Library of curated and locally saved notable seeds

Tier list:

* Interactive S, A, B, C, D ranking that defaults to community consensus
* Free drag of any joker between tiers
* Persistent local order with a one click reset to the default

Interface:

* English, French and Spanish throughout the whole app
* Three themes: Felt (red and blue casino), Midnight (deep blue) and Parchment (warm brown leather)
* UI scale slider for high density displays and large phones
* In browser synthesized sound effects, no audio files shipped
* Full keyboard navigation
* Mobile bottom tab bar, side drawer with tab descriptions, side conveyor of joker sprites on the home screen

## Stack

* React with TypeScript and Vite
* Tailwind CSS with a small set of custom Balatro inspired primitives
* Wouter for routing
* shadcn/ui for the base components
* Express server for the website build
* Capacitor for the Android wrapper
* Rust compiled to WebAssembly for the seed search engine

## Run it

```bash
npm install
npm run dev
```

Build the static bundle that ships in the Android APK:

```bash
npm run build:app
npx cap sync android
```

Open `android/` in Android Studio and run on a connected device.

## Sources

Joker data and synergy notes are cross referenced against the Balatro Fandom Wiki, dood.gg, Balatro HQ, Mobalytics, TheGamer, Two Average Gamers and validated discussion threads on r/balatro. Each joker detail sheet lists its own sources. Tier list ordering reflects aggregated community opinion, not authoritative ranking.

## Disclaimer

Balatropedia is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by or sponsored by LocalThunk or Playstack. All Balatro names, art references and gameplay mechanics belong to their respective owners and are used here under fair use for reference and educational purposes. Joker sprites are reduced scale identifiers; rights holders may request removal of any asset via the issue tracker and it will be removed promptly. No ads, no analytics, no third party trackers, no monetization.
