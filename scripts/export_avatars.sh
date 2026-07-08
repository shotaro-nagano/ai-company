#!/usr/bin/env bash
# アバターSVG → Discord用 512×512 PNG(BRAND.md: 16倍・整数倍、にじみ禁止)
# CI(ubuntu)では librsvg2-bin(rsvg-convert)を使う。SVGは矩形ベースなので拡大は正確。
# 出力: assets/discord/<slug>.png
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

command -v rsvg-convert >/dev/null || { echo "rsvg-convert が必要です (apt install librsvg2-bin)"; exit 1; }
mkdir -p assets/discord

python3 - <<'PY' | while IFS=$'\t' read -r slug ja; do
import json
for slug, info in json.load(open("scripts/employees.json")).items():
    print(f"{slug}\t{info['name']}")
PY
  src="assets/avatars/${ja}.svg"
  if [ -f "$src" ]; then
    rsvg-convert -w 512 -h 512 "$src" -o "assets/discord/${slug}.png"
    echo "exported: ${slug}.png (${ja})"
  else
    echo "missing avatar: $src" >&2
  fi
done
