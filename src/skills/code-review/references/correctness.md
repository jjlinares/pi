# Correctness

Review whether behavior matches the intended contract: stated requirements, existing callers, and data crossing boundaries. When the brief says no comments lane runs, also check changed comments: flag ones that are false or narrate code.

Useful investigation angles:
- each stated requirement or acceptance criterion, including missing behavior and work outside the agreed scope
- control flow, early returns, fallbacks, and null, empty, or default handling
- concurrent events in each order: a response after cancel, a retry racing the original, a crash between two writes; force the order rather than reason about it
- contracts at boundaries: types versus reachable states, validation, serialization, persistence, and API, CLI, or configuration consumers; a fake that accepts what the real dependency rejects
- failures reported as success, hidden from their caller, or leaving unrecoverable state
- tests that pass with the protection removed: delete the transaction, lock, or guard and rerun
- docs, help text, or agent instructions the change made wrong

For diff reviews, show how the change introduced or exposed the issue; audits may include existing bugs within the assigned scope. Judge compatibility against the project's declared guarantees, not an assumed obligation to support older formats. Missing tests are a finding only when they would leave a consequential break undetected.
