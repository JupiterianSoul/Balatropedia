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
let volume = 0.6;

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
} catch {  }

function persist(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {  }
}

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

    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {  });
  } catch {

  }
}

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

let delegationInstalled = false;

function findInteractive(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;

  return target.closest<HTMLElement>(
    'button, a[href], input, select, textarea, summary, label, ' +
    '[role="button"], [role="tab"], [role="switch"], [role="checkbox"], ' +
    '[role="radio"], [role="menuitem"], [role="menuitemradio"], ' +
    '[role="menuitemcheckbox"], [role="option"], [role="link"], ' +
    '[data-sound], [data-clickable="true"]'
  );
}

function resolveSound(el: HTMLElement): SoundName | null {

  if (el.closest('[data-no-sound]')) return null;

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

  document.addEventListener('pointerdown', handlePointer, { capture: true });
  document.addEventListener('keydown', handleKey as EventListener, { capture: true });
}

