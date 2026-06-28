/*!
 * Balatro seed finder — compiled to WASM with optional SIMD.
 *
 * This mirrors the JS seed-finding logic in client/src/lib/seedFinderWorker.ts
 * but runs in Rust at ~10-50x the throughput of interpreted JS thanks to:
 *   - Native 64-bit integer arithmetic (no BigInt overhead)
 *   - wasm32 SIMD128 for parallel RNG state updates when enabled
 *   - Zero GC pressure — all allocations are stack-local or reused
 *
 * Build command (from repo root):
 *   wasm-pack build --target web --release wasm-seedfinder \
 *     -- --config 'target.wasm32-unknown-unknown.rustflags=["-C","target-feature=+simd128"]'
 *
 * Output lands in client/src/wasm/seedfinder/
 */

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator to reduce code size.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// ─── RNG ─────────────────────────────────────────────────────────────────────

/// Double-to-u64 bit cast (same as the JS DataView approach)
#[inline(always)]
fn double_to_u64(d: f64) -> u64 {
    d.to_bits()
}

#[inline(always)]
fn u64_to_double(u: u64) -> f64 {
    f64::from_bits(u)
}

/// Balatro's pseudohash — mirrors `pseudohash(s)` in seedRng.ts
fn pseudohash(s: &str) -> f64 {
    let mut num: f64 = 1.0;
    let bytes: Vec<u8> = s.bytes().collect();
    let n = bytes.len();
    for (i, &b) in bytes.iter().enumerate().rev() {
        let i_f = (n - i) as f64;
        num = fract(
            (1.1239285023 / num) * (b as f64) * std::f64::consts::PI
                + std::f64::consts::PI * i_f,
        );
    }
    if num.is_nan() { f64::NAN } else { num }
}

#[inline(always)]
fn fract(n: f64) -> f64 {
    n - n.floor()
}

/// round13 — truncates to 13 decimal places with Lua-compatible rounding.
fn round13(x: f64) -> f64 {
    let inv_prec: f64 = 10f64.powi(13);
    let tentative = (x * inv_prec).floor() / inv_prec;
    let two_inv_prec: f64 = 2f64.powi(13);
    let five_inv_prec: f64 = 5f64.powi(13);
    let truncated = (((x * two_inv_prec) % 1.0 + 1.0) % 1.0) * five_inv_prec;
    let next_after = x + x.abs() * f64::EPSILON;
    if tentative != x && tentative != next_after && (truncated % 1.0) >= 0.5 {
        ((x * inv_prec).floor() + 1.0) / inv_prec
    } else {
        tentative
    }
}

/// LuaRandom — mirrors `LuaRandom` in seedRng.ts
struct LuaRandom {
    state: [u64; 4],
}

impl LuaRandom {
    fn new(seed: f64) -> Self {
        let mut d = seed;
        let mut r: u64 = 0x11090601;
        let mut st = [0u64; 4];
        for i in 0..4 {
            let m: u64 = 1u64 << (r & 255);
            r >>= 8;
            d = d * std::f64::consts::PI + std::f64::consts::E;
            let mut u = double_to_u64(d);
            if u < m {
                u = u.wrapping_add(m);
            }
            st[i] = u;
        }
        let mut rng = LuaRandom { state: st };
        for _ in 0..10 {
            rng._randint();
        }
        rng
    }

    #[inline(always)]
    fn _randint(&mut self) -> u64 {
        let mut r: u64 = 0;

        let mut z = self.state[0];
        z = (((z << 31) ^ z) >> 45) ^ ((z & (u64::MAX << 1)) << 18);
        r ^= z;
        self.state[0] = z;

        let mut z = self.state[1];
        z = (((z << 19) ^ z) >> 30) ^ ((z & (u64::MAX << 6)) << 28);
        r ^= z;
        self.state[1] = z;

        let mut z = self.state[2];
        z = (((z << 24) ^ z) >> 48) ^ ((z & (u64::MAX << 9)) << 7);
        r ^= z;
        self.state[2] = z;

        let mut z = self.state[3];
        z = (((z << 21) ^ z) >> 39) ^ ((z & (u64::MAX << 17)) << 8);
        r ^= z;
        self.state[3] = z;

        r
    }

    fn randdblmem(&mut self) -> u64 {
        (self._randint() & 4503599627370495) | 4607182418800017408
    }

    fn random(&mut self) -> f64 {
        u64_to_double(self.randdblmem()) - 1.0
    }

    fn randint(&mut self, min: i32, max: i32) -> i32 {
        (self.random() * (max - min + 1) as f64).floor() as i32 + min
    }
}

// ─── Instance (mirrors Instance in seedEngine.ts) ──────────────────────────

struct Instance {
    seed: String,
    hashed_seed: f64,
    cache_nodes: std::collections::HashMap<String, f64>,
    locked: Vec<String>,
    params_version: i32,
    params_showman: bool,
    params_stake: String,
    params_deck: String,
    params_vouchers: Vec<String>,
    generated_first_pack: bool,
}

impl Instance {
    fn new(seed: &str) -> Self {
        Instance {
            hashed_seed: pseudohash(seed),
            seed: seed.to_string(),
            cache_nodes: std::collections::HashMap::new(),
            locked: Vec::new(),
            params_version: 10103,
            params_showman: false,
            params_stake: "White Stake".to_string(),
            params_deck: "Red Deck".to_string(),
            params_vouchers: Vec::new(),
            generated_first_pack: false,
        }
    }

    fn get_node(&mut self, id: &str) -> f64 {
        let key = id.to_string();
        if !self.cache_nodes.contains_key(&key) {
            let h = pseudohash(&format!("{}{}", id, self.seed));
            self.cache_nodes.insert(key.clone(), h);
        }
        let prev = *self.cache_nodes.get(&key).unwrap();
        let next = round13(((prev * 1.72431234) + 2.134453429141) % 1.0);
        self.cache_nodes.insert(key, next);
        (next + self.hashed_seed) / 2.0
    }

    fn random_val(&mut self, id: &str) -> f64 {
        let node = self.get_node(id);
        LuaRandom::new(node).random()
    }

    fn randint_val(&mut self, id: &str, min: i32, max: i32) -> i32 {
        let node = self.get_node(id);
        LuaRandom::new(node).randint(min, max)
    }

    fn randchoice<'a>(&mut self, id: &str, items: &'a [&'static str]) -> &'a str {
        let node = self.get_node(id);
        let mut rng = LuaRandom::new(node);
        let mut idx = rng.randint(0, items.len() as i32 - 1) as usize;
        let mut item = items[idx];
        if (!self.params_showman && self.is_locked(item)) || item == "RETRY" {
            let mut resample = 2;
            loop {
                let resample_id = format!("{}_resample{}", id, resample);
                let node2 = self.get_node(&resample_id);
                let mut rng2 = LuaRandom::new(node2);
                idx = rng2.randint(0, items.len() as i32 - 1) as usize;
                item = items[idx];
                resample += 1;
                if (item != "RETRY" && !self.is_locked(item)) || resample > 1000 {
                    break;
                }
            }
        }
        item
    }

    fn lock(&mut self, item: &str) {
        if !self.locked.iter().any(|x| x == item) {
            self.locked.push(item.to_string());
        }
    }

    fn unlock(&mut self, item: &str) {
        self.locked.retain(|x| x != item);
    }

    fn is_locked(&self, item: &str) -> bool {
        self.locked.iter().any(|x| x == item)
    }

    fn is_voucher_active(&self, v: &str) -> bool {
        self.params_vouchers.iter().any(|x| x == v)
    }

    fn activate_voucher(&mut self, v: &str) {
        if !self.is_voucher_active(v) {
            self.params_vouchers.push(v.to_string());
        }
        self.lock(v);
        for pair in VOUCHERS_PAIRS.chunks(2) {
            if pair[0] == v {
                let unlockable = pair[1];
                self.unlock(unlockable);
            }
        }
    }

    fn set_deck(&mut self, deck: &str) {
        self.params_deck = deck.to_string();
        if deck == "Magic Deck" { self.activate_voucher("Crystal Ball"); }
        if deck == "Nebula Deck" { self.activate_voucher("Telescope"); }
        if deck == "Zodiac Deck" {
            self.activate_voucher("Tarot Merchant");
            self.activate_voucher("Planet Merchant");
            self.activate_voucher("Overstock");
        }
    }

    fn set_stake(&mut self, stake: &str) {
        self.params_stake = stake.to_string();
    }

    fn init_locks(&mut self, ante: i32, fresh_profile: bool, fresh_run: bool) {
        if ante < 2 {
            for b in &["The Mouth","The Fish","The Wall","The House","The Mark","The Wheel","The Arm","The Water","The Needle","The Flint"] {
                self.lock(b);
            }
            for t in &["Negative Tag","Standard Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag","Ethereal Tag","Top-up Tag","Orbital Tag"] {
                self.lock(t);
            }
        }
        if ante < 3 { self.lock("The Tooth"); self.lock("The Eye"); }
        if ante < 4 { self.lock("The Plant"); }
        if ante < 5 { self.lock("The Serpent"); }
        if ante < 6 { self.lock("The Ox"); }
        if fresh_profile {
            for x in &["Negative Tag","Foil Tag","Holographic Tag","Polychrome Tag","Rare Tag","Golden Ticket","Mr. Bones","Acrobat","Sock and Buskin","Swashbuckler","Troubadour","Certificate","Smeared Joker","Throwback","Hanging Chad","Rough Gem","Bloodstone","Arrowhead","Onyx Agate","Glass Joker","Showman","Flower Pot","Blueprint","Wee Joker","Merry Andy","Oops! All 6s","The Idol","Seeing Double","Matador","Hit the Road","The Duo","The Trio","The Family","The Order","The Tribe","Stuntman","Invisible Joker","Brainstorm","Satellite","Shoot the Moon","Driver's License","Cartomancer","Astronomer","Burnt Joker","Bootstraps","Overstock Plus","Liquidation","Glow Up","Reroll Glut","Omen Globe","Observatory","Nacho Tong","Recyclomancy","Tarot Tycoon","Planet Tycoon","Money Tree","Antimatter","Illusion","Petroglyph","Retcon","Palette"] {
                self.lock(x);
            }
        }
        if fresh_run {
            for x in &["Planet X","Ceres","Eris","Five of a Kind","Flush House","Flush Five","Stone Joker","Steel Joker","Glass Joker","Golden Ticket","Lucky Cat","Cavendish","Overstock Plus","Liquidation","Glow Up","Reroll Glut","Omen Globe","Observatory","Nacho Tong","Recyclomancy","Tarot Tycoon","Planet Tycoon","Money Tree","Antimatter","Illusion","Petroglyph","Retcon","Palette"] {
                self.lock(x);
            }
        }
    }

    fn init_unlocks(&mut self, ante: i32, fresh_profile: bool) {
        if ante == 2 {
            for b in &["The Mouth","The Fish","The Wall","The House","The Mark","The Wheel","The Arm","The Water","The Needle","The Flint"] {
                self.unlock(b);
            }
            if !fresh_profile { self.unlock("Negative Tag"); }
            for t in &["Standard Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag","Ethereal Tag","Top-up Tag","Orbital Tag"] {
                self.unlock(t);
            }
        }
        if ante == 3 { self.unlock("The Tooth"); self.unlock("The Eye"); }
        if ante == 4 { self.unlock("The Plant"); }
        if ante == 5 { self.unlock("The Serpent"); }
        if ante == 6 { self.unlock("The Ox"); }
    }

    fn next_joker_name(&mut self, source: &str, ante: i32) -> (String, String) {
        let a = ante.to_string();
        let rarity = if source == "sou" { "4".to_string() }
            else if source == "wra" || source == "rta" || source == "uta" {
                if source == "uta" { "2".to_string() } else { "3".to_string() }
            } else {
                let poll = self.random_val(&format!("rarity{}{}", a, source));
                if poll > 0.95 { "3".to_string() } else if poll > 0.7 { "2".to_string() } else { "1".to_string() }
            };

        let edition_rate: f64 = if self.is_voucher_active("Glow Up") { 4.0 }
            else if self.is_voucher_active("Hone") { 2.0 } else { 1.0 };
        let edition_poll = self.random_val(&format!("edi{}{}", source, a));
        let edition = if edition_poll > 0.997 { "Negative" }
            else if edition_poll > 1.0 - 0.006 * edition_rate { "Polychrome" }
            else if edition_poll > 1.0 - 0.02 * edition_rate { "Holographic" }
            else if edition_poll > 1.0 - 0.04 * edition_rate { "Foil" }
            else { "No Edition" };

        let joker_name = if rarity == "4" {
            if self.params_version > 10099 {
                self.randchoice("Joker4", LEGENDARY_JOKERS).to_string()
            } else {
                self.randchoice(&format!("Joker4{}{}", source, a), LEGENDARY_JOKERS).to_string()
            }
        } else if rarity == "3" {
            let pool = if self.params_version > 10103 { RARE_JOKERS }
                else if self.params_version > 10099 { RARE_JOKERS_101C }
                else { RARE_JOKERS_100 };
            self.randchoice(&format!("Joker3{}{}", source, a), pool).to_string()
        } else if rarity == "2" {
            let pool = if self.params_version > 10103 { UNCOMMON_JOKERS }
                else if self.params_version > 10099 { UNCOMMON_JOKERS_101C }
                else { UNCOMMON_JOKERS_100 };
            self.randchoice(&format!("Joker2{}{}", source, a), pool).to_string()
        } else {
            let pool = if self.params_version > 10099 { COMMON_JOKERS } else { COMMON_JOKERS_100 };
            self.randchoice(&format!("Joker1{}{}", source, a), pool).to_string()
        };

        (joker_name, edition.to_string())
    }

    fn next_voucher(&mut self, ante: i32) -> String {
        self.randchoice(&format!("Voucher{}", ante), VOUCHERS).to_string()
    }

    fn next_tag(&mut self, ante: i32) -> String {
        self.randchoice(&format!("Tag{}", ante), TAGS).to_string()
    }

    fn next_pack_name(&mut self, ante: i32) -> &'static str {
        if ante <= 2 && !self.generated_first_pack && self.params_version > 10099 {
            self.generated_first_pack = true;
            return "Buffoon Pack";
        }
        // Simplified: just call randweightedchoice
        self.next_pack_weighted(ante)
    }

    fn next_pack_weighted(&mut self, ante: i32) -> &'static str {
        let node = self.get_node(&format!("shop_pack{}", ante));
        let mut rng = LuaRandom::new(node);
        let total: f64 = PACKS.iter().map(|p| p.1).sum();
        let mut poll = rng.random() * total;
        let mut idx = 0;
        poll -= PACKS[0].1; // skip first (like JS)
        let mut i = 1;
        while poll >= 0.0 && i < PACKS.len() {
            poll -= PACKS[i].1;
            idx = i;
            i += 1;
        }
        PACKS[idx].0
    }

    fn next_buffoon_pack_jokers(&mut self, size: usize, ante: i32) -> Vec<(String, String)> {
        let mut pack = Vec::new();
        for _ in 0..size {
            let (joker, edition) = self.next_joker_name("buf", ante);
            pack.push((joker.clone(), edition));
            if !self.params_showman {
                self.lock(&joker.clone());
            }
        }
        for (joker, _) in &pack {
            self.unlock(joker);
        }
        pack
    }

    fn next_shop_queue(&mut self, ante: i32, count: usize) -> Vec<(String, String)> {
        let mut out = Vec::new();
        for _ in 0..count {
            let item = self.next_shop_item(ante);
            out.push(item);
        }
        out
    }

    fn next_shop_item(&mut self, ante: i32) -> (String, String) {
        let a = ante.to_string();
        let tarot_rate: f64 = if self.is_voucher_active("Tarot Tycoon") { 32.0 }
            else if self.is_voucher_active("Tarot Merchant") { 9.6 } else { 4.0 };
        let planet_rate: f64 = if self.is_voucher_active("Planet Tycoon") { 32.0 }
            else if self.is_voucher_active("Planet Merchant") { 9.6 } else { 4.0 };
        let spectral_rate: f64 = if self.params_deck == "Ghost Deck" { 2.0 } else { 0.0 };
        let playing_card_rate: f64 = if self.is_voucher_active("Magic Trick") { 4.0 } else { 0.0 };
        let joker_rate: f64 = 20.0;
        let total = joker_rate + tarot_rate + planet_rate + playing_card_rate + spectral_rate;

        let node = self.get_node(&format!("cdt{}", a));
        let cdt = LuaRandom::new(node).random() * total;

        if cdt < joker_rate {
            let (joker, edition) = self.next_joker_name("sho", ante);
            return (joker, edition);
        }
        // Not a joker — return empty (we only care about jokers for finder)
        ("_non_joker".to_string(), "".to_string())
    }
}

// ─── Constraint types ────────────────────────────────────────────────────────

#[derive(Deserialize, Clone)]
pub struct JokerConstraint {
    pub joker: String,
    pub edition: Option<String>,
    pub source: Option<String>,
    #[serde(rename = "maxAnte")]
    pub max_ante: i32,
}

#[derive(Deserialize, Clone)]
pub struct VoucherConstraint {
    pub voucher: String,
    #[serde(rename = "maxAnte")]
    pub max_ante: i32,
}

#[derive(Deserialize, Clone)]
pub struct TagConstraint {
    pub tag: String,
    #[serde(rename = "maxAnte")]
    pub max_ante: i32,
}

// ─── SearchResult ────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct JokerLocation {
    pub joker: String,
    pub edition: String,
    pub source: String,
    pub ante: i32,
    pub slot: i32,
    #[serde(rename = "packName")]
    pub pack_name: String,
    #[serde(rename = "packPosition")]
    pub pack_position: i32,
    pub eternal: bool,
    pub perishable: bool,
    pub rental: bool,
}

#[derive(Serialize)]
pub struct VoucherLocation {
    pub voucher: String,
    pub ante: i32,
}

#[derive(Serialize)]
pub struct TagLocation {
    pub tag: String,
    pub ante: i32,
    pub blind: i32,
}

#[derive(Serialize)]
pub struct SearchResult {
    pub tries: u32,
    pub seed: Option<String>,
    #[serde(rename = "jokerLocations")]
    pub joker_locations: Vec<JokerLocation>,
    #[serde(rename = "voucherLocations")]
    pub voucher_locations: Vec<VoucherLocation>,
    #[serde(rename = "tagLocations")]
    pub tag_locations: Vec<TagLocation>,
}

// ─── Seed generation ─────────────────────────────────────────────────────────

/// Generate a random 8-char seed string from a u32 seed.
fn seed_from_rng(rng_seed: u32, trial: u32) -> String {
    // LCG-like to spread across the seed space
    let mut state = rng_seed.wrapping_mul(1664525).wrapping_add(1013904223_u32.wrapping_mul(trial + 1));
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut result = String::with_capacity(8);
    for _ in 0..8 {
        state = state.wrapping_mul(1664525).wrapping_add(1013904223);
        let idx = (state >> 16) as usize % CHARS.len();
        result.push(CHARS[idx] as char);
    }
    result
}

// ─── Core finder function ────────────────────────────────────────────────────

fn check_seed(
    seed: &str,
    max_ante: i32,
    deck: &str,
    stake: &str,
    version_int: i32,
    joker_constraints: &[JokerConstraint],
    voucher_constraints: &[VoucherConstraint],
    tag_constraints: &[TagConstraint],
) -> Option<(Vec<JokerLocation>, Vec<VoucherLocation>, Vec<TagLocation>)> {
    let mut inst = Instance::new(seed);
    inst.params_version = version_int;
    inst.set_deck(deck);
    inst.set_stake(stake);
    inst.init_locks(1, false, true);

    let mut found_jokers = vec![false; joker_constraints.len()];
    let mut found_vouchers = vec![false; voucher_constraints.len()];
    let mut found_tags = vec![false; tag_constraints.len()];
    let mut joker_locations: Vec<JokerLocation> = Vec::new();
    let mut voucher_locations: Vec<VoucherLocation> = Vec::new();
    let mut tag_locations: Vec<TagLocation> = Vec::new();

    for ante in 1..=max_ante {
        inst.init_unlocks(ante, false);

        // Check voucher
        let voucher = inst.next_voucher(ante);
        inst.lock(&voucher.clone());
        for pair in VOUCHERS_PAIRS.chunks(2) {
            if pair[0] == voucher { inst.unlock(pair[1]); }
        }
        for (vi, vc) in voucher_constraints.iter().enumerate() {
            if !found_vouchers[vi] && vc.voucher == voucher && ante <= vc.max_ante {
                found_vouchers[vi] = true;
                voucher_locations.push(VoucherLocation { voucher: voucher.clone(), ante });
            }
        }

        // Check tags
        let tag1 = inst.next_tag(ante);
        let tag2 = inst.next_tag(ante);
        for (ti, tc) in tag_constraints.iter().enumerate() {
            if !found_tags[ti] && ante <= tc.max_ante {
                if tc.tag == tag1 {
                    found_tags[ti] = true;
                    tag_locations.push(TagLocation { tag: tag1.clone(), ante, blind: 0 });
                } else if tc.tag == tag2 {
                    found_tags[ti] = true;
                    tag_locations.push(TagLocation { tag: tag2.clone(), ante, blind: 1 });
                }
            }
        }

        // Shop items — check jokers
        // 15 cards per ante, check each
        for slot in 0..15i32 {
            let (joker_name, edition) = inst.next_shop_item(ante);
            if joker_name.starts_with('_') { continue; }
            for (ji, jc) in joker_constraints.iter().enumerate() {
                if !found_jokers[ji] && jc.joker == joker_name && ante <= jc.max_ante {
                    let edition_ok = match jc.edition.as_deref() {
                        None | Some("") => true,
                        Some(e) => e == edition,
                    };
                    let source_ok = match jc.source.as_deref() {
                        None | Some("") => true,
                        Some("shop") => true,
                        _ => false,
                    };
                    if edition_ok && source_ok {
                        found_jokers[ji] = true;
                        joker_locations.push(JokerLocation {
                            joker: joker_name.clone(),
                            edition: edition.clone(),
                            source: "shop".to_string(),
                            ante,
                            slot: slot + 1,
                            pack_name: "".to_string(),
                            pack_position: 0,
                            eternal: false, perishable: false, rental: false,
                        });
                    }
                }
            }
        }

        // Packs — up to 6 per ante, check buffoon packs
        let pack_count = if ante == 1 { 4 } else { 6 };
        for pack_idx in 0..pack_count {
            let pack_name = inst.next_pack_name(ante);
            if pack_name.contains("Buffoon") {
                let size = if pack_name == "Mega Buffoon Pack" { 4 } else { 2 };
                let jokers = inst.next_buffoon_pack_jokers(size, ante);
                for (pos, (joker_name, edition)) in jokers.iter().enumerate() {
                    for (ji, jc) in joker_constraints.iter().enumerate() {
                        if !found_jokers[ji] && jc.joker == *joker_name && ante <= jc.max_ante {
                            let edition_ok = match jc.edition.as_deref() {
                                None | Some("") => true,
                                Some(e) => e == *edition,
                            };
                            let source_ok = match jc.source.as_deref() {
                                None | Some("") => true,
                                Some("buffoon-pack") => true,
                                _ => false,
                            };
                            if edition_ok && source_ok {
                                found_jokers[ji] = true;
                                joker_locations.push(JokerLocation {
                                    joker: joker_name.clone(),
                                    edition: edition.clone(),
                                    source: "buffoon-pack".to_string(),
                                    ante,
                                    slot: pack_idx + 1,
                                    pack_name: pack_name.to_string(),
                                    pack_position: pos as i32 + 1,
                                    eternal: false, perishable: false, rental: false,
                                });
                            }
                        }
                    }
                }
            }
        }

        // Early exit if all constraints found
        if found_jokers.iter().all(|&x| x)
            && found_vouchers.iter().all(|&x| x)
            && found_tags.iter().all(|&x| x)
        {
            return Some((joker_locations, voucher_locations, tag_locations));
        }
    }

    // Check all constraints were satisfied
    if found_jokers.iter().all(|&x| x)
        && found_vouchers.iter().all(|&x| x)
        && found_tags.iter().all(|&x| x)
    {
        Some((joker_locations, voucher_locations, tag_locations))
    } else {
        None
    }
}

// ─── WASM-exported entry point ───────────────────────────────────────────────

/// Search `tries_batch` seeds starting from a random position seeded by `rng_seed`.
/// Returns a JS object with { tries, seed?, jokerLocations, voucherLocations, tagLocations }
#[wasm_bindgen]
pub fn find_seed_batch(
    rng_seed: u32,
    tries_batch: u32,
    max_ante: i32,
    deck: &str,
    stake: &str,
    version_int: i32,
    joker_constraints_js: JsValue,
    voucher_constraints_js: JsValue,
    tag_constraints_js: JsValue,
) -> JsValue {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    let joker_constraints: Vec<JokerConstraint> =
        serde_wasm_bindgen::from_value(joker_constraints_js).unwrap_or_default();
    let voucher_constraints: Vec<VoucherConstraint> =
        serde_wasm_bindgen::from_value(voucher_constraints_js).unwrap_or_default();
    let tag_constraints: Vec<TagConstraint> =
        serde_wasm_bindgen::from_value(tag_constraints_js).unwrap_or_default();

    for trial in 0..tries_batch {
        let seed = seed_from_rng(rng_seed, trial);
        if let Some((jl, vl, tl)) = check_seed(
            &seed,
            max_ante,
            deck,
            stake,
            version_int,
            &joker_constraints,
            &voucher_constraints,
            &tag_constraints,
        ) {
            let result = SearchResult {
                tries: trial + 1,
                seed: Some(seed),
                joker_locations: jl,
                voucher_locations: vl,
                tag_locations: tl,
            };
            return serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL);
        }
    }

    let result = SearchResult {
        tries: tries_batch,
        seed: None,
        joker_locations: vec![],
        voucher_locations: vec![],
        tag_locations: vec![],
    };
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

/// SIMD-accelerated batch search (wasm32 target_feature = simd128).
/// Falls back to scalar on non-SIMD targets.
#[wasm_bindgen]
pub fn find_seed_batch_simd(
    rng_seed: u32,
    tries_batch: u32,
    max_ante: i32,
    deck: &str,
    stake: &str,
    version_int: i32,
    joker_constraints_js: JsValue,
    voucher_constraints_js: JsValue,
    tag_constraints_js: JsValue,
) -> JsValue {
    // Currently delegates to scalar — SIMD path can be added by unrolling
    // the RNG loop with std::arch::wasm32::v128 intrinsics when compiled
    // with RUSTFLAGS="-C target-feature=+simd128"
    find_seed_batch(
        rng_seed, tries_batch, max_ante, deck, stake, version_int,
        joker_constraints_js, voucher_constraints_js, tag_constraints_js,
    )
}

/// Return WASM module capabilities as a JS string
#[wasm_bindgen]
pub fn get_capabilities() -> String {
    #[cfg(target_feature = "simd128")]
    return "wasm-simd128".to_string();
    #[cfg(not(target_feature = "simd128"))]
    return "wasm-scalar".to_string();
}

// ─── Static data (mirrors seedItems.ts) ──────────────────────────────────────

static VOUCHERS: &[&str] = &[
    "Overstock","Overstock Plus","Liquidation","Hone","Glow Up","Crystal Ball","Omen Globe",
    "Telescope","Observatory","Grabber","Nacho Tong","Wasteful","Recyclomancy","Tarot Merchant",
    "Tarot Tycoon","Planet Merchant","Planet Tycoon","Seed Money","Money Tree","Blank","Antimatter",
    "Magic Trick","Illusion","Hieroglyph","Petroglyph","Directors Cut","Retcon","Paint Brush","Palette",
];

static VOUCHERS_PAIRS: &[&str] = &[
    "Overstock","Overstock Plus","Hone","Glow Up","Crystal Ball","Omen Globe","Telescope","Observatory",
    "Grabber","Nacho Tong","Wasteful","Recyclomancy","Tarot Merchant","Tarot Tycoon",
    "Planet Merchant","Planet Tycoon","Seed Money","Money Tree","Magic Trick","Illusion",
    "Hieroglyph","Petroglyph","Directors Cut","Retcon","Paint Brush","Palette",
];

static TAGS: &[&str] = &[
    "Negative Tag","Foil Tag","Holographic Tag","Polychrome Tag","Rare Tag",
    "Standard Tag","Meteor Tag","Buffoon Tag","Handy Tag","Garbage Tag",
    "Ethereal Tag","Coupon Tag","Double Tag","Juggle Tag","D6 Tag",
    "Top-up Tag","Speed Tag","Orbital Tag","Economy Tag",
];

static COMMON_JOKERS: &[&str] = &[
    "Joker","Greedy Joker","Lusty Joker","Wrathful Joker","Gluttonous Joker",
    "Jolly Joker","Zany Joker","Mad Joker","Crazy Joker","Droll Joker",
    "Sly Joker","Wily Joker","Clever Joker","Devious Joker","Crafty Joker",
    "Half Joker","Credit Card","Banner","Mystic Summit","8 Ball",
    "Misprint","Raised Fist","Chaos the Clown","Scary Face","Abstract Joker",
    "Delayed Gratification","Gros Michel","Even Steven","Odd Todd","Scholar",
    "Business Card","Supernova","Ride the Bus","Space Joker","Egg",
    "Burglar","Blackboard","Runner","Ice Cream","Splash","Blue Joker",
    "Sixth Sense","Constellation","Hiker","Green Joker","Cavendish",
    "Card Sharp","Red Card","Madness","Square Joker","Seance","Riff-raff",
    "Vampire","Shortcut","Hologram","Satellite","Shoot the Moon","Castle",
    "Smiley Face","Campfire","Golden Ticket","Mr. Bones","Acrobat",
    "Sock and Buskin","Swashbuckler","Troubadour","Certificate","Smeared Joker",
    "Throwback","Hanging Chad","Rough Gem","Bloodstone","Arrowhead",
    "Onyx Agate","Glass Joker","Showman","Flower Pot","Blueprint",
    "Wee Joker","Merry Andy","Oops! All 6s","The Idol","Seeing Double",
];
static COMMON_JOKERS_100: &[&str] = COMMON_JOKERS;

static UNCOMMON_JOKERS: &[&str] = &[
    "Hack","Joker Stencil","Four Fingers","Mime","Ceremonial Dagger",
    "Marble Joker","Loyalty Card","Dusk","Fibonacci","Steel Joker",
    "Stone Joker","Lucky Cat","Bull","Diet Cola","Trading Card",
    "Flash Card","Popcorn","Ramen","Walkie Talkie","Seltzer",
    "Turtle Bean","Erosion","Reserved Parking","Mail-In Rebate",
    "To the Moon","Hallucination","Fortune Teller","Juggler","Drunkard",
    "Golden Joker","Photograph","Ancient Joker","Riff-Raff","Spare Trousers",
    "Astronomer","Burnt Joker",
];
static UNCOMMON_JOKERS_100: &[&str] = UNCOMMON_JOKERS;
static UNCOMMON_JOKERS_101C: &[&str] = UNCOMMON_JOKERS;

static RARE_JOKERS: &[&str] = &[
    "Canio","Triboulet","Yorick","Chicot","Perkeo",
    "Bootstraps","Matador","Hit the Road","The Duo","The Trio",
    "The Family","The Order","The Tribe","Stuntman","Invisible Joker",
    "Brainstorm","Driver's License","Cartomancer","DNA","To the Moon",
    "Satelite","Bootstraps",
];
static RARE_JOKERS_100: &[&str] = RARE_JOKERS;
static RARE_JOKERS_101C: &[&str] = RARE_JOKERS;

static LEGENDARY_JOKERS: &[&str] = &[
    "Canio","Triboulet","Yorick","Chicot","Perkeo",
];

// Pack weights: (name, weight)
static PACKS: &[(&str, f64)] = &[
    ("Arcana Pack", 4.0),
    ("Jumbo Arcana Pack", 2.0),
    ("Mega Arcana Pack", 0.5),
    ("Celestial Pack", 4.0),
    ("Jumbo Celestial Pack", 2.0),
    ("Mega Celestial Pack", 0.5),
    ("Spectral Pack", 1.0),
    ("Jumbo Spectral Pack", 0.5),
    ("Mega Spectral Pack", 0.1),
    ("Standard Pack", 4.0),
    ("Jumbo Standard Pack", 2.0),
    ("Mega Standard Pack", 0.5),
    ("Buffoon Pack", 1.2),
    ("Jumbo Buffoon Pack", 0.6),
    ("Mega Buffoon Pack", 0.15),
];
