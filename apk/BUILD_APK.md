# Build & sideload the Seed Searcher APK

Step-by-step for Julie's Windows machine. Assumes Android Studio
Koala (2024.1.x) or newer, Android SDK 34, and a USB-debug-enabled
Android phone.

> **Reminder:** this directory wraps the **standalone** Seed Searcher
> build, not the Balatropedia client. The threaded-mode COOP/COEP
> headers are injected by `MainActivity.java` so the WebView is
> cross-origin isolated and `SharedArrayBuffer` is available.

---

## 0. One-time setup

1. Install Android Studio. During first launch let it install SDK 34
   + Build Tools + Platform Tools.
2. Make sure `adb` is on your PATH (Android Studio adds it to
   `%LOCALAPPDATA%\Android\Sdk\platform-tools`).
3. Enable USB debugging on your phone.

---

## 1. Build the standalone web bundle (one terminal)

```powershell
cd C:\Users\Julie\Balatro-Seed-Searcher\web
npm install         # only first time
npm run build       # outputs to .\dist\
```

Sanity-check the output exists:

```powershell
dir .\dist\engine-threads\balatro_seed_engine_bg.wasm
```

If that file is missing, threading will fall back to N-worker inside
the APK. Rebuild the engine with `wasm-pack` (see Balatro-Seed-Searcher
root README, section "Threaded build").

---

## 2. Sync the bundle into the APK assets folder

```powershell
cd C:\Users\Julie\Balatropedia\apk
powershell -ExecutionPolicy Bypass -File .\scripts\sync-web.ps1
```

This wipes `android\app\src\main\assets\` and copies the contents of
`Balatro-Seed-Searcher\web\dist\` into it. The script also warns if
the threaded wasm is missing.

---

## 3. Open the project in Android Studio

`File > Open` → `C:\Users\Julie\Balatropedia\apk\android`

First sync will download:
- Gradle 8.7 (one-time, ~120 MB)
- AGP 8.5.2
- `androidx.webkit:webkit:1.11.0`

If Studio offers to "Update Android Gradle Plugin", **say no** the
first time — let the pinned version sync cleanly, then upgrade
deliberately if you want to.

If Studio cannot find `gradle-wrapper.jar`, run once in the project
root:

```powershell
gradle wrapper --gradle-version 8.7
```

(Or just paste a wrapper jar from any other Android project — it's
the same file across all projects on the same Gradle version.)

---

## 4. Build a debug APK

In Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

Or from the command line:

```powershell
cd C:\Users\Julie\Balatropedia\apk\android
.\gradlew.bat assembleDebug
```

Output: `app\build\outputs\apk\debug\app-debug.apk` (~5–15 MB,
depending on how many sprites the standalone bundles).

---

## 5. Sideload to the phone

Connect via USB. Approve the RSA fingerprint prompt on the phone.

```powershell
adb devices       # should list your phone
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

Launch "Seed Searcher (debug)" from the app drawer.

---

## 6. Verify threading actually engaged

Keep the phone on USB, in a separate terminal:

```powershell
adb logcat -s BalatroSeed
```

Now tap the app icon, then hit Run on any seed search. You should see:

```
I/BalatroSeed: crossOriginIsolated=true
I/BalatroSeed: SharedArrayBuffer=true
I/BalatroSeed: hardwareConcurrency=8       <- your phone's cores
I/BalatroSeed: engineMode=threaded
```

If you see `engineMode=nworker-fallback`, threading did NOT engage.
Most likely causes:
- The synced `engine-threads/` folder is missing → re-run sync.
- `MainActivity.java` headers got out of sync with the wasm file paths
  → check the `prefix` in `IsolatedWebViewClient.shouldInterceptRequest`.
- The phone's WebView is too old (pre-Chrome 89). Update Chrome /
  Android System WebView from Play Store.

---

## 7. Measure on-device throughput

Inside the app, run the same fixed filter three times and write down
the wall-time displayed in the UI. We want three numbers:

- threaded mode (engineMode=threaded)
- N-worker fallback — temporarily disable threading by editing
  `apk\android\app\src\main\java\com\julie\balatroseedsearcher\MainActivity.java`,
  removing the two `Cross-Origin-*-Policy` headers, and rebuilding.
  This forces `crossOriginIsolated=false` and the orchestrator falls
  back to N workers.
- Cold-start: kill the app from the recents tray, relaunch, hit Run.
  The first search after a fresh launch should be ~200–400 ms faster
  than subsequent ones thanks to the prewarm `useEffect`.

Tell me the three numbers and I'll fold them into the v4.0 CHANGELOG
as the first on-device measurement.

---

## 8. Release build (later — for Play Store)

Don't bother until on-device numbers are good. When you do:

1. Generate a keystore:
   ```powershell
   keytool -genkey -v -keystore C:\Users\Julie\.android\seedsearcher.jks `
     -alias seedsearcher -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add `signingConfigs.release` to `app/build.gradle`, point it at
   the keystore via `key.properties` (which is gitignored — see
   `apk/.gitignore`).
3. Flip `buildTypes.release.signingConfig` to `signingConfigs.release`.
4. `.\gradlew.bat bundleRelease` → produces an `.aab` for the Play
   Console.

---

## Files at a glance

| File | What it does |
|---|---|
| `android/app/src/main/java/.../MainActivity.java` | Hosts the WebView, intercepts every asset request, adds COOP/COEP/CORP headers |
| `android/app/src/main/java/.../DebugLogger.java` | JS-to-logcat bridge for diagnostics |
| `android/app/src/main/AndroidManifest.xml` | Single-activity launcher app, no permissions |
| `android/app/build.gradle` | AGP 8.5.2, SDK 34, `noCompress .wasm .js .json` |
| `scripts/sync-web.ps1` | Copies standalone build into `assets/` |
