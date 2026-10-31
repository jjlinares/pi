#!/usr/bin/env node
import fs from "node:fs";
import { KILL_GRACE_MS, failRunningRun, runSubagents } from "./executor.mjs";

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: runner.mjs <config.json>");
  process.exit(2);
}

// Termination by signal publishes a failed status instead of leaving the run "running".
// Shutdown is bounded: a child whose pipes never close must not keep the runner alive.
const SHUTDOWN_DEADLINE_MS = KILL_GRACE_MS + 2000;
const controller = new AbortController();
let terminatedBy;
let runDir;
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(signal, () => {
    if (terminatedBy) return;
    terminatedBy = signal;
    controller.abort();
    setTimeout(() => {
      try { if (runDir) failRunningRun(runDir, `Subagent runner received ${signal} and did not shut down in time.`); } catch {}
      process.exit(1);
    }, SHUTDOWN_DEADLINE_MS).unref();
  });
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  runDir = config.runDir;
  const { status } = await runSubagents(config, {
    signal: controller.signal,
    terminationReason: () => terminatedBy && `Subagent runner received ${terminatedBy}.`,
  });
  process.exit(status.state === "failed" ? 1 : 0);
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
