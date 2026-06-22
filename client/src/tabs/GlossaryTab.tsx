import { GLOSSARY } from "@/lib/helpers";
import { useT } from "@/lib/i18n";

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
          <div key={g.term} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6" data-testid={`glossary-${g.term}`}>
            <dt className="font-display text-base font-semibold text-accent">{g.term}</dt>
            <dd className="text-sm leading-relaxed text-foreground/85">{g.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
