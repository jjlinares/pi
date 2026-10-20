# Type contracts

Review whether contracts preserve real domain invariants across boundaries.

Useful investigation angles:
- optionality or nullability that contradicts reachable states
- casts or loose types that hide unsupported assumptions
- gaps between external-input validation and internal expectations
- serialization and deserialization mismatches
- drift between duplicated contracts or database and application schemas
- API and CLI behavior that disagrees with consumers, documentation, or tests

Trace the mismatch to a concrete caller, input, or maintenance cost. Judge compatibility against the project's declared guarantees and supported versions; an intentional break in a disposable format is not a defect. A primitive, cast, or duplicated type is not sufficient evidence on its own.
