// Verify-seed inspector. Loads the V2 scalar WASM bundle, builds the same
// filter JSON the search workers use, and calls engine.inspect_seed for a
// single user-supplied seed. Renders a clause-by-clause report so users can
// see which targets matched and why.
//
// Honest-disclosure: inspector uses the scalar build (no SIMD). It's a
// single-seed call, so SIMD wouldn't help anyway; scalar avoids the extra
// 200KB download.

import { useCallback, useMemo, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  type JokerConstraint,
  type VoucherConstraint,
  type TagConstraint,
  type BossConstraint,
  type StandardCardConstraint,
  type FinderConfig,
} from "@/lib/seedFinder";
import { buildFilterJson } from "@/lib/seedFinderV2";
import { DECKS, STAKES } from "@/lib/seedItems";

interface ClauseReport {
  index: number;
  matched: boolean;
  detail: string;
}
interface InspectReport {
  ok: boolean;
  seed: string;
  clauses: ClauseReport[];
  matched: number;
  total: number;
  error?: string;
}

interface Props {
  seed: string;
  onSeedChange: (s: string) => void;
  deck: string;
  stake: string;
  version: string;
  jokerConstraints: JokerConstraint[];
  voucherConstraints: VoucherConstraint[];
  tagConstraints: TagConstraint[];
  bossConstraints: BossConstraint[];
  standardCardConstraints: StandardCardConstraint[];
}

// Lazy WASM bootstrap. Cached at module scope so we only download once per page.
let enginePromise: Promise<any> | null = null;
function loadEngine(): Promise<any> {
  if (enginePromise) return enginePromise;
  const origin = self.location.origin;
  const jsUrl = new URL("/engine-v2/balatro_seed_engine.js", origin).toString();
  const wasmUrl = new URL("/engine-v2/balatro_seed_engine_bg.wasm", origin).toString();
  enginePromise = (async () => {
    const mod = await import(/* @vite-ignore */ jsUrl);
    // wasm-pack default export takes either a URL or a module-config object.
    if (typeof mod.default === "function") {
      await mod.default(wasmUrl);
    } else if (mod.initSync && typeof WebAssembly !== "undefined") {
      const bytes = await fetch(wasmUrl).then(r => r.arrayBuffer());
      mod.initSync(bytes);
    }
    return mod;
  })();
  return enginePromise;
}

function clauseLabel(
  idx: number,
  cfg: {
    jokerConstraints: JokerConstraint[];
    voucherConstraints: VoucherConstraint[];
    tagConstraints: TagConstraint[];
    bossConstraints: BossConstraint[];
    standardCardConstraints: StandardCardConstraint[];
  },
): string {
  // Clauses are emitted in this fixed order in buildFilterJson:
  // jokers, vouchers, tags, bosses, standard cards.
  let i = idx;
  if (i < cfg.jokerConstraints.length) {
    const jc = cfg.jokerConstraints[i];
    return `${jc.joker}${jc.edition ? ` [${jc.edition}]` : ""}${jc.sticker ? ` (${jc.sticker})` : ""} — antes 1..${jc.maxAnte}`;
  }
  i -= cfg.jokerConstraints.length;
  if (i < cfg.voucherConstraints.length) {
    const vc = cfg.voucherConstraints[i];
    return `Voucher: ${vc.voucher} — antes 1..${vc.maxAnte}`;
  }
  i -= cfg.voucherConstraints.length;
  if (i < cfg.tagConstraints.length) {
    const tc = cfg.tagConstraints[i];
    const pos = (tc as any).position === 1 ? "big blind" : "small blind";
    return `Tag: ${tc.tag} (${pos}) — antes 1..${tc.maxAnte}`;
  }
  i -= cfg.tagConstraints.length;
  if (i < cfg.bossConstraints.length) {
    const bc = cfg.bossConstraints[i];
    return `Boss: ${bc.boss} — antes 1..${bc.maxAnte}`;
  }
  i -= cfg.bossConstraints.length;
  if (i < cfg.standardCardConstraints.length) {
    const sc = cfg.standardCardConstraints[i];
    const parts: string[] = [];
    if (sc.rank && sc.suit) parts.push(`${sc.rank} of ${sc.suit}`);
    else if (sc.base) parts.push(sc.base);
    if (sc.enhancement) parts.push(sc.enhancement);
    if (sc.edition) parts.push(sc.edition);
    if (sc.seal) parts.push(`${sc.seal} seal`);
    return `Standard card: ${parts.join(" · ") || "any"} — antes 1..${sc.maxAnte}`;
  }
  return `Clause #${idx + 1}`;
}

export function VerifySeedPanel(props: Props) {
  const {
    seed, onSeedChange, deck, stake,
    jokerConstraints, voucherConstraints, tagConstraints,
    bossConstraints, standardCardConstraints,
  } = props;
  const [report, setReport] = useState<InspectReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const labels = useMemo(() => ({
    jokerConstraints, voucherConstraints, tagConstraints,
    bossConstraints, standardCardConstraints,
  }), [jokerConstraints, voucherConstraints, tagConstraints, bossConstraints, standardCardConstraints]);

  const totalConstraints =
    jokerConstraints.length + voucherConstraints.length + tagConstraints.length +
    bossConstraints.length + standardCardConstraints.length;

  const inspect = useCallback(async () => {
    setErr(null);
    setReport(null);
    const trimmed = (seed || "").trim().toUpperCase();
    if (trimmed.length < 1 || trimmed.length > 8) {
      setErr("Enter a 1-8 character seed (A-Z, 0-9).");
      return;
    }
    if (totalConstraints === 0) {
      setErr("Add at least one constraint above before verifying.");
      return;
    }
    setBusy(true);
    try {
      const engine = await loadEngine();
      const cfg: FinderConfig = {
        jokerConstraints,
        voucherConstraints,
        tagConstraints,
        bossConstraints,
        standardCardConstraints,
        deck, stake,
        threads: 1,
      } as any;
      const filterJson = buildFilterJson(cfg);
      const deckIdx = Math.max(0, DECKS.indexOf(deck));
      const stakeIdx = Math.max(0, STAKES.indexOf(stake));
      const fnName = "inspect_seed";
      if (typeof engine[fnName] !== "function") {
        throw new Error("Engine build does not include inspect_seed — rebuild required.");
      }
      const raw: string = engine[fnName](filterJson, trimmed, deckIdx, stakeIdx);
      const parsed = JSON.parse(raw) as InspectReport;
      setReport(parsed);
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [seed, deck, stake, jokerConstraints, voucherConstraints, tagConstraints, bossConstraints, standardCardConstraints, totalConstraints]);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-zinc-200">Verify seed</Label>
        <span className="text-[10px] text-zinc-500">Single-seed inspector · scalar WASM</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={seed}
          onChange={(e) => onSeedChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
          placeholder="e.g. 7LB2"
          maxLength={8}
          className="h-9 w-40 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm font-mono text-zinc-100"
        />
        <button
          onClick={inspect}
          disabled={busy || !seed}
          className="h-9 rounded-md bg-purple-600 px-3 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Inspect
        </button>
        <span className="text-[11px] text-zinc-500">
          deck: <span className="text-zinc-300">{deck}</span> · stake: <span className="text-zinc-300">{stake}</span>
        </span>
      </div>

      {err && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-200">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>{err}</div>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 font-semibold ${report.matched === report.total ? "bg-green-600/20 text-green-300" : "bg-yellow-600/20 text-yellow-200"}`}>
              {report.matched}/{report.total} clauses matched
            </span>
            <span className="text-zinc-500">seed</span>
            <span className="font-mono text-zinc-200">{report.seed}</span>
          </div>
          <div className="space-y-1">
            {report.clauses.map((c) => (
              <div
                key={c.index}
                className={`flex items-start gap-2 rounded border px-2.5 py-1.5 text-xs ${
                  c.matched ? "border-green-500/30 bg-green-950/20" : "border-zinc-700 bg-zinc-950/40"
                }`}
              >
                {c.matched
                  ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-400" />
                  : <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-zinc-500" />}
                <div className="min-w-0 flex-1">
                  <div className="text-zinc-200">{clauseLabel(c.index, labels)}</div>
                  <div className={`mt-0.5 text-[11px] ${c.matched ? "text-green-300/80" : "text-zinc-400"}`}>
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
