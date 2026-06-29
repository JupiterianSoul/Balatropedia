# Sync the standalone Seed Searcher build into the APK assets folder.
#
# Usage (from C:\Users\Julie\Balatropedia\apk\):
#   powershell -ExecutionPolicy Bypass -File .\scripts\sync-web.ps1
#
# Prereqs:
#   - C:\Users\Julie\Balatro-Seed-Searcher checked out
#   - cd ..\Balatro-Seed-Searcher\web ; npm run build  (done first)

$ErrorActionPreference = "Stop"

$Here   = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ApkDir = Resolve-Path (Join-Path $Here "..")
$SsDist = Resolve-Path (Join-Path $ApkDir "..\..\Balatro-Seed-Searcher\web\dist") -ErrorAction SilentlyContinue
$Assets = Join-Path $ApkDir "android\app\src\main\assets"

if (-not $SsDist) {
    Write-Host "Standalone dist not found. Run:"
    Write-Host "  cd ..\..\Balatro-Seed-Searcher\web; npm run build"
    exit 1
}

Write-Host "Syncing $SsDist -> $Assets"
if (Test-Path $Assets) { Remove-Item -Recurse -Force $Assets }
New-Item -ItemType Directory -Force -Path $Assets | Out-Null
Copy-Item -Recurse -Force (Join-Path $SsDist "*") $Assets

$threadedWasm = Join-Path $Assets "engine-threads\balatro_seed_engine_bg.wasm"
if (-not (Test-Path $threadedWasm)) {
    Write-Warning "engine-threads\balatro_seed_engine_bg.wasm missing."
    Write-Warning "The APK will run, but threading mode will not engage."
}

$count = (Get-ChildItem -Recurse -File $Assets).Count
Write-Host "Done. $count files staged."
