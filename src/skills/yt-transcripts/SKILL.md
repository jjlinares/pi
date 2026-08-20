---
name: yt-transcripts
description: This skill should be used when the user asks to "download a YouTube transcript", "transcribe a YouTube video", "get YouTube captions", "use yt-dlp to transcribe YouTube", "clean YouTube captions", or wants raw YouTube captions plus a cleaned transcript file.
---

# YouTube Transcripts

Download and clean YouTube caption transcripts with `yt-dlp`.

Scope: caption download plus cleaned transcript generation. Treat downstream analysis, formatting, or publishing as governed by the user's instructions.

## Output rules

Apply explicit output conventions only when the user names a knowledge wiki under `~/projects/knowledge/*`.

Otherwise, follow the user's requested destination and format. If the destination or save behavior is unclear, ask. If the user only needs transcript text for the current task, use `--stdout` or a `/tmp` directory.

## Wiki layout

When outputting to a knowledge wiki, preserve both layers:

- raw caption asset: `<wiki>/raw/assets/<video_id>.<lang>.vtt`
- cleaned transcript: `<wiki>/raw/<video title>.md`

The cleaned transcript is deterministic normalized text, not source-of-truth raw input. The `.vtt` asset is the raw caption source.

When using a wiki, update `<wiki>/index.md` with the cleaned transcript under `## Raw Sources`. The ingest script only creates the raw caption asset and cleaned transcript; it does not update the index. Leave `raw/assets/` as unindexed source assets.

## Commands

Use the bundled script for repeatability.

Wiki output:

```bash
python "$HOME/.pi/agent/skills/yt-transcripts/scripts/youtube_transcript_ingest.py" \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --wiki-dir /home/jj/projects/knowledge/investing
```

User-directed file output:

```bash
python "$HOME/.pi/agent/skills/yt-transcripts/scripts/youtube_transcript_ingest.py" \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --output-dir /path/requested/by/user
```

Temporary/no-save output:

```bash
python "$HOME/.pi/agent/skills/yt-transcripts/scripts/youtube_transcript_ingest.py" \
  'https://www.youtube.com/watch?v=VIDEO_ID' \
  --stdout > /tmp/youtube-transcript.md
```

Print directly to the conversation only when the transcript is short enough. For long videos, write to `/tmp` and read relevant sections.

Common options:

```bash
--lang en-US                 # request a specific caption language
--output-title 'Stable Name' # control cleaned transcript filename
--overwrite                  # replace existing output files
```

## Script behavior

The script:

- calls `yt-dlp --dump-json` for metadata
- calls `yt-dlp --write-auto-subs --write-subs --sub-format vtt` for captions
- saves the downloaded VTT unchanged when using `--wiki-dir` or `--output-dir`
- writes a cleaned markdown transcript when using `--wiki-dir` or `--output-dir`
- prints cleaned markdown only when using `--stdout`
- adds frontmatter with YouTube metadata and transcript provenance
- does not update wiki indexes; the agent must do that separately when using `--wiki-dir`

The cleaner is deterministic and heuristic:

- parse VTT cue blocks
- strip VTT timestamp tags and YouTube `<c>` markup
- HTML-unescape caption text
- keep every cleaned text line in each cue
- remove repeated overlap by word suffix/prefix matching
- split transcript by YouTube chapter timestamps when available
- paragraphize by fixed character width and sentence boundary

Do not claim the cleaned transcript is exact raw input. Use the `.vtt` for fidelity.

## Correctness verification

When the user asks whether transcript cleaning is correct, whether useful VTT text was dropped, or how to verify output quality, follow `CORRECTNESS.md` in this skill directory.

## Validation

Run tests after editing the script:

```bash
cd "$HOME/.pi/agent/skills/yt-transcripts/scripts"
python -m unittest test_youtube_transcript_ingest.py
```

Run `--help` to verify the CLI loads:

```bash
python "$HOME/.pi/agent/skills/yt-transcripts/scripts/youtube_transcript_ingest.py" --help
```
