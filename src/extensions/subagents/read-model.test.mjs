import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { SubagentReadModel } from "./read-model.ts";

async function waitFor(check, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail("timed out waiting for read model update");
}

function status(runId, options = {}) {
  const startedAt = options.startedAt ?? 1000;
  return {
    id: runId,
    ...(options.parentSessionId ? { parentSessionId: options.parentSessionId } : {}),
    ...(options.mode ? { mode: options.mode } : {}),
    ...(options.legacy ? {} : { controlProtocolVersion: options.controlProtocolVersion ?? 1 }),
    state: options.state ?? "running",
    cwd: `/work/${runId}`,
    notify: "none",
    startedAt,
    updatedAt: options.updatedAt ?? startedAt,
    ...(options.completedAt ? { completedAt: options.completedAt } : {}),
    subagents: (options.children ?? ["one"]).map((name, index) => ({
      id: `${runId}-${index}`,
      index,
      name,
      task: `task for ${name}`,
      state: options.childState ?? "queued",
      cwd: `/work/${runId}/${name}`,
      context: "fresh",
      model: "test-model",
      thinking: "high",
      updatedAt: options.updatedAt ?? startedAt,
      preview: options.preview,
    })),
  };
}

async function writeStatus(root, value) {
  const runDir = path.join(root, value.id);
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(value)}\n`);
  return runDir;
}

test("read model flattens statuses in stable run/index order and treats legacy mode as unknown", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  await writeStatus(root, status("older", { startedAt: 100, mode: "foreground", children: ["a"] }));
  await writeStatus(root, status("newer", { startedAt: 200, children: ["a", "b"] }));

  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  assert.deepEqual(model.list().map((child) => child.id), ["newer-0", "newer-1", "older-0"]);
  assert.equal(model.get("newer-0").mode, "unknown");
  assert.equal(model.get("older-0").mode, "foreground");
  assert.equal(model.get("older-0").runState, "running");
  assert.equal(model.get("older-0").notify, "none");
  assert.equal(model.get("older-0").runStartedAt, 100);
  assert.equal(model.get("older-0").runUpdatedAt, 100);
  assert.equal(model.get("newer-1").cwd, "/work/newer/b");
  assert.equal(model.get("newer-1").task, "task for b");
  assert.equal(model.get("newer-1").capabilities.canAbort, true);
});

test("read model isolates runs by parent session and excludes unowned legacy runs", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  await writeStatus(root, status("owned", { parentSessionId: "session-a" }));
  await writeStatus(root, status("foreign", { parentSessionId: "session-b" }));
  await writeStatus(root, status("unowned"));

  const model = new SubagentReadModel(root, "session-a");
  t.after(() => model.dispose());
  assert.deepEqual(model.list().map((child) => child.id), ["owned-0"]);
  assert.equal(model.get("owned-0").parentSessionId, "session-a");
  assert.equal(model.get("foreign-0"), undefined);
  assert.equal(model.get("unowned-0"), undefined);
});

test("legacy statuses without the control protocol are never abortable", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  await writeStatus(root, status("legacy", { legacy: true, childState: "running" }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());

  assert.equal(model.get("legacy-0").mode, "unknown");
  assert.equal(model.get("legacy-0").canAbort, false);
  assert.equal(model.requestAbort("legacy-0"), false);
});

test("read model exposes terminal run metadata on every child snapshot", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  await writeStatus(root, status("done", {
    mode: "background",
    state: "failed",
    childState: "failed",
    startedAt: 100,
    updatedAt: 250,
    completedAt: 240,
  }));

  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  const child = model.get("done-0");
  assert.equal(child.runState, "failed");
  assert.equal(child.mode, "background");
  assert.equal(child.runStartedAt, 100);
  assert.equal(child.runUpdatedAt, 250);
  assert.equal(child.runCompletedAt, 240);
});

test("read model exposes cancelled children as terminal and non-abortable", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const value = status("cancelled", {
    mode: "foreground",
    state: "cancelled",
    childState: "cancelled",
    startedAt: 100,
    updatedAt: 200,
    completedAt: 200,
  });
  value.subagents[0].reason = "Cancelled by user";
  await writeStatus(root, value);

  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  const child = model.get("cancelled-0");
  assert.equal(child.runState, "cancelled");
  assert.equal(child.state, "cancelled");
  assert.equal(child.reason, "Cancelled by user");
  assert.equal(child.canAbort, false);
});

test("read model emits one running-to-terminal run transition", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const runDir = await writeStatus(root, status("transition", { mode: "background", startedAt: 100 }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  const updates = [];
  model.subscribe((snapshots) => updates.push(snapshots.map((snapshot) => snapshot.runState)));

  const terminal = status("transition", {
    mode: "background",
    state: "complete",
    childState: "complete",
    startedAt: 100,
    updatedAt: 300,
    completedAt: 300,
  });
  await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(terminal)}\n`);
  await waitFor(() => updates.length === 1);
  assert.deepEqual(updates, [["complete"]]);
  assert.equal(model.get("transition-0").runCompletedAt, 300);

  await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(terminal, null, 2)}\n`);
  await new Promise((resolve) => setTimeout(resolve, 320));
  assert.equal(updates.length, 1);
});

test("read model emits only changed snapshots and preserves valid data on transient read failure", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const initial = status("pollrun", { startedAt: 100, preview: "first" });
  const runDir = await writeStatus(root, initial);
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  const updates = [];
  model.subscribe((snapshots) => updates.push(snapshots.map((snapshot) => snapshot.preview)));

  await fs.writeFile(path.join(runDir, "status.json"), `${JSON.stringify(initial, null, 2)}\n`);
  await new Promise((resolve) => setTimeout(resolve, 320));
  assert.equal(updates.length, 0);

  await fs.writeFile(path.join(runDir, "status.json"), "{");
  await new Promise((resolve) => setTimeout(resolve, 320));
  assert.equal(model.get("pollrun-0").preview, "first");
  assert.equal(updates.length, 0);

  await fs.writeFile(path.join(runDir, "status.json"), JSON.stringify(status("pollrun", { startedAt: 100, updatedAt: 300, preview: "second" })));
  await waitFor(() => updates.length === 1);
  assert.equal(model.get("pollrun-0").preview, "second");
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(updates.length, 1);
});

test("requestAbort writes one validated idempotent per-child marker", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const runDir = await writeStatus(root, status("cancelrun", { childState: "running" }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());

  assert.equal(model.requestAbort("cancelrun-0"), true);
  assert.equal(model.get("cancelrun-0").abortRequested, true);
  const marker = path.join(runDir, "control", "abort-0.json");
  const first = await fs.readFile(marker, "utf8");
  assert.equal(model.requestAbort("cancelrun-0"), true);
  assert.equal(await fs.readFile(marker, "utf8"), first);
  assert.equal(JSON.parse(first).childId, "cancelrun-0");

  await writeStatus(root, status("other", { childState: "complete" }));
  await waitFor(() => model.get("other-0"));
  assert.equal(model.requestAbort("other-0"), false);
  assert.equal(model.requestAbort("missing"), false);
});

test("requestAbort re-reads persisted state and rejects a child that settled after its snapshot", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const runDir = await writeStatus(root, status("stale", { childState: "running" }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  await fs.writeFile(path.join(runDir, "status.json"), JSON.stringify(status("stale", {
    state: "complete",
    childState: "complete",
    completedAt: 2,
  })));

  assert.equal(model.get("stale-0").canAbort, true);
  assert.equal(model.requestAbort("stale-0"), false);
  await assert.rejects(fs.access(path.join(runDir, "control", "abort-0.json")));

  await fs.writeFile(path.join(runDir, "status.json"), JSON.stringify(status("stale", { legacy: true, childState: "running" })));
  assert.equal(model.requestAbort("stale-0"), false);
  await assert.rejects(fs.access(path.join(runDir, "control", "abort-0.json")));
});

test("read model rejects a status whose persisted address does not match its run directory", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const value = status("claimed", { childState: "running" });
  const runDir = path.join(root, "actual");
  await fs.mkdir(runDir);
  await fs.writeFile(path.join(runDir, "status.json"), JSON.stringify(value));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());

  assert.equal(model.get("claimed-0"), undefined);
  assert.equal(model.requestAbort("claimed-0"), false);
  await assert.rejects(fs.access(path.join(runDir, "control", "abort-0.json")));
});

test("read model drops malformed prior snapshots after the one-second grace", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const runDir = await writeStatus(root, status("expires", { preview: "valid" }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  await fs.writeFile(path.join(runDir, "status.json"), "{");

  await new Promise((resolve) => setTimeout(resolve, 500));
  assert.equal(model.get("expires-0").preview, "valid");
  await waitFor(() => model.get("expires-0") === undefined, 2200);
});

test("read model rejects non-regular, symlinked, oversized, and noncanonical statuses", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const target = path.join(root, "target.json");
  await fs.writeFile(target, JSON.stringify(status("linked")));
  const linkedDir = path.join(root, "linked");
  await fs.mkdir(linkedDir);
  await fs.symlink(target, path.join(linkedDir, "status.json"));

  const hugeDir = path.join(root, "huge");
  await fs.mkdir(hugeDir);
  await fs.writeFile(path.join(hugeDir, "status.json"), " ".repeat(1024 * 1024 + 1));

  const children = status("children", { children: ["a", "b"] });
  children.subagents[1].index = 0;
  await writeStatus(root, children);

  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  assert.equal(model.list().length, 0);
});

test("read model exposes only lexical artifact paths inside the run directory", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const value = status("artifacts");
  const runDir = path.join(root, "artifacts");
  value.subagents[0].outputFile = path.join(runDir, "output.md");
  value.subagents[0].stderrFile = path.join(root, "outside.log");
  value.subagents[0].stdoutFile = "../outside.jsonl";
  value.subagents[0].transcriptFile = "transcript-0.jsonl";
  await writeStatus(root, value);

  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  const child = model.get("artifacts-0");
  assert.equal(child.outputFile, path.join(runDir, "output.md"));
  assert.equal(child.stderrFile, undefined);
  assert.equal(child.stdoutFile, undefined);
  assert.equal(child.transcriptFile, path.join(runDir, "transcript-0.jsonl"));
});

test("read model sorts active runs before newer terminal history", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  await writeStatus(root, status("done", { state: "complete", childState: "complete", startedAt: 500, completedAt: 600 }));
  await writeStatus(root, status("active", { state: "running", childState: "running", startedAt: 100 }));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  assert.deepEqual(model.list().map((child) => child.id), ["active-0", "done-0"]);
});

test("read model isolates listener exceptions", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-read-model-test-"));
  const runDir = await writeStatus(root, status("listeners"));
  const model = new SubagentReadModel(root);
  t.after(() => model.dispose());
  let called = 0;
  model.subscribe(() => { throw new Error("listener failed"); });
  model.subscribe(() => { called += 1; });
  await fs.writeFile(path.join(runDir, "status.json"), JSON.stringify(status("listeners", { updatedAt: 2, preview: "changed" })));
  await waitFor(() => called === 1);
  assert.equal(model.get("listeners-0").preview, "changed");
});
