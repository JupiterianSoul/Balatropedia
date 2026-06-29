import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/appContext";
import {
  JOKER_MAP, ROLE_LABELS, groupedPartners, PARTNER_CATEGORY_ORDER,
  exampleUseCaseRules, antiSynergyReason, whyPlayThisRules, synergyKey,
} from "@/lib/helpers";
import {
  RolePill, RiskBadge, StageBadge, ScalingBadge, StarToggle, JokerChip, SectionLabel, RarityBadge,
} from "./primitives";
import { JokerSprite } from "./JokerSprite";
import { Sparkles, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameText, useT, useLabels, useCuratedText, useI18n } from "@/lib/i18n";
import type { WhyRule, UseCaseRule } from "@/lib/helpers";
import { FormattedBalatroText } from "@/lib/balatroText";
import { useSheetBackButton } from "@/lib/useSheetBackButton";

export function JokerDetailSheet() {
  const {
    selectedJokerId, closeJokerDetail, openJokerDetail,
    isFavoriteJoker, toggleFavoriteJoker, notes, setNote,
    favoriteNote, setFavoriteNote,
  } = useApp();

  const isMobile = useIsMobile();
  const t = useT();
  const labels = useLabels();
  const j = selectedJokerId ? JOKER_MAP[selectedJokerId] : null;
  const localized = useGameText("jokers", selectedJokerId ?? "");
  const { lang } = useI18n();
  const displayName = (j && localized.name) || j?.name || "";

  // Android hardware back / browser back closes the sheet instead of
  // navigating tabs underneath.
  useSheetBackButton(!!j, closeJokerDetail, "joker-detail");

  return (
    <Sheet open={!!j} onOpenChange={(o) => !o && closeJokerDetail()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "flex w-full flex-col overflow-hidden p-0"
            : "flex w-full flex-col overflow-hidden p-0 sm:max-w-none md:max-w-[min(640px,50vw)] lg:max-w-[min(720px,50vw)] md:!right-auto md:!left-1/2 md:!-translate-x-1/2 md:!translate-y-0 md:!border md:!rounded-lg md:!top-4"
        }
        style={isMobile ? { height: "100dvh", maxHeight: "100dvh" } : { maxHeight: "calc(100vh - 2rem)" }}
        hideClose
        data-testid="sheet-joker-detail"
      >
        {j && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-8 md:px-8 md:pb-8 md:pt-10">
              <SheetHeader className="space-y-2 pr-2 text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <JokerSprite jokerId={j.id} name={displayName} size={104} clickable={false} className="!border-0 !bg-transparent !shadow-none" />
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="font-pixel text-2xl leading-tight text-accent md:whitespace-nowrap md:overflow-hidden md:text-ellipsis">
                        {displayName}
                      </SheetTitle>
                      {j.rarity && (
                        <div className="mt-1.5">
                          <RarityBadge rarity={j.rarity} size="md" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pr-1">
                    <StarToggle
                      active={isFavoriteJoker(j.id)}
                      onToggle={() => toggleFavoriteJoker(j.id)}
                      testId={`button-favorite-detail-${j.id}`}
                      size={20}
                    />
                    <button
                      type="button"
                      onClick={closeJokerDetail}
                      data-testid={`button-close-detail-${j.id}`}
                      aria-label="Close"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
                      style={{ backgroundColor: '#dc2626', border: '1px solid #991b1b' }}
                    >
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground/90">
                  <FormattedBalatroText text={localized.text || j.summary} id={j.id} lang={lang} />
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {j.tags.slice(0, 4).map((tg) => (
                    <RolePill key={tg} role={tg} />
                  ))}
                  <ScalingBadge scaling={j.scaling} />
                  {j.stage.map((s) => <StageBadge key={s} stage={s} />)}
                  <RiskBadge level={j.risk} />
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
                {}
                <section className="rounded-md border border-accent/25 bg-accent/[0.04] p-3.5 md:col-span-2" data-testid="section-why-play">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <SectionLabel>{t("ui.sheet.why_play")}</SectionLabel>
                  </div>
                  <ul className="space-y-2.5">
                    {whyPlayThisRules(j).map((r, i) => (
                      <WhyBulletRow key={i} rule={r} />
                    ))}
                  </ul>
                </section>

                {}
                <section>
                  <SectionLabel>{t("ui.sheet.role_in_build")}</SectionLabel>
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {t("ui.sheet.primarily_a")} <strong className="text-foreground">{labels.role[j.mainRole] ?? ROLE_LABELS[j.mainRole]}</strong> {t("ui.sheet.piece")}
                    {j.secondaryRole ? <> {t("ui.sheet.with_a")} <strong className="text-foreground">{labels.role[j.secondaryRole] ?? ROLE_LABELS[j.secondaryRole]}</strong> {t("ui.sheet.angle")}</> : null}.
                    {" "}{t("ui.sheet.it_triggers_on")} <span className="italic">{j.trigger}</span> {t("ui.sheet.and_provides")}{" "}
                    {j.tags.map((tag) => (labels.role[tag] ?? ROLE_LABELS[tag]).toLowerCase()).join(", ")} {t("ui.sheet.value_to_build")}
                  </p>
                </section>

                {}
                <section>
                  <SectionLabel>{t("ui.sheet.strong_weak")}</SectionLabel>
                  <p className="text-sm leading-relaxed text-foreground/85">{j.notes}</p>
                </section>

                {}
                <section>
                  <SectionLabel>{t("ui.sheet.best_partners")}</SectionLabel>
                  {j.partners.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("ui.sheet.no_partners")}</p>
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

                {}
                {j.antiSynergies.length > 0 && (
                  <section>
                    <SectionLabel>{t("ui.sheet.anti_synergies")}</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {j.antiSynergies.map((aid) => (
                        <AntiChipRow key={aid} jokerAId={j.id} jokerBId={aid} onClick={openJokerDetail} />
                      ))}
                    </div>
                  </section>
                )}

                {}
                <section>
                  <SectionLabel>{t("ui.sheet.example_use")}</SectionLabel>
                  <ul className="space-y-1.5">
                    {exampleUseCaseRules(j).map((u, i) => (
                      <UseCaseRow key={i} rule={u} />
                    ))}
                  </ul>
                </section>

                {}
                <section className="rounded-md border border-accent/30 bg-accent/5 p-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    {t("ui.sheet.for_new_players")}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{j.beginner}</p>
                </section>

                {}
                {isFavoriteJoker(j.id) ? (
                  <section>
                    <SectionLabel>{t("ui.sheet.your_note_fav")}</SectionLabel>
                    <Textarea
                      key={`fav-note-${j.id}`}
                      defaultValue={favoriteNote(j.id)}
                      onBlur={(e) => setFavoriteNote(j.id, e.target.value)}
                      placeholder={t("ui.sheet.your_note_fav_ph")}
                      rows={3}
                      data-testid={`input-favnote-${j.id}`}
                      className="resize-none bg-background text-sm"
                    />
                  </section>
                ) : (
                  <section>
                    <SectionLabel>{t("ui.sheet.your_note_session")}</SectionLabel>
                    <Textarea
                      value={notes[`joker:${j.id}`] ?? ""}
                      onChange={(e) => setNote(`joker:${j.id}`, e.target.value)}
                      placeholder={t("ui.sheet.your_note_session_ph")}
                      rows={3}
                      data-testid={`input-note-${j.id}`}
                      className="resize-none bg-background text-sm"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{t("ui.sheet.star_to_note")}</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function WhyBulletRow({ rule }: { rule: WhyRule }) {
  const t = useT();
  const labels = useLabels();

  const text = (() => {
    switch (rule.rule) {
      case "core_role":
        return t("ui.why.core_role", {
          role: labels.role[rule.role!] ?? ROLE_LABELS[rule.role!],
          scaling: (labels.scaling[rule.scaling!] ?? rule.scaling!).toLowerCase(),
        });
      case "best_partners":
        return t("ui.why.best_partners", {
          partners: rule.partnerIds!.map((id) => JOKER_MAP[id]?.name ?? id).join(", "),
        });
      case "fits_archetypes":
        return t("ui.why.fits_archetypes", {
          archetypes: rule.archetypeIds!.map((id) => labels.archetype[id] ?? id).join(", "),
        });
      case "setup_risk":
        return t("ui.why.setup_risk", {
          setup: labels.level[rule.setup!] ?? rule.setup!,
          risk: labels.level[rule.risk!] ?? rule.risk!,
        });
      case "anti_warning":
        return t("ui.why.anti_warning", {
          anti: rule.antiIds!.map((id) => JOKER_MAP[id]?.name ?? id).join(", "),
        });
    }
  })();

  const ruleHint = t(`ui.why.${rule.rule}_rule`);

  return (
    <li className="flex gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">{ruleHint}</p>
      </div>
    </li>
  );
}

function UseCaseRow({ rule }: { rule: UseCaseRule }) {
  const t = useT();
  const labels = useLabels();

  const text = (() => {
    switch (rule.rule) {
      case "early_pickup":
        return t("ui.usecase.early_pickup", {
          role: (labels.role[rule.role!] ?? ROLE_LABELS[rule.role!]).toLowerCase(),
        });
      case "endgame_payoff":
        return t("ui.usecase.endgame_payoff");
      case "pivot_piece":
        return t("ui.usecase.pivot_piece");
      case "economy_snowball":
        return t("ui.usecase.economy_snowball");
      case "late_commit":
        return t("ui.usecase.late_commit");
      case "pairs_partners":
        return t("ui.usecase.pairs_partners", { partners: rule.partners ?? 0 });
    }
  })();

  return (
    <li className="flex gap-2 text-sm text-foreground/85">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
      <span>{text}</span>
    </li>
  );
}

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function AntiChipRow({ jokerAId, jokerBId, onClick }: { jokerAId: string; jokerBId: string; onClick: (id: string) => void }) {
  const t = useT();
  const ja = JOKER_MAP[jokerAId];
  const localized = useGameText("jokers", jokerBId);
  const name = localized.name || JOKER_MAP[jokerBId]?.name || jokerBId;
  const nameA = ja?.name ?? jokerAId;

  const enFallback = antiSynergyReason(jokerAId, jokerBId);
  const synKey = synergyKey(jokerAId, jokerBId);
  const localizedWhy = useCuratedText(`ui.synergy.${synKey}.why`, enFallback ?? "");

  const reason = enFallback != null
    ? (localizedWhy || enFallback)
    : t("ui.tabs.myrun_anti_generic", { a: nameA, b: name });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onClick(jokerBId)}
          data-testid={`chip-anti-${jokerBId}`}
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

