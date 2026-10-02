---
name: format-transcript
description: Convert transcripts into readable Markdown. Use when formatting transcript files, not transcribing audio or summarizing meetings.
---

# Format Transcript

Save a new `.md` file at the user's chosen location. Ask if no destination is given. Preserve the original file. Unless the user specifies otherwise, prefix the filename with the meeting date as `YYYYMMDD_`, for example `20260930_Meeting title.md`. Omit the prefix if the meeting date is unknown.

## Frontmatter and layout

```markdown
---
title: "Meeting title"
description: null
date: "2026-10-01"
participants:
  - Speaker One
  - Speaker Two
---

# Transcript

**Speaker One · 00:00:13**

Text of the speaker's turn.

**Speaker Two · 00:00:18**

Text of the next turn.
```

- `title`: use the meeting title from the source or user. A readable filename-derived title is acceptable when metadata is absent.
- `description`: use an existing meeting description if available; otherwise `null`. Do not generate a summary to fill it.
- `date`: meeting date as `YYYY-MM-DD`, or `null` if unknown. Do not substitute the download or file modification date. Companion exports may contain metadata missing from subtitles.
- `participants`: unique names from an explicit attendee list, otherwise identified transcript speakers. Do not infer silent attendees. Use `[]` if none are known.

Keep the body to `# Transcript` and speaker turns. Do not repeat the meeting title, add a source-file line, or explain the conversion inside the document.

## Assemble speaker turns

- Remove caption IDs, timing arrows, subtitle markup, and document formatting. Decode escaped text and normalize whitespace without changing the spoken wording.
- Merge adjacent caption fragments from the same identified speaker into a paragraph, joining wrapped lines with spaces. Start a new turn when the speaker changes; never combine turns across another speaker's interruption.
- Label each turn with the speaker and its first fragment's start time in `HH:MM:SS`. Preserve source order when speech overlaps. Omit timestamps when unavailable rather than inventing them.
- Preserve existing speaker labels. Use `Unknown speaker` when attribution is missing; do not assume all unattributed fragments belong to one person.
- Preserve repetitions, incomplete sentences, and transcription errors. Formatting is not summarization or correction. Remove repeated text only when it is demonstrably an overlapping caption artifact, not repeated speech.

Check that all spoken text remains in order and attributed correctly after merging, allowing only formatting changes and verified caption deduplication.
