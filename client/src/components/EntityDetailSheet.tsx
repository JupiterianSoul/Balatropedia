import { Fragment } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDetail } from "@/lib/detailContext";
import { useApp } from "@/lib/appContext";
import { useGameText, useT } from "@/lib/i18n";
import { humanize } from "@/lib/utils";
import {
  resolveEntity,
  KIND_TO_SPRITE_CATEGORY,
  KIND_TO_I18N_CATEGORY,
  KNOWN_JOKER_IDS,
  type EntityKind,
} from "@/lib/entities";
import { JOKER_MAP } from "@/lib/helpers";
import { Phase3Sprite } from "@/components/Phase3Sprite";
import { EntityChip } from "@/components/EntityChip";
import { SectionLabel } from "@/components/primitives";
import type { Phase3Category } from "@/lib/phase3Sprites";
import { Sparkles, Clock, AlertTriangle, Lightbulb, X } from "lucide-react";
import { FormattedBalatroText } from "@/lib/balatroText";
import { useI18n } from "@/lib/i18n";
import { useSheetBackButton } from "@/lib/useSheetBackButton";

const SORTED_JOKER_IDS = [...KNOWN_JOKER_IDS].sort((a, b) => b.length - a.length);

function InlineJokerLink({ id }: { id: string }) {
  const { openJokerDetail } = useApp();
  const { name } = useGameText("jokers", id);
  const label = name || JOKER_MAP[id]?.name || humanize(id);
  return (
    <button
      type="button"
      onClick={() => openJokerDetail(id)}
      data-testid={`combo-jokerlink-${id}`}
      className="font-medium text-accent underline decoration-dotted underline-offset-2 hover:decoration-solid"
    >
      {label}
    </button>
  );
}

function ComboText({ text }: { text: string }) {

  const parts = text.split(/([a-z][a-z0-9]*(?:_[a-z0-9]+)+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        const isId = SORTED_JOKER_IDS.includes(part);
        if (isId) return <InlineJokerLink key={i} id={part} />;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((b, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <ComboText text={b} />
        </li>
      ))}
    </ul>
  );
}

export function EntityDetailSheet() {
  const { target, closeDetail } = useDetail();
  const isMobile = useIsMobile();
  const t = useT();
  const open = !!target;

  // Android hardware back / browser back closes the sheet first.
  useSheetBackButton(open, closeDetail, "entity-detail");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeDetail()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md"
        style={isMobile ? { height: "100dvh", maxHeight: "100dvh" } : { height: "100dvh" }}
        hideClose
        data-testid="sheet-entity-detail"
      >
        {target && <EntityDetailBody kind={target.kind} id={target.id} t={t} closeDetail={closeDetail} />}
      </SheetContent>
    </Sheet>
  );
}

function EntityDetailBody({
  kind,
  id,
  t,
  closeDetail,
}: {
  kind: EntityKind;
  id: string;
  t: (k: string) => string;
  closeDetail: () => void;
}) {
  const entity = resolveEntity(kind, id);
  const { name, text } = useGameText(KIND_TO_I18N_CATEGORY[kind], id);
  const { lang } = useI18n();

  if (!entity) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        {t("ui.common.no_results")}
      </div>
    );
  }

  const displayName = name || entity.name;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-8 md:px-8 md:pb-8 md:pt-10">
        <SheetHeader className="space-y-2 pr-2 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
            <Phase3Sprite
              category={KIND_TO_SPRITE_CATEGORY[kind as Exclude<EntityKind, "joker">] as Phase3Category}
              id={id}
              name={displayName}
              size={88}
              className="h-[80px] w-[80px]"
            />
            <div className="min-w-0">
              <SheetTitle className="font-display text-xl leading-tight text-accent">
                {displayName}
              </SheetTitle>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {humanize(kind)}
              </p>
              {entity.meta.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entity.meta.map((m) => (
                    <span
                      key={m.label}
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                    >
                      <span className="opacity-70">{m.label}:</span>
                      <span className="text-foreground/80">{humanize(m.value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              data-testid={`button-close-entity-${id}`}
              aria-label="Close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: '#dc2626', border: '1px solid #991b1b' }}
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {}
          <section data-testid="section-effect">
            <SectionLabel>{t("ui.section.effect")}</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              <FormattedBalatroText text={text || entity.effect} lang={lang} />
            </p>
          </section>

          {}
          {entity.strategy && (
            <section data-testid="section-strategy">
              <SectionLabel>{t("ui.section.strategy")}</SectionLabel>
              <p className="text-sm leading-relaxed text-foreground/85">{entity.strategy}</p>
            </section>
          )}

          {}
          {entity.whenToUse && (
            <section data-testid="section-when-to-use">
              <SectionLabel>{t("ui.section.when_to_use")}</SectionLabel>
              <p className="text-sm leading-relaxed text-foreground/85">{entity.whenToUse}</p>
            </section>
          )}

          {}
          {entity.deepStrategy && entity.deepStrategy.length > 0 && (
            <section className="rounded-md border border-accent/25 bg-accent/[0.04] p-3.5" data-testid="section-deep-strategy">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <SectionLabel>{t("ui.section.deep_strategy")}</SectionLabel>
              </div>
              <BulletList items={entity.deepStrategy} />
            </section>
          )}

          {}
          {entity.bestTimingNotes && (
            <section data-testid="section-best-timing">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <SectionLabel>{t("ui.section.best_timing")}</SectionLabel>
              </div>
              <p className="text-sm leading-relaxed text-foreground/85">{entity.bestTimingNotes}</p>
            </section>
          )}

          {}
          {entity.bestWith.length > 0 && (
            <section data-testid="section-best-with">
              <SectionLabel>{t("ui.section.best_with")}</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {entity.bestWith.map((jid) => (
                  <EntityChip key={jid} kind="joker" id={jid} testIdPrefix="chip-bestwith" />
                ))}
              </div>
            </section>
          )}

          {}
          {entity.commonMistakes && entity.commonMistakes.length > 0 && (
            <section data-testid="section-common-mistakes">
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(0_65%_70%)]" />
                <SectionLabel>{t("ui.section.common_mistakes")}</SectionLabel>
              </div>
              <BulletList items={entity.commonMistakes} />
            </section>
          )}

          {}
          {entity.comboIdeas && entity.comboIdeas.length > 0 && (
            <section data-testid="section-combo-ideas">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-accent" />
                <SectionLabel>{t("ui.section.combo_ideas")}</SectionLabel>
              </div>
              <BulletList items={entity.comboIdeas} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

