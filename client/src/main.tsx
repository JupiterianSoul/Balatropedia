import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";
import { installGlobalSoundDelegation } from "./lib/sound";

if (!window.location.hash) {
  window.location.hash = "#/";
}

installGlobalSoundDelegation();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ShakeProvider>
      <App />
    </ShakeProvider>
  </ThemeProvider>,
);

