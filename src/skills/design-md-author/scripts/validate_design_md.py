#!/usr/bin/env python3
"""Lightweight DESIGN.md structural validator."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_FRONTMATTER_KEYS = [
    "version",
    "name",
    "description",
    "colors",
    "typography",
    "rounded",
    "spacing",
    "components",
]

REQUIRED_HEADINGS = [
    "## Overview",
    "## Colors",
    "## Typography",
    "## Layout",
    "## Elevation & Depth",
    "## Shapes",
    "## Components",
    "## Do's and Don'ts",
]

RECOMMENDED_HEADINGS = [
    "## Responsive Behavior",
    "## Iteration Guide",
    "## Known Gaps",
]

HEX_COLOR_RE = re.compile(r'#[0-9a-fA-F]{6}\b')
TYPO_TOKEN_RE = re.compile(r"^  [a-zA-Z0-9_-]+:\s*$", re.MULTILINE)
COMPONENT_TOKEN_RE = re.compile(r"^  [a-zA-Z0-9_-]+:\s*$", re.MULTILINE)


def validate_text(text: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    frontmatter, body = split_frontmatter(text, errors)
    if not frontmatter:
        return errors, warnings

    for key in REQUIRED_FRONTMATTER_KEYS:
        if not re.search(rf"^{re.escape(key)}\s*:", frontmatter, re.MULTILINE):
            errors.append(f"missing frontmatter key: {key}")

    for heading in REQUIRED_HEADINGS:
        if heading not in body:
            errors.append(f"missing heading: {heading}")

    for heading in RECOMMENDED_HEADINGS:
        if heading not in body:
            warnings.append(f"missing recommended heading: {heading}")

    color_count = len(set(HEX_COLOR_RE.findall(frontmatter)))
    if color_count < 5:
        warnings.append(f"few hex colors in frontmatter: {color_count}")

    typography_block = block_after_key(frontmatter, "typography")
    if len(TYPO_TOKEN_RE.findall(typography_block)) < 4:
        warnings.append("few typography tokens; expected at least 4")

    components_block = block_after_key(frontmatter, "components")
    if len(COMPONENT_TOKEN_RE.findall(components_block)) < 3:
        warnings.append("few component tokens; expected at least 3")

    if "Known Gaps" in body and re.search(r"## Known Gaps\s*$", body):
        warnings.append("Known Gaps section is empty")

    return errors, warnings


def split_frontmatter(text: str, errors: list[str]) -> tuple[str, str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        errors.append("file must start with YAML frontmatter delimiter ---")
        return "", text

    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            return "\n".join(lines[1:index]), "\n".join(lines[index + 1 :])

    errors.append("frontmatter closing delimiter --- not found")
    return "", text


def block_after_key(frontmatter: str, key: str) -> str:
    pattern = re.compile(rf"^{re.escape(key)}\s*:\s*$([\s\S]*?)(?=^[a-zA-Z_][\w-]*\s*:|\Z)", re.MULTILINE)
    match = pattern.search(frontmatter)
    return match.group(1) if match else ""


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: validate_design_md.py DESIGN.md", file=sys.stderr)
        return 2

    path = Path(argv[1])
    text = path.read_text(encoding="utf-8")
    errors, warnings = validate_text(text)

    for warning in warnings:
        print(f"warning: {warning}")
    for error in errors:
        print(f"error: {error}", file=sys.stderr)

    if errors:
        return 1
    print("DESIGN.md structure OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
