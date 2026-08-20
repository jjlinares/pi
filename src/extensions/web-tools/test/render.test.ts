import test from "node:test";
import assert from "node:assert/strict";
import { appendExpandedPreview, sanitizePreviewText } from "../render.ts";
import { createWebFetchTool } from "../webfetch.ts";
import { createWebSearchTool } from "../websearch.ts";

const theme = {
	fg: (_name: string, value: string) => value,
	bold: (value: string) => value,
};

test("renderers use Pi render context error state", () => {
	const fetchTool = createWebFetchTool();
	const searchTool = createWebSearchTool();

	const fetchRendered = fetchTool.renderResult(
		{ content: [{ type: "text", text: "fetch failed" }], isError: false },
		{ expanded: false, isPartial: false },
		theme,
		{ isError: true },
	).render(80).join("\n");
	const searchRendered = searchTool.renderResult(
		{ content: [{ type: "text", text: "search failed" }], isError: false },
		{ expanded: false, isPartial: false },
		theme,
		{ isError: true },
	).render(80).join("\n");

	assert.match(fetchRendered, /✗ fetch failed/);
	assert.match(searchRendered, /✗ search failed/);
});

test("expanded previews strip terminal control sequences", () => {
	const hostile = "safe\u001b]0;owned\u0007\u001b[31mred\u001b[0m\u0001\roverwrite";

	assert.equal(sanitizePreviewText(hostile), "saferedoverwrite");
	assert.equal(appendExpandedPreview("base", hostile, theme), "base\nsaferedoverwrite");
});
