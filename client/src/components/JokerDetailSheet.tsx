import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/lib/appContext";
import {
  JOKER_MAP, ROLE_LABELS, groupedPartners, PARTNER_CATEGORY_ORDER,
  exampleUseCases, antiSynergyReason,
} from "@/lib/helpers";
import {
  RolePill, RiskBadge, StageBadge, ScalingBadge, StarToggle, JokerChip, SectionLabel,
} from "./primitives";
import { useIsMobile } from "@/hooks/use-mobile";

export function JokerDetailSheet() {
  const { selectedJokerId, closeJokerDetail, openJokerDetail, isFavoriteJoker, toggleFavoriteJoker, notes, setNote } = useApp();
  const isMobile = useIsMobile();
  const j = selectedJokerId ? JOKER_MAP[selectedJokerId] : null;

  return (
    <Sheet open={!!j} onOpenChange={(o) => !o && closeJokerDetail()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full overflow-hidden p-0 sm:max-w-md"
        style={isMobile ? { maxHeight: "92vh" } : undefined}
        data-testid="sheet-joker-detail"
      >
        {j && (
          <ScrollArea className="h-full max-h-[92vh]">
            <div className="p-5">
              <SheetHeader className="space-y-2 pr-8 text-left">
                <div className="flex items-start justify-between gap-2">
                  <SheetTitle className="font-display text-2xl leading-tight text-accent">
                    {j.name}
                  </SheetTitle>
                  <StarToggle
                    active={isFavoriteJoker(j.id)}
                    onToggle={() => toggleFavoriteJoker(j.id)}
                    testId={`button-favorite-detail-${j.id}`}
                    size={20}
                  />
                </div>
                <p className="text-sm text-foreground/90">{j.summary}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {j.tags.slice(0, 4).map((t) => (
                    <RolePill key={t} role={t} />
                  ))}
                  <ScalingBadge scaling={j.scaling} />
                  {j.stage.map((s) => <StageBadge key={s} stage={s} />)}
                  <RiskBadge level={j.risk} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Role in a build */}
                <section>
                  <SectionLabel>Role in a build</SectionLabel>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    Primarily a <strong className="text-foreground">{ROLE_LABELS[j.mainRole]}</strong> piece
                    {j.secondaryRole ? <> with a <strong className="text-foreground">{ROLE_LABELS[j.secondaryRole]}</strong> angle</> : null}.
                    {" "}It triggers on <span className="italic">{j.trigger}</span> and provides{" "}
                    {j.tags.map((t) => ROLE_LABELS[t].toLowerCase()).join(", ")} value to a build.
                  </p>
                </section>

                {/* Notes (why strong/weak) */}
                <section>
                  <SectionLabel>Why it's strong / weak / conditional</SectionLabel>
                  <p className="text-sm leading-relaxed text-foreground/85">{j.notes}</p>
                </section>

                {/* Best partners grouped */}
                <section>
                  <SectionLabel>Best partners</SectionLabel>
                  {j.partners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No curated partners listed.</p>
                  ) : (
                    <div className="space-y-3">
                      {PARTNER_CATEGORY_ORDER.map((cat) => {
                        const list = groupedPartners(j)[cat];
                        if (!list.length) return null;
                        return (
                          <div key={cat}>
                            <div className="mb-1.5 text-xs font-medium text-muted-foreground">{cat}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {list.map((p) => (
                                <JokerChip key={p.id} id={p.id} onClick={openJokerDetail} testIdPrefix="chip-partner" />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Anti-synergies */}
                {j.antiSynergies.length > 0 && (
                  <section>
                    <SectionLabel>Anti-synergies</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {j.antiSynergies.map((aid) => {
                        const reason = antiSynergyReason(j.id, aid) ?? `Competes with or undercuts ${j.name}; avoid running both unless you can patch the conflict.`;
                        return (
                          <AntiChip key={aid} id={aid} reason={reason} onClick={openJokerDetail} />
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Example use cases */}
                <section>
                  <SectionLabel>Example use cases</SectionLabel>
                  <ul className="space-y-1.5">
                    {exampleUseCases(j).map((u, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/85">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Beginner callout */}
                <section className="rounded-md border border-accent/30 bg-accent/5 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    For new players
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{j.beginner}</p>
                </section>

                {/* Note */}
                <section>
                  <SectionLabel>Your note (session only)</SectionLabel>
                  <Textarea
                    value={notes[`joker:${j.id}`] ?? ""}
                    onChange={(e) => setNote(`joker:${j.id}`, e.target.value)}
                    placeholder="Jot a strategy note for this Joker…"
                    rows={3}
                    data-testid={`input-note-${j.id}`}
                    className="resize-none bg-background text-sm"
                  />
                </section>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
function AntiChip({ id, reason, onClick }: { id: string; reason: string; onClick: (id: string) => void }) {
  const name = JOKER_MAP[id]?.name ?? id;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onClick(id)}
          data-testid={`chip-anti-${id}`}
          className="inline-flex items-center gap-1 rounded-full border border-destructive/60 bg-card px-2.5 py-1 text-xs font-medium text-[hsl(0_60%_72%)] transition-colors hover:border-destructive"
        >
          <span>{name}</span>
          <span className="opacity-70">?</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{reason}</TooltipContent>
    </Tooltip>
  );
}
