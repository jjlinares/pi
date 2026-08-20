import test from "node:test";
import assert from "node:assert/strict";
import { keyHint, StringEnum, Text } from "../pi-compat.ts";

test("Text wrapping ignores ANSI escape bytes", () => {
	const rendered = new Text("\u001b[32mhello world\u001b[0m", 0, 0).render(12);

	assert.equal(rendered.length, 1);
	assert.match(rendered[0] ?? "", /hello world/);
});

test("Text padding uses visible width", () => {
	const rendered = new Text("\u001b[32mok\u001b[0m", 0, 0).render(5);

	assert.equal(rendered[0]?.endsWith("   "), true);
});

test("StringEnum emits Google-compatible string enum schema", () => {
	assert.deepEqual(StringEnum(["markdown", "text"] as const, { description: "Format" }), {
		type: "string",
		enum: ["markdown", "text"],
		description: "Format",
	});
});

test("keyHint includes default expand key", () => {
	assert.equal(keyHint("app.tools.expand", "for details"), "ctrl+o for details");
});
