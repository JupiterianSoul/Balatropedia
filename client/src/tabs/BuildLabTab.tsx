import { useMemo, useState } from "react";
import { FlaskConical, X, Sparkles, AlertTriangle, Target, Skull, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JokerCombobox } from "@/components/JokerCombobox";
import { JokerSprite } from "@/components/JokerSprite";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  JOKERS, JOKER_MAP, pairScore, suggestedArchetypes, activeSynergies,
  antiSynergyWarnings, heuristicSynergies,
  SCALING_LABELS, HAND_LABELS,
} from "@/lib/helpers";
import { useGameText, useT } from "@/lib/i18n";

function HandFocus({ ids }: { ids: string[] }) {
  const t = useT();
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const j = JOKER_MAP[id];
    if (!j) continue;
    for (const h of j.hands) {
      if (h === "any") continue;
      counts[h] = (counts[h] ?? 0) + 1;
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_hand_pref")}</p>;
  }
  return (
    <ul className="space-y-1 text-xs">
      {ranked.map(([h, n]) => (
        <li key={h} className="flex items-center justify-between">
          <span>{HAND_LABELS[h as keyof typeof HAND_LABELS] ?? h}</span>
          <span className="text-muted-foreground">{t("ui.buildlab.jokers_care", { n: String(n) })}</span>
        </li>
      ))}
    </ul>
  );
}

function ScalingTracker({ ids }: { ids: string[] }) {
  const t = useT();
  const scaling = ids.map(id => JOKER_MAP[id]).filter(j => j && j.scaling !== "static");
  if (scaling.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_scaling")}</p>;
  }
  return (
    <ul className="space-y-1.5 text-xs">
      {scaling.map(j => (
        <li key={j.id} className="border-l-2 border-amber-500/40 pl-2">
          <div className="font-semibold">{j.name} <span className="text-muted-foreground text-[10px]">({SCALING_LABELS[j.scaling]})</span></div>
          <div className="text-muted-foreground">{j.trigger}</div>
        </li>
      ))}
    </ul>
  );
}

function BossWatch({ ids }: { ids: string[] }) {
  const t = useT();
  const warns: { boss: string; why: string }[] = [];
  const has = (role: string) => ids.some(id => {
    const j = JOKER_MAP[id]; if (!j) return false;
    return j.tags.includes(role as any) || j.mainRole === role || j.secondaryRole === role;
  });
  const hasArchetype = (a: string) => ids.some(id => JOKER_MAP[id]?.archetypes.includes(a as any));
  const buildIncludes = (jid: string) => ids.includes(jid);

  if (has("suit_support") || hasArchetype("flush")) warns.push({ boss: "The Plant", why: "Flush builds debuff face cards if you rely on K/Q/J chips" });
  if (has("rank_face_support") || hasArchetype("face_card")) warns.push({ boss: "The Plant", why: "Face cards debuffed" });
  if (hasArchetype("steel") || has("held_in_hand")) warns.push({ boss: "The Needle", why: "Only 1 hand — held effects fire less" });
  if (has("retrigger")) warns.push({ boss: "The Eye", why: "Can't repeat hand types — retrigger engines suffer" });
  if (has("economy") || hasArchetype("economy_snowball")) warns.push({ boss: "The Hook", why: "Discards 2 random cards on play" });
  if (has("scaling_engine")) warns.push({ boss: "The Manacle", why: "-1 hand size limits scaling triggers per ante" });
  if (buildIncludes("baron") || buildIncludes("shoot_the_moon")) warns.push({ boss: "The Mark", why: "Cards drawn face down — held-in-hand triggers blind" });

  if (warns.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_boss_disasters")}</p>;
  }
  const seen = new Set<string>();
  const uniq = warns.filter(w => seen.has(w.boss) ? false : (seen.add(w.boss), true));
  return (
    <ul className="space-y-1.5 text-xs">
      {uniq.map(w => (
        <li key={w.boss} className="border-l-2 border-rose-500/40 pl-2">
          <div className="font-semibold text-rose-400">{w.boss}</div>
          <div className="text-muted-foreground">{w.why}</div>
        </li>
      ))}
    </ul>
  );
}

function PartnerSuggestions({ ids }: { ids: string[] }) {
  const t = useT();
  const candidates = useMemo(() => {
    if (ids.length === 0) return [];
    const scored = JOKERS
      .filter(c => !ids.includes(c.id))
      .map(c => {
        let total = 0;
        let curatedHits = 0;
        for (const aid of ids) {
          const p = pairScore(aid, c.id);
          total += p;
          const a = JOKER_MAP[aid];
          if (a?.partners.includes(c.id)) curatedHits += 1;
        }
        return { joker: c, score: total, curatedHits };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || b.curatedHits - a.curatedHits)
      .slice(0, 12);
    return scored;
  }, [ids.join("|")]);

  if (ids.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.add_anchor_hint")}</p>;
  }
  if (candidates.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_partners")}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {candidates.map(c => (
        <PartnerCard key={c.joker.id} jokerId={c.joker.id} score={c.score} curated={c.curatedHits} />
      ))}
    </div>
  );
}

function PartnerCard({ jokerId, score, curated }: { jokerId: string; score: number; curated: number }) {
  const t = useT();
  const { name, text } = useGameText("jokers", jokerId);
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2 flex gap-2">
      <JokerSprite jokerId={jokerId} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold truncate">{name}</span>
          {curated > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] bg-accent/20 text-accent px-1 rounded">★{curated}</span>
              </TooltipTrigger>
              <TooltipContent>{t("ui.buildlab.curated_partner", { n: String(curated) })}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground line-clamp-2">{text}</p>
        <div className="text-[10px] text-muted-foreground mt-0.5">{t("ui.buildlab.score")}: {score.toFixed(1)}</div>
      </div>
    </div>
  );
}

export function BuildLabTab() {
  const t = useT();
  const [anchors, setAnchors] = useState<string[]>([]);
  const archetypes = useMemo(() => suggestedArchetypes(anchors), [anchors.join("|")]);
  const synergies = useMemo(() => activeSynergies(anchors), [anchors.join("|")]);
  const antiWarns = useMemo(() => antiSynergyWarnings(anchors), [anchors.join("|")]);
  const heuristics = useMemo(() => heuristicSynergies(anchors), [anchors.join("|")]);

  const addAnchor = (id: string) => {
    if (id && !anchors.includes(id) && anchors.length < 3) setAnchors([...anchors, id]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-bold">{t("ui.buildlab.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("ui.buildlab.desc")}
        </p>
      </div>

      { }
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
        <h3 className="text-sm font-semibold">{t("ui.buildlab.anchors")} ({anchors.length}/3)</h3>
        <div className="flex flex-wrap gap-2">
          {anchors.map((id, i) => {
            const j = JOKER_MAP[id];
            return (
              <div key={id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card/60 px-2 py-1">
                <JokerSprite jokerId={id} size={32} />
                <span className="text-sm font-semibold">{j?.name ?? id}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setAnchors(anchors.filter((_, k) => k !== i))}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          {anchors.length < 3 && (
            <div className="min-w-[220px] flex-1">
              <JokerCombobox value={null} onChange={addAnchor} placeholder={t("ui.buildlab.add_anchor")} />
            </div>
          )}
        </div>
      </section>

      {anchors.length > 0 && (
        <>
          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">{t("ui.buildlab.detected_archetypes")}</h3>
            </div>
            {archetypes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.flexible_build")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {archetypes.map(a => (
                  <span key={a.id} className="text-xs rounded px-2 py-0.5 bg-accent/20 text-accent border border-accent/40">
                    {a.name} <span className="opacity-60">·{a.matched.length}</span>
                  </span>
                ))}
              </div>
            )}
          </section>

          { }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold">{t("ui.buildlab.hand_focus")}</h3>
              </div>
              <HandFocus ids={anchors} />
            </section>

            <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">{t("ui.buildlab.scaling_tracker")}</h3>
              </div>
              <ScalingTracker ids={anchors} />
            </section>
          </div>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <h3 className="text-sm font-semibold">{t("ui.buildlab.ranked_partners")}</h3>
            <PartnerSuggestions ids={anchors} />
          </section>

          { }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
              <h3 className="text-sm font-semibold">{t("ui.buildlab.active_synergies")} ({synergies.length + heuristics.length})</h3>
              {synergies.length + heuristics.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_synergies")}</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {synergies.map((s, i) => (
                    <li key={`c${i}`} className="border-l-2 border-emerald-500/40 pl-2">
                      <span className="font-semibold">{JOKER_MAP[s.a]?.name} + {JOKER_MAP[s.b]?.name}</span>
                      <div className="text-muted-foreground">{s.why}</div>
                    </li>
                  ))}
                  {heuristics.map((h, i) => (
                    <li key={`h${i}`} className="border-l-2 border-sky-500/40 pl-2">
                      <span className="font-semibold">{JOKER_MAP[h.a]?.name} + {JOKER_MAP[h.b]?.name}</span>
                      <span className="text-[10px] text-muted-foreground"> ({h.reasonKey})</span>
                      <div className="text-muted-foreground">{h.detail}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-semibold">{t("ui.buildlab.anti_synergies")} ({antiWarns.length})</h3>
              </div>
              {antiWarns.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">{t("ui.buildlab.no_conflicts")}</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {antiWarns.map((w, i) => (
                    <li key={i} className="border-l-2 border-yellow-500/40 pl-2">
                      <span className="font-semibold">{JOKER_MAP[w.a]?.name} ⚠ {JOKER_MAP[w.b]?.name}</span>
                      <div className="text-muted-foreground">{w.why}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          { }
          <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skull className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-semibold">{t("ui.buildlab.boss_watch")}</h3>
            </div>
            <BossWatch ids={anchors} />
          </section>
        </>
      )}
    </div>
  );
}
