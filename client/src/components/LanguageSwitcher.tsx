import { useI18n, useT, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";

const LANGS: Lang[] = ["en", "fr", "es"];

interface LanguageSwitcherProps {
  /** Compact mode: icon + 2-char code only, no extra chrome. Used in mobile header. */
  compact?: boolean;
}

export function LanguageSwitcher({ compact }: LanguageSwitcherProps = {}) {
  const { lang, setLang } = useI18n();
  const t = useT();

  // Short 2-char code for compact display
  const shortCode = lang.toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/90 transition-colors hover:text-foreground"
          aria-label={t("ui.lang.label")}
          data-testid="language-switcher"
        >
          <Languages className="h-3.5 w-3.5" aria-hidden />
          {compact ? (
            <span aria-hidden>{shortCode}</span>
          ) : (
            <span>{t(`ui.lang.${lang}`)}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {LANGS.map((l) => {
          const active = lang === l;
          return (
            <DropdownMenuItem
              key={l}
              onSelect={() => setLang(l)}
              data-testid={`lang-${l}`}
              data-active={active}
              className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide"
            >
              <span>{t(`ui.lang.${l}`)}</span>
              {active && <Check className="h-3.5 w-3.5 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

