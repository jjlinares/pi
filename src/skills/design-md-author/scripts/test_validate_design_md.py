#!/usr/bin/env python3
"""Tests for validate_design_md.py."""

from __future__ import annotations

import unittest

from validate_design_md import validate_text


VALID_DESIGN = """---
version: alpha
name: Test-design-analysis
description: Test design system.
colors:
  primary: "#000000"
  ink: "#111111"
  body: "#333333"
  canvas: "#ffffff"
  hairline: "#eeeeee"
typography:
  display-xl:
    fontFamily: "Test Sans, sans-serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -1px
  display-lg:
    fontFamily: "Test Sans, sans-serif"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1px
  body-md:
    fontFamily: "Test Sans, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button-md:
    fontFamily: "Test Sans, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
rounded:
  sm: 4px
spacing:
  sm: 8px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
  card-default:
    backgroundColor: "{colors.canvas}"
  input-default:
    backgroundColor: "{colors.canvas}"
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
## Responsive Behavior
## Iteration Guide
## Known Gaps
- None.
"""


class ValidateDesignMdTest(unittest.TestCase):
    def test_valid_design_has_no_errors(self) -> None:
        errors, _warnings = validate_text(VALID_DESIGN)
        self.assertEqual(errors, [])

    def test_missing_frontmatter_fails(self) -> None:
        errors, _warnings = validate_text("# DESIGN\n")
        self.assertIn("file must start with YAML frontmatter delimiter ---", errors)

    def test_missing_required_heading_fails(self) -> None:
        broken = VALID_DESIGN.replace("## Components\n", "")
        errors, _warnings = validate_text(broken)
        self.assertIn("missing heading: ## Components", errors)

    def test_missing_required_key_fails(self) -> None:
        broken = VALID_DESIGN.replace("spacing:\n  sm: 8px\n", "")
        errors, _warnings = validate_text(broken)
        self.assertIn("missing frontmatter key: spacing", errors)


if __name__ == "__main__":
    unittest.main()
