import { useState } from "react";
import { Volume2, VolumeX, Trash2, LogOut, Languages, Github, ExternalLink, Star, Music, Palette, Zap, Monitor, Maximize2, Expand, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLabel } from "@/components/primitives";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume } from "@/lib/sound";
import { useI18n, useT, type Lang } from "@/lib/i18n";
import { useTheme, THEME_OPTIONS, type Theme } from "@/lib/theme";
import { useShake, SHAKE_DEFAULTS } from "@/lib/screenshake";
import { useCRT, CRT_DEFAULTS } from "@/lib/crt";
import { useUIScale, UI_SCALE_MIN, UI_SCALE_MAX, UI_SCALE_STEP } from "@/lib/uiScale";
import {
  useAppScale,
  APP_SCALE_MIN, APP_SCALE_MAX, APP_SCALE_STEP,
  TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_STEP,
} from "@/lib/appScale";
import { useApp } from "@/lib/appContext";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

export function SettingsTab() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { toast } = useToast();
  const { favoriteJokers, favoriteCombos, toggleFavoriteJoker, toggleFavoriteCombo } = useApp();
  const { isSignedIn, signOut, user } = useAuth();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [volume, setVolume] = useState(getSoundVolume());
  const { theme, setTheme } = useTheme();
  const { enabled: shakeEnabled, intensity: shakeIntensity, setEnabled: setShakeEnabled, setIntensity: setShakeIntensity } = useShake();
  const { enabled: crtEnabled, intensity: crtIntensity, setEnabled: setCrtEnabled, setIntensity: setCrtIntensity } = useCRT();
  const { scale: uiScale, setScale: setUIScale } = useUIScale();
  const { appScale, setAppScale, textScale, setTextScale } = useAppScale();

  function handleSoundToggle(next: boolean) {
    setSoundOn(next);
    setSoundEnabled(next);
  }

  function handleVolume(v: number[]) {
    const next = (v[0] ?? 50) / 100;
    setVolume(next);
    setSoundVolume(next);
  }

  function handleResetFavorites() {

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

      {}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.language")}</SectionLabel>
        </div>
        <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
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

      {}
      <section className="casino-card p-4" data-testid="section-theme">
        <div className="mb-3 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.theme.title")}</SectionLabel>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value as Theme)}
                className={`flex flex-col items-start gap-1 rounded-md border-2 px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card/50 hover:border-accent/50"
                }`}
                data-testid={`button-theme-${opt.value}`}
                aria-pressed={active}
              >
                <span className="font-pixel text-sm text-accent">{t(opt.labelKey)}</span>
                <span className="text-xs text-muted-foreground">{t(opt.descriptionKey)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("ui.settings.theme.hint")}</p>
      </section>

      <section className="casino-card p-4" data-testid="section-ui-scale">
        <div className="mb-3 flex items-center gap-1.5">
          <Maximize2 className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.ui_scale.title")}</SectionLabel>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("ui.settings.ui_scale.label")}</span>
          <span className="font-pixel text-xs tabular text-accent">{Math.round(uiScale * 100)}%</span>
        </div>
        <Slider
          min={Math.round(UI_SCALE_MIN * 100)}
          max={Math.round(UI_SCALE_MAX * 100)}
          step={Math.round(UI_SCALE_STEP * 100)}
          value={[Math.round(uiScale * 100)]}
          onValueChange={(v) => { setUIScale((v[0] ?? 100) / 100); }}
          data-testid="slider-ui-scale"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("ui.settings.ui_scale.hint")}</p>
          <Button variant="outline" size="sm" onClick={() => setUIScale(1)} data-testid="button-ui-scale-reset">
            {t("ui.settings.ui_scale.reset")}
          </Button>
        </div>
      </section>

      {/* UI SIZE (whole interface zoom) */}
      <section className="casino-card p-4" data-testid="section-app-scale">
        <div className="mb-3 flex items-center gap-1.5">
          <Expand className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>UI Size</SectionLabel>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Overall interface size</span>
          <span className="font-pixel text-xs tabular text-accent">{Math.round(appScale * 100)}%</span>
        </div>
        <Slider
          min={Math.round(APP_SCALE_MIN * 100)}
          max={Math.round(APP_SCALE_MAX * 100)}
          step={Math.round(APP_SCALE_STEP * 100)}
          value={[Math.round(appScale * 100)]}
          onValueChange={(v) => { setAppScale((v[0] ?? 100) / 100); }}
          data-testid="slider-app-scale"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Scales the whole interface — buttons, panels and fonts grow together.</p>
          <Button variant="outline" size="sm" onClick={() => setAppScale(1)} data-testid="button-app-scale-reset">
            Reset
          </Button>
        </div>
      </section>

      {/* TEXT SIZE (font-size only) */}
      <section className="casino-card p-4" data-testid="section-text-scale">
        <div className="mb-3 flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>Text Size</SectionLabel>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Text-only scale</span>
          <span className="font-pixel text-xs tabular text-accent">{Math.round(textScale * 100)}%</span>
        </div>
        <Slider
          min={Math.round(TEXT_SCALE_MIN * 100)}
          max={Math.round(TEXT_SCALE_MAX * 100)}
          step={Math.round(TEXT_SCALE_STEP * 100)}
          value={[Math.round(textScale * 100)]}
          onValueChange={(v) => { setTextScale((v[0] ?? 100) / 100); }}
          data-testid="slider-text-scale"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Adjusts text size across the app, leaving layout alone.</p>
          <Button variant="outline" size="sm" onClick={() => setTextScale(1)} data-testid="button-text-scale-reset">
            Reset
          </Button>
        </div>
      </section>

      {}
      <section className="casino-card p-4" data-testid="section-screenshake">
        <div className="mb-3 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.screenshake.title")}</SectionLabel>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
          <div className="font-medium text-sm">{t("ui.settings.screenshake.enabled")}</div>
          <Button
            variant={shakeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setShakeEnabled(!shakeEnabled)}
            data-testid="button-shake-toggle"
          >
            {shakeEnabled ? t("ui.settings.on") : t("ui.settings.off")}
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("ui.settings.screenshake.intensity")}</span>
            <span className="font-pixel text-xs tabular text-accent">{Math.round(shakeIntensity * 100)}</span>
          </div>
          <Slider
            min={Math.round(SHAKE_DEFAULTS.min * 100)}
            max={Math.round(SHAKE_DEFAULTS.max * 100)}
            step={5}
            value={[Math.round(shakeIntensity * 100)]}
            onValueChange={(v) => { setShakeIntensity((v[0] ?? 50) / 100); }}
            disabled={!shakeEnabled}
            data-testid="slider-shake"
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("ui.settings.screenshake.hint")}</p>
        </div>
      </section>

      {}
      <section className="casino-card p-4" data-testid="section-crt">
        <div className="mb-3 flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>{t("ui.settings.crt.title")}</SectionLabel>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
          <div className="font-medium text-sm">{t("ui.settings.crt.enabled")}</div>
          <Button
            variant={crtEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setCrtEnabled(!crtEnabled)}
            data-testid="button-crt-toggle"
          >
            {crtEnabled ? t("ui.settings.on") : t("ui.settings.off")}
          </Button>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("ui.settings.crt.intensity")}</span>
            <span className="font-pixel text-xs tabular text-accent">{Math.round(crtIntensity * 100)}</span>
          </div>
          <Slider
            min={Math.round(CRT_DEFAULTS.min * 100)}
            max={Math.round(CRT_DEFAULTS.max * 100)}
            step={5}
            value={[Math.round(crtIntensity * 100)]}
            onValueChange={(v) => { setCrtIntensity((v[0] ?? 60) / 100); }}
            disabled={!crtEnabled}
            data-testid="slider-crt"
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("ui.settings.crt.hint")}</p>
        </div>
      </section>

      {}
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
          <div className="font-medium text-sm">{t("ui.settings.sound_enabled")}</div>
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
        </div>
      </section>

      {}
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

      {}
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

