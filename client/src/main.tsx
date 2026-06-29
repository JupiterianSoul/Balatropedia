import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";
import { CRTProvider } from "./lib/crt";
import { UIScaleProvider } from "./lib/uiScale";
import { AppScaleProvider } from "./lib/appScale";
import { installGlobalSoundDelegation } from "./lib/sound";

if (!window.location.hash) {
  window.location.hash = "#/";
}

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

