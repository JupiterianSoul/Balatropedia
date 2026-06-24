
const U64_MASK = 0xffffffffffffffffn;
const ONE = 1n;

function doubleToU64(d: number): bigint {
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = d;
  const view = new DataView(buf);
  const lo = BigInt(view.getUint32(0, true));
  const hi = BigInt(view.getUint32(4, true));
  return (hi << 32n) | lo;
}

function u64ToDouble(u: bigint): number {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Number(u & 0xffffffffn), true);
  view.setUint32(4, Number((u >> 32n) & 0xffffffffn), true);
  return new Float64Array(buf)[0];
}

function fract(n: number): number {
  return n - Math.floor(n);
}

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

const INV_PREC = Math.pow(10, 13);
const TWO_INV_PREC = Math.pow(2, 13);
const FIVE_INV_PREC = Math.pow(5, 13);

export function round13(x: number): number {
  const tentative = Math.floor(x * INV_PREC) / INV_PREC;
  const truncated = (((x * TWO_INV_PREC) % 1) + 1) % 1 * FIVE_INV_PREC;
  const nextAfter = x + Math.abs(x) * Number.EPSILON;
  if (tentative !== x && tentative !== nextAfter && (truncated % 1) >= 0.5) {
    return (Math.floor(x * INV_PREC) + 1) / INV_PREC;
  }
  return tentative;
}

export class LuaRandom {
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
    for (let i = 0; i < 10; i++) this._randint();
  }

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

  randdblmem(): bigint {
    return (
      (this._randint() & 4503599627370495n) | 4607182418800017408n
    );
  }

  random(): number {
    const u = this.randdblmem();
    return u64ToDouble(u) - 1.0;
  }

  randint(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}
