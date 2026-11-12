#!/usr/bin/env bash
# extract-video.sh: Extração de metadados, legendas e informações de capítulos com yt-dlp
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Uso: $0 <URL_DO_YOUTUBE> [DIRETORIO_SAIDA]"
  exit 1
fi

VIDEO_URL="$1"
OUT_DIR="${2:-.scratch/video-extract}"

mkdir -p "$OUT_DIR"

echo "==> 1. Extraindo metadados JSON do vídeo..."
yt-dlp --dump-json "$VIDEO_URL" > "$OUT_DIR/metadata.json"

VIDEO_ID=$(grep -o '"id": "[^"]*"' "$OUT_DIR/metadata.json" | head -n1 | cut -d'"' -f4)
echo "Vídeo ID detectado: $VIDEO_ID"

echo "==> 2. Baixando legendas disponíveis (manuais ou automáticas) em formato SRT/VTT..."
yt-dlp --write-subs --write-auto-subs --sub-lang "pt,en" --sub-format srt/vtt --skip-download -o "$OUT_DIR/subtitles.%(ext)s" "$VIDEO_URL" || {
  echo "Aviso: Nenhuma legenda encontrada para download automático."
}

echo "==> 3. Extração concluída em: $OUT_DIR"
