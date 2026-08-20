# Domain Documentation Format

Use domain documentation to define business meaning and product invariants independently from implementation.

## Placement and naming

Place domain files under the project's established domain documentation location. Prefer `docs/domain/<scope>.md` when creating a new structure.

Name files after the business area or workflow they own:

```text
docs/domain/
  ordering.md
  billing.md
  call-outcome.md
```

Avoid generic names such as `context.md` once the actual scope is known.

Route a small domain set directly from the project documentation router. Add `docs/domain/README.md` only when the directory becomes large enough to need its own navigation layer.

Split a file only when it contains a distinct business area or workflow with enough language and invariants to own independently. Do not split files merely for symmetry. Add compatibility files only when uncontrolled references justify them.

## Recommended structure

```md
# {Scope Name} Domain

{One or two sentences defining the scope and what this file owns.}

{Links to broader, narrower, or adjacent domain files when needed.}

## Language

### Order

A customer's commercial request for one or more products.

_Avoid_: transaction, cart

### Customer

A person or organization that places Orders.

_Avoid_: account, user

## Relationships and invariants

- An Order belongs to exactly one Customer.
- A cancelled Order cannot return to an active state.
- Cancelling an Order does not cancel its Customer.

## Example dialogue

> **Dev:** "Can an account own an Order?"
> **Domain expert:** "Use Customer here. Account is ambiguous between authentication and commerce."

## Flagged ambiguities

- "account" can mean authenticated User or commercial Customer — resolved: use the precise term.
- Refund policy for partially fulfilled Orders is intentionally undefined.
```

Include only sections that add value. Vocabulary is required for glossary-oriented files; relationships, examples, and ambiguities become important as the model grows.

## Writing rules

### Define product meaning

Describe what a concept is, how it relates to neighboring concepts, and which business rules govern it.

Include a term when its precise meaning matters to product behavior, even if the industry also uses the term. Exclude general programming concepts unless the product gives them a domain-specific meaning.

### Choose canonical language

Pick one preferred term when multiple words describe the same concept. Add `_Avoid_` aliases only when they prevent likely ambiguity.

Preserve capitalization for canonical terms when referring to the modeled concept, such as **Lead Status** or **Post-call Confirmation**.

### Assign one owner

Define each term fully in one domain file. In related files, link to the owning file and describe only the additional local relationship.

For example:

- `sales-intel.md` owns **Lead**, **Lead Status**, and **Lead Action**.
- `call-outcome.md` owns **Generated Call Intel** and **Post-call Confirmation**.
- Call Outcome uses Lead Status without redefining it.

### Separate domain from implementation

Apply this test to each statement:

> Would this statement remain true if the framework, database, provider, route structure, or code layout changed?

If yes, keep it in domain documentation. If changing the mechanism makes the statement false, move it to architecture documentation or a focused guide.

Exclude or relocate:

- table and column names
- JSON field paths
- API routes
- source file paths
- framework behavior
- model or infrastructure providers
- transaction and persistence mechanisms
- temporary validation gaps

Express the product requirement in the domain file and the mechanism in architecture documentation:

```md
Domain: Applying confirmation is all-or-nothing.
Architecture: The DAL applies confirmation in one PostgreSQL transaction.
```

Do not silently delete important implementation notes during cleanup. Move them to architecture documentation or record them for an immediate architecture review.

### Challenge and validate the model

Call out conflicts with established language and resolve which meaning is canonical. Sharpen overloaded terms and stress-test relationships with concrete scenarios, especially around ownership, lifecycle, identity, partial failure, and boundaries between workflows.

Cross-reference code and tests when validating current behavior. Surface contradictions instead of silently changing domain truth to match either the conversation or implementation.

### Record current truth

Document accepted vocabulary and current product behavior. Keep proposed behavior in plans and explain durable trade-offs in ADRs.

Label intentionally undefined behavior explicitly rather than inventing a rule. Remove obsolete rules when product behavior changes and update affected architecture docs, ADR status, tests, and code references.

### Add scenarios and ambiguities selectively

Use example dialogue when a realistic scenario explains a boundary better than another abstract rule. Prefer examples that distinguish close concepts or expose edge cases.

Use flagged ambiguities to record:

- overloaded terms and their resolution
- boundaries between related contexts
- intentionally undefined policy

Do not use the ambiguity section as a general backlog or scratch pad.

## Review checklist

- [ ] File name communicates its actual business scope.
- [ ] Opening paragraph states what the file owns.
- [ ] Canonical terms use linkable headings.
- [ ] Definitions use product language rather than code language.
- [ ] Relationships and invariants are testable or scenario-verifiable.
- [ ] Each shared term has one canonical owner.
- [ ] Related domain files cross-link instead of duplicating definitions.
- [ ] Implementation mechanisms live outside domain documentation.
- [ ] Proposed behavior is not presented as current truth.
- [ ] The project documentation router links to the file.
- [ ] Moved-file references have been updated or intentionally preserved.
