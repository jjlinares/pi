import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCancellationResults,
  formatChildCheck,
  formatWaitResults,
  requestChildCancellations,
  resolveChildTargets,
  selectorsForAction,
  waitForChildTargets,
} from "./management.ts";
import { MAX_TOOL_RESULT_BYTES, MAX_TOOL_RESULT_CHILD_BYTES } from "./executor.mjs";

function child(runId, index, options = {}) {
  const runDir = options.runDir ?? `/tmp/${runId}`;
  return {
    id: `${runId}-${index}`,
    index,
    parentRunId: runId,
    parentSessionId: "parent-session",
    runDir,
    mode: "background",
    controlProtocolVersion: 1,
    runState: options.runState ?? "running",
    notify: "none",
    state: options.state ?? "running",
    name: options.name ?? `child-${index}`,
    cwd: "/work",
    context: "fresh",
    thinking: "medium",
    runStartedAt: 1000,
    runUpdatedAt: 1000,
    startedAt: 1000,
    updatedAt: 1000,
    ...(options.completedAt ? { completedAt: options.completedAt } : {}),
    toolCount: 0,
    recentTools: [],
    recentOutput: options.recentOutput ?? [],
    ...(options.preview ? { preview: options.preview } : {}),
    ...(options.error ? { error: options.error } : {}),
    ...(options.reason ? { reason: options.reason } : {}),
    ...(options.outputFile ? { outputFile: options.outputFile } : {}),
    transcriptBytes: 0,
    transcriptTruncated: false,
    resultFile: path.join(runDir, "result.md"),
    abortRequested: false,
    canAbort: options.state === undefined || options.state === "running" || options.state === "queued",
    capabilities: { canAbort: true },
  };
}

class FakeReadModel {
  snapshots;
  listeners = new Set();
  aborts = [];

  constructor(snapshots) {
    this.snapshots = snapshots;
  }

  list() {
    return this.snapshots;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  requestAbort(id) {
    this.aborts.push(id);
    return true;
  }

  publish(snapshots) {
    this.snapshots = snapshots;
    for (const listener of this.listeners) listener(snapshots);
  }
}

test("action selectors reject conflicting or missing id fields", () => {
  assert.deepEqual(selectorsForAction("status", "run", undefined), ["run"]);
  assert.deepEqual(selectorsForAction("status", undefined, undefined), []);
  assert.deepEqual(selectorsForAction("check", "run-0", undefined), ["run-0"]);
  assert.deepEqual(selectorsForAction("wait", undefined, ["run-0", "run-1"]), ["run-0", "run-1"]);
  assert.throws(() => selectorsForAction("cancel", "run", ["run-0"]), /not both/);
  assert.throws(() => selectorsForAction("status", undefined, ["run"]), /Status accepts id/);
  assert.throws(() => selectorsForAction("check", undefined, undefined), /Check requires/);
  assert.throws(() => selectorsForAction("wait", undefined, undefined), /requires at least one/);
});

test("target resolution accepts child ids and expands unique run prefixes", () => {
  const snapshots = [child("abcdef", 0), child("abcdef", 1), child("999999", 0)];
  assert.deepEqual(resolveChildTargets(snapshots, ["abcdef-1"]).map((value) => value.id), ["abcdef-1"]);
  assert.deepEqual(resolveChildTargets(snapshots, ["abc"]).map((value) => value.id), ["abcdef-0", "abcdef-1"]);
  assert.deepEqual(resolveChildTargets(snapshots, ["abcdef", "abcdef-0"]).map((value) => value.id), ["abcdef-0", "abcdef-1"]);
  assert.throws(() => resolveChildTargets(snapshots, ["missing"]), /Unknown run or child id/);
});

test("target resolution rejects ambiguous run prefixes", () => {
  const snapshots = [child("abc111", 0), child("abc222", 0)];
  assert.throws(() => resolveChildTargets(snapshots, ["abc"]), /Ambiguous run id prefix/);
});

test("check returns bounded current or final child output", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-management-test-"));
  const outputFile = path.join(dir, "output.md");
  await fs.writeFile(outputFile, `${"x".repeat(4 * 1024)}\nEND`);
  const snapshot = child("checkrun", 0, {
    runDir: dir,
    state: "complete",
    runState: "complete",
    completedAt: 2000,
    outputFile,
  });
  const result = formatChildCheck(snapshot, 3000);
  assert.match(result, /checkrun-0 \[complete\]/);
  assert.match(result, /Output truncated\. Full output:/);
  assert.doesNotMatch(result, /END/);
  assert.ok(Buffer.byteLength(result, "utf8") < 3 * 1024);
});

test("wait observes selected children until all settle", async () => {
  const runningA = child("waitrun", 0);
  const runningB = child("waitrun", 1);
  const model = new FakeReadModel([runningA, runningB]);
  const updates = [];
  const waiting = waitForChildTargets(model, [runningA, runningB], undefined, (pending) => {
    updates.push(pending.map((snapshot) => snapshot.id));
  });

  model.publish([{ ...runningA, state: "complete" }, runningB]);
  model.publish([
    { ...runningA, state: "complete" },
    { ...runningB, state: "failed", error: "failed" },
  ]);

  const settled = await waiting;
  assert.deepEqual(settled.map((snapshot) => snapshot.state), ["complete", "failed"]);
  assert.deepEqual(updates, [["waitrun-0", "waitrun-1"], ["waitrun-1"]]);
  assert.equal(model.listeners.size, 0);
});

test("wait interruption leaves children running and unsubscribes", async () => {
  const running = child("abortwait", 0);
  const model = new FakeReadModel([running]);
  const controller = new AbortController();
  const waiting = waitForChildTargets(model, [running], controller.signal);
  controller.abort();
  await assert.rejects(waiting, /Wait aborted\. Subagents keep running/);
  assert.equal(model.listeners.size, 0);
});

test("wait output applies per-child and total limits", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-management-test-"));
  const snapshots = [];
  for (let index = 0; index < 4; index++) {
    const outputFile = path.join(dir, `output-${index}.md`);
    await fs.writeFile(outputFile, `${String(index).repeat(20 * 1024)}END-${index}`);
    snapshots.push(child("largerun", index, {
      runDir: dir,
      state: "complete",
      runState: "complete",
      completedAt: 2000,
      outputFile,
    }));
  }

  const one = formatWaitResults([snapshots[0]]);
  assert.ok(Buffer.byteLength(one.match(/0+/)?.[0] ?? "", "utf8") <= MAX_TOOL_RESULT_CHILD_BYTES);
  assert.match(one, /Child result truncated\. Full output:/);
  assert.doesNotMatch(one, /END-0/);

  const all = formatWaitResults(snapshots);
  assert.ok(Buffer.byteLength(all, "utf8") <= MAX_TOOL_RESULT_BYTES);
  assert.match(all, /Wait output truncated\. Full results:/);
});

test("wait applies the per-child limit to metadata and errors", () => {
  const snapshot = child("errorrun", 0, {
    state: "failed",
    runState: "failed",
    name: "n".repeat(20 * 1024),
    error: "e".repeat(20 * 1024),
  });
  const result = formatWaitResults([snapshot]);
  assert.ok(Buffer.byteLength(result, "utf8") <= MAX_TOOL_RESULT_CHILD_BYTES);
  assert.match(result, /Child result truncated/);
});

test("cancel requests only nonterminal children and reports terminal children", () => {
  const running = child("cancelrun", 0);
  const complete = child("cancelrun", 1, { state: "complete", runState: "complete" });
  const model = new FakeReadModel([running, complete]);
  const results = requestChildCancellations(model, [running, complete]);
  assert.deepEqual(model.aborts, ["cancelrun-0"]);
  assert.deepEqual(results.map((result) => result.requested), [true, false]);
  const text = formatCancellationResults(results);
  assert.match(text, /Cancellation requested for cancelrun-0/);
  assert.match(text, /cancelrun-1 .* already complete/);
});
