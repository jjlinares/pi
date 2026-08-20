import {
	MAX_TOOL_RESULT_BYTES,
	MAX_TOOL_RESULT_CHILD_BYTES,
} from "./limits.mjs";
import type { ChildSnapshot, SubagentReadModel } from "./read-model.ts";
import { readContainedFileHead } from "./artifact-files.ts";

const CHECK_OUTPUT_MAX_BYTES = 2 * 1024;
const CHECK_OUTPUT_MAX_LINES = 20;

type ManagementReadModel = Pick<SubagentReadModel, "list" | "subscribe" | "requestAbort">;
export type ManagementAction = "status" | "check" | "wait" | "cancel";

/** Validate the shared id/ids schema and return selectors for one action. */
export function selectorsForAction(
	action: ManagementAction,
	id: string | undefined,
	ids: readonly string[] | undefined,
): string[] {
	if (id && ids?.length) throw new Error("Use id or ids, not both.");
	if (action === "status") {
		if (ids?.length) throw new Error("Status accepts id, not ids.");
		return id ? [id] : [];
	}
	if (action === "check") {
		if (!id || ids?.length) throw new Error("Check requires one child id in id.");
		return [id];
	}
	const selectors = ids?.length ? [...ids] : id ? [id] : [];
	if (selectors.length === 0) throw new Error(`Action ${action} requires at least one run or child id.`);
	return selectors;
}

function terminal(snapshot: ChildSnapshot): boolean {
	return snapshot.state === "complete" || snapshot.state === "cancelled" || snapshot.state === "failed";
}

function unique<T>(values: readonly T[]): T[] {
	return [...new Set(values)];
}

function knownIds(snapshots: readonly ChildSnapshot[]): string {
	const runs = unique(snapshots.map((snapshot) => snapshot.parentRunId));
	const children = snapshots.map((snapshot) => snapshot.id);
	return `Known runs: ${runs.join(", ") || "none"}. Known children: ${children.join(", ") || "none"}.`;
}

/** Resolve session-owned run or child selectors into stable child snapshots. */
export function resolveChildTargets(
	snapshots: readonly ChildSnapshot[],
	selectors: readonly string[],
): ChildSnapshot[] {
	if (selectors.length === 0) throw new Error("Provide at least one run or child id.");
	const selected: ChildSnapshot[] = [];
	for (const rawSelector of selectors) {
		const selector = rawSelector.trim();
		if (!selector) throw new Error("Run and child ids must not be empty.");

		const exactChild = snapshots.find((snapshot) => snapshot.id === selector);
		if (exactChild) {
			selected.push(exactChild);
			continue;
		}

		const runIds = unique(snapshots.map((snapshot) => snapshot.parentRunId));
		const exactRun = runIds.find((runId) => runId === selector);
		if (exactRun) {
			selected.push(...snapshots.filter((snapshot) => snapshot.parentRunId === exactRun));
			continue;
		}

		const matchingRuns = runIds.filter((runId) => runId.startsWith(selector));
		if (matchingRuns.length === 1) {
			selected.push(...snapshots.filter((snapshot) => snapshot.parentRunId === matchingRuns[0]));
			continue;
		}
		if (matchingRuns.length > 1) {
			throw new Error(`Ambiguous run id prefix "${selector}": ${matchingRuns.join(", ")}.`);
		}

		const matchingChildren = snapshots.filter((snapshot) => snapshot.id.startsWith(selector));
		if (matchingChildren.length === 1) {
			selected.push(matchingChildren[0]);
			continue;
		}
		if (matchingChildren.length > 1) {
			throw new Error(`Ambiguous child id prefix "${selector}": ${matchingChildren.map((snapshot) => snapshot.id).join(", ")}.`);
		}
		throw new Error(`Unknown run or child id "${selector}". ${knownIds(snapshots)}`);
	}

	const ids = new Set<string>();
	return selected.filter((snapshot) => {
		if (ids.has(snapshot.id)) return false;
		ids.add(snapshot.id);
		return true;
	});
}

function boundUtf8Text(value: string, maxBytes: number): string {
	if (Buffer.byteLength(value, "utf8") <= maxBytes) return value;
	let low = 0;
	let high = value.length;
	while (low < high) {
		const middle = Math.ceil((low + high) / 2);
		if (Buffer.byteLength(value.slice(0, middle), "utf8") <= maxBytes) low = middle;
		else high = middle - 1;
	}
	return value.slice(0, low);
}

function truncateWithNotice(value: string, maxBytes: number, notice: string, forceNotice = false): string {
	if (!forceNotice && Buffer.byteLength(value, "utf8") <= maxBytes) return value;
	const requestedMarker = `\n\n${notice}`;
	const marker = boundUtf8Text(requestedMarker, maxBytes);
	const contentBudget = Math.max(0, maxBytes - Buffer.byteLength(marker, "utf8"));
	return `${boundUtf8Text(value, contentBudget)}${marker}`;
}

function limitedLines(value: string, maxLines: number): { text: string; truncated: boolean } {
	const lines = value.split("\n");
	if (lines.length <= maxLines) return { text: value, truncated: false };
	return { text: lines.slice(0, maxLines).join("\n"), truncated: true };
}

/** Format one non-blocking child inspection for the parent model. */
export function formatChildCheck(snapshot: ChildSnapshot, now = Date.now()): string {
	const elapsedStart = snapshot.startedAt ?? snapshot.runStartedAt;
	const elapsedEnd = snapshot.completedAt ?? now;
	const elapsedSeconds = Math.max(0, Math.round((elapsedEnd - elapsedStart) / 1000));
	const lines = [
		`${snapshot.id} [${snapshot.state}] "${snapshot.name}"`,
		`Run: ${snapshot.parentRunId} (${snapshot.mode})`,
		`Elapsed: ${elapsedSeconds}s`,
		`Cwd: ${snapshot.cwd}`,
	];
	const config = [
		snapshot.context ? `context ${snapshot.context}` : "",
		snapshot.model ? `model ${snapshot.model}` : "",
		snapshot.thinking ? `thinking ${snapshot.thinking}` : "",
	].filter(Boolean);
	if (config.length > 0) lines.push(`Config: ${config.join(" · ")}`);
	if (snapshot.currentTool) {
		const args = snapshot.currentToolArgs || snapshot.currentPath;
		lines.push(`Current tool: ${snapshot.currentTool}${args ? ` ${args}` : ""}`);
	}
	if (snapshot.error) lines.push(`Error: ${snapshot.error}`);
	if (snapshot.reason) lines.push(`Reason: ${snapshot.reason}`);
	if (snapshot.warning) lines.push(`Warning: ${snapshot.warning}`);

	let output = "";
	let truncated = false;
	if (terminal(snapshot)) {
		const read = readContainedFileHead(snapshot.runDir, snapshot.outputFile, CHECK_OUTPUT_MAX_BYTES);
		output = read.text;
		truncated = read.truncated;
	}
	if (!output) output = snapshot.recentOutput.join("\n") || snapshot.preview || "";
	if (output) {
		const lineLimited = limitedLines(output, CHECK_OUTPUT_MAX_LINES);
		truncated ||= lineLimited.truncated;
		const byteLimited = boundUtf8Text(lineLimited.text, CHECK_OUTPUT_MAX_BYTES);
		truncated ||= byteLimited !== lineLimited.text;
		lines.push("", "Latest output:", byteLimited);
		if (truncated) lines.push(`[Output truncated. Full output: ${snapshot.outputFile ?? "unavailable"}]`);
	} else if (!terminal(snapshot)) {
		lines.push("", "(no text output yet)");
	}
	if (snapshot.resumeCommand) lines.push(`Resume: ${snapshot.resumeCommand}`);
	return lines.join("\n");
}

/** Wait for selected children. Tool interruption leaves all children running. */
export function waitForChildTargets(
	model: ManagementReadModel,
	targets: readonly ChildSnapshot[],
	signal: AbortSignal | undefined,
	onPending?: (pending: readonly ChildSnapshot[]) => void,
): Promise<ChildSnapshot[]> {
	const ids = targets.map((snapshot) => snapshot.id);
	return new Promise((resolve, reject) => {
		let unsubscribe = () => {};
		let lastPending = "";
		const cleanup = () => {
			unsubscribe();
			signal?.removeEventListener("abort", onAbort);
		};
		const onAbort = () => {
			cleanup();
			reject(new Error("Wait aborted. Subagents keep running."));
		};
		const evaluate = () => {
			const current = model.list();
			const byId = new Map(current.map((snapshot) => [snapshot.id, snapshot]));
			const missing = ids.filter((id) => !byId.has(id));
			if (missing.length > 0) {
				cleanup();
				reject(new Error(`Subagent status disappeared while waiting: ${missing.join(", ")}.`));
				return;
			}
			const selected = ids.map((id) => byId.get(id)!);
			const pending = selected.filter((snapshot) => !terminal(snapshot));
			const fingerprint = pending.map((snapshot) => `${snapshot.id}:${snapshot.state}`).join(",");
			if (pending.length > 0 && fingerprint !== lastPending) {
				lastPending = fingerprint;
				try {
					onPending?.(pending);
				} catch (error) {
					cleanup();
					reject(error);
					return;
				}
			}
			if (pending.length === 0) {
				cleanup();
				resolve(selected);
			}
		};

		if (signal?.aborted) {
			onAbort();
			return;
		}
		signal?.addEventListener("abort", onAbort, { once: true });
		unsubscribe = model.subscribe(evaluate);
		evaluate();
	});
}

/** Return bounded final output for selected settled children. */
export function formatWaitResults(targets: readonly ChildSnapshot[]): string {
	const sections = targets.map((snapshot) => {
		const read = readContainedFileHead(snapshot.runDir, snapshot.outputFile, MAX_TOOL_RESULT_CHILD_BYTES);
		const fallback = snapshot.error || snapshot.reason || snapshot.preview || "(no output)";
		const output = read.text || fallback;
		const error = snapshot.error ? `\nError: ${snapshot.error}` : "";
		const reason = snapshot.reason ? `\nReason: ${snapshot.reason}` : "";
		const section = `## ${snapshot.id} "${snapshot.name}" — ${snapshot.state}${error}${reason}\n\n${output}`;
		return truncateWithNotice(
			section,
			MAX_TOOL_RESULT_CHILD_BYTES,
			`[Child result truncated. Full output: ${snapshot.outputFile ?? "unavailable"}. Full result: ${snapshot.resultFile}]`,
			read.truncated,
		);
	});
	const resultPaths = unique(targets.map((snapshot) => snapshot.resultFile));
	return truncateWithNotice(
		sections.join("\n\n---\n\n"),
		MAX_TOOL_RESULT_BYTES,
		`[Wait output truncated. Full results: ${resultPaths.join(", ")}]`,
	);
}

export type CancellationResult = {
	readonly snapshot: ChildSnapshot;
	readonly requested: boolean;
};

/** Write best-effort cancellation requests without waiting for settlement. */
export function requestChildCancellations(
	model: ManagementReadModel,
	targets: readonly ChildSnapshot[],
): CancellationResult[] {
	return targets.map((snapshot) => ({
		snapshot,
		requested: terminal(snapshot) ? false : model.requestAbort(snapshot.id),
	}));
}

export function formatCancellationResults(results: readonly CancellationResult[]): string {
	return results.map(({ snapshot, requested }) => {
		if (requested) return `Cancellation requested for ${snapshot.id} "${snapshot.name}".`;
		if (terminal(snapshot)) return `${snapshot.id} "${snapshot.name}" was already ${snapshot.state}.`;
		return `Cancellation was not accepted for ${snapshot.id} "${snapshot.name}"; check its status.`;
	}).join("\n");
}
