# Balatropedia — Play Store build guide

This repo now ships **two versions** from one codebase:

- **Web version** — Express + Postgres, accounts, cloud-synced favorites and runs. Build with `npm run build`, deploy with `render.yaml`. Unchanged.
- **Android app** — fully local, no server, no network. Built with `npm run build:app` and wrapped in Capacitor.

## How the two modes diverge

A single env var, `VITE_APP_MODE`, switches between them at build time:

| Concern | Web (`VITE_APP_MODE` unset) | App (`VITE_APP_MODE=local`) |
|---|---|---|
| `apiRequest("/api/*")` | `fetch()` against Express | `client/src/lib/localAdapter.ts` mimics the same routes against Capacitor Preferences |
| Sprites | Proxied through `/api/sprite` from `static.wikia.nocookie.net` | Served from `./sprites/*.png` bundled inside the APK |
| Auth | Real email/password via bcrypt + token | Auto-signed-in as a synthetic local user; signup/login responses are mocked |
| Favorites / Runs | Postgres via Drizzle | JSON arrays in Capacitor Preferences (or `localStorage` fallback) |
| Language | `PATCH /api/auth/language` to DB | Stored under `balatropedia.local.language` |

Nothing else in `client/src/` had to change — the entire feature surface goes through `apiRequest`/`getQueryFn`, which is the single switchpoint.

## Local development of the app build

```bash
# 1. Web dev (unchanged)
npm run dev

# 2. Local-mode dev in a browser (to test the offline build before wrapping)
VITE_APP_MODE=local npm run dev

# 3. Build the offline client + sync into Android
npm run cap:sync

# 4. Open Android Studio
npm run cap:open
```

## First-time Android setup on your machine

1. Install **Android Studio** (latest stable) — this gives you the SDK + emulator.
2. Install **JDK 17** (bundled with Android Studio).
3. Set `ANDROID_HOME` to your SDK path (Android Studio shows it under Settings → Languages & Frameworks → Android SDK).

That's it — Capacitor handles the rest.

## Building a release AAB for Play Store

```bash
# 1. Generate a release keystore (DO THIS ONCE, keep it forever, never commit).
keytool -genkey -v -keystore balatropedia-release.keystore \
  -alias balatropedia -keyalg RSA -keysize 2048 -validity 10000

# 2. Add signing config to android/app/build.gradle inside `android { ... }`:
#    (Replace MY_PWD with your keystore password.)
#
#    signingConfigs {
#        release {
#            storeFile file("../../balatropedia-release.keystore")
#            storePassword "MY_PWD"
#            keyAlias "balatropedia"
#            keyPassword "MY_PWD"
#        }
#    }
#    buildTypes {
#        release {
#            signingConfig signingConfigs.release
#            minifyEnabled false
#            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
#        }
#    }

# 3. Bump version in android/app/build.gradle whenever you release:
#    versionCode 2   // integer, must always go up
#    versionName "1.0.1"

# 4. Sync the latest web build into Android.
npm run cap:sync

# 5. Build the AAB. Output: android/app/build/outputs/bundle/release/app-release.aab
cd android
./gradlew bundleRelease
```

Upload `app-release.aab` to **Google Play Console → Production → Create new release**.

## Play Store listing — what you'll still need

- Google Play Developer account ($25 one-time).
- 512×512 PNG icon for the store listing.
- A short description (max 80 chars) and full description.
- At least 2 phone screenshots (1080×1920 or similar).
- A privacy policy URL — required even for local-only apps. A short page saying "Balatropedia stores favorites and runs on your device and does not send personal data to any server." is enough.

## Optional cloud sync (later)

The local adapter is the floor; cloud sync would be added as an opt-in toggle in Settings that:
1. Signs in against the existing Render backend via `/api/auth/login`.
2. On success, hydrates the local Preferences from `/api/favorites` and `/api/runs`.
3. On future writes, fans out to both local Preferences and the API.

This stays out of scope for v1.0 — ship the local-only build first.
