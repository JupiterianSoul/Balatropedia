import { ExternalLink } from "lucide-react";
import type { SynergySource } from "@/data/jokers";
import { useT } from "@/lib/i18n";

/**
 * Inline citation chip strip — renders one external-link chip per community source
 * (Balatro Wiki, dood.gg, Balatro HQ, Mobalytics, etc.).
 *
 * Used under synergy "why" blurbs and combo strategy writeups to make the
 * provenance of strategy claims visible and verifiable. When sources are empty,
 * renders nothing.
 */
export function SourceCitations({
  sources,
  className = "",
}: {
  sources?: SynergySource[];
  className?: string;
}) {
  const t = useT();
  if (!sources || sources.length === 0) return null;
  return (
    <div className={`mt-2 flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
        {t("ui.sources.label")}
      </span>
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card/40 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 transition-colors hover:border-accent/60 hover:text-accent"
          data-testid={`source-link-${encodeURIComponent(s.url)}`}
          title={s.url}
        >
          <ExternalLink className="h-2.5 w-2.5" />
          <span className="max-w-[200px] truncate">{s.name}</span>
        </a>
      ))}
    </div>
  );
}
