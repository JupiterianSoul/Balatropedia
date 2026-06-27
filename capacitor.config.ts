import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.balatropedia",
  appName: "Balatropedia",
  // Vite outputs the client here in `npm run build:app`.
  webDir: "dist/public",
  // Capacitor 7 default. Keep it explicit so behaviour doesn't shift on upgrades.
  bundledWebRuntime: false,
  android: {
    // Match the website's theme color so the splash/status bar feel native.
    backgroundColor: "#1c262a",
    // Allow http://localhost only via WebView default; outbound HTTPS is fine.
    // No allowNavigation — the app is fully offline.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#1c262a",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1c262a",
    },
  },
};

export default config;
