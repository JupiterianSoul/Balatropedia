import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";
import { CRTProvider } from "./lib/crt";
import { UIScaleProvider, readStoredSync, apply as applyUIScale } from "./lib/uiScale";
import { installGlobalSoundDelegation } from "./lib/sound";
import { installAudioUnlock } from "./lib/sounds";

// Apply persisted UI scale before first paint to avoid flash of default size.
applyUIScale(readStoredSync());

if (!window.location.hash) {
  window.location.hash = "#/";
}

// Enable Balatro velvet skin unless the user opted out
// (key: balatropedia.local.velvet, default "1").
try {
  const velvetPref = localStorage.getItem("balatropedia.local.velvet");
  if (velvetPref === null || velvetPref === "1") {
    document.documentElement.setAttribute("data-bg", "velvet");
  }
} catch {}

installGlobalSoundDelegation();
installAudioUnlock();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <UIScaleProvider>
      <ShakeProvider>
        <CRTProvider>
          <App />
        </CRTProvider>
      </ShakeProvider>
    </UIScaleProvider>
  </ThemeProvider>,
);

// Hide Capacitor native splash after React mounts (native platform only).
// The React BalatroSplash animation takes over from here.
if ((window as any).Capacitor?.isNativePlatform?.()) {
  import("@capacitor/splash-screen")
    .then((m) => m.SplashScreen.hide({ fadeOutDuration: 200 }))
    .catch(() => {});
}

