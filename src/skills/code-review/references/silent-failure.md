# Silent failures

Review whether failed work is surfaced accurately and leaves recoverable state.

Useful investigation angles:
- swallowed exceptions or broad catches that turn failures into success
- fallbacks and defaults that make invalid state look valid
- retries that conceal persistent failure or prevent recovery
- cleanup skipped on errors or cancellation
- background work whose failure is invisible to its caller or operator
- missing diagnostics that make a consequential failure undetectable or materially harder to diagnose

Trace the failure to a user-visible consequence, lost work, invalid state, or a concrete recovery or diagnosis problem. Account for existing error-reporting channels. Do not demand extra logging for expected misses or merely to provide more detail.
