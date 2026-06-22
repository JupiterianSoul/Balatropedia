import { GLOSSARY } from "@/lib/helpers";

export function GlossaryTab() {
  return (
    <div className="mx-auto max-w-3xl">
      <dl className="divide-y divide-border">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6" data-testid={`glossary-${g.term}`}>
            <dt className="font-display text-base font-semibold text-accent">{g.term}</dt>
            <dd className="text-sm leading-relaxed text-foreground/85">{g.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
