import { useI18n, useT, type Lang } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LANGS: Lang[] = ["en", "fr", "es"];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const t = useT();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
      role="group"
      aria-label={t("ui.lang.label")}
      data-testid="language-switcher"
    >
      {LANGS.map((l) => {
        const active = lang === l;
        const btn = (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            data-testid={`lang-${l}`}
            data-active={active}
            aria-pressed={active}
            className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`ui.lang.${l}`)}
          </button>
        );
        if (l === "es") {
          return (
            <Tooltip key={l}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent>{t("ui.lang.es_tooltip")}</TooltipContent>
            </Tooltip>
          );
        }
        return btn;
      })}
    </div>
  );
}
