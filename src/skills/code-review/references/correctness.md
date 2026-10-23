# Correctness

Review whether behavior matches the intended contract: stated requirements, existing callers, and data crossing boundaries.

Useful investigation angles:
- each stated requirement or acceptance criterion, including missing behavior and work outside the agreed scope
- control flow, early returns, fallbacks, and null, empty, or default handling
- async ordering, cancellation, cleanup, and retries
- contracts at boundaries: types versus reachable states, validation, serialization, persistence, and API, CLI, or configuration consumers
- failures reported as success, hidden from their caller, or leaving unrecoverable state
- important behavior or failure paths that could break without a test failing
- docs, help text, or agent instructions the change made wrong

Trace a concrete input, state, or requirement to an incorrect outcome. For diff reviews, identify how the target introduced or exposed it; audits may include existing bugs within the assigned scope. Judge compatibility against the project's declared guarantees, not an assumed obligation to support older formats. Treat ambiguous or conflicting requirements as questions, not defects; do not invent requirements. Missing tests are a finding only when they would leave a consequential break undetected.
