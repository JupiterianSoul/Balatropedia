import { useEffect, useMemo, useRef, useState } from "react";
import {
  Library, Dices, Sparkles, Trophy, Layers, Spade, Coins, Skull, BookOpen, Star,
  Shuffle, type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/appContext";
import { JOKERS, SYNERGIES, JOKER_MAP } from "@/lib/helpers";
import { JokerSprite } from "@/components/JokerSprite";
import { useT, useGameText } from "@/lib/i18n";
import { burstConfetti } from "@/lib/confetti";

/* ───────────────── decorative layer ─────────────────
   Floating Balatro suit pips behind the hero. Pure CSS animation.
   The 4 pips below are positioned with viewport-relative units and
   randomized animation params so each renders feels alive. */

const SUITS = [
  { glyph: "♠", color: "#e6e6f0", size: "10rem", left: "6%",  top: "12%", dur: "16s", rotFrom: "-12deg", rotTo: "8deg",  dx: "18px",  dy: "-26px" },
  { glyph: "♥", color: "#ff5d6c", size: "8rem",  left: "78%", top: "18%", dur: "13s", rotFrom: "10deg",  rotTo: "-6deg", dx: "-14px", dy: "-18px" },
  { glyph: "♦", color: "#ffce5d", size: "9rem",  left: "12%", top: "68%", dur: "18s", rotFrom: "-6deg",  rotTo: "12deg", dx: "22px",  dy: "-30px" },
  { glyph: "♣", color: "#7fffa0", size: "8.5rem",left: "82%", top: "62%", dur: "15s", rotFrom: "8deg",   rotTo: "-10deg",dx: "-20px", dy: "-22px" },
];

function HomeDecor() {
  // Twinkling sparks. Stable positions per mount.
  const sparks = useMemo(() => {
    const out: { left: string; top: string; dur: string; delay: string }[] = [];
    for (let i = 0; i < 14; i++) {
      out.push({
        left: `${5 + Math.random() * 90}%`,
        top: `${5 + Math.random() * 90}%`,
        dur: `${3.5 + Math.random() * 4}s`,
        delay: `${Math.random() * 4}s`,
      });
    }
    return out;
  }, []);
  return (
    <>
      {SUITS.map((s, i) => (
        <span
          key={i}
          className="home-suit"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            color: s.color,
            ["--dur" as any]: s.dur,
            ["--rot-from" as any]: s.rotFrom,
            ["--rot-to" as any]: s.rotTo,
            ["--dx" as any]: s.dx,
            ["--dy" as any]: s.dy,
            animationDelay: `${i * 0.6}s`,
          }}
          aria-hidden="true"
        >
          {s.glyph}
        </span>
      ))}
      {sparks.map((p, i) => (
        <span
          key={`spark-${i}`}
          className="home-spark"
          style={{
            left: p.left,
            top: p.top,
            ["--dur" as any]: p.dur,
            ["--delay" as any]: p.delay,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/* ───────────────── nav card with tinted glow ───────────────── */

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
      className="casino-card home-tint-glow group relative flex h-full flex-col items-start gap-2 overflow-hidden p-4 text-left transition-transform hover:scale-[1.02]"
      style={{ ["--tint-glow" as any]: tint }}
      data-testid={testId}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-black transition-transform group-hover:rotate-[-6deg]"
        style={{ background: `hsl(${tint} / 0.28)`, color: `hsl(${tint})` }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div className="font-display text-base font-semibold text-foreground">{title}</div>
      <div className="text-xs leading-relaxed text-muted-foreground">{desc}</div>
      <span
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: `hsl(${tint})` }}
        aria-hidden="true"
      />
    </button>
  );
}

/* ───────────────── featured joker tile ───────────────── */

function FeaturedJokerTile({ id, onClick }: { id: string; onClick: (id: string) => void }) {
  const j = JOKER_MAP[id];
  const txt = useGameText("jokers", id);
  const name = txt.name ?? j?.name ?? id;
  return (
    <button
      onClick={() => onClick(id)}
      className="home-flip group flex flex-col items-center gap-1 rounded-md border-2 border-border/60 bg-card/60 p-2 hover:border-accent/60"
      data-testid={`home-featured-${id}`}
      title={name}
    >
      <JokerSprite jokerId={id} name={name} size={64} className="h-16 w-16" />
      <span className="max-w-[88px] truncate text-[10px] font-semibold text-foreground/85">{name}</span>
    </button>
  );
}

/* ───────────────── lucky pull (random joker) ───────────────── */

function LuckyPull({ onOpen }: { onOpen: (id: string) => void }) {
  const t = useT();
  const [id, setId] = useState<string>(() => JOKERS[Math.floor(Math.random() * JOKERS.length)].id);
  const j = JOKER_MAP[id];
  const txt = useGameText("jokers", id);
  const name = txt.name ?? j?.name ?? id;
  // Easter egg: clicking the reroll 7 times in quick succession bursts confetti.
  const clickStreak = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });

  function reroll() {
    setId(JOKERS[Math.floor(Math.random() * JOKERS.length)].id);
    const now = Date.now();
    if (now - clickStreak.current.lastAt < 900) clickStreak.current.count++;
    else clickStreak.current.count = 1;
    clickStreak.current.lastAt = now;
    if (clickStreak.current.count >= 7) {
      clickStreak.current.count = 0;
      burstConfetti({ count: 70, originY: 30 });
    }
  }

  return (
    <section className="casino-card relative flex flex-col items-center gap-3 overflow-hidden p-5 sm:flex-row sm:items-center sm:gap-5">
      <button
        type="button"
        onClick={() => onOpen(id)}
        className="home-flip"
        title={name}
        data-testid="home-lucky-open"
      >
        <JokerSprite jokerId={id} name={name} size={88} className="h-22 w-22" />
      </button>
      <div className="flex-1 space-y-1.5 text-center sm:text-left">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("ui.home.lucky_pull")}
        </div>
        <div className="font-pixel text-lg text-accent">{name}</div>
        <p className="text-xs leading-relaxed text-foreground/80">
          {t("ui.home.lucky_pull_desc")}
        </p>
        <button
          type="button"
          onClick={reroll}
          className="balatro-tab !px-3 !py-1.5 inline-flex items-center gap-1.5 font-pixel"
          data-testid="home-lucky-reroll"
        >
          <Shuffle className="h-3.5 w-3.5" strokeWidth={2.5} />
          {t("ui.home.lucky_pull_again")}
        </button>
      </div>
    </section>
  );
}

/* ───────────────── main tab ───────────────── */

interface HomeTabProps {
  onNavigate: (tab: string) => void;
}

export function HomeTab({ onNavigate }: HomeTabProps) {
  const t = useT();
  const { favoriteJokers, openJokerDetail } = useApp();

  // Top 10 by synergy density - stable across renders.
  const featured = useMemo(() => {
    return [...JOKERS]
      .map((j) => ({ j, count: SYNERGIES.filter((s) => s.a === j.id || s.b === j.id).length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((x) => x.j.id);
  }, []);

  // Hero CTA confetti: pop a small burst the first time the hero mounts.
  useEffect(() => {
    burstConfetti({ count: 24, originY: 6, duration: 1600 });
  }, []);

  const marqueeText = t("ui.home.marquee");

  return (
    <div className="space-y-8">
      {/* HERO with live background */}
      <section
        className="home-stage relative overflow-hidden p-6 sm:p-10"
        data-testid="home-hero"
      >
        <HomeDecor />
        <div className="relative z-10 mx-auto max-w-3xl space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent shadow-[0_0_24px_-4px_hsl(var(--bal-mult)/0.7)]">
            <Sparkles className="h-3 w-3 animate-pulse" strokeWidth={2.5} />
            {t("ui.home.hero_kicker")}
          </div>
          <h1 className="font-pixel text-3xl leading-[1.05] sm:text-5xl">
            <span className="mult-text balatro-wobble inline-block">{t("ui.header.title_a")}</span>
            <span className="chips-text inline-block pl-1.5">{t("ui.header.title_b")}</span>
          </h1>
          <p className="font-display text-base font-medium text-foreground/90 sm:text-lg">
            {t("ui.home.subhero")}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/70">
            {t("ui.home.intro")}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
            <button
              type="button"
              onClick={() => onNavigate("jokers")}
              className="balatro-tab inline-flex items-center gap-1.5 !px-5 !py-2.5 font-pixel"
              data-testid="home-cta-jokers"
            >
              <Library className="h-4 w-4" strokeWidth={2.5} />
              {t("ui.home.cta_browse")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("myrun")}
              className="balatro-tab inline-flex items-center gap-1.5 !px-5 !py-2.5 font-pixel"
              data-testid="home-cta-myrun"
            >
              <Dices className="h-4 w-4" strokeWidth={2.5} />
              {t("ui.home.cta_run")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tierlist")}
              className="balatro-tab inline-flex items-center gap-1.5 !px-5 !py-2.5 font-pixel"
              data-testid="home-cta-tierlist"
            >
              <Trophy className="h-4 w-4" strokeWidth={2.5} />
              {t("ui.home.cta_tier")}
            </button>
          </div>
          {/* Discreet whisper - one of the Easter-egg hints */}
          <p
            className="pt-2 text-[10px] italic tracking-wide text-muted-foreground/70"
            title={t("ui.home.whisper")}
          >
            <span aria-hidden="true">♠♥♦♣</span> {t("ui.home.whisper")}
          </p>
        </div>
      </section>

      {/* Marquee strip - the chip ribbon */}
      <section
        className="casino-card home-marquee py-2"
        aria-hidden="true"
        data-testid="home-marquee"
      >
        <div className="home-marquee-track font-display text-xs font-bold uppercase tracking-[0.16em]">
          {/* Duplicated content for seamless loop */}
          <span className="text-accent">{marqueeText}</span>
          <span className="text-muted-foreground">{marqueeText}</span>
          <span className="text-accent">{marqueeText}</span>
          <span className="text-muted-foreground">{marqueeText}</span>
        </div>
      </section>

      {/* Lucky pull */}
      <LuckyPull onOpen={openJokerDetail} />

      {/* Quick navigation */}
      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("ui.home.featured")}
          </h2>
          <span className="text-[11px] text-muted-foreground/70">
            {t("ui.home.featured_sub")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {featured.map((id) => (
            <FeaturedJokerTile key={id} id={id} onClick={openJokerDetail} />
          ))}
        </div>
      </section>

      {/* Favorites teaser */}
      {favoriteJokers.size > 0 && (
        <section className="casino-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
