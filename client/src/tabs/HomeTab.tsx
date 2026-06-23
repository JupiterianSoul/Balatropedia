import { useMemo } from "react";
import {
  Library, Dices, Sparkles, Trophy, Layers, Spade, Coins, Skull, BookOpen, Star,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/appContext";
import { JOKERS, SYNERGIES, COMBOS, ARCHETYPES, JOKER_MAP } from "@/lib/helpers";
import { JokerSprite } from "@/components/JokerSprite";
import { useT, useGameText } from "@/lib/i18n";

interface QuickCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  tint: string;
  testId: string;
}

function QuickCard({ icon: Icon, title, desc, onClick, tint, testId }: QuickCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="casino-card group flex h-full flex-col items-start gap-2 p-4 text-left transition-transform hover:scale-[1.02] hover-elevate"
      data-testid={testId}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-black"
        style={{ background: `hsl(${tint} / 0.25)`, color: `hsl(${tint})` }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="font-display text-base font-semibold text-foreground">{title}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{desc}</div>
    </button>
  );
}

function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-card/50 px-4 py-3">
      <div className="font-display text-2xl font-bold tabular text-accent">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

function FeaturedJokerTile({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  const j = JOKER_MAP[id];
  const txt = useGameText("jokers", id);
  const name = txt.name ?? j?.name ?? id;
  return (
    <button
      onClick={() => onClick(id)}
      className="group flex flex-col items-center gap-1 rounded-md border border-border/60 bg-card/40 p-2 transition-transform hover:scale-[1.04] hover:border-accent/50"
      data-testid={`home-featured-${id}`}
      title={name}
    >
      <JokerSprite jokerId={id} name={name} size={56} className="h-14 w-14" />
      <span className="max-w-[80px] truncate text-[10px] text-foreground/80">{name}</span>
    </button>
  );
}

interface HomeTabProps {
  onNavigate: (tab: string) => void;
}

export function HomeTab({ onNavigate }: HomeTabProps) {
  const t = useT();
  const { favoriteJokers, openJokerDetail } = useApp();

  // Stable "featured" jokers — first 6 with highest synergy density
  const featured = useMemo(() => {
    return [...JOKERS]
      .map((j) => ({ j, count: SYNERGIES.filter((s) => s.a === j.id || s.b === j.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((x) => x.j.id);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="casino-card relative overflow-hidden p-6 sm:p-8">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-accent">
            <Sparkles className="h-3 w-3" strokeWidth={2.5} />
            {t("ui.home.tag")}
          </div>
          <h1 className="font-pixel text-2xl leading-tight text-foreground sm:text-3xl">
            <span className="mult-text">{t("ui.header.title_a")}</span>
            <span className="chips-text">{t("ui.header.title_b")}</span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {t("ui.home.intro")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigate("jokers")}
              className="balatro-tab inline-flex items-center gap-1.5 !px-4 !py-2 font-pixel"
              data-testid="home-cta-jokers"
            >
              <Library className="h-4 w-4" strokeWidth={2.5} />
              {t("ui.home.cta_browse")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("myrun")}
              className="balatro-tab inline-flex items-center gap-1.5 !px-4 !py-2 font-pixel"
              data-testid="home-cta-myrun"
            >
              <Dices className="h-4 w-4" strokeWidth={2.5} />
              {t("ui.home.cta_run")}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="mb-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("ui.home.stats")}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBlock value={JOKERS.length} label={t("ui.nav.jokers")} />
          <StatBlock value={SYNERGIES.length} label={t("ui.nav.synergies")} />
          <StatBlock value={COMBOS.length} label={t("ui.nav.combos")} />
          <StatBlock value={ARCHETYPES.length} label={t("ui.nav.archetypes")} />
        </div>
      </section>

      {/* Quick navigation */}
      <section>
        <h2 className="mb-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("ui.home.quick_nav")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickCard
            icon={Library}
            title={t("ui.nav.jokers")}
            desc={t("ui.home.card_jokers")}
            onClick={() => onNavigate("jokers")}
            tint="45 85% 60%"
            testId="home-card-jokers"
          />
          <QuickCard
            icon={Dices}
            title={t("ui.nav.myrun")}
            desc={t("ui.home.card_myrun")}
            onClick={() => onNavigate("myrun")}
            tint="0 70% 62%"
            testId="home-card-myrun"
          />
          <QuickCard
            icon={Sparkles}
            title={t("ui.nav.synergies")}
            desc={t("ui.home.card_synergies")}
            onClick={() => onNavigate("synergies")}
            tint="173 55% 55%"
            testId="home-card-synergies"
          />
          <QuickCard
            icon={Trophy}
            title={t("ui.nav.tierlist")}
            desc={t("ui.home.card_tierlist")}
            onClick={() => onNavigate("tierlist")}
            tint="210 75% 65%"
            testId="home-card-tierlist"
          />
          <QuickCard
            icon={Layers}
            title={t("ui.nav.archetypes")}
            desc={t("ui.home.card_archetypes")}
            onClick={() => onNavigate("archetypes")}
            tint="270 55% 68%"
            testId="home-card-archetypes"
          />
          <QuickCard
            icon={Spade}
            title={t("ui.nav.decks")}
            desc={t("ui.home.card_decks")}
            onClick={() => onNavigate("decks")}
            tint="145 55% 58%"
            testId="home-card-decks"
          />
          <QuickCard
            icon={Coins}
            title={t("ui.nav.stakes")}
            desc={t("ui.home.card_stakes")}
            onClick={() => onNavigate("stakes")}
            tint="45 85% 55%"
            testId="home-card-stakes"
          />
          <QuickCard
            icon={Skull}
            title={t("ui.nav.bosses")}
            desc={t("ui.home.card_bosses")}
            onClick={() => onNavigate("bosses")}
            tint="0 70% 62%"
            testId="home-card-bosses"
          />
          <QuickCard
            icon={BookOpen}
            title={t("ui.nav.glossary")}
            desc={t("ui.home.card_glossary")}
            onClick={() => onNavigate("glossary")}
            tint="180 30% 60%"
            testId="home-card-glossary"
          />
        </div>
      </section>

      {/* Featured jokers (most connected) */}
      <section>
        <h2 className="mb-2.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t("ui.home.featured")}
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {featured.map((id) => (
            <FeaturedJokerTile key={id} id={id} onClick={openJokerDetail} />
          ))}
        </div>
      </section>

      {/* Favorites teaser */}
      {favoriteJokers.size > 0 && (
        <section className="casino-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-[hsl(45_85%_60%)] text-[hsl(45_85%_60%)]" strokeWidth={2.5} />
              <span className="font-display text-sm font-semibold text-foreground">
                {favoriteJokers.size} {t("ui.home.favorites_count")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("favorites")}
              className="text-xs text-accent underline decoration-dotted underline-offset-2 hover:text-accent/80"
              data-testid="home-favorites-link"
            >
              {t("ui.home.favorites_view")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
