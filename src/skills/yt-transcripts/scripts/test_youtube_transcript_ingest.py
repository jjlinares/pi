#!/usr/bin/env python3

import unittest
from pathlib import Path

import youtube_transcript_ingest as ingest


SAMPLE_VTT = """WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:01.000 align:start position:0%
Hello<00:00:00.200><c> world</c>

00:00:01.000 --> 00:00:02.000 align:start position:0%
Hello world from<c> YouTube</c>

00:00:02.000 --> 00:00:03.000 align:start position:0%
world from YouTube captions

00:00:03.000 --> 00:00:04.000 align:start position:0%
&gt;&gt; Next chapter starts
"""


class YoutubeTranscriptIngestTests(unittest.TestCase):
    def test_parse_vtt_strips_youtube_markup(self):
        cues = ingest.parse_vtt(SAMPLE_VTT)
        self.assertEqual(cues[0].text, "Hello world")
        self.assertEqual(cues[1].text, "Hello world from YouTube")
        self.assertEqual(cues[3].text, ">> Next chapter starts")

    def test_render_clean_transcript_dedupes_overlap_and_splits_chapters(self):
        chapters = [
            {"start_time": 0, "title": "Intro"},
            {"start_time": 3, "title": "Second"},
        ]
        rendered = ingest.render_clean_transcript(SAMPLE_VTT, chapters)
        self.assertIn("## 00:00 Intro", rendered)
        self.assertIn("Hello world from YouTube captions", rendered)
        self.assertIn("## 00:03 Second", rendered)
        self.assertIn(">> Next chapter starts", rendered)
        self.assertEqual(rendered.count("Hello world"), 1)

    def test_parse_vtt_keeps_manual_multiline_cues(self):
        vtt = """WEBVTT

00:00:01.000 --> 00:00:03.000
This is line one.
This is line two.
"""
        rendered = ingest.render_clean_transcript(vtt, [])
        self.assertIn("This is line one. This is line two.", rendered)

    def test_parse_vtt_keeps_text_after_blank_line_inside_cue(self):
        vtt = """WEBVTT

00:00:01.000 --> 00:00:03.000

Text after blank line.

00:00:03.000 --> 00:00:04.000
Next text.
"""
        rendered = ingest.render_clean_transcript(vtt, [])
        self.assertIn("Text after blank line. Next text.", rendered)

    def test_render_clean_transcript_keeps_non_adjacent_repeated_phrases(self):
        vtt = """WEBVTT

00:00:01.000 --> 00:00:02.000
repeat this phrase

00:00:02.000 --> 00:00:03.000
with other words between

00:00:03.000 --> 00:00:04.000
repeat this phrase
"""
        rendered = ingest.render_clean_transcript(vtt, [])
        self.assertEqual(rendered.count("repeat this phrase"), 2)

    def test_build_markdown_records_raw_caption_file(self):
        md = ingest.build_markdown(
            {
                "id": "abc123",
                "title": "Example",
                "webpage_url": "https://www.youtube.com/watch?v=abc123",
                "channel": "Channel",
                "upload_date": "20260611",
                "duration_string": "01:02",
                "description": "First paragraph.\n\nSecond paragraph.",
                "automatic_captions": {"en": []},
            },
            "2026-06-25",
            Path("raw/assets/abc123.en.vtt"),
            "## 00:00\n\nText\n",
        )
        self.assertIn('raw_caption_file: "raw/assets/abc123.en.vtt"', md)
        self.assertIn('transcript_kind: "auto"', md)
        self.assertIn("published: 2026-06-11", md)


if __name__ == "__main__":
    unittest.main()
