# Standards and conventions

Review against applicable project instructions, architecture decisions, and established local conventions.

Useful investigation angles:
- violations of explicit project constraints
- ownership or module boundaries that contradict the architecture
- domain language drift that obscures behavior or contracts
- inconsistent conventions that impose concrete maintenance costs
- setup, build, or test guidance that conflicts with actual behavior

Cite the applicable constraint or demonstrate the maintenance cost. Distinguish explicit requirements from design judgment. Duplication, primitive types, switches, wrappers, and file size are clues to investigate, not defects by themselves. Recommend structural changes only when they reduce a concrete cost without adding greater complexity.
