import { GLOSSARY } from "@/lib/helpers";
import { useT, useCuratedText } from "@/lib/i18n";

function gid(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function GlossaryRow({ term, def }: { term: string; def: string }) {
  const id = gid(term);
  const lTerm = useCuratedText(`ui.glossary.${id}.term`, term);
  const lDef = useCuratedText(`ui.glossary.${id}.def`, def);
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6" data-testid={`glossary-${id}`}>
      <dt className="font-display text-base font-semibold text-accent">{lTerm}</dt>
      <dd className="text-sm leading-relaxed text-foreground/85">{lDef}</dd>
    </div>
  );
}

export function GlossaryTab() {
  const t = useT();
  const RARITY_ENTRY = {
    term: t("ui.gloss.rarity_term"),
    def: t("ui.gloss.rarity_def"),
  };
  const entries = GLOSSARY.some((g) => g.term === "Rarity")
    ? GLOSSARY
    : [RARITY_ENTRY, ...GLOSSARY];
  return (
    <div className="mx-auto max-w-3xl">
      <dl className="divide-y divide-border">
        {entries.map((g) => (
          <GlossaryRow key={g.term} term={g.term} def={g.def} />
        ))}
      </dl>
    </div>
  );
}
