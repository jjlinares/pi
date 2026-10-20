# Performance

Review costs that matter at the project's expected scale.

Useful investigation angles:
- accidental quadratic work or repeated queries and network/file IO
- ineffective caching or invalidation
- payload and serialization costs on common paths
- unnecessary sequential work or unbounded concurrency
- blocking work in UI and request paths
- leaked handles, timers, subscriptions, or streams
- pagination, filtering, and batching behavior

Identify the workload, input size, or execution frequency that makes the cost consequential. Ground claims in the code path, measurements, or defensible estimates; distinguish measured impact from expected impact. Avoid micro-optimizations without meaningful benefit.
