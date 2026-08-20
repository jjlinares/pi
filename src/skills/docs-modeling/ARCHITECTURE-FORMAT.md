# Architecture Documentation Format

Use architecture documentation to explain how the current technical system works: runtimes, components, dependency direction, data flow, ownership, and trust boundaries.

## Placement and scale

Prefer `docs/architecture/<topic>.md` for substantial architecture topics. Use the root `README.md` for the system overview when it can orient readers without duplicating a second overview file.

Route a small architecture set directly from the project documentation router. Add `docs/architecture/README.md` only when the parent router no longer provides clear navigation.

Create files for real current seams, not for every technology or proposal. Split a topic only when it becomes independently substantial or gains a distinct owner or lifecycle.

## Current truth

Write architecture from current code, configuration, tests, deployment definitions, and accepted decisions. Treat plans and proposals as research, not evidence that an architecture exists.

Reconcile contradictions before documenting them. When an ADR describes a historical consequence that no longer matches code:

- document current behavior in architecture
- keep the ADR as decision history
- flag the ADR for later status or supersession review

Do not present desired monorepos, state libraries, observability systems, or deployment processes as current merely because a plan describes them.

## Detail level

Use architecture documentation as a map of structure, ownership, and boundaries—not as a substitute for reading code.

Apply this test to implementation detail:

> Does this help locate responsibility or prevent a boundary violation?

Keep it when the answer is yes. Otherwise link to the controlling source file.

## Recommended topic structure

```md
# {Architecture Topic}

{State directly what the architecture topic defines, separates, or connects.}

## Overview or flow

{A concise diagram or end-to-end flow.}

## Responsibilities

{Which runtime, module, or layer owns each concern.}

## Boundaries and invariants

{Dependency direction, trust boundaries, state ownership, and failure behavior.}

## Current limitations

{Important gaps that affect how the system works today.}

## Related documentation

{Links to domain files, architecture files, ADRs, and procedural guides.}
```

Include only sections that help explain the topic; avoid metatext such as “This document describes…”.

## Content boundaries

Architecture documentation owns:

- current runtimes and deployment topology
- module and layer responsibilities
- dependency and data flow
- persistence and state ownership
- authentication and trust boundaries
- external-system integration mechanisms
- failure, cleanup, and transaction behavior
- important current technical limitations

Architecture documentation does not own:

- product vocabulary and business invariants — link domain docs
- decision rationale and rejected alternatives — link ADRs
- future sequencing or unimplemented designs — link plans
- setup commands and operational procedures — link focused guides

Summarize enough context to make the architecture understandable, but do not copy full prompts, schemas, command references, or ADR histories. Architecture explains why responsibilities are separated and where they belong; focused guides explain how to perform the work.

## Application-logic terminology

Reserve **workflow** for a user-visible, multi-step product process. When describing implementation, prefer:

- **DAL operation** for an exported DAL function
- **application logic** for authorization, sequencing, decisions, and result handling
- **orchestration** for coordinating several queries, providers, or mutations
- **app-facing view** for a read model shaped for the application
- **persistence operation** for a direct database query or mutation

Use the project's established terms rather than introducing an application-service or use-case layer that does not exist in code.

## End-to-end flow documentation

Document a cross-cutting technology inside the product flow or system it belongs to until multiple independent uses justify a shared category. For example, document one implemented AI generation path inside its calling flow rather than creating a generic AI architecture silo.

For an end-to-end flow, trace:

```text
entry point
  -> authorization
  -> application orchestration
  -> external runtime or provider
  -> validation and normalization
  -> persistence
  -> user-visible result
```

Identify what data crosses each boundary and which component owns expected failures, retries, cleanup, and durable state.

## Root README overview

When the root README owns the system overview, include:

- what the project is
- current deployable runtimes
- major modules and external systems
- a high-level system flow
- links to deeper architecture and setup documentation

Keep detailed layer rules and flow mechanics in topic files.

## Review checklist

- [ ] The file describes current implemented architecture.
- [ ] The scope corresponds to a real system seam.
- [ ] Code, configuration, tests, and deployment files support its claims.
- [ ] Proposed future state is absent or clearly labeled.
- [ ] Domain meaning is linked rather than redefined.
- [ ] ADR rationale is linked rather than duplicated.
- [ ] Procedures remain in focused guides.
- [ ] Ownership and dependency direction are explicit.
- [ ] Trust, state, persistence, and failure boundaries are clear where relevant.
- [ ] Current limitations are stated without turning them into domain rules.
- [ ] The project documentation router links to the file.
