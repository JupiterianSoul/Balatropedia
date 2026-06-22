// Balatro-style SFX using real recorded samples (Kenney CC0 audio packs).
//
// Design rules :
//   1. Each SoundName maps to EXACTLY ONE audio file, deterministically.
//      Same action = same sound. Never randomized.
//   2. Samples live in client/public/sfx/*.ogg and are served as static assets.
//   3. We use HTMLAudioElement pooling : each sound holds N pre-cloned audio
//      instances so rapid retriggering (hover spam, chip cascade) does not
//      cancel itself.
//   4. State (enabled, volume) persists in localStorage when available.
//
// SoundName  ; semantic intent                                ; file
//   click          primary button press                       click.ogg
//   click_alt      secondary press (less prominent)           click_alt.ogg
//   click_heavy    deep press / commit                        click_heavy.ogg
//   hover          mouse rollover                             hover.ogg
//   select         dropdown / select item                     select.ogg
//   toggle_on      toggle / switch turning on                 toggle_on.ogg
//   toggle_off     toggle / switch turning off                toggle_off.ogg
//   tab_switch     top-level tab change                       tab_switch.ogg
//   card_place     joker card placed / chosen                 card_place.ogg
//   card_slide     joker card slide (combobox commit)         card_slide.ogg
//   card_shove     joker card removed                         card_shove.ogg
//   card_fan       opening combobox / fanning cards           card_fan.ogg
//   shuffle        shop reroll / full shuffle                 shuffle.ogg
//   pack_open      pack / booster open                        pack_open.ogg
//   pack_take      take card from pack                        pack_take.ogg
//   chip           chip lay (favorite toggle on)              chip.ogg
//   chip_stack     stack of chips (multi-favorite)            chip_stack.ogg
//   chip_collide   chip clash                                 chip_collide.ogg
//   chip_handle    chips moving                               chip_handle.ogg
//   dice_shake     reroll shake                               dice_shake.ogg
//   dice_throw     random pick                                dice_throw.ogg
//   notify         small toast / inline notification          notify.ogg
//   favorite       star added (jingle)                        favorite.ogg
//   win            success / win jingle                       win.ogg
//   error          error / invalid action                     error.ogg

export type SoundName =
  | "click" | "click_alt" | "click_heavy" | "hover"
  | "select" | "toggle_on" | "toggle_off" | "tab_switch"
  | "card_place" | "card_slide" | "card_shove" | "card_fan"
  | "shuffle" | "pack_open" | "pack_take"
  | "chip" | "chip_stack" | "chip_collide" | "chip_handle"
  | "dice_shake" | "dice_throw"
  | "notify" | "favorite" | "win" | "error";

const STORAGE_KEY_ENABLED = "balatro_sound_enabled";
const STORAGE_KEY_VOLUME = "balatro_sound_volume";

// Per-sound volume scaling. Recorded levels vary; this normalizes perceived
// loudness so the master volume slider behaves predictably.
const PER_SOUND_GAIN: Record<SoundName, number> = {
  click: 0.7,
  click_alt: 0.7,
  click_heavy: 0.8,
  hover: 0.35,
  select: 0.7,
  toggle_on: 0.8,
  toggle_off: 0.8,
  tab_switch: 0.75,
  card_place: 0.9,
  card_slide: 0.9,
  card_shove: 0.9,
  card_fan: 0.85,
  shuffle: 0.85,
  pack_open: 0.85,
  pack_take: 0.85,
  chip: 0.9,
  chip_stack: 0.95,
  chip_collide: 0.85,
  chip_handle: 0.85,
  dice_shake: 0.75,
  dice_throw: 0.85,
  notify: 0.6,
  favorite: 0.7,
  win: 0.7,
  error: 0.65,
};

// File path map (relative to the site root ; served from public/sfx).
const SOUND_FILES: Record<SoundName, string> = {
  click:        "/sfx/click.ogg",
  click_alt:    "/sfx/click_alt.ogg",
  click_heavy:  "/sfx/click_heavy.ogg",
  hover:        "/sfx/hover.ogg",
  select:       "/sfx/select.ogg",
  toggle_on:    "/sfx/toggle_on.ogg",
  toggle_off:   "/sfx/toggle_off.ogg",
  tab_switch:   "/sfx/tab_switch.ogg",
  card_place:   "/sfx/card_place.ogg",
  card_slide:   "/sfx/card_slide.ogg",
  card_shove:   "/sfx/card_shove.ogg",
  card_fan:     "/sfx/card_fan.ogg",
  shuffle:      "/sfx/shuffle.ogg",
  pack_open:    "/sfx/pack_open.ogg",
  pack_take:    "/sfx/pack_take.ogg",
  chip:         "/sfx/chip.ogg",
  chip_stack:   "/sfx/chip_stack.ogg",
  chip_collide: "/sfx/chip_collide.ogg",
  chip_handle:  "/sfx/chip_handle.ogg",
  dice_shake:   "/sfx/dice_shake.ogg",
  dice_throw:   "/sfx/dice_throw.ogg",
  notify:       "/sfx/notify.ogg",
  favorite:     "/sfx/favorite.ogg",
  win:          "/sfx/win.ogg",
  error:        "/sfx/error.ogg",
};

// Pool size : how many parallel instances we keep per sound. Sounds that fire
// rapidly (hover, click) need more headroom. Heavy one-shots can stay at 1.
const POOL_SIZE: Partial<Record<SoundName, number>> = {
  hover: 6,
  click: 4,
  click_alt: 4,
  chip: 4,
  chip_stack: 3,
  card_place: 3,
  card_slide: 3,
};
const DEFAULT_POOL_SIZE = 2;

let enabled = true;
let volume = 0.6; // 0..1 master volume

// Persistence (best-effort ; sandboxed iframes may block localStorage)
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const e = window.localStorage.getItem(STORAGE_KEY_ENABLED);
    if (e === "0") enabled = false;
    const v = window.localStorage.getItem(STORAGE_KEY_VOLUME);
    if (v !== null) {
      const n = parseFloat(v);
      if (!Number.isNaN(n) && n >= 0 && n <= 1) volume = n;
    }
  }
} catch { /* ignore */ }

function persist(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch { /* sandbox blocks storage */ }
}

// ── Pool ────────────────────────────────────────────────────────────────────
// pools[name] = array of HTMLAudioElement ; pointers[name] = next index to use.

const pools: Partial<Record<SoundName, HTMLAudioElement[]>> = {};
const pointers: Partial<Record<SoundName, number>> = {};

function ensurePool(name: SoundName): HTMLAudioElement[] | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (pools[name]) return pools[name]!;
  const size = POOL_SIZE[name] ?? DEFAULT_POOL_SIZE;
  const arr: HTMLAudioElement[] = [];
  for (let i = 0; i < size; i++) {
    const a = new Audio(SOUND_FILES[name]);
    a.preload = "auto";
    arr.push(a);
  }
  pools[name] = arr;
  pointers[name] = 0;
  return arr;
}

// ── Public API ──────────────────────────────────────────────────────────────

// Per-sound dedup window. Prevents the same sound firing twice in rapid
// succession when both the global delegation and a component onClick handler
// fire for the same user gesture. 40 ms is short enough that legitimate
// rapid-fire (hover spam, chip cascade) still stacks via the pool.
const DEDUP_MS = 40;
const lastPlayedAt: Partial<Record<SoundName, number>> = {};

export function playSound(name: SoundName) {
  if (!enabled) return;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const last = lastPlayedAt[name] ?? -Infinity;
  if (now - last < DEDUP_MS) return;
  lastPlayedAt[name] = now;
  const pool = ensurePool(name);
  if (!pool) return;
  const idx = pointers[name] ?? 0;
  const a = pool[idx];
  pointers[name] = (idx + 1) % pool.length;

  try {
    a.currentTime = 0;
    a.volume = volume * (PER_SOUND_GAIN[name] ?? 1);
    // play() returns a Promise in modern browsers ; swallow autoplay rejections.
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => { /* user gesture pending */ });
  } catch {
    /* ignore */
  }
}

// Back-compat helper kept so existing call sites compile, but it now plays the
// FIRST sound only (deterministic) ; the user explicitly does not want random
// SFX per interaction.
export function playRandom(names: SoundName[]) {
  if (names.length === 0) return;
  playSound(names[0]);
}

export function isSoundEnabled(): boolean { return enabled; }

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (v) playSound("toggle_on");
  persist(STORAGE_KEY_ENABLED, v ? "1" : "0");
}

export function getSoundVolume(): number { return volume; }

export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  persist(STORAGE_KEY_VOLUME, String(volume));
}

// ── Global delegation ───────────────────────────────────────────────────────
// Most components do not wire playSound() themselves. To guarantee every
// interactive click makes a sound, we install a single capture-phase listener
// at the document level that fires BEFORE any onClick handler runs.
//
// Resolution order :
//   1. Element (or ancestor) has data-no-sound  -> skip
//   2. Element (or ancestor) has data-sound="x" -> play x
//   3. Otherwise pick a default sound from role/tag/type :
//        - role="tab"                     -> tab_switch
//        - role="switch" / type=checkbox  -> toggle_on / toggle_off (by state)
//        - role="option" / role="menuitem"-> select
//        - <select>                       -> select
//        - default                         -> click
//
// We also handle keyboard activation (Enter / Space on focused button-like
// element) by listening to keydown on the same capture phase.

let delegationInstalled = false;

function findInteractive(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  // Closest match for anything clickable. We deliberately include [role=tab],
  // [role=switch], [role=option], [role=menuitem], [role=button], plus native
  // button / a / input / select / summary / label.
  return target.closest<HTMLElement>(
    'button, a[href], input, select, textarea, summary, label, ' +
    '[role="button"], [role="tab"], [role="switch"], [role="checkbox"], ' +
    '[role="radio"], [role="menuitem"], [role="menuitemradio"], ' +
    '[role="menuitemcheckbox"], [role="option"], [role="link"], ' +
    '[data-sound], [data-clickable="true"]'
  );
}

function resolveSound(el: HTMLElement): SoundName | null {
  // opt-out via attribute on element or any ancestor
  if (el.closest('[data-no-sound]')) return null;

  // explicit override
  const ov = el.closest<HTMLElement>('[data-sound]');
  if (ov) {
    const v = ov.getAttribute('data-sound');
    if (v && v in SOUND_FILES) return v as SoundName;
  }

  const role = el.getAttribute('role');
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute('type') || '').toLowerCase();

  if (role === 'tab') return 'tab_switch';
  if (role === 'switch' || role === 'checkbox' || type === 'checkbox') {
    const nativeChecked = (el as HTMLInputElement).checked === true;
    const ariaChecked = el.getAttribute('aria-checked') === 'true';
    const stateChecked = el.getAttribute('data-state') === 'checked';
    const checked = nativeChecked || ariaChecked || stateChecked;
    // PRE-click state ; clicking flips it, so play the OPPOSITE sound.
    return checked ? 'toggle_off' : 'toggle_on';
  }
  if (role === 'option' || role === 'menuitem' || role === 'menuitemradio' ||
      role === 'menuitemcheckbox') return 'select';
  if (tag === 'select') return 'select';
  if (tag === 'summary') return 'card_fan';

  return 'click';
}

function handlePointer(e: Event) {
  if (!enabled) return;
  const el = findInteractive(e.target);
  if (!el) return;
  // disabled elements should not chirp
  if ((el as HTMLButtonElement).disabled) return;
  if (el.getAttribute('aria-disabled') === 'true') return;
  const s = resolveSound(el);
  if (s) playSound(s);
}

function handleKey(e: KeyboardEvent) {
  if (!enabled) return;
  if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  const el = findInteractive(e.target);
  if (!el) return;
  if ((el as HTMLButtonElement).disabled) return;
  if (el.getAttribute('aria-disabled') === 'true') return;
  const s = resolveSound(el);
  if (s) playSound(s);
}

export function installGlobalSoundDelegation() {
  if (delegationInstalled) return;
  if (typeof document === 'undefined') return;
  delegationInstalled = true;
  // capture phase = runs before component onClick handlers, so even if a
  // handler calls stopPropagation() we have already fired the sound.
  document.addEventListener('pointerdown', handlePointer, { capture: true });
  document.addEventListener('keydown', handleKey as EventListener, { capture: true });
}
