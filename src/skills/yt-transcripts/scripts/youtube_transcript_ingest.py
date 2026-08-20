#!/usr/bin/env python3
"""Download and clean a YouTube caption transcript."""

from __future__ import annotations

import argparse
import bisect
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class Cue:
    start: float
    text: str


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download YouTube captions with yt-dlp and produce a cleaned markdown transcript."
    )
    parser.add_argument("url", help="YouTube URL")
    output = parser.add_mutually_exclusive_group(required=True)
    output.add_argument("--wiki-dir", help="Wiki directory containing raw/ and raw/assets/")
    output.add_argument("--output-dir", help="Generic directory for the raw VTT and cleaned markdown transcript")
    output.add_argument("--stdout", action="store_true", help="Print cleaned markdown transcript; do not persist files")
    parser.add_argument("--lang", default="en", help="Caption language passed to yt-dlp --sub-langs (default: en)")
    parser.add_argument("--created", default=date.today().isoformat(), help="Created date for frontmatter")
    parser.add_argument("--output-title", help="Markdown filename stem. Defaults to shortened video title")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing output files")
    args = parser.parse_args()

    require_executable("yt-dlp")

    with tempfile.TemporaryDirectory(prefix="youtube-transcript-") as tmp_name:
        tmp = Path(tmp_name)
        info = fetch_info(args.url, tmp)
        download_captions(args.url, args.lang, tmp)
        caption = select_caption_file(tmp, info.get("id"), args.lang)

        video_id = str(info.get("id") or caption.stem.split(".")[0])
        title = str(info.get("title") or video_id)
        stem = safe_filename(args.output_title or title)
        raw_caption_name = f"{video_id}.{caption_language(caption)}.vtt"
        vtt = caption.read_text(encoding="utf-8", errors="replace")
        cleaned = render_clean_transcript(vtt, info.get("chapters") or [])

        if args.stdout:
            print(build_markdown(info, args.created, "", cleaned), end="")
            return 0

        if args.wiki_dir:
            wiki_dir = Path(args.wiki_dir).expanduser().resolve()
            raw_dir = wiki_dir / "raw"
            assets_dir = raw_dir / "assets"
            if not raw_dir.is_dir():
                fail(f"missing raw directory: {raw_dir}")
            assets_dir.mkdir(parents=True, exist_ok=True)
            raw_caption_path = assets_dir / raw_caption_name
            transcript_path = raw_dir / f"{stem}.md"
            raw_caption_ref = str(raw_caption_path.relative_to(wiki_dir))
        else:
            output_dir = Path(args.output_dir).expanduser().resolve()
            output_dir.mkdir(parents=True, exist_ok=True)
            raw_caption_path = output_dir / raw_caption_name
            transcript_path = output_dir / f"{stem}.md"
            raw_caption_ref = raw_caption_name

        ensure_writable(raw_caption_path, args.overwrite)
        ensure_writable(transcript_path, args.overwrite)
        shutil.copyfile(caption, raw_caption_path)
        transcript_path.write_text(
            build_markdown(info, args.created, raw_caption_ref, cleaned),
            encoding="utf-8",
        )

    print(json.dumps({"transcript": str(transcript_path), "raw_caption": str(raw_caption_path)}, indent=2))
    return 0


def fetch_info(url: str, tmp: Path) -> dict:
    out = tmp / "info.json"
    run(["yt-dlp", "--skip-download", "--dump-json", url], stdout=out)
    return json.loads(out.read_text(encoding="utf-8"))


def download_captions(url: str, lang: str, tmp: Path) -> None:
    run(
        [
            "yt-dlp",
            "--skip-download",
            "--write-auto-subs",
            "--write-subs",
            "--sub-langs",
            lang,
            "--sub-format",
            "vtt",
            "-o",
            str(tmp / "%(id)s.%(ext)s"),
            url,
        ]
    )


def select_caption_file(tmp: Path, video_id: str | None, lang: str) -> Path:
    candidates = sorted(tmp.glob("*.vtt"))
    if not candidates:
        fail("yt-dlp did not download any .vtt captions")
    prefixes = [p for p in [f"{video_id}.{lang}.vtt" if video_id else None, f"{video_id}.en.vtt" if video_id else None] if p]
    for name in prefixes:
        path = tmp / name
        if path.exists():
            return path
    return candidates[0]


def render_clean_transcript(vtt: str, chapters: list[dict]) -> str:
    cues = parse_vtt(vtt)
    if not chapters:
        chapters = [{"start_time": 0, "title": ""}]
    starts = [float(c.get("start_time") or 0) for c in chapters]
    sections: list[list[str]] = [[] for _ in chapters]
    emitted: list[str] = []

    for cue in cues:
        words = split_words(cue.text)
        if not words:
            continue
        overlap = suffix_prefix_overlap(emitted, words, limit=50)
        new_words = words[overlap:]
        if not new_words:
            continue
        emitted.extend(new_words)
        section_index = max(0, bisect.bisect_right(starts, cue.start) - 1)
        sections[section_index].extend(new_words)

    rendered: list[str] = []
    for chapter, words in zip(chapters, sections):
        title = str(chapter.get("title") or "").strip()
        if title == "<Untitled Chapter 1>":
            title = ""
        heading = f"## {format_time(float(chapter.get('start_time') or 0))}"
        if title:
            heading += f" {title}"
        text = paragraphize(" ".join(words))
        rendered.append(f"{heading}\n\n{text}".rstrip())
    return "\n\n".join(rendered).strip() + "\n"


def parse_vtt(vtt: str) -> list[Cue]:
    cues: list[Cue] = []
    current_start: float | None = None
    current_text: list[str] = []

    def flush_current() -> None:
        if current_start is None:
            return
        for line in current_text:
            cleaned = clean_caption_line(line)
            if cleaned:
                cues.append(Cue(current_start, cleaned))

    for raw_line in vtt.splitlines():
        line = raw_line.strip()
        timestamp = caption_timestamp(line)
        if timestamp is not None:
            flush_current()
            current_start = timestamp
            current_text = []
            continue
        if current_start is None:
            continue
        current_text.append(line)

    flush_current()
    return cues


def caption_timestamp(line: str) -> float | None:
    match = re.match(r"(?:(\d+):)?(\d\d):(\d\d\.\d+)\s+-->", line)
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2))
    seconds = float(match.group(3))
    return hours * 3600 + minutes * 60 + seconds


def clean_caption_line(line: str) -> str:
    line = re.sub(r"<\d\d:\d\d:\d\d\.\d+>", "", line)
    line = re.sub(r"</?c[^>]*>", "", line)
    line = re.sub(r"<[^>]+>", "", line)
    return html.unescape(line).strip()


def suffix_prefix_overlap(existing: list[str], new: list[str], limit: int) -> int:
    max_check = min(len(existing), len(new), limit)
    normalized_existing = [normalize_word(word) for word in existing]
    normalized_new = [normalize_word(word) for word in new]
    overlap = 0
    for size in range(1, max_check + 1):
        if normalized_existing[-size:] == normalized_new[:size]:
            overlap = size
    return overlap


def paragraphize(text: str, width: int = 1000) -> str:
    paragraphs: list[str] = []
    text = text.strip()
    while len(text) > width:
        cut = text.rfind(". ", 0, width)
        if cut < width // 2:
            cut = text.rfind(" ", 0, width)
        if cut <= 0:
            cut = width
        paragraphs.append(text[: cut + 1].strip())
        text = text[cut + 1 :].strip()
    if text:
        paragraphs.append(text)
    return "\n\n".join(paragraphs)


def build_markdown(info: dict, created: str, raw_caption_ref: str | Path, cleaned: str) -> str:
    channel = str(info.get("channel") or info.get("uploader") or "")
    raw_caption_ref = str(raw_caption_ref)
    lang = caption_language(raw_caption_ref)
    raw_caption_line = f"  raw_caption_file: {yaml_quote(raw_caption_ref)}\n" if raw_caption_ref else ""
    return f"""---
title: {yaml_quote(str(info.get('title') or ''))}
source: {yaml_quote(str(info.get('webpage_url') or info.get('original_url') or ''))}
author:
  - "[[{channel}]]"
published: {format_upload_date(info.get('upload_date'))}
created: {created}
description: {yaml_quote(description(info))}
tags:
  - "clippings"
  - "youtube"
  - "transcript"
media:
  type: "youtube"
  video_id: {yaml_quote(str(info.get('id') or ''))}
  channel: {yaml_quote(channel)}
  duration: {yaml_quote(str(info.get('duration_string') or ''))}
  transcript_source: "youtube captions"
  transcript_language: {yaml_quote(lang)}
  transcript_kind: {yaml_quote(transcript_kind(info, lang))}
  fetched_with: "yt-dlp"
{raw_caption_line}---
# Transcript

{cleaned}"""


def transcript_kind(info: dict, lang: str) -> str:
    if lang in (info.get("subtitles") or {}):
        return "manual"
    if lang in (info.get("automatic_captions") or {}):
        return "auto"
    return "unknown"


def caption_language(path: Path | str) -> str:
    name = Path(path).name
    parts = name.split(".")
    if len(parts) >= 3 and parts[-1] == "vtt":
        return parts[-2]
    return ""


def description(info: dict) -> str:
    first = str(info.get("description") or "").strip().split("\n\n")[0].replace("\n", " ")
    return first[:297].rstrip() + "..." if len(first) > 300 else first


def format_upload_date(value: object) -> str:
    raw = str(value or "")
    if re.fullmatch(r"\d{8}", raw):
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:8]}"
    return ""


def format_time(seconds: float) -> str:
    total = int(seconds)
    if total >= 3600:
        return f"{total // 3600}:{total % 3600 // 60:02d}:{total % 60:02d}"
    return f"{total // 60:02d}:{total % 60:02d}"


def timestamp_to_seconds(timestamp: str) -> float:
    hours, minutes, seconds = timestamp.split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def split_words(text: str) -> list[str]:
    return re.findall(r"\S+", text)


def normalize_word(word: str) -> str:
    return word.lower().strip(".,?!:;\"“”()[]")


def safe_filename(name: str) -> str:
    name = re.sub(r"[\x00/\\\r\n\t]+", "-", name)
    name = re.sub(r"\s+", " ", name).strip().strip(".")
    return name[:180] or "youtube-transcript"


def yaml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def ensure_writable(path: Path, overwrite: bool) -> None:
    if path.exists() and not overwrite:
        fail(f"output exists; pass --overwrite: {path}")


def require_executable(name: str) -> None:
    if shutil.which(name) is None:
        fail(f"missing required executable: {name}")


def run(command: list[str], stdout: Path | None = None) -> None:
    if stdout:
        with stdout.open("w", encoding="utf-8") as out:
            result = subprocess.run(command, stdout=out, stderr=subprocess.PIPE, text=True)
    else:
        result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        fail(f"command failed: {' '.join(command)}")


def fail(message: str) -> None:
    raise SystemExit(message)


if __name__ == "__main__":
    raise SystemExit(main())
