---
name: prune-tests
description: Prune tests that guard no behavior, such as tests of removed code, tests no change can fail, tests coupled to the implementation, and duplicates. Use when auditing, cleaning up, or slimming a test suite.
---

# Prune Tests

Keep a test only if it depends on the intended behavior: it should change only when that behavior changes, and fail only when it regresses. If another test already guards the same behavior, prune the copy.

Start from the latest main branch. Work that retires a feature often deletes the same tests at the same time.

## Find what each test depends on

Prune tests that depend on:

**The past.** The test guards code that no longer exists, so it has no reason of its own to change.

- A feature was removed, and tests assert it's gone. Removed code never changes, so they can't catch a regression.
- A module was moved, and a test asserts it's absent from its old path.
- A test asserts that retired text or fields are absent. Search the source first: if the code still strips or hides that data, the check guards live behavior and stays.

**Nothing.** No change to the code can make the test fail.

- It tests the browser, framework, or library: a `<button>` renders, a click event fires, a plugin's own schema has its keys.
- It mocks the unit under test, then asserts what the mock returns.
- It asserts what the type system already guarantees, or that a constant equals its own literal.
- Its fixture is empty, so every comparison passes whatever the code does.

**The implementation.** The test changes whenever the code does, even when behavior didn't.

- The expected value is derived from the same logic as the code, so a wrong result still passes.
- It asserts private state, internal call order, mock call counts, or which helper was invoked.
- It matches generated SQL, query, or prompt text where executing it would prove the behavior. When a fake already interprets queries and filters its results, the returned rows prove the filter and the text checks add nothing.

**A duplicate.** Keep the copy at the layer that best guards the behavior and runs in CI. Check which suites CI runs before you move coverage: deleting a unit test in favor of an e2e test that CI never runs drops the guard. Keep both layers of a security or authorization boundary unless they truly assert the same thing.

## Prune

- Delete every test that isn't anchored to intended behavior.
- Where a test also covers behavior something relies on, rewrite it against that behavior: literal expected values and outputs callers see.
- Before deleting an assertion, search every suite for another guard of the same behavior. If none exists, rewrite it instead.
- If the only way to observe a behavior is an implementation detail, such as counting a CSS class, the product may lack a visible or accessible signal. Propose adding that signal and asserting it, rather than deleting the guard.
- Delete production code that only existed for the tests you removed.

## Verify

- For each rewrite and each assertion kept as the last guard of a behavior, break the production code on purpose, confirm the test fails, and revert.
- Run the affected suites, including database and e2e suites, in an environment like CI's. Compare any failure with the main branch before attributing it to the change.
- On a large suite, get an independent review of the deletions. Missed gaps become silent regressions.

## What done looks like

- Every test left is anchored to intended behavior.
- Each one would fail on a regression, and only on a regression.
- No test asserts code that no longer exists.
- No two tests guard the same behavior.
- No production code exists only for tests.

## Example

```diff
--- a/pricing.test.ts
+++ b/pricing.test.ts
@@ rewritten: the expected value repeated the code's logic @@
 test("applies the discount", () => {
-  const price = 100;
-  expect(applyDiscount(price, 0.2)).toBe(price - price * 0.2);
+  expect(applyDiscount(100, 0.2)).toBe(80);
 });
--- a/cart.test.ts
+++ b/cart.test.ts
@@ rewritten against what callers see: it asserted private state @@
 test("adds an item to the cart", () => {
   const cart = new Cart();
   cart.add(book);
-  expect(cart._items.length).toBe(1);
+  expect(cart.total()).toBe(book.price);
 });
@@ deleted: checkout.test.ts already guards the same total @@
-test("total includes tax", () => {
-  expect(cartTotal([book], { tax: 0.1 })).toBe(11);
-});
--- a/export.test.ts
+++ b/export.test.ts
@@ deleted: it guards code that no longer exists @@
-test("legacy exporter is gone", () => {
-  expect(existsSync("src/export/legacy.ts")).toBe(false);
-});
--- a/session.test.ts
+++ b/session.test.ts
@@ deleted, with the production code that only existed for it @@
-test("clears the cache", () => {
-  _resetCacheForTests();
-  expect(_getCacheSize()).toBe(0);
-});
--- a/session.ts
+++ b/session.ts
@@ @@
-export function _resetCacheForTests() { cache.clear(); }
-export function _getCacheSize() { return cache.size; }
```
