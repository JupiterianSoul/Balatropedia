#!/usr/bin/env python3
"""Replace em-dashes / en-dashes everywhere in the client codebase.

Rules:
  ' \u2014 '  -> '; '          (spaced em-dash : clause break)
  '\u2014'    -> ';'           (any remaining em-dash)
  ' \u2013 '  -> ' ; '          (spaced en-dash)
  '\u2013'    -> '-'           (en-dash between numbers / inside words)

Run from repo root. Touches client/src/**/*.{ts,tsx,json,css,md} and README.md.
"""
from __future__ import annotations
import pathlib

EM = "\u2014"
EN = "\u2013"

EXTS = {".ts", ".tsx", ".json", ".css", ".md"}

def transform(text: str) -> str:
    text = text.replace(f" {EM} ", "; ")
    text = text.replace(f"{EM} ", "; ")
    text = text.replace(f" {EM}", ";")
    text = text.replace(EM, ";")
    text = text.replace(f" {EN} ", " ; ")
    text = text.replace(EN, "-")
    return text

def main() -> None:
    root = pathlib.Path(__file__).resolve().parent
    targets: list[pathlib.Path] = []
    for p in (root / "client" / "src").rglob("*"):
        if p.is_file() and p.suffix in EXTS:
            targets.append(p)
    readme = root / "README.md"
    if readme.exists():
        targets.append(readme)

    changed = 0
    for path in targets:
        try:
            original = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if EM not in original and EN not in original:
            continue
        new = transform(original)
        if new != original:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print(f"updated: {path.relative_to(root)}")
    print(f"\nTotal files changed: {changed}")

if __name__ == "__main__":
    main()
