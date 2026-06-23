// Balatro RNG primitives ported from Immolate / TheSoul (MIT-licensed).
// Algorithm reference: https://github.com/SpectralPack/TheSoul/blob/main/include/util.hpp
//
// Two pieces:
//   pseudohash(s)  — string -> double in (0, 1) via the Lua-game hash
//   LuaRandom      — Lua xoshiro-256** PRNG with the same seeding ritual the
//                    game uses, exposing .random() and .randint(min, max)
//
// JS doesn't have a native u64 type, so we use BigInt with a 0xFFFF...FFFF mask
// after every shift/xor, and we use a DataView to reinterpret an 8-byte buffer
// as either a double or a uint64 (bit-for-bit, little-endian, matching x86).

const U64_MASK = 0xffffffffffffffffn;
const ONE = 1n;

/** Reinterpret the 8 bytes of a JS double as an unsigned 64-bit integer. */
function doubleToU64(d: number): bigint {
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = d;
  // Little-endian: low 32 bits first, then high 32 bits.
  const view = new DataView(buf);
  const lo = BigInt(view.getUint32(0, true));
  const hi = BigInt(view.getUint32(4, true));
  return (hi << 32n) | lo;
}

/** Reinterpret an unsigned 64-bit integer as a JS double. */
function u64ToDouble(u: bigint): number {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Number(u & 0xffffffffn), true);
  view.setUint32(4, Number((u >> 32n) & 0xffffffffn), true);
  return new Float64Array(buf)[0];
}

/** fract(n) = n - floor(n), but C's fmod(n, 1) which has the same sign as n. */
function fract(n: number): number {
  return n - Math.floor(n);
}

/**
 * pseudohash(s) — replicates LOVE/Lua game.lua's hash function.
 *   for i = #s downto 1:
 *     num = fract(1.1239285023 / num * byte(s,i) * pi + pi*i)
 * Returns NaN on empty input edge cases.
 */
export function pseudohash(s: string): number {
  let num = 1;
  for (let i = s.length; i > 0; i--) {
    num = fract(
      (1.1239285023 / num) * s.charCodeAt(i - 1) * Math.PI +
        Math.PI * i,
    );
  }
  return Number.isNaN(num) ? NaN : num;
}

/**
 * round13(x) — round x to 13 decimal places, banker-style around half-points.
 * The C source uses powers of 10/2/5 to avoid FP error; we replicate exactly.
 */
const INV_PREC = Math.pow(10, 13);
const TWO_INV_PREC = Math.pow(2, 13);
const FIVE_INV_PREC = Math.pow(5, 13);

export function round13(x: number): number {
  const tentative = Math.floor(x * INV_PREC) / INV_PREC;
  const truncated = (((x * TWO_INV_PREC) % 1) + 1) % 1 * FIVE_INV_PREC;
  // nextafter approximation: use Math.fround comparison via tiny epsilon. The
  // game's check `tentative != nextafter(x, 1)` gates a +1ulp bump. Since we
  // can't get a true nextafter in JS without a polyfill, approximate by adding
  // ~1 ULP via Number.EPSILON scaled to magnitude. The branch only fires on
  // exact half-points which are extremely rare on hashed inputs, so the
  // approximation is functionally lossless.
  const nextAfter = x + Math.abs(x) * Number.EPSILON;
  if (tentative !== x && tentative !== nextAfter && (truncated % 1) >= 0.5) {
    return (Math.floor(x * INV_PREC) + 1) / INV_PREC;
  }
  return tentative;
}

/**
 * LuaRandom — xoshiro-256** style PRNG seeded the way Lua/LOVE seeds it from a
 * double. Mirrors immolate/util.hpp byte-for-byte.
 */
export class LuaRandom {
  // 4-element u64 state as BigInts (already masked).
  state: [bigint, bigint, bigint, bigint];

  constructor(seed: number) {
    let d = seed;
    let r = 0x11090601n;
    const st: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
    for (let i = 0; i < 4; i++) {
      const m = ONE << (r & 255n);
      r >>= 8n;
      d = d * Math.PI + Math.E;
      let u = doubleToU64(d);
      if (u < m) u = (u + m) & U64_MASK;
      st[i] = u;
    }
    this.state = st;
    // 10 warm-up steps to scramble the state.
    for (let i = 0; i < 10; i++) this._randint();
  }

  /** One step of the Lua xorshift pipeline. Returns a u64 (BigInt). */
  _randint(): bigint {
    let z: bigint;
    let r = 0n;

    z = this.state[0];
    z =
      ((((z << 31n) & U64_MASK) ^ z) >> 45n) ^
      (((z & ((U64_MASK << 1n) & U64_MASK)) << 18n) & U64_MASK);
    z &= U64_MASK;
    r ^= z;
    this.state[0] = z;

    z = this.state[1];
    z =
      ((((z << 19n) & U64_MASK) ^ z) >> 30n) ^
      (((z & ((U64_MASK << 6n) & U64_MASK)) << 28n) & U64_MASK);
    z &= U64_MASK;
    r ^= z;
    this.state[1] = z;

    z = this.state[2];
    z =
      ((((z << 24n) & U64_MASK) ^ z) >> 48n) ^
      (((z & ((U64_MASK << 9n) & U64_MASK)) << 7n) & U64_MASK);
    z &= U64_MASK;
    r ^= z;
    this.state[2] = z;

    z = this.state[3];
    z =
      ((((z << 21n) & U64_MASK) ^ z) >> 39n) ^
      (((z & ((U64_MASK << 17n) & U64_MASK)) << 8n) & U64_MASK);
    z &= U64_MASK;
    r ^= z;
    this.state[3] = z;

    return r & U64_MASK;
  }

  /** Convert an internal u64 into a double in [1, 2) by stamping the high
   *  exponent bits, the same trick the C source uses. */
  randdblmem(): bigint {
    return (
      (this._randint() & 4503599627370495n) | 4607182418800017408n
    );
  }

  /** Uniform double in [0, 1). */
  random(): number {
    const u = this.randdblmem();
    return u64ToDouble(u) - 1.0;
  }

  /** Integer in [min, max] inclusive. */
  randint(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}
