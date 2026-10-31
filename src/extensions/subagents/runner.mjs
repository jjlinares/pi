#!/usr/bin/env node
import fs from "node:fs";
import { runSubagents } from "./executor.mjs";

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: runner.mjs <config.json>");
  process.exit(2);
}

// Termination by signal publishes a failed status instead of leaving the run "running".
const controller = new AbortController();
let terminatedBy;
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(signal, () => {
    terminatedBy ??= signal;
    controller.abort();
  });
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const { status } = await runSubagents(config, {
    signal: controller.signal,
    terminationReason: () => terminatedBy && `Subagent runner received ${terminatedBy}.`,
  });
  process.exit(status.state === "failed" ? 1 : 0);
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
