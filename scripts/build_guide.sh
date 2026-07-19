#!/bin/bash
# P-001「PixelYen 完全ガイド」 PDF ビルドスクリプト
# 前提: pandoc がインストール済み(ubuntu-latestで利用可能)
# 実行: bash scripts/build_guide.sh
# 出力: dist/p-001/pixelyen-complete-guide.pdf

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/products/p-001"
OUT="$REPO/dist/p-001"
PDF_NAME="pixelyen-complete-guide.pdf"

mkdir -p "$OUT"

# 章の結合順序(00_structure は目次確認用のみ・本文外)
CHAPTERS=(
  "$SRC/chapter-00.md"
  "$SRC/chapter-01.md"
  "$SRC/chapter-02.md"
  "$SRC/chapter-03.md"
  "$SRC/chapter-04.md"
  "$SRC/chapter-05.md"
  "$SRC/appendix.md"
)

# pandocでPDF生成 (日本語対応: --pdf-engine=lualatex 推奨。なければweasyprint)
if command -v pandoc &>/dev/null; then
  echo "[build_guide] pandoc でPDFを生成中..."
  pandoc "${CHAPTERS[@]}" \
    -o "$OUT/$PDF_NAME" \
    --pdf-engine=lualatex \
    -V documentclass=ltjsarticle \
    -V geometry:margin=2cm \
    -V fontsize=11pt \
    --toc \
    --toc-depth=2 \
    2>/dev/null || {
      # lualatexが使えない場合はHTMLにフォールバック
      echo "[build_guide] lualatex 未対応。HTML形式にフォールバック..."
      pandoc "${CHAPTERS[@]}" \
        -o "$OUT/pixelyen-complete-guide.html" \
        --standalone \
        --toc \
        --metadata title="PixelYen 完全ガイド"
      echo "[build_guide] HTML出力: $OUT/pixelyen-complete-guide.html"
      exit 0
    }
  echo "[build_guide] PDF出力: $OUT/$PDF_NAME"
else
  echo "[build_guide] pandoc が見つかりません。インストールしてください: sudo apt-get install pandoc texlive-xetex"
  exit 1
fi

# itch.io向け README.txt を生成
cat > "$OUT/README.txt" <<'EOF'
PixelYen 完全ガイド — ダウンロードありがとうございます

・pixelyen-complete-guide.pdf をお読みください
・ご不明な点はサポートメール(掲載先に記載)へお気軽にどうぞ
・アップデートは追加費用なし。過去購入者に配布します(付録B参照)

本書はAIが運営する事業PixelYenが制作しています。
EOF

echo "[build_guide] 完了: $OUT/"
ls -lh "$OUT/"
