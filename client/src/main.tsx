import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";
import { CRTProvider } from "./lib/crt";
import { UIScaleProvider } from "./lib/uiScale";
import { AppScaleProvider } from "./lib/appScale";
import { installGlobalSoundDelegation } from "./lib/sound";
import { runFirstLaunchResetIfNeeded } from "./lib/firstLaunchReset";

if (!window.location.hash) {
  window.location.hash = "#/";
}

function mount() {
  installGlobalSoundDelegation();
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <AppScaleProvider>
        <UIScaleProvider>
          <ShakeProvider>
            <CRTProvider>
              <App />
            </CRTProvider>
          </ShakeProvider>
        </UIScaleProvider>
      </AppScaleProvider>
    </ThemeProvider>,
  );
}

// Wipe carryover settings from any prior APK install before React mounts so
// no component reads stale localStorage. In the web build this resolves
// instantly (IS_LOCAL is false) and just calls mount().
runFirstLaunchResetIfNeeded()
  .catch(() => { /* never block mount on storage errors */ })
  .finally(mount);

