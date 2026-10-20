# Correctness and regressions

Review whether behavior matches the intended contract across affected callers and state transitions.

Useful investigation angles:
- control flow, early returns, and fallback branches
- async ordering, cancellation, cleanup, and retries
- null, empty, and default handling
- data shapes, serialization, and persistence
- API, CLI, configuration, and protocol contracts
- integration failures across existing callers

Trace a concrete input or state to an incorrect outcome. For diff reviews, identify how the target introduced or exposed it; audits may include existing bugs within the assigned scope. Judge compatibility against the project's actual requirements, not an assumed obligation to support older formats.
