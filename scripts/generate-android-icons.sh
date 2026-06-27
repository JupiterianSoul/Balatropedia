#!/usr/bin/env bash
# Generates Android launcher icons, adaptive icon foreground, and splash images
# from client/public/favicon.png.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/client/public/favicon.png"
RES="$ROOT/android/app/src/main/res"
BG_COLOR="#1c262a"

if [ ! -f "$SRC" ]; then
  echo "Missing source: $SRC" >&2
  exit 1
fi

# Square launcher icons (legacy + round) for each density bucket.
declare -A DENSITIES=(
  [mdpi]=48
  [hdpi]=72
  [xhdpi]=96
  [xxhdpi]=144
  [xxxhdpi]=192
)

for d in "${!DENSITIES[@]}"; do
  size=${DENSITIES[$d]}
  dir="$RES/mipmap-$d"
  mkdir -p "$dir"
  magick "$SRC" -resize "${size}x${size}" "$dir/ic_launcher.png"
  # Round icon — apply a circular mask so launchers that prefer round icons render cleanly.
  magick "$SRC" -resize "${size}x${size}" \
    \( +clone -threshold 101% -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
    -alpha off -compose CopyOpacity -composite \
    "$dir/ic_launcher_round.png"
  # Adaptive icon foreground: inset the joker so it sits in the safe zone (~66% of canvas).
  fg_canvas=$((size * 108 / 48))
  inset=$((fg_canvas * 66 / 100))
  magick -size "${fg_canvas}x${fg_canvas}" xc:none \
    \( "$SRC" -resize "${inset}x${inset}" \) -gravity center -composite \
    "$dir/ic_launcher_foreground.png"
done

# Adaptive icon background (solid Balatro dark) + XML wrappers.
mkdir -p "$RES/values" "$RES/mipmap-anydpi-v26" "$RES/drawable"
cat > "$RES/values/ic_launcher_background.xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$BG_COLOR</color>
</resources>
XML

cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
XML
cp "$RES/mipmap-anydpi-v26/ic_launcher.xml" "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"

# Splash drawable — solid background with the joker centered.
SPLASH_SIZE=1200
magick -size "${SPLASH_SIZE}x${SPLASH_SIZE}" "xc:$BG_COLOR" \
  \( "$SRC" -resize "480x480" \) -gravity center -composite \
  "$RES/drawable/splash.png"

# Color resources used by Capacitor's StatusBar / SplashScreen plugins.
cat > "$RES/values/colors.xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">$BG_COLOR</color>
    <color name="colorPrimaryDark">$BG_COLOR</color>
    <color name="colorAccent">#f44b3c</color>
    <color name="ic_launcher_background">$BG_COLOR</color>
</resources>
XML

echo "Generated launcher icons + splash."
