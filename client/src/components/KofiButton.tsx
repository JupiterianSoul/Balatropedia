import { Coffee, Heart, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n";

const KOFI_URL = "https://ko-fi.com/jupiteriansoul";

export function KofiFooterButton() {
  const t = useT();
  return (
    <div className="mt-12 flex flex-col items-center gap-1 pb-4">
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-sound="favorite"
        data-testid="link-kofi-footer"
        aria-label={t("ui.kofi.aria")}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-card hover:text-foreground"
      >
        <Coffee className="h-3.5 w-3.5" />
        <span>{t("ui.kofi.footer")}</span>
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
      <p className="max-w-md text-center text-[10px] text-muted-foreground/70">
        {t("ui.kofi.footer_note")}
      </p>
    </div>
  );
}

export function KofiSupportCard() {
  const t = useT();
  return (
    <section className="casino-card p-5">
      <div className="mb-3 flex items-center gap-1.5">
        <Coffee className="h-4 w-4 text-[hsl(45_90%_60%)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("ui.kofi.section_label")}
        </span>
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground">
        {t("ui.kofi.title")}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {t("ui.kofi.tagline")}
      </p>
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-sound="favorite"
        data-testid="link-kofi-about"
        aria-label={t("ui.kofi.aria")}
        className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
      >
        <Heart className="h-4 w-4" />
        <span>{t("ui.kofi.cta")}</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>
    </section>
  );
}
