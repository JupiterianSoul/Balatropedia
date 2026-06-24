
import { LuaRandom, pseudohash, round13 } from "./seedRng";
import {
  BOSSES, CARDS, COMMON_JOKERS, COMMON_JOKERS_100, ENHANCEMENTS, LEGENDARY_JOKERS,
  PACKS, PLANETS, RARE_JOKERS, RARE_JOKERS_100, RARE_JOKERS_101C, SPECTRALS,
  TAGS, TAROTS, UNCOMMON_JOKERS, UNCOMMON_JOKERS_100, UNCOMMON_JOKERS_101C, VOUCHERS,
  packInfo,
} from "./seedItems";
import type {
  JokerData, JokerStickers, Pack, ShopItem, ShopRates, StandardCard, WeightedItem,
} from "./seedItems";

const VOUCHERS_PAIRS = VOUCHERS;

export interface InstParams {
  deck: string;
  stake: string;
  showman: boolean;
  sixesFactor: number;
  version: number;
  vouchers: string[];
}

function defaultParams(): InstParams {
  return {
    deck: "Red Deck",
    stake: "White Stake",
    showman: false,
    sixesFactor: 1,
    version: 10103,
    vouchers: [],
  };
}

export class Instance {
  seed: string;
  hashedSeed: number;
  locked: string[] = [];
  cacheNodes: Map<string, number> = new Map();
  generatedFirstPack = false;
  params: InstParams;

  constructor(seed: string) {
    this.seed = seed;
    this.hashedSeed = pseudohash(seed);
    this.params = defaultParams();
  }

  getNode(id: string): number {
    if (!this.cacheNodes.has(id)) {
      this.cacheNodes.set(id, pseudohash(id + this.seed));
    }
    const next = round13(((this.cacheNodes.get(id) as number) * 1.72431234 + 2.134453429141) % 1);
    this.cacheNodes.set(id, next);
    return (next + this.hashedSeed) / 2;
  }
  random(id: string): number {
    return new LuaRandom(this.getNode(id)).random();
  }
  randint(id: string, min: number, max: number): number {
    return new LuaRandom(this.getNode(id)).randint(min, max);
  }
  randchoice(id: string, items: string[]): string {
    const rng = new LuaRandom(this.getNode(id));
    let item = items[rng.randint(0, items.length - 1)];
    if ((!this.params.showman && this.isLocked(item)) || item === "RETRY") {
      let resample = 2;
      while (true) {
        const r = new LuaRandom(this.getNode(id + "_resample" + resample));
        item = items[r.randint(0, items.length - 1)];
        resample++;
        if ((item !== "RETRY" && !this.isLocked(item)) || resample > 1000) return item;
      }
    }
    return item;
  }
  randweightedchoice(id: string, items: WeightedItem[]): string {
    const rng = new LuaRandom(this.getNode(id));
    const poll = rng.random() * items[0].weight;
    let idx = 1;
    let weight = 0;
    while (weight < poll) {
      weight += items[idx].weight;
      idx++;
    }
    return items[idx - 1].item;
  }

  lock(item: string) { this.locked.push(item); }
  unlock(item: string) {
    const i = this.locked.indexOf(item);
    if (i !== -1) this.locked.splice(i, 1);
  }
  isLocked(item: string) { return this.locked.indexOf(item) !== -1; }

  snapshotState(): { cacheNodes: Map<string, number>; locked: string[]; generatedFirstPack: boolean } {
    return {
      cacheNodes: new Map(this.cacheNodes),
      locked: this.locked.slice(),
      generatedFirstPack: this.generatedFirstPack,
    };
  }
  restoreState(snap: { cacheNodes: Map<string, number>; locked: string[]; generatedFirstPack: boolean }) {
    this.cacheNodes = new Map(snap.cacheNodes);
    this.locked = snap.locked.slice();
    this.generatedFirstPack = snap.generatedFirstPack;
  }

  initLocks(ante: number, freshProfile: boolean, freshRun: boolean) {
    if (ante < 2) {
      for (const b of ["The Mouth","The Fish","The Wall","The House","The Mark","The Wheel","The Arm","The Water","The Needle","The Flint"]) this.lock(b);
      for (const t of ["Negative Tag","Standard Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag","Ethereal Tag","Top-up Tag","Orbital Tag"]) this.lock(t);
    }
    if (ante < 3) { this.lock("The Tooth"); this.lock("The Eye"); }
    if (ante < 4) this.lock("The Plant");
    if (ante < 5) this.lock("The Serpent");
    if (ante < 6) this.lock("The Ox");
    if (freshProfile) {
      for (const x of ["Negative Tag","Foil Tag","Holographic Tag","Polychrome Tag","Rare Tag","Golden Ticket","Mr. Bones","Acrobat","Sock and Buskin","Swashbuckler","Troubadour","Certificate","Smeared Joker","Throwback","Hanging Chad","Rough Gem","Bloodstone","Arrowhead","Onyx Agate","Glass Joker","Showman","Flower Pot","Blueprint","Wee Joker","Merry Andy","Oops! All 6s","The Idol","Seeing Double","Matador","Hit the Road","The Duo","The Trio","The Family","The Order","The Tribe","Stuntman","Invisible Joker","Brainstorm","Satellite","Shoot the Moon","Driver's License","Cartomancer","Astronomer","Burnt Joker","Bootstraps","Overstock Plus","Liquidation","Glow Up","Reroll Glut","Omen Globe","Observatory","Nacho Tong","Recyclomancy","Tarot Tycoon","Planet Tycoon","Money Tree","Antimatter","Illusion","Petroglyph","Retcon","Palette"]) this.lock(x);
    }
    if (freshRun) {
      for (const x of ["Planet X","Ceres","Eris","Five of a Kind","Flush House","Flush Five","Stone Joker","Steel Joker","Glass Joker","Golden Ticket","Lucky Cat","Cavendish","Overstock Plus","Liquidation","Glow Up","Reroll Glut","Omen Globe","Observatory","Nacho Tong","Recyclomancy","Tarot Tycoon","Planet Tycoon","Money Tree","Antimatter","Illusion","Petroglyph","Retcon","Palette"]) this.lock(x);
    }
  }
  initUnlocks(ante: number, freshProfile: boolean) {
    if (ante === 2) {
      for (const b of ["The Mouth","The Fish","The Wall","The House","The Mark","The Wheel","The Arm","The Water","The Needle","The Flint"]) this.unlock(b);
      if (!freshProfile) this.unlock("Negative Tag");
      for (const t of ["Standard Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag","Ethereal Tag","Top-up Tag","Orbital Tag"]) this.unlock(t);
    }
    if (ante === 3) { this.unlock("The Tooth"); this.unlock("The Eye"); }
    if (ante === 4) this.unlock("The Plant");
    if (ante === 5) this.unlock("The Serpent");
    if (ante === 6) this.unlock("The Ox");
  }

  nextTarot(source: string, ante: number, soulable: boolean): string {
    const a = String(ante);
    if (soulable && (this.params.showman || !this.isLocked("The Soul")) && this.random("soul_Tarot" + a) > 0.997) {
      return "The Soul";
    }
    return this.randchoice("Tarot" + source + a, TAROTS);
  }
  nextPlanet(source: string, ante: number, soulable: boolean): string {
    const a = String(ante);
    if (soulable && (this.params.showman || !this.isLocked("Black Hole")) && this.random("soul_Planet" + a) > 0.997) {
      return "Black Hole";
    }
    return this.randchoice("Planet" + source + a, PLANETS);
  }
  nextSpectral(source: string, ante: number, soulable: boolean): string {
    const a = String(ante);
    if (soulable) {
      let forced = "RETRY";
      if ((this.params.showman || !this.isLocked("The Soul")) && this.random("soul_Spectral" + a) > 0.997) forced = "The Soul";
      if ((this.params.showman || !this.isLocked("Black Hole")) && this.random("soul_Spectral" + a) > 0.997) forced = "Black Hole";
      if (forced !== "RETRY") return forced;
    }
    return this.randchoice("Spectral" + source + a, SPECTRALS);
  }

  nextJoker(source: string, ante: number, hasStickers: boolean): JokerData {
    const a = String(ante);

    let rarity: string;
    if (source === "sou") rarity = "4";
    else if (source === "wra") rarity = "3";
    else if (source === "rta") rarity = "3";
    else if (source === "uta") rarity = "2";
    else {
      const poll = this.random("rarity" + a + source);
      rarity = poll > 0.95 ? "3" : poll > 0.7 ? "2" : "1";
    }

    let editionRate = 1;
    if (this.isVoucherActive("Glow Up")) editionRate = 4;
    else if (this.isVoucherActive("Hone")) editionRate = 2;
    const editionPoll = this.random("edi" + source + a);
    let edition: string;
    if (editionPoll > 0.997) edition = "Negative";
    else if (editionPoll > 1 - 0.006 * editionRate) edition = "Polychrome";
    else if (editionPoll > 1 - 0.02 * editionRate) edition = "Holographic";
    else if (editionPoll > 1 - 0.04 * editionRate) edition = "Foil";
    else edition = "No Edition";

    let joker = "Joker";
    if (rarity === "4") {
      joker = this.params.version > 10099
        ? this.randchoice("Joker4", LEGENDARY_JOKERS)
        : this.randchoice("Joker4" + source + a, LEGENDARY_JOKERS);
    } else if (rarity === "3") {
      const pool = this.params.version > 10103 ? RARE_JOKERS : this.params.version > 10099 ? RARE_JOKERS_101C : RARE_JOKERS_100;
      joker = this.randchoice("Joker3" + source + a, pool);
    } else if (rarity === "2") {
      const pool = this.params.version > 10103 ? UNCOMMON_JOKERS : this.params.version > 10099 ? UNCOMMON_JOKERS_101C : UNCOMMON_JOKERS_100;
      joker = this.randchoice("Joker2" + source + a, pool);
    } else {
      const pool = this.params.version > 10099 ? COMMON_JOKERS : COMMON_JOKERS_100;
      joker = this.randchoice("Joker1" + source + a, pool);
    }

    const stickers: JokerStickers = { eternal: false, perishable: false, rental: false };
    if (hasStickers) {
      const isShop = source !== "buf";
      if (this.params.version > 10103) {
        const stickerPoll = this.random((isShop ? "etperpoll" : "packetper") + a);
        const stake = this.params.stake;
        const eternalStakes = stake === "Black Stake" || stake === "Blue Stake" || stake === "Purple Stake" || stake === "Orange Stake" || stake === "Gold Stake";
        const perishStakes = stake === "Orange Stake" || stake === "Gold Stake";
        const noEternal = new Set(["Gros Michel","Ice Cream","Cavendish","Luchador","Turtle Bean","Diet Cola","Popcorn","Ramen","Seltzer","Mr. Bones","Invisible Joker"]);
        const noPerish = new Set(["Ceremonial Dagger","Ride the Bus","Runner","Constellation","Green Joker","Red Card","Madness","Square Joker","Vampire","Rocket","Obelisk","Lucky Cat","Flash Card","Spare Trousers","Castle","Wee Joker"]);
        if (stickerPoll > 0.7 && eternalStakes && !noEternal.has(joker)) stickers.eternal = true;
        if (stickerPoll > 0.4 && stickerPoll <= 0.7 && perishStakes && !noPerish.has(joker)) stickers.perishable = true;
        if (stake === "Gold Stake") {
          stickers.rental = this.random((isShop ? "ssjr" : "packssjr") + a) > 0.7;
        }
      } else {
        const stake = this.params.stake;
        const eternalStakes = stake === "Black Stake" || stake === "Blue Stake" || stake === "Purple Stake" || stake === "Orange Stake" || stake === "Gold Stake";
        const noEternal = new Set(["Gros Michel","Ice Cream","Cavendish","Luchador","Turtle Bean","Diet Cola","Popcorn","Ramen","Seltzer","Mr. Bones","Invisible Joker"]);
        if (eternalStakes && !noEternal.has(joker)) {
          stickers.eternal = this.random("stake_shop_joker_eternal" + a) > 0.7;
        }
        if (this.params.version > 10099) {
          if ((stake === "Orange Stake" || stake === "Gold Stake") && !stickers.eternal) {
            stickers.perishable = this.random("ssjp" + a) > 0.49;
          }
          if (stake === "Gold Stake") {
            stickers.rental = this.random("ssjr" + a) > 0.7;
          }
        }
      }
    }
    return { joker, rarity, edition, stickers };
  }

  getShopInstance(): ShopRates {
    let tarotRate = 4, planetRate = 4, playingCardRate = 0, spectralRate = 0;
    if (this.params.deck === "Ghost Deck") spectralRate = 2;
    if (this.isVoucherActive("Tarot Tycoon")) tarotRate = 32;
    else if (this.isVoucherActive("Tarot Merchant")) tarotRate = 9.6;
    if (this.isVoucherActive("Planet Tycoon")) planetRate = 32;
    else if (this.isVoucherActive("Planet Merchant")) planetRate = 9.6;
    if (this.isVoucherActive("Magic Trick")) playingCardRate = 4;
    return { jokerRate: 20, tarotRate, planetRate, playingCardRate, spectralRate };
  }
  nextShopItem(ante: number): ShopItem {
    const a = String(ante);
    const shop = this.getShopInstance();
    const total = shop.jokerRate + shop.tarotRate + shop.planetRate + shop.playingCardRate + shop.spectralRate;
    let cdt = this.random("cdt" + a) * total;
    let type: string;
    if (cdt < shop.jokerRate) type = "Joker";
    else { cdt -= shop.jokerRate;
      if (cdt < shop.tarotRate) type = "Tarot";
      else { cdt -= shop.tarotRate;
        if (cdt < shop.planetRate) type = "Planet";
        else { cdt -= shop.planetRate;
          if (cdt < shop.playingCardRate) type = "Playing Card";
          else type = "Spectral";
        }
      }
    }
    if (type === "Joker") {
      const jkr = this.nextJoker("sho", ante, true);
      return { type, item: jkr.joker, jokerData: jkr };
    } else if (type === "Tarot") return { type, item: this.nextTarot("sho", ante, false) };
    else if (type === "Planet") return { type, item: this.nextPlanet("sho", ante, false) };
    else if (type === "Spectral") return { type, item: this.nextSpectral("sho", ante, false) };
    return { type: "Tarot", item: "The Fool" };
  }

  nextPack(ante: number): string {
    if (ante <= 2 && !this.generatedFirstPack && this.params.version > 10099) {
      this.generatedFirstPack = true;
      return "Buffoon Pack";
    }
    return this.randweightedchoice("shop_pack" + ante, PACKS);
  }

  nextStandardCard(ante: number): StandardCard {
    const a = String(ante);
    let enhancement = "No Enhancement";
    if (this.random("stdset" + a) > 0.6) enhancement = this.randchoice("Enhancedsta" + a, ENHANCEMENTS);
    const base = this.randchoice("frontsta" + a, CARDS);
    const editionPoll = this.random("standard_edition" + a);
    let edition = "No Edition";
    if (editionPoll > 0.988) edition = "Polychrome";
    else if (editionPoll > 0.96) edition = "Holographic";
    else if (editionPoll > 0.92) edition = "Foil";
    let seal = "No Seal";
    if (this.random("stdseal" + a) > 0.8) {
      const sp = this.random("stdsealtype" + a);
      if (sp > 0.75) seal = "Red Seal";
      else if (sp > 0.5) seal = "Blue Seal";
      else if (sp > 0.25) seal = "Gold Seal";
      else seal = "Purple Seal";
    }
    return { base, enhancement, edition, seal };
  }
  nextArcanaPack(size: number, ante: number): string[] {
    const pack: string[] = [];
    for (let i = 0; i < size; i++) {
      let item: string;
      if (this.isVoucherActive("Omen Globe") && this.random("omen_globe") > 0.8) {
        item = this.nextSpectral("ar2", ante, true);
      } else {
        item = this.nextTarot("ar1", ante, true);
      }
      pack.push(item);
      if (!this.params.showman) this.lock(item);
    }
    for (const it of pack) this.unlock(it);
    return pack;
  }
  resolveSoulAt(ante: number): JokerData {
    const snap = this.snapshotState();
    const jkr = this.nextJoker("sou", ante, false);
    this.restoreState(snap);
    return jkr;
  }
  resolveSoulsInPack(items: string[], ante: number): { position: number; card: "The Soul"; joker: JokerData }[] {
    const out: { position: number; card: "The Soul"; joker: JokerData }[] = [];
    items.forEach((it, idx) => {
      if (it === "The Soul") {
        out.push({ position: idx, card: "The Soul", joker: this.resolveSoulAt(ante) });
      }
    });
    return out;
  }
  nextCelestialPack(size: number, ante: number): string[] {
    const pack: string[] = [];
    for (let i = 0; i < size; i++) {
      const item = this.nextPlanet("pl1", ante, true);
      pack.push(item);
      if (!this.params.showman) this.lock(item);
    }
    for (const it of pack) this.unlock(it);
    return pack;
  }
  nextSpectralPack(size: number, ante: number): string[] {
    const pack: string[] = [];
    for (let i = 0; i < size; i++) {
      const item = this.nextSpectral("spe", ante, true);
      pack.push(item);
      if (!this.params.showman) this.lock(item);
    }
    for (const it of pack) this.unlock(it);
    return pack;
  }
  nextStandardPack(size: number, ante: number): StandardCard[] {
    const pack: StandardCard[] = [];
    for (let i = 0; i < size; i++) pack.push(this.nextStandardCard(ante));
    return pack;
  }
  nextBuffoonPack(size: number, ante: number): JokerData[] {
    const pack: JokerData[] = [];
    for (let i = 0; i < size; i++) {
      const jkr = this.nextJoker("buf", ante, true);
      pack.push(jkr);
      if (!this.params.showman) this.lock(jkr.joker);
    }
    for (const j of pack) this.unlock(j.joker);
    return pack;
  }

  isVoucherActive(v: string) { return this.params.vouchers.indexOf(v) !== -1; }
  activateVoucher(v: string) {
    this.params.vouchers.push(v);
    this.lock(v);
    for (let i = 0; i < VOUCHERS.length; i += 2) {
      if (VOUCHERS[i] === v) this.unlock(VOUCHERS[i + 1]);
    }
  }
  nextVoucher(ante: number): string {
    return this.randchoice("Voucher" + ante, VOUCHERS);
  }
  setDeck(deck: string) {
    this.params.deck = deck;
    if (deck === "Magic Deck") this.activateVoucher("Crystal Ball");
    if (deck === "Nebula Deck") this.activateVoucher("Telescope");
    if (deck === "Zodiac Deck") {
      this.activateVoucher("Tarot Merchant");
      this.activateVoucher("Planet Merchant");
      this.activateVoucher("Overstock");
    }
  }
  setStake(stake: string) { this.params.stake = stake; }
  nextTag(ante: number): string { return this.randchoice("Tag" + ante, TAGS); }
  nextBoss(ante: number): string {
    const pool: string[] = [];
    for (const b of BOSSES) {
      if (!this.isLocked(b) && ((ante % 8 === 0 && b[0] !== "T") || (ante % 8 !== 0 && b[0] === "T"))) {
        pool.push(b);
      }
    }
    if (pool.length === 0) {
      for (const b of BOSSES) {
        if ((ante % 8 === 0 && b[0] !== "T") || (ante % 8 !== 0 && b[0] === "T")) this.unlock(b);
      }
      return this.nextBoss(ante);
    }
    const chosen = this.randchoice("boss", pool);
    this.lock(chosen);
    return chosen;
  }
}

export interface SoulResolution {
  position: number;
  card: "The Soul";
  joker: JokerData;
}

export interface PackContents {
  name: string;
  size: number;
  choices: number;
  contents:
    | { kind: "tarot"; items: string[]; soulResolutions?: SoulResolution[] }
    | { kind: "planet"; items: string[] }
    | { kind: "spectral"; items: string[]; soulResolutions?: SoulResolution[] }
    | { kind: "standard"; cards: StandardCard[] }
    | { kind: "buffoon"; jokers: JokerData[] };
}

export interface AnteResult {
  ante: number;
  boss: string;
  voucher: string;
  tags: [string, string];
  shopQueue: ShopItem[];
  packs: PackContents[];
}

export interface AnalysisInput {
  seed: string;
  deck: string;
  stake: string;
  showman: boolean;
  version: number;
  freshProfile: boolean;
  freshRun: boolean;
  maxAnte: number;
  cardsPerAnte: number;
  packsPerAnte: number;
}

export function defaultInput(seed: string): AnalysisInput {
  return {
    seed: (seed || "").toUpperCase(),
    deck: "Red Deck",
    stake: "White Stake",
    showman: false,
    version: 10103,
    freshProfile: false,
    freshRun: true,
    maxAnte: 8,
    cardsPerAnte: 15,
    packsPerAnte: 6,
  };
}

export function buildInstance(input: AnalysisInput): Instance {
  const inst = new Instance(input.seed);
  inst.params.version = input.version;
  inst.params.showman = input.showman;
  inst.setDeck(input.deck);
  inst.setStake(input.stake);
  inst.initLocks(1, input.freshProfile, input.freshRun);
  return inst;
}

function generatePackContents(inst: Instance, name: string, ante: number): PackContents {
  const info: Pack = packInfo(name);
  if (info.type === "Arcana Pack") {
    const items = inst.nextArcanaPack(info.size, ante);
    const res = inst.resolveSoulsInPack(items, ante);
    return { name, size: info.size, choices: info.choices, contents: { kind: "tarot", items, soulResolutions: res.length ? res : undefined } };
  }
  if (info.type === "Celestial Pack") {
    return { name, size: info.size, choices: info.choices, contents: { kind: "planet", items: inst.nextCelestialPack(info.size, ante) } };
  }
  if (info.type === "Spectral Pack") {
    const items = inst.nextSpectralPack(info.size, ante);
    const res = inst.resolveSoulsInPack(items, ante);
    return { name, size: info.size, choices: info.choices, contents: { kind: "spectral", items, soulResolutions: res.length ? res : undefined } };
  }
  if (info.type === "Standard Pack") {
    return { name, size: info.size, choices: info.choices, contents: { kind: "standard", cards: inst.nextStandardPack(info.size, ante) } };
  }
  if (info.type === "Buffoon Pack") {
    return { name, size: info.size, choices: info.choices, contents: { kind: "buffoon", jokers: inst.nextBuffoonPack(info.size, ante) } };
  }
  return { name, size: info.size, choices: info.choices, contents: { kind: "tarot", items: [] } };
}

export function analyzeAnte(inst: Instance, ante: number, input: AnalysisInput): AnteResult {
  inst.initUnlocks(ante, input.freshProfile);
  const boss = inst.nextBoss(ante);
  const voucher = inst.nextVoucher(ante);
  inst.lock(voucher);
  for (let i = 0; i < VOUCHERS_PAIRS.length; i += 2) {
    if (VOUCHERS_PAIRS[i] === voucher) inst.unlock(VOUCHERS_PAIRS[i + 1]);
  }
  const tags: [string, string] = [inst.nextTag(ante), inst.nextTag(ante)];

  const shopQueue: ShopItem[] = [];
  for (let i = 0; i < input.cardsPerAnte; i++) shopQueue.push(inst.nextShopItem(ante));

  const naturalPackCount = ante === 1 ? 4 : 6;
  const packCount = Math.min(input.packsPerAnte, naturalPackCount);
  const packs: PackContents[] = [];
  for (let i = 0; i < packCount; i++) {
    const name = inst.nextPack(ante);
    packs.push(generatePackContents(inst, name, ante));
  }

  return { ante, boss, voucher, tags, shopQueue, packs };
}

export function runAnalysis(input: AnalysisInput): AnteResult[] {
  const inst = buildInstance(input);
  const out: AnteResult[] = [];
  for (let ante = 1; ante <= input.maxAnte; ante++) {
    out.push(analyzeAnte(inst, ante, input));
  }
  return out;
}

export interface JokerSighting {
  ante: number;
  source: "shop" | "buffoon-pack" | "soul-tarot" | "soul-spectral";
  edition: string;
  stickers: JokerStickers;
  rarity: string;
  packName?: string;
  shopSlot?: number;
  packIndex?: number;
  packPosition?: number;
}

export function findJoker(results: AnteResult[], jokerName: string, max = 50): JokerSighting[] {
  const out: JokerSighting[] = [];
  for (const r of results) {
    r.shopQueue.forEach((item, idx) => {
      if (out.length >= max) return;
      if (item.type === "Joker" && item.jokerData && item.jokerData.joker === jokerName) {
        out.push({
          ante: r.ante, source: "shop",
          edition: item.jokerData.edition,
          stickers: item.jokerData.stickers,
          rarity: item.jokerData.rarity,
          shopSlot: idx + 1,
        });
      }
    });
    r.packs.forEach((p, packIdx0) => {
      if (p.contents.kind === "buffoon") {
        p.contents.jokers.forEach((j, pos0) => {
          if (out.length >= max) return;
          if (j.joker === jokerName) {
            out.push({
              ante: r.ante, source: "buffoon-pack",
              edition: j.edition, stickers: j.stickers, rarity: j.rarity,
              packName: p.name,
              packIndex: packIdx0 + 1,
              packPosition: pos0 + 1,
            });
          }
        });
      }
    });
  }
  return out;
}

export interface SoulSighting {
  ante: number;
  packName: string;
  source: "tarot-pack" | "spectral-pack";
  card: "The Soul" | "Black Hole";
  resolvedJoker?: JokerData;
  position?: number;
}

export function findSoulSpawns(results: AnteResult[]): SoulSighting[] {
  const out: SoulSighting[] = [];
  for (const r of results) {
    for (const p of r.packs) {
      const c = p.contents;
      if (c.kind === "tarot" || c.kind === "spectral") {
        const resolutions = c.soulResolutions || [];
        c.items.forEach((it, idx) => {
          if (it === "The Soul" || it === "Black Hole") {
            const resolved = it === "The Soul" ? resolutions.find(s => s.position === idx) : undefined;
            out.push({
              ante: r.ante,
              packName: p.name,
              source: c.kind === "tarot" ? "tarot-pack" : "spectral-pack",
              card: it,
              resolvedJoker: resolved ? resolved.joker : undefined,
              position: idx,
            });
          }
        });
      }
    }
  }
  return out;
}
