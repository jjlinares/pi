# Transcript Cleaning Correctness

## Goal

Produce a faithful, readable transcript from YouTube captions while preserving the raw caption file. Cleaning must be deterministic and conservative: remove caption markup and duplicate rolling-caption overlap, but do not remove semantic text.

The raw `.vtt` is the source of truth. The cleaned `.md` is a normalized reading copy.

## Non-goals

- Do not summarize.
- Do not editorially rewrite.
- Do not remove filler, stutters, speaker markers, or bracketed sounds by default.
- Do not use an LLM for transcript cleaning.

## Correctness criteria

- Raw `.vtt` is saved unchanged.
- Cleaned `.md` contains no VTT syntax or YouTube caption markup.
- Manual multiline cue text is preserved.
- YouTube rolling-caption repeats are deduped only by adjacent word suffix/prefix overlap.
- Non-adjacent repeated phrases are preserved.
- Bracketed markers like `[music]`, `[laughter]`, `[inaudible]` are preserved.
- Speaker markers like `>>` are preserved.
- Output is deterministic for the same raw VTT and metadata.

## Verification when asked

Run the unit tests:

```bash
cd "$HOME/.pi/agent/skills/yt-transcripts/scripts"
python -m unittest test_youtube_transcript_ingest.py
python -m py_compile youtube_transcript_ingest.py
```

Check the cleaned markdown for leaked VTT markup:

```bash
rg 'WEBVTT|-->|<c|</c>|<\d\d:\d\d:\d\d|\d\d:\d\d:\d\d\.\d+|&[a-zA-Z]+;' /path/to/transcript.md || true
```

Expected: no matches, except legitimate transcript text if the speaker literally says similar strings.

Compare raw VTT cue coverage against cleaned output:

```bash
python - /path/to/raw.vtt /path/to/transcript.md <<'PY'
from pathlib import Path
import html, re, sys

vtt_path = Path(sys.argv[1])
md_path = Path(sys.argv[2])
vtt = vtt_path.read_text(encoding='utf-8', errors='replace')
md = md_path.read_text(encoding='utf-8', errors='replace')

TAG_TS = re.compile(r'<\d\d:\d\d:\d\d\.\d+>')
TAG_C = re.compile(r'</?c[^>]*>')
TAG_ANY = re.compile(r'<[^>]+>')

def clean(line):
    line = TAG_TS.sub('', line)
    line = TAG_C.sub('', line)
    line = TAG_ANY.sub('', line)
    return html.unescape(line).strip()

def words(text):
    return [w.lower().strip('.,?!:;"“”()[]') for w in re.findall(r'\S+', text)]

def grams(ws, n=5):
    return {tuple(ws[i:i+n]) for i in range(max(0, len(ws) - n + 1))}

lines = []
current = False
for raw in vtt.splitlines():
    line = raw.strip()
    if '-->' in line:
        current = True
        continue
    if current:
        text = clean(line)
        if text:
            lines.append(text)

md_grams = grams(words(md))
missing = []
for line in lines:
    ws = words(line)
    if len(ws) < 5:
        continue
    if not grams(ws) & md_grams:
        missing.append(line)

print(f'normalized raw text lines: {len(lines)}')
print(f'lines without any matching 5-gram in markdown: {len(missing)}')
for line in missing[:20]:
    print('-', line)
PY
```

A small number of missing lines can be okay when they are pure rolling-caption duplicates. Inspect examples before claiming a problem.

## Manual spot-check

Pick several raw VTT regions across the video:

- intro
- middle
- chapter boundary, if chapters exist
- outro
- any suspicious missing-line examples

Verify:

- meaningful words appear in cleaned markdown
- repeated rolling-caption fragments collapse correctly
- manual multiline text is not dropped
- bracketed and speaker markers are retained
- no timestamps or markup leaked

## Known tradeoffs

The cleaner dedupes adjacent overlap by normalized words. This intentionally preserves repeated phrases that occur later in the conversation, even if they look redundant. Better an occasional duplicate than dropped meaning.
