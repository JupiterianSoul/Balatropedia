import { useEffect, useState } from "react";
import {
  Volume2, VolumeX, Trash2, LogOut, Languages, Github, ExternalLink,
  Star, Music, Palette, Zap, Monitor, Maximize2, Smartphone, Home as HomeIcon,
  RotateCcw, BookOpen, Vibrate, Cloud, CloudOff, RefreshCw, LogIn, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionLabel } from "@/components/primitives";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume } from "@/lib/sound";
import { getSoundsEnabled as getSynthSoundsEnabled, setSoundsEnabled as setSynthSoundsEnabled, uiTap } from "@/lib/sounds";
import { useI18n, useT, type Lang } from "@/lib/i18n";
import { useTheme, THEME_OPTIONS, type Theme } from "@/lib/theme";
import { useShake, SHAKE_DEFAULTS } from "@/lib/screenshake";
import { useCRT, CRT_DEFAULTS } from "@/lib/crt";
import { useUIScale, UI_SCALE_MIN, UI_SCALE_MAX, UI_SCALE_STEP } from "@/lib/uiScale";
import { useApp } from "@/lib/appContext";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { FIREBASE_ENABLED, signInWithGoogle, signOut as fbSignOut, subscribeAuth, type FirebaseUserSummary } from "@/lib/firebase";
import { isCloudSyncEnabled, setCloudSyncEnabled, subscribeSync, syncNow, type SyncStatus } from "@/lib/cloudSync";

const PREF_KEY_HAPTICS = "balatropedia.local.haptics";
const PREF_KEY_STARTUP_TAB = "balatropedia.local.startupTab";

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

const STARTUP_TAB_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "jokers", label: "Jokers" },
  { value: "tierlist", label: "Tier List" },
  { value: "favorites", label: "Favorites" },
  { value: "settings", label: "Settings" },
  { value: "last", label: "Last visited" },
];

const OSS_ATTRIBUTIONS = [
  { name: "React", license: "MIT", url: "https://reactjs.org" },
  { name: "Vite", license: "MIT", url: "https://vitejs.dev" },
  { name: "Capacitor", license: "MIT", url: "https://capacitorjs.com" },
  { name: "Tailwind CSS", license: "MIT", url: "https://tailwindcss.com" },
  { name: "framer-motion", license: "MIT", url: "https://www.framer.com/motion" },
  { name: "lucide-react", license: "ISC", url: "https://lucide.dev" },
  { name: "shadcn/ui", license: "MIT", url: "https://ui.shadcn.com" },
  { name: "TanStack Query", license: "MIT", url: "https://tanstack.com/query" },
];

function readPref(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch { /* ignore */ }
  // Also write Capacitor Preferences on native (best-effort).
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    import("@capacitor/preferences")
      .then(({ Preferences }) => Preferences.set({ key, value }))
      .catch(() => {});
  }
}

export function SettingsTab() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { toast } = useToast();
  const { favoriteJokers, favoriteCombos, toggleFavoriteJoker, toggleFavoriteCombo } = useApp();
  const { isSignedIn, signOut, user } = useAuth();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [volume, setVolume] = useState(getSoundVolume());
  const [velvetOn, setVelvetOn] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const v = localStorage.getItem("balatropedia.local.velvet");
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  });
  const [synthOn, setSynthOn] = useState(() => getSynthSoundsEnabled());

  // Firebase + cloud sync state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserSummary | null>(null);
  const [cloudSyncOn, setCloudSyncOn] = useState<boolean>(() => isCloudSyncEnabled());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncLastAt, setSyncLastAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const [signingIn, setSigningIn] = useState(false);
  useEffect(() => subscribeAuth(setFirebaseUser), []);
  useEffect(() =>
    subscribeSync((s) => {
      setSyncStatus(s.status);
      setSyncLastAt(s.lastAt);
      setSyncError(s.error);
    }),
  []);

  async function handleGoogleSignIn() {
    if (!FIREBASE_ENABLED) {
      toast({ title: "Cloud sync not configured", description: "Firebase env vars are not set in this build.", variant: "destructive" });
      return;
    }
    try {
      setSigningIn(true);
      await signInWithGoogle();
      toast({ title: "Signed in", description: "Google account linked." });
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSigningIn(false);
    }
  }

  async function handleGoogleSignOut() {
    try { await fbSignOut(); toast({ title: "Signed out" }); }
    catch (e: any) { toast({ title: "Sign-out failed", description: e?.message ?? String(e), variant: "destructive" }); }
  }

  async function handleSyncNow() {
    try { await syncNow(); toast({ title: "Sync complete" }); }
    catch (e: any) { toast({ title: "Sync failed", description: e?.message ?? String(e), variant: "destructive" }); }
  }

  const { theme, setTheme } = useTheme();
  const { enabled: shakeEnabled, intensity: shakeIntensity, setEnabled: setShakeEnabled, setIntensity: setShakeIntensity } = useShake();
  const { enabled: crtEnabled, intensity: crtIntensity, setEnabled: setCrtEnabled, setIntensity: setCrtIntensity } = useCRT();
  const { scale: uiScale, setScale: setUIScale } = useUIScale();

  // Haptic feedback toggle
  const [hapticsOn, setHapticsOn] = useState(() => readPref(PREF_KEY_HAPTICS, "true") !== "false");
  function handleHapticsToggle(next: boolean) {
    setHapticsOn(next);
    writePref(PREF_KEY_HAPTICS, String(next));
  }

  // Startup tab
  const [startupTab, setStartupTab] = useState(() => readPref(PREF_KEY_STARTUP_TAB, "home"));
  function handleStartupTab(val: string) {
    setStartupTab(val);
    writePref(PREF_KEY_STARTUP_TAB, val);
  }

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

  async function handleClearLocalData() {
    // Clear all balatropedia.local.* keys from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("balatropedia.local.")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch { /* ignore */ }

    // Also clear Capacitor Preferences if native
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { keys } = await Preferences.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("balatropedia.local."))
            .map((k) => Preferences.remove({ key: k })),
        );
      } catch { /* ignore */ }
    }

    window.location.reload();
  }

  // App version from build-time define (vite.config.ts)
  const appVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

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

      {/* Theme */}
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

      {/* Display size */}
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

      {/* Screen shake */}
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

      {/* CRT */}
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

      {/* Haptic feedback (mobile) */}
      <section className="casino-card p-4" data-testid="section-haptics">
        <div className="mb-3 flex items-center gap-1.5">
          <Vibrate className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>Haptic feedback</SectionLabel>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
          <div>
            <div className="font-medium text-sm">Haptics on button press</div>
            <div className="text-xs text-muted-foreground">Android native only</div>
          </div>
          <Button
            variant={hapticsOn ? "default" : "outline"}
            size="sm"
            onClick={() => handleHapticsToggle(!hapticsOn)}
            data-testid="button-haptics-toggle"
          >
            {hapticsOn ? t("ui.settings.on") : t("ui.settings.off")}
          </Button>
        </div>
      </section>

      {/* Startup tab */}
      <section className="casino-card p-4" data-testid="section-startup-tab">
        <div className="mb-3 flex items-center gap-1.5">
          <HomeIcon className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>Startup tab</SectionLabel>
        </div>
        <Select value={startupTab} onValueChange={handleStartupTab}>
          <SelectTrigger className="w-full sm:w-64" data-testid="select-startup-tab">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STARTUP_TAB_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} data-testid={`option-startup-${opt.value}`}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          Which tab opens when you launch the app.
        </p>
      </section>

      {/* Balatro skin (velvet bg + synth sounds) */}
      <section className="casino-card p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-accent" />
          <SectionLabel>Balatro Skin</SectionLabel>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
            <div>
              <div className="font-medium text-sm">Velvet background</div>
              <div className="text-xs text-muted-foreground">Red-velvet radial with film grain.</div>
            </div>
            <Button
              variant={velvetOn ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const next = !velvetOn;
                setVelvetOn(next);
                try { localStorage.setItem("balatropedia.local.velvet", next ? "1" : "0"); } catch {}
                document.documentElement.setAttribute("data-bg", next ? "velvet" : "");
              }}
              data-testid="button-velvet-toggle"
            >
              {velvetOn ? t("ui.settings.on") : t("ui.settings.off")}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
            <div>
              <div className="font-medium text-sm">Synth sounds</div>
              <div className="text-xs text-muted-foreground">Chip, card, score & UI blips synthesized via Web Audio.</div>
            </div>
            <Button
              variant={synthOn ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const next = !synthOn;
                setSynthOn(next);
                setSynthSoundsEnabled(next);
                if (next) uiTap();
              }}
              data-testid="button-synth-sounds-toggle"
            >
              {synthOn ? t("ui.settings.on") : t("ui.settings.off")}
            </Button>
          </div>
        </div>
      </section>

      {/* Cloud sync (Google account) */}
      <section className="casino-card p-4" data-testid="section-cloud-sync">
        <div className="mb-3 flex items-center gap-1.5">
          {cloudSyncOn && firebaseUser ? <Cloud className="h-3.5 w-3.5 text-accent" /> : <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />}
          <SectionLabel>Google account & cloud sync</SectionLabel>
        </div>
        {!FIREBASE_ENABLED && (
          <div className="rounded-md border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
            Cloud sync is unconfigured for this build. Set <code className="font-mono">VITE_FIREBASE_*</code> env vars and rebuild to enable Google sign-in and cross-device sync.
          </div>
        )}
        {FIREBASE_ENABLED && !firebaseUser && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
            <div className="min-w-0">
              <div className="font-medium text-sm">Sign in with Google</div>
              <div className="text-xs text-muted-foreground">Syncs favorites, runs, prefs, and tier lists across devices.</div>
            </div>
            <Button size="sm" onClick={handleGoogleSignIn} disabled={signingIn} data-testid="button-google-signin">
              <LogIn className="h-3.5 w-3.5 mr-1" /> {signingIn ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        )}
        {FIREBASE_ENABLED && firebaseUser && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
              {firebaseUser.photoURL ? (
                <img src={firebaseUser.photoURL} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-card flex items-center justify-center text-xs font-bold">{(firebaseUser.displayName ?? firebaseUser.email ?? "?").slice(0, 1).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{firebaseUser.displayName ?? firebaseUser.email}</div>
                {firebaseUser.email && <div className="text-xs text-muted-foreground truncate">{firebaseUser.email}</div>}
              </div>
              <Button size="sm" variant="outline" onClick={handleGoogleSignOut} data-testid="button-google-signout">
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign out
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/50 px-3 py-2">
              <div>
                <div className="font-medium text-sm">Cloud sync</div>
                <div className="text-xs text-muted-foreground">
                  {syncStatus === "pushing" && "Pushing to cloud…"}
                  {syncStatus === "pulling" && "Pulling from cloud…"}
                  {syncStatus === "error" && <span className="text-destructive">{syncError ?? "Sync error"}</span>}
                  {syncStatus === "idle" && (syncLastAt
                    ? `Last synced ${new Date(syncLastAt).toLocaleString()}`
                    : cloudSyncOn ? "Idle" : "Off")}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={cloudSyncOn ? "default" : "outline"}
                  onClick={() => { const next = !cloudSyncOn; setCloudSyncOn(next); setCloudSyncEnabled(next); }}
                  data-testid="button-cloud-sync-toggle"
                >
                  {cloudSyncOn ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <AlertCircle className="h-3.5 w-3.5 mr-1" />}
                  {cloudSyncOn ? "On" : "Off"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleSyncNow} disabled={!cloudSyncOn || syncStatus === "pushing" || syncStatus === "pulling"} aria-label="Sync now" data-testid="button-sync-now">
                  <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "pushing" || syncStatus === "pulling" ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Account data */}
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

      {/* Clear local data */}
      <section className="casino-card p-4" data-testid="section-clear-data">
        <div className="mb-3 flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5 text-destructive" />
          <SectionLabel>Clear local data</SectionLabel>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Removes all app preferences (scale, haptics, startup tab, etc.) and reloads.
          Your cloud account and favorites are not affected.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              data-testid="button-clear-local-data"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear local data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all locally persisted preferences (display size, haptics,
                startup tab, etc.) and reload the app. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("ui.common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearLocalData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-clear-local-data-confirm"
              >
                Clear & reload
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* About */}
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
          <li>
            {/* Open source attributions sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm"
                  data-testid="button-oss-attributions"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Open source attributions
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="font-pixel text-accent">Open Source Attributions</SheetTitle>
                </SheetHeader>
                <ul className="space-y-3">
                  {OSS_ATTRIBUTIONS.map((lib) => (
                    <li key={lib.name} className="flex items-center justify-between gap-3 text-sm">
                      <a
                        href={lib.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent hover:underline"
                      >
                        {lib.name}
                      </a>
                      <span className="text-xs text-muted-foreground">{lib.license}</span>
                    </li>
                  ))}
                  <li className="border-t border-border pt-3 text-xs text-muted-foreground">
                    Sprites courtesy of the Balatro Wiki community.
                  </li>
                </ul>
              </SheetContent>
            </Sheet>
          </li>
          <li className="text-xs text-muted-foreground">
            {t("ui.settings.disclaimer")}
          </li>
        </ul>
      </section>

      {/* App version + build hash — bottom of settings */}
      <p className="pb-2 text-center text-xs text-muted-foreground/50" data-testid="text-app-version">
        Balatropedia v{appVersion}
      </p>
    </div>
  );
}
