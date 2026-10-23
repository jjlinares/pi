# Architecture

Review whether the change fits the project's architecture and is the simplest shape that solves the problem.

Learn the architecture first: project instructions, architecture docs, ADRs, and neighboring code. Use the codebase-design vocabulary (module, interface, depth, seam, locality).

Useful investigation angles:
- building beside the architecture: hand-rolled mechanisms where an existing module, helper, event, or hook fits
- a second copy of something the codebase provides, or a caller bypassing a module's interface
- logic placed in the wrong module or layer
- shallow modules: a new concept with one user, an interface nearly as complex as its implementation, a contract wider than needed
- compatibility shims, speculative fallbacks, and dead code; update callers instead
- a new dependency where an installed one or a platform feature would do
- tests that restate the implementation instead of exercising behavior and failure cases
- violations of explicit project constraints

Name the existing piece (path:line) or the simpler shape, and what it saves. "A cleaner abstraction would help" is not a finding. Architecture findings are advisory unless they violate an explicit project constraint or would force rework of the next change. Raise at most one open design question. No findings is a valid result.
