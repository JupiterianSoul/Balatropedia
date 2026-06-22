import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";
import { installGlobalSoundDelegation } from "./lib/sound";

if (!window.location.hash) {
  window.location.hash = "#/";
}

// Global click-sound delegation : every interactive element plays a sound
// without each component needing to wire playSound() itself. Opt out per
// element with data-no-sound, override with data-sound="name".
installGlobalSoundDelegation();

// ThemeProvider reads persisted choice and applies `.dark`/`.light` + data-theme.
// Default = "felt" (dark green casino), so first paint matches prior behavior.

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ShakeProvider>
      <App />
    </ShakeProvider>
  </ThemeProvider>,
);
