# Attributions

Balatropedia is an unofficial companion app inspired by **Balatro** by
LocalThunk / Playstack. Balatropedia is not affiliated with, endorsed by,
or sponsored by LocalThunk or Playstack. All trademarks belong to their
respective owners.

## Font

- **m6x11plus** — by Daniel "managore" Linssen.
  - Source: [managore.itch.io/m6x11](https://managore.itch.io/m6x11)
  - License: Free for use with attribution. Used here for the in-app UI
    typography to match the pixel aesthetic.

## Visual design

The "Balatro skin" (velvet red background, beveled white cards,
art-masked foil / holo / negative / polychrome editions, chunky pill
buttons, score popups, and pixel-art tab icons) is an **original
re-implementation** of the *style* of Balatro's UI, written from scratch
with CSS, SVG, and Web Audio. No textures, sprites, fonts (other than
m6x11plus), shaders, sound samples, or source code from Balatro have
been copied into this project.

The hand-drawn pixel icons in `client/src/components/icons/BalatroIcons.tsx`
(chip, coin, home, joker hat, tier list, dice, gear) are original artwork
drawn as 24×24 SVG pixel grids.

## Sound effects

All sound effects are **synthesized at runtime** by `client/src/lib/sounds.ts`
using the Web Audio API (oscillators, biquad filters, generated noise
buffers, ADSR envelopes). No audio files from Balatro — or any other
source — were copied. The shapes of the sounds (e.g. metallic chip
clinks, paper card flicks, rising score whooshes) are inspired by Balatro's
audio design but the implementations and parameters are original.

## Joker sprites and game-data references

Joker / deck / consumable artwork rendered in `client/public/sprites/`
is used under fair-use for an unofficial companion / wiki app. If the
rights holders request removal, please open an issue at
[github.com/JupiterianSoul/Balatropedia/issues](https://github.com/JupiterianSoul/Balatropedia/issues)
and the assets will be removed promptly.

Gameplay facts, joker descriptions, and seed-finder math are factual
information about how the game works and are documented for the
companion app under fair-use principles.

## Open-source dependencies

Balatropedia uses many open-source packages; see `package.json` and
`client/package.json`. Notable ones used in the Balatro skin:

- React, Vite, Tailwind CSS — standard web stack.
- `@capacitor/*` — Android packaging.

## Reporting issues with attribution

If you believe something here is incorrectly attributed, please file an
issue at the repository above and we will correct it promptly.
