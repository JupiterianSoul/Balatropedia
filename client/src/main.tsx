import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./lib/theme";
import { ShakeProvider } from "./lib/screenshake";

if (!window.location.hash) {
  window.location.hash = "#/";
}

// ThemeProvider reads persisted choice and applies `.dark`/`.light` + data-theme.
// Default = "felt" (dark green casino), so first paint matches prior behavior.

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ShakeProvider>
      <App />
    </ShakeProvider>
  </ThemeProvider>,
);
