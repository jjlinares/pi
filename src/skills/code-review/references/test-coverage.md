# Test coverage

Review whether tests detect meaningful failures in the assigned scope, not whether every changed line has a test.

Useful investigation angles:
- important contracts or failure paths that could break without a test failing
- assertions that miss the behavior they claim to protect
- deleted or weakened coverage that removes a useful guarantee
- fixtures or mocks that bypass the relevant integration
- timing, ordering, or environment assumptions that make tests unreliable

Identify the failure a useful test should catch and why existing coverage would miss it. Consider coverage elsewhere before requesting more tests. Missing tests alone are not a finding; the added confidence must justify their cost. Prefer a focused behavioral check over implementation-detail assertions or a new testing framework.
