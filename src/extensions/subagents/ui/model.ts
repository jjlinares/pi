import path from "node:path";

export type DashboardScope = "current" | "all";

export type DashboardItem = { cwd: string };

export function filterDashboardItems<T extends DashboardItem>(
	items: readonly T[],
	currentCwd: string,
	scope: DashboardScope,
): T[] {
	if (scope === "all") return [...items];
	const resolvedCwd = path.resolve(currentCwd);
	return items.filter((item) => path.resolve(item.cwd) === resolvedCwd);
}

export type DashboardState = {
	selectedId?: string;
	selectedIndexHint: number;
	viewportStart: number;
};

export type DetailScrollState = {
	offset: number;
	pinnedToBottom: boolean;
};

export type TranscriptEventType =
	| "assistant"
	| "tool_start"
	| "tool_update"
	| "tool_end"
	| "warning"
	| "error"
	| "truncated";

export type TranscriptEvent = {
	ts: number;
	type: TranscriptEventType;
	tool?: string;
	text?: string;
	maxBytes?: number;
};

const TRANSCRIPT_TYPES = new Set<TranscriptEventType>([
	"assistant",
	"tool_start",
	"tool_update",
	"tool_end",
	"warning",
	"error",
	"truncated",
]);

function pageSize(value: number): number {
	return Math.max(1, Math.floor(value) || 1);
}

export function createDashboardState(ids: readonly string[] = []): DashboardState {
	return {
		...(ids[0] ? { selectedId: ids[0] } : {}),
		selectedIndexHint: 0,
		viewportStart: 0,
	};
}

export function reconcileDashboard(
	state: DashboardState,
	ids: readonly string[],
	visibleRows: number,
): DashboardState {
	if (ids.length === 0) return { selectedIndexHint: 0, viewportStart: 0 };
	const rows = pageSize(visibleRows);
	const existingIndex = state.selectedId ? ids.indexOf(state.selectedId) : -1;
	const selectedIndex = existingIndex >= 0
		? existingIndex
		: Math.min(Math.max(0, state.selectedIndexHint), ids.length - 1);
	const maxStart = Math.max(0, ids.length - rows);
	let viewportStart = Math.min(Math.max(0, state.viewportStart), maxStart);
	if (selectedIndex < viewportStart) viewportStart = selectedIndex;
	if (selectedIndex >= viewportStart + rows) viewportStart = selectedIndex - rows + 1;
	return {
		selectedId: ids[selectedIndex],
		selectedIndexHint: selectedIndex,
		viewportStart,
	};
}

export function selectDashboardIndex(
	state: DashboardState,
	ids: readonly string[],
	index: number,
	visibleRows: number,
): DashboardState {
	if (ids.length === 0) return reconcileDashboard(state, ids, visibleRows);
	const selectedIndex = Math.min(Math.max(0, Math.floor(index)), ids.length - 1);
	return reconcileDashboard(
		{ ...state, selectedId: ids[selectedIndex], selectedIndexHint: selectedIndex },
		ids,
		visibleRows,
	);
}

export function moveDashboardSelection(
	state: DashboardState,
	ids: readonly string[],
	delta: number,
	visibleRows: number,
): DashboardState {
	const reconciled = reconcileDashboard(state, ids, visibleRows);
	return selectDashboardIndex(reconciled, ids, reconciled.selectedIndexHint + delta, visibleRows);
}

export function createDetailScrollState(): DetailScrollState {
	return { offset: 0, pinnedToBottom: true };
}

export function reconcileDetailScroll(
	state: DetailScrollState,
	totalLines: number,
	visibleRows: number,
): DetailScrollState {
	const maxOffset = Math.max(0, Math.floor(totalLines) - pageSize(visibleRows));
	return {
		offset: state.pinnedToBottom ? maxOffset : Math.min(Math.max(0, state.offset), maxOffset),
		pinnedToBottom: state.pinnedToBottom,
	};
}

export function scrollDetail(
	state: DetailScrollState,
	delta: number,
	totalLines: number,
	visibleRows: number,
): DetailScrollState {
	const current = reconcileDetailScroll(state, totalLines, visibleRows);
	const maxOffset = Math.max(0, Math.floor(totalLines) - pageSize(visibleRows));
	const offset = Math.min(maxOffset, Math.max(0, current.offset + delta));
	return { offset, pinnedToBottom: offset === maxOffset };
}

export function homeDetailScroll(): DetailScrollState {
	return { offset: 0, pinnedToBottom: false };
}

export function endDetailScroll(totalLines: number, visibleRows: number): DetailScrollState {
	return {
		offset: Math.max(0, Math.floor(totalLines) - pageSize(visibleRows)),
		pinnedToBottom: true,
	};
}

/** Remove terminal escapes, control characters, bidi overrides, and tab ambiguity. */
export function sanitizeText(input: unknown): string {
	return String(input ?? "")
		.replace(/\r\n?/g, "\n")
		.replace(/\x1B\][\s\S]*?(?:\x07|\x1B\\)/g, "")
		.replace(/\x1B\][\s\S]*$/g, "")
		.replace(/\x1B[PX^_][\s\S]*?\x1B\\/g, "")
		.replace(/\x1B[PX^_][\s\S]*$/g, "")
		.replace(/(?:\x1B\[|\x9B)[0-?]*[ -/]*[@-~]/g, "")
		.replace(/\x1B[@-_]/g, "")
		.replace(/\t/g, "    ")
		.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, "")
		.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
}

export function parseNormalizedTranscriptJsonl(
	input: string,
	options: { maxEvents?: number; maxFieldChars?: number } = {},
): TranscriptEvent[] {
	const maxEvents = Math.max(1, options.maxEvents ?? 200);
	const maxFieldChars = Math.max(1, options.maxFieldChars ?? 4096);
	const completeLines = input.split("\n").slice(0, -1);
	const events: TranscriptEvent[] = [];
	for (const line of completeLines) {
		if (!line.trim()) continue;
		let value: unknown;
		try { value = JSON.parse(line); } catch { continue; }
		if (!value || typeof value !== "object") continue;
		const event = value as Record<string, unknown>;
		if (typeof event.type !== "string" || !TRANSCRIPT_TYPES.has(event.type as TranscriptEventType)) continue;
		const normalized: TranscriptEvent = {
			ts: typeof event.ts === "number" && Number.isFinite(event.ts) ? event.ts : 0,
			type: event.type as TranscriptEventType,
		};
		if (typeof event.tool === "string") normalized.tool = sanitizeText(event.tool).slice(0, maxFieldChars);
		if (typeof event.text === "string") normalized.text = sanitizeText(event.text).slice(0, maxFieldChars);
		if (typeof event.maxBytes === "number" && Number.isFinite(event.maxBytes)) normalized.maxBytes = event.maxBytes;
		events.push(normalized);
	}
	return events.slice(-maxEvents);
}

export function boundText(
	input: unknown,
	options: { maxChars?: number; maxLines?: number } = {},
): { text: string; truncated: boolean } {
	const maxChars = Math.max(1, options.maxChars ?? 24_000);
	const maxLines = Math.max(1, options.maxLines ?? 200);
	let text = sanitizeText(input);
	let truncated = false;
	if (text.length > maxChars) {
		text = text.slice(0, maxChars);
		truncated = true;
	}
	let lines = text.split("\n");
	if (lines.length > maxLines) {
		lines = lines.slice(0, maxLines);
		truncated = true;
	}
	text = lines.join("\n");
	if (truncated) text += `${text ? "\n" : ""}[…truncated]`;
	return { text, truncated };
}

export function formatElapsed(startedAt: number | undefined, completedAt: number | undefined, now: number): string {
	if (startedAt === undefined) return "-";
	const seconds = Math.max(0, Math.floor(((completedAt ?? now) - startedAt) / 1000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const rest = seconds % 60;
	if (minutes < 60) return `${minutes}m${rest ? `${rest}s` : ""}`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h${minutes % 60 ? `${minutes % 60}m` : ""}`;
}
