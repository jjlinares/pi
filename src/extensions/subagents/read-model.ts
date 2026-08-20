import fs from "node:fs";
import path from "node:path";
import {
	CONTROL_PROTOCOL_VERSION,
	MAX_STATUS_BYTES,
	READ_MODEL_POLL_MS,
	readAbortMarker,
	resultFilePath,
	statusFilePath,
	writeAbortMarker,
} from "./_protocol.mjs";
import { RUN_ROOT, type ContextMode, type ExecutionMode, type NotifyMode, type RunStatus, type ThinkingLevel } from "./core.ts";

export type SnapshotMode = ExecutionMode | "unknown";
export type ChildState = RunStatus["subagents"][number]["state"];
export type ChildUsage = NonNullable<RunStatus["subagents"][number]["usage"]>;
export type ChildActivity = NonNullable<RunStatus["subagents"][number]["latestActivity"]>;

export type ChildSnapshot = {
	id: string;
	index: number;
	parentRunId: string;
	parentSessionId?: string;
	runDir: string;
	mode: SnapshotMode;
	controlProtocolVersion?: number;
	runState: RunStatus["state"];
	notify: NotifyMode;
	state: ChildState;
	name: string;
	task?: string;
	cwd: string;
	context?: ContextMode;
	model?: string;
	thinking?: ThinkingLevel;
	runStartedAt: number;
	runUpdatedAt: number;
	runCompletedAt?: number;
	startedAt?: number;
	updatedAt: number;
	completedAt?: number;
	usage?: ChildUsage;
	toolCount: number;
	recentTools: Array<{ tool: string; args: string; endMs: number }>;
	recentOutput: string[];
	currentTool?: string;
	currentToolArgs?: string;
	currentPath?: string;
	preview?: string;
	warning?: string;
	error?: string;
	reason?: string;
	latestActivity?: ChildActivity;
	outputFile?: string;
	stderrFile?: string;
	stdoutFile?: string;
	transcriptFile?: string;
	transcriptBytes: number;
	transcriptTruncated: boolean;
	resultFile: string;
	resumeCommand?: string;
	abortRequested: boolean;
	canAbort: boolean;
	capabilities: { canAbort: boolean };
};

export type SubagentReadModelListener = (snapshots: readonly ChildSnapshot[]) => void;
export const MALFORMED_STATUS_GRACE_MS = 1000;

function isStatus(value: unknown, runDir: string): value is RunStatus {
	if (!value || typeof value !== "object") return false;
	const status = value as Partial<RunStatus>;
	return status.id === path.basename(runDir)
		&& (status.parentSessionId === undefined || typeof status.parentSessionId === "string")
		&& (status.state === "running" || status.state === "complete" || status.state === "cancelled" || status.state === "failed")
		&& typeof status.cwd === "string"
		&& typeof status.startedAt === "number" && Number.isFinite(status.startedAt)
		&& typeof status.updatedAt === "number" && Number.isFinite(status.updatedAt)
		&& Array.isArray(status.subagents)
		&& status.subagents.every((child, index) => child
			&& child.id === `${status.id}-${index}`
			&& child.index === index
			&& typeof child.name === "string"
			&& (child.state === "queued" || child.state === "running" || child.state === "complete" || child.state === "cancelled" || child.state === "failed"));
}

function readStatus(runDir: string): RunStatus | undefined {
	const file = statusFilePath(runDir);
	let fd: number | undefined;
	try {
		fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
		const stat = fs.fstatSync(fd);
		if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_STATUS_BYTES) return undefined;
		const buffer = Buffer.allocUnsafe(stat.size);
		let offset = 0;
		while (offset < buffer.length) {
			const count = fs.readSync(fd, buffer, offset, buffer.length - offset, offset);
			if (count <= 0) return undefined;
			offset += count;
		}
		const value: unknown = JSON.parse(buffer.toString("utf8"));
		return isStatus(value, runDir) ? value : undefined;
	} catch {
		return undefined;
	} finally {
		if (fd !== undefined) try { fs.closeSync(fd); } catch {}
	}
}

function latestActivity(child: RunStatus["subagents"][number]): ChildActivity | undefined {
	if (child.latestActivity) return child.latestActivity;
	const at = child.updatedAt ?? child.completedAt ?? child.startedAt;
	if (!at) return undefined;
	if (child.error) return { type: "error", text: child.error, at };
	if (child.reason) return { type: "warning", text: child.reason, at };
	if (child.warning) return { type: "warning", text: child.warning, at };
	if (child.currentTool) return { type: "tool_start", tool: child.currentTool, text: child.currentPath ?? child.currentToolArgs, at };
	if (child.preview) return { type: "assistant", text: child.preview, at };
	return undefined;
}

function containedArtifact(runDir: string, value: unknown): string | undefined {
	if (typeof value !== "string" || !value) return undefined;
	const root = path.resolve(runDir);
	const candidate = path.resolve(runDir, value);
	return candidate === root || candidate.startsWith(`${root}${path.sep}`) ? candidate : undefined;
}

export function projectRunStatus(status: RunStatus, runDir: string): ChildSnapshot[] {
	const mode: SnapshotMode = status.mode === "foreground" || status.mode === "background" ? status.mode : "unknown";
	const notify: NotifyMode = status.notify === "tui" || status.notify === "followUp" || status.notify === "none" ? status.notify : "none";
	const protocolSupported = status.controlProtocolVersion === CONTROL_PROTOCOL_VERSION;
	return status.subagents.map((child) => {
		const address = { runDir, runId: status.id, childId: child.id, index: child.index };
		const abortRequested = Boolean(readAbortMarker(address));
		const childNonterminal = child.state === "queued" || child.state === "running";
		const canAbort = protocolSupported && status.state === "running" && childNonterminal;
		const activity = latestActivity(child);
		const outputFile = containedArtifact(runDir, child.outputFile);
		const stderrFile = containedArtifact(runDir, child.stderrFile);
		const stdoutFile = containedArtifact(runDir, child.stdoutFile);
		const transcriptFile = containedArtifact(runDir, child.transcriptFile);
		return {
			id: child.id,
			index: child.index,
			parentRunId: status.id,
			...(status.parentSessionId ? { parentSessionId: status.parentSessionId } : {}),
			runDir,
			mode,
			...(status.controlProtocolVersion !== undefined ? { controlProtocolVersion: status.controlProtocolVersion } : {}),
			runState: status.state,
			notify,
			state: child.state,
			name: child.name,
			...(child.task ? { task: child.task } : {}),
			cwd: child.cwd ?? status.cwd,
			...(child.context ? { context: child.context } : {}),
			...(child.model ? { model: child.model } : {}),
			...(child.thinking ? { thinking: child.thinking } : {}),
			runStartedAt: status.startedAt,
			runUpdatedAt: status.updatedAt,
			...(status.completedAt !== undefined ? { runCompletedAt: status.completedAt } : {}),
			...(child.startedAt !== undefined ? { startedAt: child.startedAt } : {}),
			updatedAt: child.updatedAt ?? status.updatedAt,
			...(child.completedAt !== undefined ? { completedAt: child.completedAt } : {}),
			...(child.usage ? { usage: { ...child.usage } } : {}),
			toolCount: child.toolCount ?? 0,
			recentTools: (child.recentTools ?? []).map((tool) => ({ ...tool })),
			recentOutput: [...(child.recentOutput ?? [])],
			...(child.currentTool ? { currentTool: child.currentTool } : {}),
			...(child.currentToolArgs ? { currentToolArgs: child.currentToolArgs } : {}),
			...(child.currentPath ? { currentPath: child.currentPath } : {}),
			...(child.preview ? { preview: child.preview } : {}),
			...(child.warning ? { warning: child.warning } : {}),
			...(child.error ? { error: child.error } : {}),
			...(child.reason ? { reason: child.reason } : {}),
			...(activity ? { latestActivity: activity } : {}),
			...(outputFile ? { outputFile } : {}),
			...(stderrFile ? { stderrFile } : {}),
			...(stdoutFile ? { stdoutFile } : {}),
			...(transcriptFile ? { transcriptFile } : {}),
			transcriptBytes: child.transcriptBytes ?? 0,
			transcriptTruncated: child.transcriptTruncated === true,
			resultFile: resultFilePath(runDir),
			...(child.resumeCommand ? { resumeCommand: child.resumeCommand } : {}),
			abortRequested,
			canAbort,
			capabilities: { canAbort },
		};
	});
}

function compareSnapshots(a: ChildSnapshot, b: ChildSnapshot): number {
	const aActive = a.runState === "running" || a.state === "queued" || a.state === "running";
	const bActive = b.runState === "running" || b.state === "queued" || b.state === "running";
	if (aActive !== bActive) return aActive ? -1 : 1;
	if (a.runStartedAt !== b.runStartedAt) return b.runStartedAt - a.runStartedAt;
	const runOrder = b.parentRunId.localeCompare(a.parentRunId);
	if (runOrder !== 0) return runOrder;
	if (a.index !== b.index) return a.index - b.index;
	return a.id.localeCompare(b.id);
}

export class SubagentReadModel {
	readonly #root: string;
	readonly #parentSessionId: string | undefined;
	readonly #listeners = new Set<SubagentReadModelListener>();
	readonly #invalidSince = new Map<string, number>();
	#snapshots: ChildSnapshot[] = [];
	#fingerprint = "[]";
	#timer: NodeJS.Timeout | undefined;
	#disposed = false;

	constructor(root = RUN_ROOT, parentSessionId?: string) {
		this.#root = root;
		this.#parentSessionId = parentSessionId;
		try { fs.mkdirSync(root, { recursive: true, mode: 0o700 }); } catch {}
		this.#poll(false);
		this.#timer = setInterval(() => this.#poll(true), READ_MODEL_POLL_MS);
		this.#timer.unref?.();
	}

	list(): readonly ChildSnapshot[] {
		return this.#snapshots;
	}

	get(id: string): ChildSnapshot | undefined {
		return this.#snapshots.find((snapshot) => snapshot.id === id);
	}

	subscribe(listener: SubagentReadModelListener): () => void {
		if (this.#disposed) return () => {};
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	requestAbort(id: string): boolean {
		const snapshot = this.get(id);
		if (!snapshot?.canAbort) return false;
		const current = readStatus(snapshot.runDir);
		if (!current
			|| current.id !== snapshot.parentRunId
			|| current.parentSessionId !== snapshot.parentSessionId
			|| current.controlProtocolVersion !== CONTROL_PROTOCOL_VERSION
			|| current.state !== "running") return false;
		const child = current.subagents[snapshot.index];
		if (!child
			|| child.id !== snapshot.id
			|| child.index !== snapshot.index
			|| (child.state !== "queued" && child.state !== "running")) return false;
		const accepted = writeAbortMarker({
			runDir: snapshot.runDir,
			runId: current.id,
			childId: child.id,
			index: child.index,
		});
		if (accepted) this.#poll(true);
		return accepted;
	}

	dispose(): void {
		if (this.#disposed) return;
		this.#disposed = true;
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = undefined;
		this.#listeners.clear();
		this.#invalidSince.clear();
	}

	#poll(emit: boolean): void {
		if (this.#disposed) return;
		let dirs: string[];
		try {
			dirs = fs.readdirSync(this.#root, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => path.join(this.#root, entry.name));
		} catch {
			return;
		}

		const previousByDir = new Map<string, ChildSnapshot[]>();
		for (const snapshot of this.#snapshots) {
			const entries = previousByDir.get(snapshot.runDir) ?? [];
			entries.push(snapshot);
			previousByDir.set(snapshot.runDir, entries);
		}

		const observedAt = Date.now();
		const next: ChildSnapshot[] = [];
		for (const runDir of dirs) {
			const status = readStatus(runDir);
			if (status) {
				this.#invalidSince.delete(runDir);
				if (this.#parentSessionId === undefined || status.parentSessionId === this.#parentSessionId) {
					next.push(...projectRunStatus(status, runDir));
				}
				continue;
			}
			const previous = previousByDir.get(runDir);
			if (!previous) continue;
			const invalidSince = this.#invalidSince.get(runDir) ?? observedAt;
			this.#invalidSince.set(runDir, invalidSince);
			if (observedAt - invalidSince <= MALFORMED_STATUS_GRACE_MS) next.push(...previous);
		}
		for (const runDir of this.#invalidSince.keys()) {
			if (!dirs.includes(runDir)) this.#invalidSince.delete(runDir);
		}
		next.sort(compareSnapshots);
		const fingerprint = JSON.stringify(next);
		if (fingerprint === this.#fingerprint) return;
		this.#snapshots = next;
		this.#fingerprint = fingerprint;
		if (emit) {
			for (const listener of this.#listeners) {
				try { listener(this.#snapshots); } catch {}
			}
		}
	}
}
