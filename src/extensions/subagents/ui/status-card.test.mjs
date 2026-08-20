import test from "node:test";
import assert from "node:assert/strict";
import { renderStatusCardLines } from "./status-card.ts";

const theme = {
  fg: (_tone, text) => text,
  bold: (text) => text,
};

function child(overrides = {}) {
  return {
    id: "run-0",
    index: 0,
    parentRunId: "run",
    runDir: "/tmp/run",
    mode: "foreground",
    runState: "complete",
    notify: "none",
    state: "complete",
    name: "workflow-explorer",
    task: "Inspect transaction boundaries and verify external operations.\nReport concrete risks.",
    cwd: "/work",
    context: "fork",
    model: "gpt-5.6-terra",
    thinking: "high",
    runStartedAt: 1_000,
    runUpdatedAt: 53_000,
    startedAt: 1_000,
    completedAt: 53_000,
    updatedAt: 53_000,
    usage: { input: 175_200, output: 7_500, cost: 0.0167, turns: 7, totalTokens: 182_700 },
    toolCount: 26,
    recentTools: [{ tool: "read", args: '{"path":"secret.ts"}', endMs: 20_000 }],
    recentOutput: ["private child output"],
    currentTool: "bash",
    currentToolArgs: '{"command":"do-not-render"}',
    preview: "tool: bash do-not-render",
    outputFile: "/tmp/run/output.md",
    transcriptBytes: 100,
    transcriptTruncated: false,
    resultFile: "/tmp/run/result.json",
    abortRequested: false,
    canAbort: false,
    capabilities: { canAbort: false },
    ...overrides,
  };
}

function run() {
  return {
    state: "complete",
    startedAt: 1_000,
    completedAt: 53_000,
    totalChildren: 2,
    children: [
      child(),
      child({
        id: "run-1",
        index: 1,
        name: "quality-explorer",
        startedAt: 1_000,
        completedAt: 40_000,
        usage: { input: 80_000, output: 7_700, cost: 0.0094, turns: 5, totalTokens: 87_700 },
        toolCount: 27,
      }),
    ],
  };
}

test("wide status card exposes config and telemetry in aligned columns", () => {
  const output = renderStatusCardLines(run(), theme, 120, 53_000).join("\n");
  assert.match(output, /SUBAGENTS\s+COMPLETE\s+2\/2/);
  assert.match(output, /STATUS\s+AGENT\s+MODEL \/ THINKING\s+TIME\s+TURNS\s+CALLS\s+TOKENS\s+COST/);
  assert.match(output, /workflow-explorer\s+gpt-5\.6-terra \/ high\s+00:52\s+7\s+26\s+182\.7k\s+\$0\.0167/);
  assert.match(output, /quality-explorer\s+gpt-5\.6-terra \/ high\s+00:39\s+5\s+27\s+87\.7k\s+\$0\.0094/);
});

test("compact status card never renders tasks, child activity, output, or artifacts", () => {
  const output = renderStatusCardLines(run(), theme, 120, 53_000).join("\n");
  assert.doesNotMatch(output, /transaction boundaries|concrete risks/);
  assert.doesNotMatch(output, /secret\.ts|do-not-render|private child output|output\.md/);
  assert.doesNotMatch(output, /tool:|\bread\b|\bbash\b/);
});

test("expanded status card renders each task but no child tool activity", () => {
  const output = renderStatusCardLines(run(), theme, 72, 53_000, true).join("\n");
  assert.match(output, /TASK  Inspect transaction boundaries and verify external/);
  assert.match(output, /Report concrete risks\./);
  assert.doesNotMatch(output, /secret\.ts|do-not-render|private child output|output\.md/);
  assert.doesNotMatch(output, /tool:|\bread\b|\bbash\b/);
});

test("status card stays within narrow, medium, and wide widths", () => {
  for (const width of [48, 60, 72, 90, 100, 120]) {
    for (const expanded of [false, true]) {
      const lines = renderStatusCardLines(run(), theme, width, 53_000, expanded);
      assert.ok(lines.length > 0);
      for (const line of lines) assert.ok(Array.from(line).length <= width, `${width}: ${line}`);
    }
  }
});

test("missing model and queued timing are explicit", () => {
  const queued = child({ state: "queued", model: undefined, thinking: undefined, startedAt: undefined, completedAt: undefined, usage: undefined, toolCount: 0 });
  const output = renderStatusCardLines({ state: "running", startedAt: 1_000, totalChildren: 1, children: [queued] }, theme, 80, 3_000).join("\n");
  assert.match(output, /default \/ default/);
  assert.match(output, /—\s+0 turns\s+0 calls\s+0 tok\s+\$0\.0000/);
});
