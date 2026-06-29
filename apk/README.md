# Balatro Seed Searcher — Android APK (hidden)

> **This directory is intentionally hidden from the running Balatropedia
> site.** It is only present in the repo so the APK build can be done
> locally on a Windows machine when needed. It does **not** ship with
> the live site, is not referenced by `client/`, `server/`, or any
> `npm` script the deployed site runs.

## What it wraps

This APK wraps the **standalone Seed Searcher** build
(`Balatro-Seed-Searcher/web/dist`), not the Balatropedia client.
That's intentional:

- Balatropedia's Express server sends `crossOriginEmbedderPolicy: false`
  on purpose so cross-origin embeds keep working. That disables
  threaded WASM mode.
- The standalone build has no such constraint, and inside the APK we
  inject COOP/COEP headers directly in the `WebViewClient`, so
  `crossOriginIsolated === true` and rayon threading activates.

## How threaded mode actually turns on inside the APK

The WebView needs `crossOriginIsolated` to be true to expose
`SharedArrayBuffer`. That requires every response from the WebView
asset loader to carry:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

`MainActivity.java` does this in `WebViewClient.shouldInterceptRequest`
for every `index.html`, `.js`, `.wasm`, `.css`, `.json` response. See
the comment block in that file.

## Layout

```
apk/
├── README.md              # this file
├── www/                   # synced standalone build (gitignored)
├── android/               # gradle project
│   ├── app/build.gradle
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/julie/balatroseedsearcher/
│   │   │   ├── MainActivity.java        # COOP/COEP header injection
│   │   │   └── DebugLogger.java         # crossOriginIsolated logger
│   │   ├── assets/                      # populated by sync script
│   │   └── res/                         # icons, strings, layout
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle/wrapper/                  # gradle wrapper config
├── scripts/
│   └── sync-web.sh                      # copies standalone dist into android assets
└── BUILD_APK.md           # step-by-step Windows build runbook
```

## Build status

**Has never been built.** All Android tooling (SDK, Gradle, signing
keystore) must be set up on Julie's Windows machine. See
`BUILD_APK.md` for the exact commands.
