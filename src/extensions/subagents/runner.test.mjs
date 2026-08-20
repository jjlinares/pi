import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TOOL_RESULT_BYTES,
  MAX_TOOL_RESULT_CHILD_BYTES,
  runSubagents,
} from "./executor.mjs";
import { writeAbortMarker } from "./_protocol.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(here, "runner.mjs");

function execNode(args, options = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, args, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr, code: error?.code ?? 0 });
    });
  });
}

async function makeFakePi(dir) {
  const fake = path.join(dir, "fake-pi.mjs");
  await fs.writeFile(fake, `
import fs from "node:fs";
const taskArg = process.argv.find((arg) => arg.startsWith("@"));
const task = taskArg ? fs.readFileSync(taskArg.slice(1), "utf8") : "";
if (task.includes("occupy-slot")) {
  setInterval(() => {}, 1000);
} else {
if (task.includes("fail")) {
  console.error("fake failure");
  process.exit(7);
}
const lingerAfterStop = task.includes("linger-after-stop");
if (task.includes("slow")) {
  setInterval(() => {}, 1000);
}
if (task.includes("many-jsonl")) {
  for (let i = 0; i < 20; i++) console.log(JSON.stringify({ type: "tool_execution_start", toolName: "read", args: { path: "file-" + i } }));
}
if (task.includes("repeated-large-updates")) {
  const update = "x".repeat(50 * 1024);
  console.log(JSON.stringify({ type: "tool_execution_start", toolName: "bash", args: { command: "large" } }));
  for (let i = 0; i < 30; i++) console.log(JSON.stringify({ type: "tool_execution_update", toolName: "bash", partialResult: update }));
}
if (task.includes("transcript-events")) {
  console.log("not-json");
  console.log(JSON.stringify({ type: "tool_execution_start", toolName: "bash\\u001b[31m", args: { command: "printf \\u0001bad" } }));
  console.log(JSON.stringify({ type: "tool_execution_update", toolName: "bash", partialResult: { content: [{ type: "text", text: "update text\\u202E" }], details: { secret: "omit" } } }));
  console.log(JSON.stringify({ type: "tool_execution_end", toolName: "bash", result: { content: [{ type: "text", text: "done text\\u0002" }] }, isError: true }));
}
const sessionCwd = task.includes("session-cwd-different") ? "/session/project" : process.cwd();
console.log(JSON.stringify({ type: "session", version: 3, id: "fake-session-id", timestamp: new Date().toISOString(), cwd: sessionCwd }));
if (task.includes("exit-before-message")) process.exit(9);
console.log(JSON.stringify({ type: "tool_execution_start", toolName: "read", args: { path: "README.md" } }));
const normalOutput = (task.includes("transcript-events") ? "\\u001b[34m" : "") + "result for " + task.trim().replace(/\\s+/g, " ") + (task.includes("transcript-events") ? "\\u0003" : "");
const output = task.includes("large-output")
  ? "L".repeat(24 * 1024) + "LARGE-END"
  : task.includes("medium-output")
    ? "M".repeat(14 * 1024) + "MEDIUM-END"
    : normalOutput;
const message = {
  type: "message_end",
  message: {
    role: "assistant",
    content: [{ type: "text", text: output }],
    stopReason: "stop",
    usage: { input: 3, output: 5, cacheRead: 0, cacheWrite: 0, cost: { total: 0.02 }, totalTokens: 8 }
  }
};
console.log(JSON.stringify(message));
if (task.includes("two-turns")) console.log(JSON.stringify(message));
if (lingerAfterStop) setInterval(() => {}, 1000);
}
`, "utf8");
  return fake;
}

async function waitForStatus(runDir, predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
      if (predicate(value)) return value;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail("timed out waiting for runner status");
}

async function writeConfig(dir, config) {
  const runDir = path.join(dir, "run");
  await fs.mkdir(runDir, { recursive: true });
  const configPath = path.join(runDir, "config.json");
  await fs.writeFile(configPath, JSON.stringify({ runDir, cwd: dir, notify: "none", concurrency: 2, ...config }, null, 2));
  return { runDir, configPath };
}

test("runner completes parallel subagents and writes aggregate result", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "okrun",
    parentSessionId: "parent-session-id",
    subagents: [
      { id: "okrun-0", name: "one", task: "inspect one", context: "fresh", thinking: "high" },
      { id: "okrun-1", name: "two", task: "inspect two", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.state, "complete");
  assert.equal(status.parentSessionId, "parent-session-id");
  assert.equal(status.mode, "foreground");
  assert.equal(status.controlProtocolVersion, 1);
  assert.equal(status.subagents.length, 2);
  assert.deepEqual(status.subagents.map((subagent) => subagent.state), ["complete", "complete"]);
  assert.equal(status.subagents[0].usage.input, 3);
  assert.equal(status.subagents[1].usage.output, 5);
  assert.equal(status.subagents[0].thinking, "high");
  assert.equal(status.subagents[0].task, "inspect one");
  assert.equal(status.subagents[0].sessionId, "fake-session-id");
  assert.equal(status.subagents[0].resumeCommand, `(cd -- '${dir}' && pi --session fake-session-id)`);
  assert.match(path.basename(status.subagents[0].outputFile), /^output-0-one\.md$/);
  assert.equal(await fs.readFile(path.join(runDir, "input-0-one.md"), "utf8"), "Task:\ninspect one\n");
  assert.match(await fs.readFile(status.subagents[0].outputFile, "utf8"), /result for Task: inspect one/);

  const aggregate = await fs.readFile(path.join(runDir, "result.md"), "utf8");
  assert.match(aggregate, /## one — complete/);
  assert.ok(aggregate.includes(`> Resume: \`(cd -- '${dir}' && pi --session fake-session-id)\``));
  assert.match(aggregate, /result for Task: inspect one/);
  assert.match(aggregate, /## two — complete/);

  const files = await fs.readdir(runDir);
  assert.equal(files.some((file) => file.endsWith(".jsonl") && file.startsWith("subagent-")), false);
  assert.match(await fs.readFile(status.subagents[0].transcriptFile, "utf8"), /"type":"assistant"/);
  const events = await fs.readFile(path.join(runDir, "events.jsonl"), "utf8");
  assert.match(events, /--thinking/);
  assert.match(events, /high/);
  assert.doesNotMatch(events, /--append-system-prompt/);
  assert.doesNotMatch(events, /--no-session/);
  assert.doesNotMatch(events, /child_event/);
  assert.equal(files.some((file) => file.startsWith("prompt-")), false);

  assert.equal((await fs.stat(runDir)).mode & 0o777, 0o700);
  assert.equal((await fs.stat(path.join(runDir, "status.json"))).mode & 0o777, 0o600);
  assert.equal((await fs.stat(path.join(runDir, "result.md"))).mode & 0o777, 0o600);
  assert.equal((await fs.stat(status.subagents[0].outputFile)).mode & 0o777, 0o600);
  assert.equal((await fs.stat(status.subagents[0].transcriptFile)).mode & 0o777, 0o600);
  assert.equal((await fs.stat(path.join(runDir, "events.jsonl"))).mode & 0o777, 0o600);
});

test("runner caps each child in the tool result but preserves complete result files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runDir = path.join(dir, "child-cap");
  const { status, resultText } = await runSubagents({
    runId: "child-cap",
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [{ id: "child-cap-0", name: "large", task: "large-output", context: "fresh", cwd: dir }],
  });

  const returnedChildOutput = resultText.match(/L+/)?.[0] ?? "";
  assert.ok(Buffer.byteLength(returnedChildOutput, "utf8") <= MAX_TOOL_RESULT_CHILD_BYTES);
  assert.match(resultText, /Output truncated\. Full output:/);
  assert.ok(resultText.includes(status.subagents[0].outputFile));
  assert.doesNotMatch(resultText, /LARGE-END/);
  assert.match(await fs.readFile(status.subagents[0].outputFile, "utf8"), /LARGE-END$/);
  assert.match(await fs.readFile(path.join(runDir, "result.md"), "utf8"), /LARGE-END/);
});

test("runner caps the total tool result but preserves the complete aggregate", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runDir = path.join(dir, "total-cap");
  const subagents = Array.from({ length: 4 }, (_, index) => ({
    id: `total-cap-${index}`,
    name: `medium-${index}`,
    task: `medium-output ${index}`,
    context: "fresh",
    cwd: dir,
  }));
  const { resultText } = await runSubagents({
    runId: "total-cap",
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 4,
    piScript: fakePi,
    subagents,
  });

  assert.ok(Buffer.byteLength(resultText, "utf8") <= MAX_TOOL_RESULT_BYTES);
  assert.match(resultText, /Subagent run output truncated\. Full result:/);
  assert.ok(resultText.includes(path.join(runDir, "result.md")));
  const aggregate = await fs.readFile(path.join(runDir, "result.md"), "utf8");
  for (const child of subagents) assert.match(aggregate, new RegExp(`## ${child.name} — complete`));
  assert.match(aggregate, /MEDIUM-END/);
});

test("runner builds resume commands from the persisted session cwd", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "forkcwd",
    subagents: [
      { id: "forkcwd-0", name: "fork", task: "session-cwd-different", context: "fork", cwd: dir, sessionFile: "/sessions/fork.jsonl" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.subagents[0].resumeCommand, "(cd -- '/session/project' && pi --session fake-session-id)");
  const events = await fs.readFile(path.join(runDir, "events.jsonl"), "utf8");
  assert.match(events, /--session/);
  assert.match(events, /\/sessions\/fork\.jsonl/);
});

test("runner accumulates usage across assistant turns", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "turnsrun",
    subagents: [
      { id: "turnsrun-0", name: "turns", task: "two-turns", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.subagents[0].usage.turns, 2);
  assert.equal(status.subagents[0].usage.input, 6);
  assert.equal(status.subagents[0].usage.output, 10);
  assert.equal(status.subagents[0].usage.totalTokens, 16);
  assert.equal(status.subagents[0].usage.cost, 0.04);
});

test("runner passes session name, tool, and system prompt append arguments", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "argsrun",
    subagents: [
      { id: "argsrun-0", name: "args", task: "inspect", context: "fresh", tools: false, appendSystemPrompt: "Custom" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const events = await fs.readFile(path.join(runDir, "events.jsonl"), "utf8");
  const start = events.trim().split("\n").map((line) => JSON.parse(line)).find((event) => event.type === "subagent_start");
  const nameIndex = start.args.indexOf("--name");
  assert.deepEqual(start.args.slice(nameIndex, nameIndex + 2), ["--name", "subagent: args"]);
  assert.match(events, /--no-tools/);
  assert.match(events, /--append-system-prompt/);
  assert.doesNotMatch(events, /"--system-prompt"/);
  assert.equal(await fs.readFile(path.join(runDir, "prompt-0-args.md"), "utf8"), "Custom");
});

test("runner writes raw child jsonl only when includeJsonl is true", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "jsonlrun",
    includeJsonl: true,
    subagents: [
      { id: "jsonlrun-0", name: "one", task: "inspect one", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.match(await fs.readFile(status.subagents[0].stdoutFile, "utf8"), /message_end/);
});

test("runner caps raw child jsonl", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "caprun",
    includeJsonl: true,
    maxJsonlBytes: 200,
    subagents: [
      { id: "caprun-0", name: "one", task: "many-jsonl", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.match(await fs.readFile(status.subagents[0].stdoutFile, "utf8"), /subagent_jsonl_truncated/);
});

test("runner writes sanitized normalized activity without raw JSONL", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "transcript",
    includeJsonl: false,
    subagents: [
      { id: "transcript-0", name: "events", task: "transcript-events", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);
  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.subagents[0].stdoutFile, undefined);
  const transcript = await fs.readFile(status.subagents[0].transcriptFile, "utf8");
  const records = transcript.trim().split("\n").map((line) => JSON.parse(line));
  assert.ok(records.some((record) => record.type === "warning" && /Malformed/.test(record.text)));
  assert.ok(records.some((record) => record.type === "tool_start"));
  assert.ok(records.some((record) => record.type === "tool_update"));
  assert.ok(records.some((record) => record.type === "tool_end"));
  assert.ok(records.some((record) => record.type === "error"));
  assert.ok(records.some((record) => record.type === "assistant"));
  assert.ok(records.some((record) => record.type === "tool_update" && record.text === "update text"));
  assert.ok(records.some((record) => record.type === "tool_end" && record.text === "done text"));
  assert.doesNotMatch(transcript, /\u001b|\u000[0-8bcef]|\u202e/i);
});

test("runner caps normalized transcript at one configured limit with a truncation marker", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "transcriptcap",
    maxTranscriptBytes: 300,
    subagents: [
      { id: "transcriptcap-0", name: "many", task: "many-jsonl", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);
  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  const transcript = await fs.readFile(status.subagents[0].transcriptFile, "utf8");
  assert.equal(status.subagents[0].transcriptTruncated, true);
  assert.ok(Buffer.byteLength(transcript) <= 300);
  assert.equal(status.subagents[0].transcriptBytes, Buffer.byteLength(transcript));
  assert.ok(transcript.trim().split("\n").map((line) => JSON.parse(line)).some((record) => record.type === "truncated"));
});

test("runner ignores repeated cumulative tool updates without crowding out final assistant output", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "cumulativeupdates",
    maxTranscriptBytes: 1024 * 1024,
    subagents: [{ id: "cumulativeupdates-0", name: "updates", task: "repeated-large-updates", context: "fresh" }],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);
  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  const records = (await fs.readFile(status.subagents[0].transcriptFile, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  const updates = records.filter((record) => record.type === "tool_update");
  assert.equal(status.subagents[0].transcriptTruncated, false);
  assert.equal(updates.length, 1);
  assert.ok(Buffer.byteLength(updates[0].text, "utf8") <= 8 * 1024);
  assert.ok(records.some((record) => record.type === "assistant" && /repeated-large-updates/.test(record.text)));
});

test("runner final-drains child that lingers after clean final output", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "linger",
    subagents: [
      { id: "linger-0", name: "linger", task: "linger-after-stop", context: "fresh" },
    ],
  });

  const started = Date.now();
  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi }, timeout: 5000 });
  assert.equal(result.code, 0, result.stderr);
  assert.ok(Date.now() - started < 4000);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.state, "complete");
  assert.equal(status.subagents[0].state, "complete");
  assert.equal(status.subagents[0].exitCode, 0);
});

test("runner marks failed subagent and exits nonzero", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "failrun",
    subagents: [
      { id: "failrun-0", name: "good", task: "inspect", context: "fresh" },
      { id: "failrun-1", name: "bad", task: "fail this", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 1);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.state, "failed");
  assert.deepEqual(status.subagents.map((subagent) => subagent.state), ["complete", "failed"]);
  assert.equal(status.subagents[1].exitCode, 7);

  const stderr = await fs.readFile(status.subagents[1].stderrFile, "utf8");
  assert.match(stderr, /fake failure/);
  assert.equal((await fs.stat(status.subagents[1].stderrFile)).mode & 0o777, 0o600);
});

test("runner cancels a queued child without launching it", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "cancelqueued";
  const runDir = path.join(dir, runId);
  const config = {
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [
      { id: `${runId}-0`, name: "running", task: "slow task", context: "fresh", cwd: dir },
      { id: `${runId}-1`, name: "queued", task: "inspect", context: "fresh", cwd: dir },
    ],
  };
  const running = runSubagents(config);
  await waitForStatus(runDir, (value) => value.subagents[0].state === "running" && value.subagents[1].state === "queued");
  const address = { runDir, runId, childId: `${runId}-1`, index: 1 };
  assert.equal(writeAbortMarker(address), true);
  const marker = await fs.readFile(path.join(runDir, "control", "abort-1.json"), "utf8");
  assert.equal(writeAbortMarker(address), true);
  assert.equal(await fs.readFile(path.join(runDir, "control", "abort-1.json"), "utf8"), marker);

  const { status } = await running;
  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "complete");
  assert.equal(status.subagents[1].state, "cancelled");
  assert.equal(status.subagents[1].reason, "Cancelled by user");
  assert.match((await fs.readFile(path.join(runDir, "result.md"), "utf8")), /Cancelled by user/);
  const events = (await fs.readFile(path.join(runDir, "events.jsonl"), "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(events.some((event) => event.type === "subagent_start" && event.index === 1), false);
});

test("detached runner exits successfully for a cancelled-only run", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "cancelrunner";
  const runDir = path.join(dir, runId);
  await fs.mkdir(runDir, { recursive: true });
  const configPath = path.join(runDir, "config.json");
  await fs.writeFile(configPath, JSON.stringify({
    runId,
    runDir,
    cwd: dir,
    mode: "background",
    notify: "none",
    concurrency: 1,
    subagents: [{ id: `${runId}-0`, name: "cancel", task: "inspect", context: "fresh", cwd: dir }],
  }));
  assert.equal(writeAbortMarker({ runDir, runId, childId: `${runId}-0`, index: 0 }), true);

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 0, result.stderr);
  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "cancelled");
});

test("runner control poll cancels queued children before an occupied slot frees", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "promptqueuedcancel";
  const runDir = path.join(dir, runId);
  const controller = new AbortController();
  const running = runSubagents({
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [
      { id: `${runId}-0`, name: "occupied", task: "occupy-slot", context: "fresh", cwd: dir },
      { id: `${runId}-1`, name: "queued", task: "inspect", context: "fresh", cwd: dir },
    ],
  }, { signal: controller.signal });

  await waitForStatus(runDir, (value) => value.subagents[0].state === "running" && value.subagents[1].state === "queued");
  const markedAt = Date.now();
  assert.equal(writeAbortMarker({ runDir, runId, childId: `${runId}-1`, index: 1 }), true);
  const prompt = await waitForStatus(runDir, (value) => value.subagents[0].state === "running" && value.subagents[1].state === "cancelled", 750);
  assert.ok(Date.now() - markedAt < 750);
  assert.equal(prompt.subagents[1].reason, "Cancelled by user");
  const events = (await fs.readFile(path.join(runDir, "events.jsonl"), "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(events.filter((event) => event.type === "subagent_end" && event.index === 1).length, 1);
  assert.equal(events.some((event) => event.type === "subagent_start" && event.index === 1), false);

  controller.abort();
  await running;
});

test("runner cancels one running child while its sibling completes", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "cancelrunning";
  const runDir = path.join(dir, runId);
  const config = {
    runId,
    runDir,
    cwd: dir,
    mode: "background",
    notify: "none",
    concurrency: 2,
    piScript: fakePi,
    subagents: [
      { id: `${runId}-0`, name: "cancel", task: "slow task", context: "fresh", cwd: dir },
      { id: `${runId}-1`, name: "continue", task: "slow task", context: "fresh", cwd: dir },
    ],
  };
  const running = runSubagents(config);
  await waitForStatus(runDir, (value) => value.subagents.every((child) => child.state === "running"));
  assert.equal(writeAbortMarker({ runDir, runId, childId: `${runId}-0`, index: 0 }), true);

  const { status, resultText } = await running;
  assert.equal(status.mode, "background");
  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "cancelled");
  assert.equal(status.subagents[0].reason, "Cancelled by user");
  assert.equal(status.subagents[1].state, "complete");
  assert.match(resultText, /## cancel — cancelled/);
  assert.match(resultText, /## continue — complete/);
  const cancelledActivity = (await fs.readFile(status.subagents[0].transcriptFile, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.ok(cancelledActivity.some((event) => event.type === "warning" && event.text === "Cancelled by user"));
});

test("runner reports failed when a fanout mixes failure and cancellation", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "failandcancel";
  const runDir = path.join(dir, runId);
  const config = {
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 2,
    piScript: fakePi,
    subagents: [
      { id: `${runId}-0`, name: "fail", task: "fail this", context: "fresh", cwd: dir },
      { id: `${runId}-1`, name: "cancel", task: "inspect", context: "fresh", cwd: dir },
    ],
  };
  assert.equal(writeAbortMarker({ runDir, runId, childId: `${runId}-1`, index: 1 }), true);

  const { status } = await runSubagents(config);
  assert.equal(status.state, "failed");
  assert.deepEqual(status.subagents.map((child) => child.state), ["failed", "cancelled"]);
});

test("runner does not launch queued subagents after abort", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runDir = path.join(dir, "run");
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 50);

  const { status, resultText } = await runSubagents({
    runId: "abortrun",
    runDir,
    cwd: dir,
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [
      { id: "abortrun-0", name: "slow", task: "slow task", context: "fresh", cwd: dir },
      { id: "abortrun-1", name: "queued", task: "inspect", context: "fresh", cwd: dir },
    ],
  }, { signal: controller.signal });

  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "cancelled");
  assert.equal(status.subagents[0].reason, "Aborted");
  assert.equal(status.subagents[1].state, "cancelled");
  assert.equal(status.subagents[1].reason, "Aborted");
  assert.match(resultText, /Aborted/);
  for (const child of status.subagents) {
    const activity = (await fs.readFile(child.transcriptFile, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    assert.ok(activity.some((event) => event.type === "warning" && event.text === child.reason));
  }
  const events = await fs.readFile(path.join(runDir, "events.jsonl"), "utf8");
  assert.doesNotMatch(events, /queued/);
});

test("runner does not advertise a fresh session that exits before an assistant message", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "unpersisted",
    subagents: [
      { id: "unpersisted-0", name: "fresh", task: "exit-before-message", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi } });
  assert.equal(result.code, 1);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.subagents[0].sessionId, "fake-session-id");
  assert.equal(status.subagents[0].resumeCommand, undefined);
  assert.doesNotMatch(await fs.readFile(path.join(runDir, "result.md"), "utf8"), /> Resume:/);
});

test("runner times out slow subagents", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const { runDir, configPath } = await writeConfig(dir, {
    runId: "slowrun",
    timeoutMs: 100,
    subagents: [
      { id: "slowrun-0", name: "slow", task: "slow task", context: "fresh" },
    ],
  });

  const result = await execNode([runner, configPath], { env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: fakePi }, timeout: 5000 });
  assert.equal(result.code, 1);

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(status.state, "failed");
  assert.match(status.subagents[0].error, /Timed out/);
});

test("runner publishes child terminals under a running parent and result before the only parent terminal", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "publication";
  const runDir = path.join(dir, runId);
  const observations = [];
  const finished = await runSubagents({
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [{ id: `${runId}-0`, name: "one", task: "inspect", context: "fresh", cwd: dir }],
  }, {
    onUpdate(status) {
      observations.push({
        runState: status.state,
        childState: status.subagents[0].state,
        resultExists: existsSync(path.join(runDir, "result.md")),
      });
    },
  });

  assert.equal(finished.status.state, "complete");
  assert.ok(observations.some((value) => value.childState === "complete" && value.runState === "running"));
  const terminals = observations.filter((value) => value.runState !== "running");
  assert.equal(terminals.length, 1);
  assert.ok(terminals.every((value) => value.resultExists));
  assert.equal((await fs.readdir(runDir)).some((name) => name.startsWith("result.md.") && name.endsWith(".tmp")), false);
});

test("runner rechecks cancellation immediately before spawn", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "prespawn";
  const runDir = path.join(dir, runId);
  let requested = false;
  const { status } = await runSubagents({
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [{ id: `${runId}-0`, name: "one", task: "inspect", context: "fresh", cwd: dir }],
  }, {
    onUpdate(value) {
      if (!requested && value.subagents[0].state === "running") {
        requested = writeAbortMarker({ runDir, runId, childId: `${runId}-0`, index: 0 });
      }
    },
  });

  assert.equal(requested, true);
  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "cancelled");
  assert.equal(status.subagents[0].reason, "Cancelled by user");
  const events = (await fs.readFile(path.join(runDir, "events.jsonl"), "utf8")).trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(events.some((event) => event.type === "subagent_start"), false);
});

test("runner gives a late cancellation request precedence over successful child exit", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "latecancel";
  const runDir = path.join(dir, runId);
  let requested = false;
  const { status } = await runSubagents({
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [{ id: `${runId}-0`, name: "one", task: "inspect", context: "fresh", cwd: dir }],
  }, {
    onUpdate(value) {
      if (!requested && value.subagents[0].state === "running" && value.subagents[0].preview.startsWith("result for")) {
        requested = writeAbortMarker({ runDir, runId, childId: `${runId}-0`, index: 0 });
      }
    },
  });

  assert.equal(requested, true);
  assert.equal(status.state, "cancelled");
  assert.equal(status.subagents[0].state, "cancelled");
  assert.equal(status.subagents[0].reason, "Cancelled by user");
});

test("runner errors still atomically publish aggregate output before failed terminal status", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-runner-test-"));
  const fakePi = await makeFakePi(dir);
  const runId = "runnererror";
  const runDir = path.join(dir, runId);
  let blocked = false;
  let terminalHadResult = false;
  await assert.rejects(runSubagents({
    runId,
    runDir,
    cwd: dir,
    mode: "foreground",
    notify: "none",
    concurrency: 1,
    piScript: fakePi,
    subagents: [{ id: `${runId}-0`, name: "blocked", task: "inspect", context: "fresh", cwd: dir }],
  }, {
    onUpdate(status) {
      if (!blocked && status.subagents[0].state === "queued") {
        blocked = true;
        requireDirectory(path.join(runDir, "input-0-blocked.md"));
      }
      if (status.state !== "running") terminalHadResult = existsSync(path.join(runDir, "result.md"));
    },
  }));

  const status = JSON.parse(await fs.readFile(path.join(runDir, "status.json"), "utf8"));
  assert.equal(terminalHadResult, true);
  assert.equal(status.state, "failed");
  assert.match(await fs.readFile(path.join(runDir, "result.md"), "utf8"), /EISDIR|illegal operation/i);
});

function requireDirectory(dir) {
  const { mkdirSync } = process.getBuiltinModule("node:fs");
  mkdirSync(dir);
}
