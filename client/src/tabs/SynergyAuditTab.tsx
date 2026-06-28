/**
 * SynergyAuditTab — Julie's audit/corrections workflow for the SYNERGIES dataset.
 *
 * Iterates every synergy pair in client/src/data/jokers.ts and lets the user
 * mark each one as verified / needs-review / incorrect / missing-detail, with
 * optional notes. All state is local (balatropedia.local.synergyAudit).
 *
 * Includes:
 *  - Filter chips for status, engine, popularity.
 *  - Search across joker names + reasoning text.
 *  - Bulk export of flagged items as JSON for an offline review pass.
 *  - "Reset all" with confirmation.
 */

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Download, Filter, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOKER_MAP, SYNERGIES, ENGINE_LABELS } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";

type AuditStatus = "unreviewed" | "verified" | "needs_review" | "incorrect" | "missing_detail";

interface AuditEntry {
  status: AuditStatus;
  note: string;
  updatedAt: number;
}

const STORAGE_KEY = "balatropedia.local.synergyAudit";

const STATUS_META: Record<AuditStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  unreviewed:     { label: "Unreviewed",     color: "hsl(220 10% 50%)",  Icon: HelpCircle },
  verified:       { label: "Verified",       color: "hsl(145 50% 45%)",  Icon: CheckCircle2 },
  needs_review:   { label: "Needs review",   color: "hsl(45 75% 50%)",   Icon: AlertTriangle },
  incorrect:      { label: "Incorrect",      color: "hsl(0 65% 50%)",    Icon: XCircle },
  missing_detail: { label: "Missing detail", color: "hsl(28 65% 50%)",   Icon: AlertTriangle },
};

function loadAudit(): Record<string, AuditEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveAudit(state: Record<string, AuditEntry>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function pairKey(a: string, b: string) { return `${a}::${b}`; }

export function SynergyAuditTab() {
  const { toast } = useToast();
  const [audit, setAudit] = useState<Record<string, AuditEntry>>(() => loadAudit());
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "all" | "flagged">("all");
  const [engineFilter, setEngineFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Persist whenever audit changes
  useEffect(() => { saveAudit(audit); }, [audit]);

  const counts = useMemo(() => {
    const c: Record<AuditStatus, number> = {
      unreviewed: 0, verified: 0, needs_review: 0, incorrect: 0, missing_detail: 0,
    };
    for (const s of SYNERGIES) {
      const status = audit[pairKey(s.a, s.b)]?.status ?? "unreviewed";
      c[status]++;
    }
    return c;
  }, [audit]);

  const engineOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of SYNERGIES) set.add(s.engine);
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return SYNERGIES.filter((s) => {
      const key = pairKey(s.a, s.b);
      const entry = audit[key];
      const status: AuditStatus = entry?.status ?? "unreviewed";

      if (statusFilter === "flagged") {
        if (status === "verified" || status === "unreviewed") return false;
      } else if (statusFilter !== "all" && status !== statusFilter) return false;

      if (engineFilter !== "all" && s.engine !== engineFilter) return false;

      if (term) {
        const a = JOKER_MAP.get(s.a)?.name?.toLowerCase() ?? s.a;
        const b = JOKER_MAP.get(s.b)?.name?.toLowerCase() ?? s.b;
        const why = (s.why ?? "").toLowerCase();
        if (!a.includes(term) && !b.includes(term) && !why.includes(term)) return false;
      }
      return true;
    });
  }, [audit, statusFilter, engineFilter, search]);

  function setStatus(a: string, b: string, status: AuditStatus) {
    setAudit((prev) => {
      const key = pairKey(a, b);
      const next = { ...prev };
      if (status === "unreviewed") {
        delete next[key];
      } else {
        next[key] = { status, note: prev[key]?.note ?? "", updatedAt: Date.now() };
      }
      return next;
    });
  }

  function setNote(a: string, b: string, note: string) {
    setAudit((prev) => {
      const key = pairKey(a, b);
      const cur = prev[key] ?? { status: "needs_review" as AuditStatus, note: "", updatedAt: Date.now() };
      return { ...prev, [key]: { ...cur, note, updatedAt: Date.now() } };
    });
  }

  function handleExport() {
    const flagged = SYNERGIES
      .map((s) => {
        const entry = audit[pairKey(s.a, s.b)];
        if (!entry || entry.status === "verified" || entry.status === "unreviewed") return null;
        return {
          a: s.a,
          b: s.b,
          a_name: JOKER_MAP.get(s.a)?.name ?? s.a,
          b_name: JOKER_MAP.get(s.b)?.name ?? s.b,
          engine: s.engine,
          status: entry.status,
          note: entry.note,
          original_reasoning: s.why,
          updated_at: new Date(entry.updatedAt).toISOString(),
        };
      })
      .filter(Boolean);

    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), entries: flagged }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synergy-audit-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${flagged.length} flagged synergies exported.` });
  }

  function handleReset() {
    if (!confirm("Reset all audit progress? This cannot be undone.")) return;
    setAudit({});
    toast({ title: "Reset", description: "Audit progress cleared." });
  }

  return (
    <div className="p-3 sm:p-4 space-y-3" data-testid="synergy-audit">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold">Synergy Audit</h2>
        <span className="text-xs text-muted-foreground">
          {SYNERGIES.length} pairs · {counts.verified} verified · {counts.needs_review + counts.incorrect + counts.missing_detail} flagged · {counts.unreviewed} to-do
        </span>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleExport} data-testid="button-export-audit">
          <Download className="h-3.5 w-3.5 mr-1" /> Export flagged
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset} data-testid="button-reset-audit">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Status chip bar */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setStatusFilter("all")}
          className={`text-xs px-2 py-1 rounded-md border ${statusFilter === "all" ? "border-accent bg-accent/10" : "border-border bg-card/50"}`}
          data-testid="filter-status-all"
        >
          All ({SYNERGIES.length})
        </button>
        <button
          onClick={() => setStatusFilter("flagged")}
          className={`text-xs px-2 py-1 rounded-md border ${statusFilter === "flagged" ? "border-accent bg-accent/10" : "border-border bg-card/50"}`}
        >
          Flagged ({counts.needs_review + counts.incorrect + counts.missing_detail})
        </button>
        {(Object.keys(STATUS_META) as AuditStatus[]).map((s) => {
          const M = STATUS_META[s];
          const Icon = M.Icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2 py-1 rounded-md border inline-flex items-center gap-1 ${statusFilter === s ? "border-accent bg-accent/10" : "border-border bg-card/50"}`}
              style={statusFilter === s ? undefined : { color: M.color }}
              data-testid={`filter-status-${s}`}
            >
              <Icon className="h-3 w-3" style={{ color: M.color }} />
              {M.label} ({counts[s]})
            </button>
          );
        })}
      </div>

      {/* Search + engine filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search joker names or reasoning…"
            className="pl-7 h-9"
          />
        </div>
        <Select value={engineFilter} onValueChange={setEngineFilter}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All engines</SelectItem>
            {engineOptions.map((e) => (
              <SelectItem key={e} value={e}>{(ENGINE_LABELS as Record<string, string>)[e] ?? e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No synergies match these filters.
          </div>
        ) : (
          filtered.map((s) => {
            const key = pairKey(s.a, s.b);
            const entry = audit[key];
            const status: AuditStatus = entry?.status ?? "unreviewed";
            const meta = STATUS_META[status];
            const Icon = meta.Icon;
            return (
              <div
                key={key}
                className="rounded-lg border bg-card/50 p-3"
                style={{ borderLeftWidth: 6, borderLeftColor: meta.color }}
                data-testid={`audit-row-${key}`}
              >
                <div className="flex flex-wrap items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {JOKER_MAP.get(s.a)?.name ?? s.a} <span className="text-muted-foreground">+</span> {JOKER_MAP.get(s.b)?.name ?? s.b}
                    </div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">
                      {(ENGINE_LABELS as Record<string, string>)[s.engine] ?? s.engine}
                      {s.popularity ? ` · ${s.popularity}` : ""}
                      {s.difficulty ? ` · ${s.difficulty}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 leading-snug">{s.why}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded" style={{ background: `${meta.color}20`, color: meta.color }}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(Object.keys(STATUS_META) as AuditStatus[]).map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={status === st ? "default" : "outline"}
                      className="h-7 text-[11px] px-2"
                      onClick={() => setStatus(s.a, s.b, st)}
                      data-testid={`set-${st}-${key}`}
                    >
                      {STATUS_META[st].label}
                    </Button>
                  ))}
                </div>
                {(status === "needs_review" || status === "incorrect" || status === "missing_detail") && (
                  <Textarea
                    value={entry?.note ?? ""}
                    onChange={(e) => setNote(s.a, s.b, e.target.value)}
                    placeholder="Your correction or notes for this synergy…"
                    className="mt-2 text-xs"
                    rows={2}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
