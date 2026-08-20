import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ExtensionAPI, SourceInfo } from "@earendil-works/pi-coding-agent";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { getBashPolicy, hasInterpolations, interpolateSkillContent, type RunCommand } from "./core.ts";

type SkillFrontmatter = { "allowed-tools"?: unknown };
type SkillRef = { name: string; filePath: string; baseDir: string };

const EXEC_MAX_BUFFER = 5 * 1024 * 1024;

const runShellCommand: RunCommand = (command, cwd, options) => new Promise((resolve, reject) => {
	const child = exec(command, {
		cwd,
		timeout: options.timeoutMs,
		maxBuffer: EXEC_MAX_BUFFER,
		signal: options.signal,
		encoding: "utf8",
	}, (error, stdout, stderr) => {
		if (error) {
			const message = stderr.trim() || stdout.trim() || error.message;
			reject(new Error(message));
			return;
		}
		resolve({ stdout, stderr });
	});
	child.stdin?.end();
});

export default function registerSkillInterpolation(pi: ExtensionAPI): void {
	pi.on("input", async (event, ctx) => {
		if (event.source === "extension") return { action: "continue" as const };
		const invocation = parseSkillInvocation(event.text);
		if (!invocation) return { action: "continue" as const };

		const skill = findSkill(pi, invocation.name);
		if (!skill) return { action: "continue" as const };

		let raw: string;
		try {
			raw = await readFile(skill.filePath, "utf8");
		} catch {
			return { action: "continue" as const };
		}

		let parsed: { frontmatter: SkillFrontmatter; body: string };
		try {
			parsed = parseFrontmatter<SkillFrontmatter>(raw);
		} catch {
			return { action: "continue" as const };
		}
		const { frontmatter, body } = parsed;
		const policy = getBashPolicy(frontmatter["allowed-tools"]);
		if (!policy || !hasInterpolations(body)) return { action: "continue" as const };

		const interpolated = await interpolateSkillContent(body.trim(), skill.baseDir, policy, runShellCommand, {
			signal: ctx.signal,
		});
		const block = `<skill name="${skill.name}" location="${skill.filePath}">\nReferences are relative to ${skill.baseDir}.\n\n${interpolated}\n</skill>`;
		return { action: "transform" as const, text: invocation.args ? `${block}\n\n${invocation.args}` : block };
	});

	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "read") return;

		const inputPath = (event as { input?: { path?: unknown } }).input?.path;
		if (typeof inputPath !== "string" || !inputPath.endsWith(".md")) return;

		let changed = false;
		const absolutePath = path.resolve(ctx.cwd, inputPath.replace(/^@/, ""));
		const cwd = path.dirname(absolutePath);
		const nextContent = [];

		for (const item of event.content ?? []) {
			if (item.type !== "text" || typeof item.text !== "string" || !hasInterpolations(item.text)) {
				nextContent.push(item);
				continue;
			}

			let frontmatter: SkillFrontmatter;
			try {
				frontmatter = parseFrontmatter<SkillFrontmatter>(item.text).frontmatter;
			} catch {
				nextContent.push(item);
				continue;
			}
			const policy = getBashPolicy(frontmatter["allowed-tools"]);
			if (!policy) {
				nextContent.push(item);
				continue;
			}

			changed = true;
			nextContent.push({
				...item,
				text: await interpolateSkillContent(item.text, cwd, policy, runShellCommand, { signal: ctx.signal }),
			});
		}

		if (!changed) return;
		return { content: nextContent };
	});
}

function parseSkillInvocation(text: string): { name: string; args: string } | null {
	if (!text.startsWith("/skill:")) return null;
	const spaceIndex = text.indexOf(" ");
	const name = spaceIndex === -1 ? text.slice(7) : text.slice(7, spaceIndex);
	if (!name) return null;
	return { name, args: spaceIndex === -1 ? "" : text.slice(spaceIndex + 1).trim() };
}

function findSkill(pi: ExtensionAPI, name: string): SkillRef | null {
	const command = pi.getCommands().find((candidate) => candidate.source === "skill" && candidate.name === `skill:${name}`);
	if (!command) return null;
	return skillFromSourceInfo(name, command.sourceInfo);
}

function skillFromSourceInfo(name: string, sourceInfo: SourceInfo): SkillRef {
	return {
		name,
		filePath: sourceInfo.path,
		baseDir: sourceInfo.baseDir ?? path.dirname(sourceInfo.path),
	};
}
