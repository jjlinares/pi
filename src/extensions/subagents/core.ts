import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseDocument } from "yaml";
import { CONTROL_PROTOCOL_VERSION, resultFilePath, statusFilePath } from "./_protocol.mjs";

export type ContextMode = "fresh" | "fork";
export type NotifyMode = "tui" | "followUp" | "none";
export type ExecutionMode = "foreground" | "background";
export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type SubagentInput = {
	profile?: string;
	name?: string;
	task: string;
	appendSystemPrompt?: string;
	context?: ContextMode;
	model?: string;
	thinking?: ThinkingLevel;
	tools?: string | string[] | false;
	cwd?: string;
};

type SubagentProfile = Partial<Omit<SubagentInput, "task" | "profile">> & { description?: string };

export type SubagentParams = {
	action?: "status" | "check" | "wait" | "cancel";
	id?: string;
	ids?: string[];
	appendSystemPrompt?: string;
	subagents?: SubagentInput[];
	context?: ContextMode;
	model?: string;
	thinking?: ThinkingLevel;
	tools?: string | string[] | false;
	cwd?: string;
	concurrency?: number;
	timeoutMs?: number;
	includeJsonl?: boolean;
	async?: boolean;
	notify?: NotifyMode;
};

export type RunStatus = {
	id: string;
	parentSessionId?: string;
	mode?: ExecutionMode;
	controlProtocolVersion?: number;
	state: "running" | "complete" | "cancelled" | "failed";
	cwd: string;
	notify: NotifyMode;
	startedAt: number;
	updatedAt: number;
	completedAt?: number;
	error?: string;
	subagents: Array<{
		id: string;
		index: number;
		name: string;
		task?: string;
		state: "queued" | "running" | "complete" | "cancelled" | "failed";
		preview?: string;
		outputFile?: string;
		stderrFile?: string;
		cwd?: string;
		context?: ContextMode;
		model?: string;
		thinking?: ThinkingLevel;
		sessionFile?: string;
		sessionId?: string;
		resumeCommand?: string;
		startedAt?: number;
		completedAt?: number;
		updatedAt?: number;
		error?: string;
		reason?: string;
		warning?: string;
		currentTool?: string;
		currentToolArgs?: string;
		currentToolStartedAt?: number;
		currentPath?: string;
		toolCount?: number;
		recentTools?: Array<{ tool: string; args: string; endMs: number }>;
		recentOutput?: string[];
		stdoutFile?: string;
		transcriptFile?: string;
		transcriptBytes?: number;
		transcriptTruncated?: boolean;
		latestActivity?: { type: "assistant" | "tool_start" | "tool_update" | "tool_end" | "warning" | "error"; text?: string; tool?: string; at: number };
		exitCode?: number;
		usage?: { input: number; output: number; cacheRead?: number; cacheWrite?: number; cost: number; turns: number; totalTokens: number };
	}>;
};

export type PlannedSubagent = Required<Pick<SubagentInput, "task" | "context">> & {
	id: string;
	name: string;
	appendSystemPrompt?: string;
	model?: string;
	thinking?: ThinkingLevel;
	tools?: string | string[] | false;
	cwd: string;
	sessionFile?: string;
};

export type RunConfig = {
	runId: string;
	runDir: string;
	parentSessionId?: string;
	cwd: string;
	mode: ExecutionMode;
	controlProtocolVersion: number;
	notify: NotifyMode;
	concurrency: number;
	timeoutMs?: number;
	includeJsonl: boolean;
	piScript?: string;
	maxJsonlBytes?: number;
	maxTranscriptBytes?: number;
	subagents: PlannedSubagent[];
};

function sanitizeTempScopeSegment(value: string): string {
	const sanitized = value
		.trim()
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return sanitized || "unknown";
}

export function resolveTempScopeId(): string {
	if (typeof process.getuid === "function") return `uid-${process.getuid()}`;
	for (const key of ["USERNAME", "USER", "LOGNAME"] as const) {
		const value = process.env[key];
		if (value) return `user-${sanitizeTempScopeSegment(value)}`;
	}
	try {
		const username = os.userInfo().username;
		if (username) return `user-${sanitizeTempScopeSegment(username)}`;
	} catch {}
	const home = process.env.HOME ?? process.env.USERPROFILE ?? os.homedir();
	if (home) return `home-${sanitizeTempScopeSegment(home)}`;
	return "shared";
}

export const RUN_ROOT = path.join(os.tmpdir(), `pi-subagents-${resolveTempScopeId()}`, "runs");
export const DEFAULT_CONCURRENCY = 4;
export const MAX_LISTED_RUNS = 12;
export const DEFAULT_THINKING: ThinkingLevel = "medium";

export function ensureDir(dir: string): void {
	fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
	try { fs.chmodSync(dir, 0o700); } catch {}
}

export function randomId(): string {
	return randomBytes(8).toString("hex");
}

export function safeName(value: string | undefined, fallback: string): string {
	return (value ?? fallback).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
}

export function readJson<T>(file: string): T | undefined {
	try {
		return JSON.parse(fs.readFileSync(file, "utf8")) as T;
	} catch {
		return undefined;
	}
}

export function statusPath(runDir: string): string {
	return statusFilePath(runDir);
}

export function resultPath(runDir: string): string {
	return resultFilePath(runDir);
}

export function listRunDirs(root = RUN_ROOT): string[] {
	ensureDir(root);
	return fs.readdirSync(root, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(root, entry.name))
		.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function runBelongsToSession(dir: string, parentSessionId: string | undefined): boolean {
	if (parentSessionId === undefined) return true;
	return readJson<RunStatus>(statusPath(dir))?.parentSessionId === parentSessionId;
}

export function findRunDir(id?: string, root = RUN_ROOT, parentSessionId?: string): string | undefined {
	if (!id) return undefined;
	const dirs = listRunDirs(root).filter((dir) => runBelongsToSession(dir, parentSessionId));
	const exact = dirs.find((dir) => path.basename(dir) === id);
	if (exact) return exact;
	const matches = dirs.filter((dir) => path.basename(dir).startsWith(id));
	if (matches.length > 1) {
		throw new Error(`Ambiguous subagent run id prefix "${id}": ${matches.map((dir) => path.basename(dir)).join(", ")}.`);
	}
	return matches[0];
}

export function resolveSubagents(params: SubagentParams): SubagentInput[] {
	if ((params.subagents?.length ?? 0) === 0) {
		throw new Error("Provide at least one subagent in subagents[].");
	}
	return params.subagents!;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
	return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}

function assertLocalProfilePath(profile: string): void {
	if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(profile) || profile.startsWith("file:")) {
		throw new Error(`Subagent profile must be a local file path: ${profile}`);
	}
}

function parseProfileYaml(content: string, profilePath: string): unknown {
	const doc = parseDocument(content, { prettyErrors: false });
	if (doc.errors.length > 0) {
		throw new Error(`Invalid subagent profile ${profilePath}: ${doc.errors[0].message}`);
	}
	return doc.toJS() ?? {};
}

function assertString(value: unknown, field: string, profilePath: string): asserts value is string {
	if (typeof value !== "string") throw new Error(`Invalid subagent profile ${profilePath}: ${field} must be a string.`);
}

function validateProfile(value: unknown, profilePath: string): SubagentProfile {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`Invalid subagent profile ${profilePath}: expected an object.`);
	}
	const profile = value as Record<string, unknown>;
	const allowed = new Set(["name", "description", "appendSystemPrompt", "context", "model", "thinking", "tools", "cwd"]);
	for (const key of Object.keys(profile)) {
		if (key === "task") throw new Error(`Invalid subagent profile ${profilePath}: task belongs in the tool call, not the profile.`);
		if (key === "profile") throw new Error(`Invalid subagent profile ${profilePath}: nested profiles are not supported.`);
		if (!allowed.has(key)) throw new Error(`Invalid subagent profile ${profilePath}: unknown field ${key}.`);
	}
	for (const key of ["name", "description", "appendSystemPrompt", "model", "cwd"] as const) {
		if (profile[key] !== undefined) assertString(profile[key], key, profilePath);
	}
	if (profile.context !== undefined && profile.context !== "fresh" && profile.context !== "fork") {
		throw new Error(`Invalid subagent profile ${profilePath}: context must be fresh or fork.`);
	}
	if (profile.thinking !== undefined && !["off", "minimal", "low", "medium", "high", "xhigh"].includes(String(profile.thinking))) {
		throw new Error(`Invalid subagent profile ${profilePath}: invalid thinking level.`);
	}
	if (profile.tools !== undefined && profile.tools !== false && typeof profile.tools !== "string" && (!Array.isArray(profile.tools) || !profile.tools.every((tool) => typeof tool === "string"))) {
		throw new Error(`Invalid subagent profile ${profilePath}: tools must be a string, string array, or false.`);
	}
	return profile as SubagentProfile;
}

export function loadSubagentProfile(profile: string, ctxCwd: string): SubagentProfile {
	assertLocalProfilePath(profile);
	const profilePath = path.resolve(ctxCwd, profile);
	return validateProfile(parseProfileYaml(fs.readFileSync(profilePath, "utf8"), profilePath), profilePath);
}

function mergeProfile(subagent: SubagentInput, ctxCwd: string): SubagentInput {
	if (!subagent.profile) return subagent;
	const { profile: profilePath, ...inline } = subagent;
	const profile = loadSubagentProfile(profilePath, ctxCwd);
	const { description: _description, ...profileConfig } = profile;
	return { ...profileConfig, ...withoutUndefined(inline), task: subagent.task };
}

export function buildRunConfig(input: {
	params: SubagentParams;
	ctxCwd: string;
	runId: string;
	runDir: string;
	parentSessionId?: string;
	forkSessionForIndex?: (index: number) => string | undefined;
}): RunConfig {
	const { params, ctxCwd, runId, runDir } = input;
	const cwd = path.resolve(ctxCwd, params.cwd ?? ".");
	const topContext = params.context ?? "fresh";
	const forkSessionForIndex = input.forkSessionForIndex ?? (() => undefined);
	const subagents = resolveSubagents(params).map((inputSubagent, index): PlannedSubagent => {
		const subagent = mergeProfile(inputSubagent, ctxCwd);
		const context = subagent.context ?? topContext;
		const appendSystemPrompt = subagent.appendSystemPrompt ?? params.appendSystemPrompt;
		const model = subagent.model ?? params.model;
		const thinking = subagent.thinking ?? params.thinking ?? DEFAULT_THINKING;
		const tools = subagent.tools ?? params.tools;
		return {
			id: `${runId}-${index}`,
			name: subagent.name ?? safeName(appendSystemPrompt?.split("\n", 1)[0], `subagent-${index + 1}`),
			task: subagent.task,
			...(appendSystemPrompt ? { appendSystemPrompt } : {}),
			context,
			...(model ? { model } : {}),
			...(thinking ? { thinking } : {}),
			...(tools !== undefined ? { tools } : {}),
			cwd: path.resolve(cwd, subagent.cwd ?? "."),
			...(context === "fork" ? { sessionFile: forkSessionForIndex(index) } : {}),
		};
	});
	return {
		runId,
		runDir,
		...(input.parentSessionId ? { parentSessionId: input.parentSessionId } : {}),
		cwd,
		mode: params.async === true ? "background" : "foreground",
		controlProtocolVersion: CONTROL_PROTOCOL_VERSION,
		notify: params.notify ?? "tui",
		concurrency: params.concurrency ?? DEFAULT_CONCURRENCY,
		...(params.timeoutMs ? { timeoutMs: params.timeoutMs } : {}),
		includeJsonl: params.includeJsonl === true,
		subagents,
	};
}

export function needsFork(params: SubagentParams, ctxCwd?: string): boolean {
	const topContext = params.context ?? "fresh";
	return resolveSubagents(params).some((inputSubagent) => {
		const subagent = ctxCwd ? mergeProfile(inputSubagent, ctxCwd) : inputSubagent;
		return (subagent.context ?? topContext) === "fork";
	});
}

export function formatDuration(ms: number): string {
	const seconds = Math.max(0, Math.round(ms / 1000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const rest = seconds % 60;
	return `${minutes}m${rest ? ` ${rest}s` : ""}`;
}

export function formatRunLine(status: RunStatus, now = Date.now()): string {
	const icon = status.state === "complete" ? "✓" : status.state === "cancelled" ? "−" : status.state === "failed" ? "✗" : "…";
	const done = status.subagents.filter((task) => task.state === "complete" || task.state === "cancelled" || task.state === "failed").length;
	const age = formatDuration((status.completedAt ?? now) - status.startedAt);
	return `${icon} ${status.id} ${status.state} ${done}/${status.subagents.length} ${age}`;
}

export function formatStatus(runDir?: string, root = RUN_ROOT, now = Date.now(), parentSessionId?: string): string {
	if (!runDir) {
		const runs = listRunDirs(root)
			.filter((dir) => runBelongsToSession(dir, parentSessionId))
			.map((dir) => readJson<RunStatus>(statusPath(dir)))
			.filter((status): status is RunStatus => Boolean(status))
			.slice(0, MAX_LISTED_RUNS);
		if (runs.length === 0) return "No subagent runs found.";
		return ["Subagent runs:", ...runs.map((status) => formatRunLine(status, now))].join("\n");
	}

	const status = readJson<RunStatus>(statusPath(runDir));
	if (!status || (parentSessionId !== undefined && status.parentSessionId !== parentSessionId)) {
		return `No status found for ${path.basename(runDir)}.`;
	}
	const lines = [formatRunLine(status, now), `dir: ${runDir}`];
	for (const task of status.subagents) {
		lines.push(`\n## ${task.name} (${task.id}) — ${task.state}`);
		if (task.preview) lines.push(task.preview);
		if (task.resumeCommand) lines.push(`resume: ${task.resumeCommand}`);
		if (task.outputFile) lines.push(`output: ${task.outputFile}`);
		if (task.stderrFile && fs.existsSync(task.stderrFile) && fs.statSync(task.stderrFile).size > 0) {
			lines.push(`stderr: ${task.stderrFile}`);
		}
	}
	const result = resultPath(runDir);
	if (fs.existsSync(result)) lines.push(`\nresult: ${result}`);
	return lines.join("\n");
}

export function completionMessage(status: RunStatus, runDir: string): string {
	const outcome = status.state === "complete" ? "completed" : status.state;
	return [
		`Subagent run ${status.id} ${outcome}.`,
		`Result: ${resultPath(runDir)}`,
		`Inspect with subagent({ action: "status", id: "${status.id}" }).`,
	].join("\n");
}

export function notifyCompletion(input: {
	notify: NotifyMode;
	status: RunStatus;
	runDir: string;
	hasUI: boolean;
	isIdle: boolean;
	sendUserMessage: (message: string, options?: { deliverAs: "followUp" }) => void;
	uiNotify: (message: string, type: "info" | "error") => void;
}): "followUp" | "tui" | "none" {
	if (input.notify === "followUp") {
		const message = completionMessage(input.status, input.runDir);
		if (input.isIdle) input.sendUserMessage(message);
		else input.sendUserMessage(message, { deliverAs: "followUp" });
		return "followUp";
	}
	if (input.notify === "tui" && input.hasUI) {
		input.uiNotify(`Subagent ${input.status.id} ${input.status.state}`, input.status.state === "failed" ? "error" : "info");
		return "tui";
	}
	return "none";
}
