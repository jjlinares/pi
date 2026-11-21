# Evidence

Review whether research, benchmark, or spike results support the claim drawn from them.

Useful investigation angles:
- the claim as stated against what was measured, not a weaker or neighboring claim
- tests or benchmarks that could not have failed: a broken or stubbed implementation would pass, the measured path is not the claimed one, caching or warmup dominates
- compared things that differ in more than the variable under test: versions, data, hardware, configuration, load
- sample size, variance, and dropped runs
- sources that are secondhand, stale for the installed version, or say less than the claim
- results that hold for the test setup but not the real workload

Recompute or rerun when cheap. Name what the claim needs and what the evidence shows.
