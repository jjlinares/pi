import test from "node:test";
import assert from "node:assert/strict";
import { CompletionNotificationState } from "./notification-state.ts";

function snapshot(id, options = {}) {
  return {
    id: `${id}-0`,
    index: 0,
    parentRunId: id,
    runDir: `/tmp/${id}`,
    mode: options.mode ?? "unknown",
    runState: options.runState ?? "running",
    notify: "tui",
    state: options.runState === "running" ? "running" : "complete",
    name: "one",
    cwd: "/work",
    runStartedAt: 1,
    runUpdatedAt: 1,
    updatedAt: 1,
    transcriptBytes: 0,
    transcriptTruncated: false,
    resultFile: `/tmp/${id}/result.md`,
    abortRequested: false,
    canAbort: false,
    capabilities: { canAbort: false },
  };
}

test("notification recovery tracks observed unknown running transitions but never unknown terminal history", () => {
  const state = new CompletionNotificationState();
  const delivered = [];
  state.seed([snapshot("recover")]);
  state.observe([snapshot("recover", { runState: "complete" })], (value) => delivered.push(value.parentRunId));
  assert.deepEqual(delivered, ["recover"]);
  assert.equal(state.get("recover").state, "notified");

  const history = new CompletionNotificationState();
  history.seed([snapshot("old", { runState: "complete" })]);
  history.observe([snapshot("old", { runState: "complete" })], (value) => delivered.push(value.parentRunId));
  assert.equal(history.get("old"), undefined);
  assert.deepEqual(delivered, ["recover"]);
});

test("notification delivery marks success only after dispatch and bounds retries", () => {
  const state = new CompletionNotificationState(3);
  state.trackLaunch("retry", "/tmp/retry", "tui");
  const terminal = [snapshot("retry", { mode: "background", runState: "complete" })];
  let attempts = 0;
  assert.equal(state.observe(terminal, () => { attempts += 1; throw new Error("no"); }).retryNeeded, true);
  assert.equal(state.get("retry").state, "pending");
  assert.equal(state.observe(terminal, () => { attempts += 1; }).retryNeeded, false);
  assert.equal(state.get("retry").state, "notified");
  assert.equal(attempts, 2);

  const exhausted = new CompletionNotificationState(2);
  exhausted.trackLaunch("fail", "/tmp/fail", "tui");
  exhausted.observe([snapshot("fail", { runState: "failed" })], () => { throw new Error("no"); });
  assert.equal(exhausted.observe([snapshot("fail", { runState: "failed" })], () => { throw new Error("no"); }).retryNeeded, false);
  assert.equal(exhausted.get("fail").state, "exhausted");
});
