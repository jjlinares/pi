---
name: wiki-clip
description: This skill should be used when the user asks to "clip this page", "clip current browser page", "ingest this URL", "save this article to the wiki", or wants Obsidian Web Clipper-style markdown metadata saved into a knowledge wiki.
version: 0.1.0
---

# Wiki Clip

Clip a web page into a knowledge wiki as markdown. Prefer `webfetch` first; fall back to the browser-harness method when needed.

Use this for URL/current-tab ingestion into `~/projects/knowledge/<wiki>/raw/`. 

## Assumptions

- Knowledge repo: `/home/jj/projects/knowledge`
- Wiki target: a top-level directory such as `software/`, `investing/`, `health/`
- Raw source path: `<wiki>/raw/<title>.md`
- Asset path: `<wiki>/raw/assets/`
- Do not index `raw/assets/` in `index.md`
- Use `browser-harness` for browser fallback/current-tab work.
- Let the agent write final metadata/frontmatter; tools/scripts only extract raw material

## Extraction

### Default: `webfetch`

For normal public URLs, first call `webfetch` with `format=markdown`.

Use the returned markdown as the initial body. Use `details.metadata` as metadata hints, but modify or omit fields at agent discretion. Bad metadata is worse than missing metadata.

Sanity-check:

- body is the actual article/content, not nav/login/chrome
- title is the content title, not only a site/account title
- description is useful, not a shortened URL or generic tagline
- author is plausible
- published date is plausible
- canonical/source URL points to the page, not homepage/image/fallback URL
- image is meaningful, not favicon/avatar/logo unless that is the content

### Fallback: browser-harness + Defuddle

Use the bundled script when:

- clipping the current browser tab
- page requires JS rendering, auth, expansion, scrolling, or browser state
- `webfetch` metadata or markdown is wrong and there is no simple agent-fixable path
- important assets/content are missing from `webfetch`
- X/Twitter/thread-like pages need rendered DOM content

```bash
/path/to/wiki-clip/scripts/clip-page.sh --url 'https://example.com/article'
/path/to/wiki-clip/scripts/clip-page.sh --current-tab
/path/to/wiki-clip/scripts/clip-page.sh --url 'https://example.com/article' --out-dir /tmp/my-clip
```

The script prints paths:

- `browser_json`: URL, title, description from the rendered browser page
- `html`: rendered HTML captured from Chrome
- `defuddle_json`: Defuddle JSON with extracted content and metadata

Read `browser_json` and `defuddle_json`. Use Defuddle/browser output as raw material, but normalize metadata manually.

For JS-heavy pages, `wait_for_load()` may be too early. If browser/Defuddle output is empty, login/chrome noise, or misses obvious content, retry with direct `browser-harness` and an explicit wait/selector check before capturing HTML. For X/thread-like pages, wait roughly 10 seconds or until tweet/article text appears.

## Markdown frontmatter

Use this Obsidian Web Clipper-like structure:

```md
---
title: "..."
source: "https://..."
author:
  - "[[Name]]"
published: YYYY-MM-DD
created: YYYY-MM-DD
description: "..."
tags:
  - "clippings"
---
```

Rules:

- `title`: prefer trustworthy `webfetch` metadata; fallback Defuddle/browser title; clean obvious site suffixes only when safe.
- `source`: prefer trustworthy canonical URL from `webfetch` metadata; fallback final fetched URL or browser URL. Never use temp file paths.
- `author`: include only if plausible. Omit field or use empty list if unknown.
- `published`: include if found and trustworthy. Omit if unknown.
- `created`: current date.
- `description`: short page description if available. Escape quotes.
- Do not over-normalize. Bad invented metadata is worse than missing metadata.

## Asset handling

Extracted markdown often leaves remote image links. Preserve assets only when they carry information:

Download:

- architecture diagrams
- screenshots referenced by text
- charts/tables/images necessary to understand the article

Skip:

- logos
- favicons
- author avatars
- social/share icons
- decorative headers
- spacers/tracking pixels

Save downloaded assets to `<wiki>/raw/assets/`. Rewrite markdown image links from remote URLs to `./assets/<filename>` with URL-encoded spaces where needed.

## Wiki update

After writing the raw source:

1. Read `<wiki>/index.md`.
2. Add the raw markdown under `## Raw Sources`.
3. Use a one-line summary, not a full abstract.
4. Keep existing ordering/style where practical.
5. Do not list files from `raw/assets/`.

## Quality checks

Before finishing:

- Verify the raw markdown exists.
- Verify linked local assets exist.
- Verify `index.md` links to the new source.
- Mention if the page was auth-gated, extraction looked weak, or important assets were skipped.
