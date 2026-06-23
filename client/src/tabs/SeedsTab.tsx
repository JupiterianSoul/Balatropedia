// Seeds tab. We deliberately do NOT ship a broken in-browser seed finder
// (Immolate requires native compilation; immolate.js exists but is too heavy
// for a Render free-tier dyno). Instead we provide:
//   1. Seed Library — curated seeds for popular archetypes, filterable by joker
//   2. Seed Analyzer — paste a seed, deep-link to TheSoul + Blueprint with seed prefilled
//   3. Honest "what's coming" note about full filter search.
import { useMemo, useState } from "react";
import { Dices, ExternalLink, Search, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { JokerSprite } from "@/components/JokerSprite";
import { JOKER_MAP } from "@/lib/helpers";

interface SeedEntry {
  seed: string;
  deck: string;          // "Red", "Blue", etc.
  stake?: string;
  archetype: string;
  highlights: string[];  // joker ids OR free-text labels
  notes: string;
}

const SEED_LIBRARY: SeedEntry[] = [
  // Legendary skip seeds
  { seed: "8Q47WV6K", deck: "Red", archetype: "Legendary skip", highlights: ["triboulet", "perkeo"], notes: "Ante 1 Soul → Triboulet, second Soul → Perkeo. Both via Hieroglyph skip tag." },
  { seed: "G3GN8GQH", deck: "Red", archetype: "Legendary skip", highlights: ["perkeo"], notes: "Free Perkeo via Temperance on ante 1." },
  // Yorick rushes
  { seed: "4K4ZWL2U", deck: "Red", archetype: "Yorick rush", highlights: ["yorick"], notes: "Holographic Yorick early - massive xMult scaling." },
  { seed: "DJXG5GVT", deck: "Red", archetype: "Yorick rush", highlights: ["yorick"], notes: "Yorick early in shop." },
  { seed: "ZV2W1851", deck: "Red", archetype: "Yorick rush", highlights: ["yorick", "invisible_joker"], notes: "Yorick + Invisible Joker combo path." },
  { seed: "TJ839I1Y", deck: "Red", archetype: "Yorick rush", highlights: ["yorick"], notes: "Yorick with Wasteful deck-style discard support." },
  // Brainstorm / Blueprint combos
  { seed: "NLK8X1S1", deck: "Red", archetype: "Copier loop", highlights: ["brainstorm", "the_order"], notes: "Brainstorm + The Order — easy x3 copy loop." },
  { seed: "7UMHIZHH", deck: "Red", archetype: "Copier loop", highlights: ["brainstorm", "invisible_joker"], notes: "Brainstorm + Invisible Joker — late-game power." },
  { seed: "CHHPXHBZ", deck: "Red", archetype: "Copier loop", highlights: ["blueprint", "brainstorm"], notes: "Free Blueprint + Brainstorm in shop — dream double-copier." },
  { seed: "NC6J3T8C", deck: "Red", archetype: "Copier loop", highlights: ["chicot", "brainstorm"], notes: "Chicot + Brainstorm — skip every boss." },
];

const ARCHETYPES = Array.from(new Set(SEED_LIBRARY.map(s => s.archetype)));

function seedHighlightJokers(entry: SeedEntry): string[] {
  return entry.highlights.filter(h => JOKER_MAP[h]);
}

function SeedCard({ entry, onCopy }: { entry: SeedEntry; onCopy: (s: string) => void }) {
  const jokerHighlights = seedHighlightJokers(entry);
  const textOnly = entry.highlights.filter(h => !JOKER_MAP[h]);
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <code className="text-lg font-bold tracking-wider text-[hsl(var(--bal-gold))]">{entry.seed}</code>
        <Button size="sm" variant="ghost" onClick={() => onCopy(entry.seed)}>
          <Copy className="h-3.5 w-3.5 mr-1" /> copy
        </Button>
      </div>
      <div className="flex flex-wrap gap-1 text-[11px]">
        <span className="rounded bg-secondary/40 px-1.5 py-0.5">{entry.deck} Deck</span>
        {entry.stake && <span className="rounded bg-secondary/40 px-1.5 py-0.5">{entry.stake}</span>}
        <span className="rounded bg-accent/20 text-accent px-1.5 py-0.5">{entry.archetype}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {jokerHighlights.map(j => (
          <div key={j} className="flex items-center gap-1.5 text-xs">
            <JokerSprite jokerId={j} size={28} />
            <span>{JOKER_MAP[j]?.name}</span>
          </div>
        ))}
        {textOnly.map(t => (
          <span key={t} className="text-xs text-muted-foreground italic">{t}</span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{entry.notes}</p>
      <div className="flex flex-wrap gap-1.5">
        <a href={`https://spectralpack.github.io/TheSoul/?seed=${entry.seed}&deck=${entry.deck}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" /> TheSoul
          </Button>
        </a>
        <a href={`https://miaklwalker.github.io/Blueprint/?seed=${entry.seed}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" /> Blueprint
          </Button>
        </a>
      </div>
    </div>
  );
}

export function SeedsTab() {
  const [filter, setFilter] = useState("");
  const [archetype, setArchetype] = useState<string>("__all__");
  const [jokerFilter, setJokerFilter] = useState<string>("__any__");
  const [analyzerSeed, setAnalyzerSeed] = useState("");
  const [analyzerDeck, setAnalyzerDeck] = useState("Red");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return SEED_LIBRARY.filter(s => {
      if (archetype !== "__all__" && s.archetype !== archetype) return false;
      if (jokerFilter !== "__any__" && !s.highlights.includes(jokerFilter)) return false;
      if (filter) {
        const q = filter.toLowerCase();
        const hay = (s.seed + s.archetype + s.notes + s.highlights.join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filter, archetype, jokerFilter]);

  const allJokers = useMemo(() => {
    const set = new Set<string>();
    for (const s of SEED_LIBRARY) for (const h of s.highlights) if (JOKER_MAP[h]) set.add(h);
    return Array.from(set);
  }, []);

  const copy = (s: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(s).catch(() => {});
    setCopied(s);
    setTimeout(() => setCopied(c => c === s ? null : c), 1500);
  };

  const analyzerValid = /^[A-Z0-9]{6,10}$/.test(analyzerSeed.toUpperCase());

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Dices className="h-4 w-4 text-accent" />
          <h2 className="text-lg font-bold">Seeds</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Curated seed library + analyzer. Use TheSoul or Blueprint for full per-ante spoilers. A full filter-based seed finder requires native compilation (Immolate) and is on the roadmap.
        </p>
      </div>

      {/* Analyzer */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
        <h3 className="text-sm font-semibold">Seed analyzer</h3>
        <p className="text-xs text-muted-foreground">Paste a seed to deep-link into the two best seed-spoiler tools, pre-filled with your seed and deck.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label className="text-xs">Seed code</Label>
            <Input
              value={analyzerSeed}
              onChange={(e) => setAnalyzerSeed(e.target.value.toUpperCase())}
              placeholder="e.g. 8Q47WV6K"
              className="h-9 font-mono tracking-wider"
              maxLength={10}
            />
          </div>
          <div>
            <Label className="text-xs">Deck</Label>
            <Select value={analyzerDeck} onValueChange={setAnalyzerDeck}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Red","Blue","Yellow","Green","Black","Magic","Nebula","Ghost","Abandoned","Checkered","Zodiac","Painted","Anaglyph","Plasma","Erratic"].map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={analyzerValid ? `https://spectralpack.github.io/TheSoul/?seed=${analyzerSeed.toUpperCase()}&deck=${analyzerDeck}` : "#"}
            target="_blank" rel="noopener noreferrer"
            className={!analyzerValid ? "pointer-events-none opacity-40" : ""}
          >
            <Button size="sm" variant="default">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in TheSoul
            </Button>
          </a>
          <a
            href={analyzerValid ? `https://miaklwalker.github.io/Blueprint/?seed=${analyzerSeed.toUpperCase()}` : "#"}
            target="_blank" rel="noopener noreferrer"
            className={!analyzerValid ? "pointer-events-none opacity-40" : ""}
          >
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Blueprint
            </Button>
          </a>
          {analyzerSeed && !analyzerValid && (
            <span className="text-xs text-rose-400 self-center">Seeds are 6-10 uppercase A-Z 0-9.</span>
          )}
        </div>
      </section>

      {/* Library filters */}
      <section className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Seed library ({filtered.length}/{SEED_LIBRARY.length})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search..." className="h-8 pl-7 text-xs" />
          </div>
          <Select value={archetype} onValueChange={setArchetype}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Archetype" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All archetypes</SelectItem>
              {ARCHETYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={jokerFilter} onValueChange={setJokerFilter}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Joker" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any joker</SelectItem>
              {allJokers.map(j => <SelectItem key={j} value={j}>{JOKER_MAP[j]?.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(e => <SeedCard key={e.seed} entry={e} onCopy={copy} />)}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground italic md:col-span-2 text-center py-8">No seeds match the filter.</p>
        )}
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 rounded-md bg-accent text-accent-foreground px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-lg">
          <Check className="h-3.5 w-3.5" /> Seed {copied} copied
        </div>
      )}
    </div>
  );
}
