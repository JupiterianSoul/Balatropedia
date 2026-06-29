import { useI18n, useT, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

const LANGS: Lang[] = ["en", "fr", "es"];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/90 transition-colors hover:text-foreground"
          aria-label={t("ui.lang.label")}
          data-testid="language-switcher"
        >
          <span>{t(`ui.lang.${lang}`)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        avoidCollisions
        className="z-[60] min-w-[8rem]"
      >
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

