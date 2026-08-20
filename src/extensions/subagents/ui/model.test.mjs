import test from "node:test";
import assert from "node:assert/strict";
import {
  boundText,
  createDashboardState,
  createDetailScrollState,
  endDetailScroll,
  filterDashboardItems,
  homeDetailScroll,
  moveDashboardSelection,
  parseNormalizedTranscriptJsonl,
  reconcileDashboard,
  reconcileDetailScroll,
  sanitizeText,
  scrollDetail,
} from "./model.ts";

test("dashboard defaults to exact current-directory children and can show all", () => {
  const items = [
    { id: "current", cwd: "/work/repo" },
    { id: "normalized", cwd: "/work/repo/./" },
    { id: "nested", cwd: "/work/repo/pkg" },
    { id: "other", cwd: "/work/other" },
  ];
  assert.deepEqual(filterDashboardItems(items, "/work/repo", "current").map((item) => item.id), ["current", "normalized"]);
  assert.deepEqual(filterDashboardItems(items, "/work/repo", "all").map((item) => item.id), items.map((item) => item.id));
});

test("dashboard selection survives reorder and keeps the selected row visible", () => {
  let state = createDashboardState(["a", "b", "c", "d"]);
  state = moveDashboardSelection(state, ["a", "b", "c", "d"], 3, 2);
  assert.deepEqual(state, { selectedId: "d", selectedIndexHint: 3, viewportStart: 2 });

  state = reconcileDashboard(state, ["new", "d", "a", "b", "c"], 2);
  assert.equal(state.selectedId, "d");
  assert.equal(state.selectedIndexHint, 1);
  assert.equal(state.viewportStart, 1);
});

test("dashboard chooses the nearest stable index when the selected child disappears", () => {
  const state = { selectedId: "c", selectedIndexHint: 2, viewportStart: 1 };
  assert.deepEqual(reconcileDashboard(state, ["a", "b", "d"], 2), {
    selectedId: "d",
    selectedIndexHint: 2,
    viewportStart: 1,
  });
  assert.deepEqual(reconcileDashboard(state, [], 2), { selectedIndexHint: 0, viewportStart: 0 });
});

test("detail scrolling pins live updates only while at the bottom", () => {
  let state = reconcileDetailScroll(createDetailScrollState(), 20, 5);
  assert.deepEqual(state, { offset: 15, pinnedToBottom: true });
  state = reconcileDetailScroll(state, 24, 5);
  assert.equal(state.offset, 19);

  state = scrollDetail(state, -2, 24, 5);
  assert.deepEqual(state, { offset: 17, pinnedToBottom: false });
  state = reconcileDetailScroll(state, 30, 5);
  assert.equal(state.offset, 17);
  assert.deepEqual(homeDetailScroll(), { offset: 0, pinnedToBottom: false });
  assert.deepEqual(endDetailScroll(30, 5), { offset: 25, pinnedToBottom: true });
});

test("normalized transcript parser ignores malformed records and incomplete tails", () => {
  const input = [
    JSON.stringify({ ts: 1, type: "assistant", text: "hello\u001b[31m red" }),
    "not-json",
    JSON.stringify({ ts: 2, type: "tool_start", tool: "read", text: "/tmp/a" }),
    JSON.stringify({ ts: 3, type: "error", text: "incomplete" }),
  ].join("\n");
  assert.deepEqual(parseNormalizedTranscriptJsonl(input), [
    { ts: 1, type: "assistant", text: "hello red" },
    { ts: 2, type: "tool_start", tool: "read", text: "/tmp/a" },
  ]);
});

test("normalized transcript parser is bounded to recent sanitized events", () => {
  const input = [
    JSON.stringify({ ts: 1, type: "assistant", text: "first" }),
    JSON.stringify({ ts: 2, type: "warning", text: "bad\u0000text" }),
    JSON.stringify({ ts: 3, type: "truncated", maxBytes: 1024 }),
    "",
  ].join("\n");
  assert.deepEqual(parseNormalizedTranscriptJsonl(input, { maxEvents: 2 }), [
    { ts: 2, type: "warning", text: "badtext" },
    { ts: 3, type: "truncated", maxBytes: 1024 },
  ]);
});

test("sanitization strips CSI, OSC hyperlinks, controls, bidi overrides, and tabs", () => {
  const value = "a\u001b[31mb\u001b[0m \u001b]8;;https://bad\u0007link\u001b]8;;\u0007\u0000\u202Ec\td";
  assert.equal(sanitizeText(value), "ab linkc    d");
});

test("bounded text caps both characters and lines with an explicit marker", () => {
  assert.deepEqual(boundText("123456789", { maxChars: 5, maxLines: 10 }), {
    text: "12345\n[…truncated]",
    truncated: true,
  });
  assert.deepEqual(boundText("a\nb\nc", { maxChars: 20, maxLines: 2 }), {
    text: "a\nb\n[…truncated]",
    truncated: true,
  });
});
