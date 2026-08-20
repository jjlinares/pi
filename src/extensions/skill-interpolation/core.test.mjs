import test from "node:test";
import assert from "node:assert/strict";
import { getBashPolicy, hasInterpolations, interpolateSkillContent, isCommandAllowed } from "./core.ts";

test("detects interpolation markers", () => {
	assert.equal(hasInterpolations("branch !`git branch --show-current`"), true);
	assert.equal(hasInterpolations("plain `code`"), false);
});

test("requires Bash in allowed-tools", () => {
	assert.equal(getBashPolicy("Read Write"), null);
	assert.deepEqual(getBashPolicy("Bash"), { allowAll: true, patterns: [] });
});

test("honors restricted Bash command prefixes", () => {
	const policy = getBashPolicy("Read Bash(git:*) Bash(gh:*)");
	assert.ok(policy);
	assert.equal(isCommandAllowed("git status", policy), true);
	assert.equal(isCommandAllowed("gh pr diff", policy), true);
	assert.equal(isCommandAllowed("rm -rf .", policy), false);
	assert.equal(isCommandAllowed("git status && rm -rf .", policy), false);
});

test("interpolates allowed commands", async () => {
	const policy = getBashPolicy("Bash(echo:*)");
	const calls = [];
	const output = await interpolateSkillContent("value: !`echo hello`", "/tmp/skill", policy, async (command, cwd) => {
		calls.push({ command, cwd });
		return { stdout: "hello\n" };
	});

	assert.equal(output, "value: hello");
	assert.deepEqual(calls, [{ command: "echo hello", cwd: "/tmp/skill" }]);
});

test("blocks commands outside restricted policy", async () => {
	const policy = getBashPolicy("Bash(git:*)");
	const output = await interpolateSkillContent("!`rm -rf .`", "/tmp/skill", policy, async () => {
		throw new Error("must not run");
	});
	assert.match(output, /blocked: not allowed/);
});

test("renders command failures inline", async () => {
	const policy = getBashPolicy("Bash");
	const output = await interpolateSkillContent("!`git nope`", "/tmp/skill", policy, async () => {
		throw new Error("fatal: nope\nmore");
	});
	assert.equal(output, "[error: `git nope` failed: fatal: nope]");
});

test("truncates oversized output", async () => {
	const policy = getBashPolicy("Bash");
	const output = await interpolateSkillContent("!`yes`", "/tmp/skill", policy, async () => ({ stdout: "a\nb\nc\nd" }), {
		maxLines: 2,
		maxBytes: 100,
	});
	assert.equal(output, "a\nb\n[output truncated: max 2 lines / 100 bytes]");
});
