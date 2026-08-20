#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  clip-page.sh --url URL [--out-dir DIR]
  clip-page.sh --current-tab [--out-dir DIR]

Renders a page with browser-harness, saves rendered HTML, and runs Defuddle.
Prints JSON containing output file paths.
EOF
}

mode=""
url=""
out_dir=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      mode="url"
      url="${2:-}"
      shift 2
      ;;
    --current-tab)
      mode="current-tab"
      shift
      ;;
    --out-dir)
      out_dir="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$mode" ]]; then
  echo "Expected --url or --current-tab" >&2
  usage
  exit 2
fi

if [[ "$mode" == "url" && -z "$url" ]]; then
  echo "--url requires a URL" >&2
  exit 2
fi

if [[ -z "$out_dir" ]]; then
  out_dir="${TMPDIR:-/tmp}/wiki-clip-$(date +%Y%m%d-%H%M%S)-$$"
fi

mkdir -p "$out_dir"

if [[ "$mode" == "url" ]]; then
  OUT_DIR="$out_dir" URL="$url" browser-harness <<'PY'
import json
import os
from pathlib import Path

out = Path(os.environ["OUT_DIR"])
new_tab(os.environ["URL"])
wait_for_load()
html = js("document.documentElement.outerHTML")
meta = {
    "url": js("location.href"),
    "title": js("document.title"),
    "description": js("document.querySelector('meta[name=description]')?.content || document.querySelector('meta[property=\"og:description\"]')?.content || ''"),
}
(out / "page.html").write_text(html, encoding="utf-8")
(out / "browser.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
PY
else
  OUT_DIR="$out_dir" browser-harness <<'PY'
import json
import os
from pathlib import Path

out = Path(os.environ["OUT_DIR"])
ensure_real_tab()
wait_for_load()
html = js("document.documentElement.outerHTML")
meta = {
    "url": js("location.href"),
    "title": js("document.title"),
    "description": js("document.querySelector('meta[name=description]')?.content || document.querySelector('meta[property=\"og:description\"]')?.content || ''"),
}
(out / "page.html").write_text(html, encoding="utf-8")
(out / "browser.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
PY
fi

npx -y defuddle parse "$out_dir/page.html" --markdown --json > "$out_dir/defuddle.json"

python3 - "$out_dir" <<'PY'
import json
import sys
from pathlib import Path

out = Path(sys.argv[1]).resolve()
print(json.dumps({
    "out_dir": str(out),
    "browser_json": str(out / "browser.json"),
    "html": str(out / "page.html"),
    "defuddle_json": str(out / "defuddle.json"),
}, indent=2))
PY
