# Plans and designs

Review whether a plan or design would work against the system as it is installed, not as the author remembers it.

Useful investigation angles:
- each step against the installed code, configuration, and dependency versions: the API, flag, hook, or schema it relies on exists and behaves as assumed
- promises the dependencies do not make: ordering, atomicity, idempotency, delivery, limits
- missing failure handling: a step that fails halfway, a retry, a rollback, existing data a migration meets
- steps that conflict with each other, with settled decisions, or with project constraints
- acceptance criteria that could pass while the goal fails

Show what the system actually does: the source line, the installed version's docs, or a probe.
