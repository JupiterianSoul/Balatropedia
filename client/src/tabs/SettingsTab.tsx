import { useState } from "react";
import { Volume2, VolumeX, Trash2, LogOut, Languages, Github, ExternalLink, Star, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLabel } from "@/components/primitives";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, playSound } from "@/lib/sound";
import { useI18n, useT, type Lang } from "@/lib/i18n";
import { useApp } from "@/lib/appContext";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

/**
 * Settings tab — all user-tunable preferences in one place:
 *  - Language (EN / FR / ES)
 *  - Sound on/off + master volume
 *  - Reset favorites (local + server when signed in)
 *  - Sign out
 *  - About + external links
 */
export function SettingsTab() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { toast } = useToast();
  const { favoriteJokers, favoriteCombos, toggleFavoriteJoker, toggleFavoriteCombo } = useApp();
  const { isSignedIn, signOut, user } = useAuth();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [volume, setVolume] = useState(getSoundVolume());

  function handleSoundToggle(next: boolean) {
    setSoundOn(next);
    setSoundEnabled(next);
  }

  function handleVolume(v: number[]) {
    const next = (v[0] ?? 50) / 100;
    setVolume(next);
    setSoundVolume(next);
    playSound("click");
  }

  function handleResetFavorites() {
    // Clear by toggling each (handles both server and local paths via appContext)
    Array.from(favoriteJokers).forEach((id) => toggleFavoriteJoker(id));
    Array.from(favoriteCombos).forEach((id) => toggleFavoriteCombo(id));
    toast({ title: t("ui.settings.reset_done") });
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast({ title: t("ui.settings.signed_out") });
    } catch (e: any) {
      toast({ title: t("ui.settings.signout_failed"), description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="tab-settings">
      <header>
        <h2 className="font-pixel text-2xl text-accent">{t("ui.settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.settings.subtitle")}</p>
      </header>

      {/* Language */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.language")}</SectionLabel>
        </div>
        <Select value={lang} onValueChange={(v) => { setLang(v as Lang); playSound("click"); }}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANG_OPTIONS.map((l) => (
              <SelectItem key={l.code} value={l.code} data-testid={`option-lang-${l.code}`}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">{t("ui.settings.language_hint")}</p>
      </section>

      {/* Sound */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          {soundOn ? (
            <Volume2 className="h-3.5 w-3.5 text-accent" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <SectionLabel>{t("ui.settings.sound")}</SectionLabel>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
          <div>
            <div className="font-medium text-sm">{t("ui.settings.sound_enabled")}</div>
            <div className="text-xs text-muted-foreground">{t("ui.settings.sound_enabled_hint")}</div>
          </div>
          <Button
            variant={soundOn ? "default" : "outline"}
            size="sm"
            onClick={() => handleSoundToggle(!soundOn)}
            data-testid="button-settings-sound-toggle"
          >
            {soundOn ? t("ui.settings.on") : t("ui.settings.off")}
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Music className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-pixel text-xs tabular text-accent">{Math.round(volume * 100)}</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[Math.round(volume * 100)]}
            onValueChange={handleVolume}
            disabled={!soundOn}
            data-testid="slider-volume"
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("ui.settings.volume_hint")}</p>
        </div>
      </section>

      {/* Account / Favorites */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-[hsl(45_85%_60%)]" />
          <SectionLabel>{t("ui.settings.account_data")}</SectionLabel>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
            <div>
              <div className="font-medium text-sm">{t("ui.settings.favorites_count")}</div>
              <div className="text-xs text-muted-foreground">
                {favoriteJokers.size} {t("ui.settings.jokers")} · {favoriteCombos.size} {t("ui.settings.combos")}
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={favoriteJokers.size + favoriteCombos.size === 0}
                  data-testid="button-reset-favorites"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("ui.settings.reset")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("ui.settings.reset_confirm_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("ui.settings.reset_confirm_desc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-reset-cancel">{t("ui.common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetFavorites} data-testid="button-reset-confirm">
                    {t("ui.settings.reset")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {isSignedIn ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium text-sm">{t("ui.settings.signed_in_as")}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSignOut}
                data-testid="button-settings-signout"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("ui.settings.signout")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("ui.settings.sign_in_to_sync")}</p>
          )}
        </div>
      </section>

      {/* About / Links */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <SectionLabel>{t("ui.settings.about")}</SectionLabel>
        </div>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="https://github.com/JupiterianSoul/Balatropedia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
              data-testid="link-github"
            >
              <Github className="h-3.5 w-3.5" />
              {t("ui.settings.source_code")}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </li>
          <li className="text-xs text-muted-foreground">
            {t("ui.settings.disclaimer")}
          </li>
          <li className="text-xs text-muted-foreground">
            v{import.meta.env.VITE_APP_VERSION ?? "0.1"} · Balatropedia
          </li>
        </ul>
      </section>
    </div>
  );
}
