import type { ExtensionContext, KeybindingsManager, Theme } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi, type TUI } from "@earendil-works/pi-tui";
import type { ChildSnapshot, SubagentReadModel } from "../read-model.ts";
import {
	boundText,
	createDashboardState,
	createDetailScrollState,
	endDetailScroll,
	filterDashboardItems,
	formatElapsed,
	homeDetailScroll,
	moveDashboardSelection,
	parseNormalizedTranscriptJsonl,
	reconcileDashboard,
	reconcileDetailScroll,
	sanitizeText,
	scrollDetail,
	selectDashboardIndex,
	type DashboardScope,
	type DashboardState,
	type DetailScrollState,
	type TranscriptEvent,
} from "./model.ts";
import { readContainedFileHead, readContainedFileTail } from "../artifact-files.ts";

const MAX_TRANSCRIPT_READ_BYTES = 1024 * 1024;
const MAX_FINAL_OUTPUT_READ_BYTES = 64 * 1024;
const TRANSCRIPT_EVENT_LIMIT = 200;

type DashboardReadModel = Pick<SubagentReadModel, "list" | "get" | "subscribe" | "requestAbort">;
type Tone = "text" | "accent" | "muted" | "dim" | "success" | "warning" | "error";
type DetailLine = { text: string; tone?: Tone };

function compact(value: unknown, max = 28): string {
	const clean = sanitizeText(value).replace(/\s+/g, " ").trim() || "-";
	return clean.length > max ? `${clean.slice(0, Math.max(0, max - 1))}…` : clean;
}

function detailValue(value: unknown, max = 4096): string {
	const clean = sanitizeText(value);
	return clean.length > max ? `${clean.slice(0, Math.max(0, max - 1))}…` : clean;
}

function finiteNumber(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatBytes(value: number): string {
	const bytes = Math.max(0, finiteNumber(value));
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10}KiB`;
	return `${Math.round(bytes / (1024 * 102.4)) / 10}MiB`;
}

function stateTone(state: ChildSnapshot["state"]): Tone {
	if (state === "complete") return "success";
	if (state === "cancelled") return "warning";
	if (state === "failed") return "error";
	if (state === "running") return "warning";
	return "muted";
}

function currentActivity(snapshot: ChildSnapshot): string {
	if (snapshot.abortRequested) return "cancellation requested";
	if (snapshot.error) return snapshot.error;
	if (snapshot.reason) return snapshot.reason;
	if (snapshot.currentTool) {
		return `${snapshot.currentTool}${snapshot.currentPath ? ` ${snapshot.currentPath}` : snapshot.currentToolArgs ? ` ${snapshot.currentToolArgs}` : ""}`;
	}
	if (snapshot.latestActivity) {
		return `${snapshot.latestActivity.tool ? `${snapshot.latestActivity.tool} ` : ""}${snapshot.latestActivity.text ?? snapshot.latestActivity.type}`;
	}
	return snapshot.preview ?? snapshot.warning ?? "-";
}

export function shouldAppendLatestActivity(events: readonly TranscriptEvent[], latestActivity: ChildSnapshot["latestActivity"]): boolean {
	if (!latestActivity) return false;
	const newestEventAt = events.reduce((latest, event) => Math.max(latest, event.ts), 0);
	return latestActivity.at > newestEventAt || (events.some((event) => event.type === "truncated") && latestActivity.at === newestEventAt);
}

function latestActivityLine(latestActivity: NonNullable<ChildSnapshot["latestActivity"]>): DetailLine {
	return {
		text: detailValue(`${latestActivity.type}${latestActivity.tool ? ` ${latestActivity.tool}` : ""}${latestActivity.text ? ` — ${latestActivity.text}` : ""}`),
		tone: latestActivity.type === "error" ? "error" : latestActivity.type === "warning" ? "warning" : "text",
	};
}

function transcriptEventLine(event: TranscriptEvent): DetailLine {
	const time = event.ts > 0 ? new Date(event.ts).toLocaleTimeString() : "--:--:--";
	const tool = event.tool ? ` ${event.tool}` : "";
	const text = event.text ? ` — ${event.text}` : "";
	switch (event.type) {
		case "assistant": return { text: `${time} assistant${text}`, tone: "text" };
		case "tool_start": return { text: `${time} tool start${tool}${text}`, tone: "accent" };
		case "tool_update": return { text: `${time} tool update${tool}${text}`, tone: "dim" };
		case "tool_end": return { text: `${time} tool end${tool}${text}`, tone: "muted" };
		case "warning": return { text: `${time} warning${tool}${text}`, tone: "warning" };
		case "error": return { text: `${time} error${tool}${text}`, tone: "error" };
		case "truncated": return { text: `${time} transcript truncated${event.maxBytes ? ` at ${formatBytes(event.maxBytes)}` : ""}`, tone: "warning" };
	}
}

function detailSourceLines(snapshot: ChildSnapshot, now: number): DetailLine[] {
	const elapsed = formatElapsed(snapshot.startedAt ?? snapshot.runStartedAt, snapshot.completedAt, now);
	const usage = snapshot.usage;
	const lines: DetailLine[] = [
		{ text: `${snapshot.state.toUpperCase()}${snapshot.abortRequested ? " • CANCELLATION REQUESTED" : ""} • ${elapsed}`, tone: stateTone(snapshot.state) },
		{ text: `child: ${detailValue(snapshot.id)}` },
		{ text: `parent run: ${detailValue(snapshot.parentRunId)} • mode: ${snapshot.mode} • index: ${snapshot.index}` },
		{ text: `cwd: ${detailValue(snapshot.cwd)}` },
		{ text: `context: ${snapshot.context ?? "-"} • model: ${detailValue(snapshot.model ?? "-")} • thinking: ${snapshot.thinking ?? "-"}` },
	];
	if (usage) {
		lines.push({
			text: `usage: ${finiteNumber(usage.totalTokens)} tokens (${finiteNumber(usage.input)} in / ${finiteNumber(usage.output)} out) • ${finiteNumber(usage.turns)} turns • $${finiteNumber(usage.cost).toFixed(4)}`,
			tone: "muted",
		});
	}
	if (snapshot.warning) lines.push({ text: `warning: ${detailValue(snapshot.warning)}`, tone: "warning" });
	if (snapshot.reason) lines.push({ text: `reason: ${detailValue(snapshot.reason)}`, tone: "warning" });
	if (snapshot.error) lines.push({ text: `error: ${detailValue(snapshot.error)}`, tone: "error" });

	const output = readContainedFileHead(snapshot.runDir, snapshot.outputFile, MAX_FINAL_OUTPUT_READ_BYTES);
	if (output.text) {
		const bounded = boundText(output.text, { maxChars: 24_000, maxLines: 200 });
		lines.push({ text: "", tone: "dim" }, { text: "Final output", tone: "accent" });
		for (const line of bounded.text.split("\n")) lines.push({ text: line || " " });
		if (output.truncated && !bounded.truncated) lines.push({ text: "[…file truncated]", tone: "warning" });
	}

	lines.push({ text: "", tone: "dim" }, { text: "Artifacts", tone: "accent" });
	const artifacts = [
		["output", snapshot.outputFile],
		["transcript", snapshot.transcriptFile],
		["stdout", snapshot.stdoutFile],
		["stderr", snapshot.stderrFile],
		["run result", snapshot.resultFile],
	] as const;
	for (const [label, file] of artifacts) {
		if (file) lines.push({ text: `${label}: ${detailValue(file)}`, tone: "muted" });
	}
	lines.push({
		text: `transcript size: ${formatBytes(snapshot.transcriptBytes)}${snapshot.transcriptTruncated ? " • truncated" : ""}`,
		tone: snapshot.transcriptTruncated ? "warning" : "dim",
	});
	if (snapshot.resumeCommand) lines.push({ text: `resume: ${detailValue(snapshot.resumeCommand)}`, tone: "success" });

	lines.push({ text: "", tone: "dim" }, { text: "Recent activity", tone: "accent" });
	const transcript = readContainedFileTail(snapshot.runDir, snapshot.transcriptFile, MAX_TRANSCRIPT_READ_BYTES);
	const events = parseNormalizedTranscriptJsonl(transcript, { maxEvents: TRANSCRIPT_EVENT_LIMIT });
	if (events.length > 0) {
		for (const event of events) lines.push(transcriptEventLine(event));
		if (shouldAppendLatestActivity(events, snapshot.latestActivity)) lines.push(latestActivityLine(snapshot.latestActivity!));
	} else if (snapshot.latestActivity) {
		lines.push(latestActivityLine(snapshot.latestActivity));
	} else {
		lines.push({ text: "No activity recorded.", tone: "dim" });
	}
	return lines;
}

function wrapDetailLines(lines: readonly DetailLine[], width: number, theme: Theme): string[] {
	if (width <= 0) return [];
	const wrapped: string[] = [];
	for (const line of lines) {
		const clean = sanitizeText(line.text);
		if (!clean) {
			wrapped.push("");
			continue;
		}
		const styled = theme.fg(line.tone ?? "text", clean);
		wrapped.push(...wrapTextWithAnsi(styled, width));
	}
	return wrapped;
}

export class SubagentsDashboardComponent {
	readonly #tui: TUI;
	readonly #theme: Theme;
	readonly #keybindings: KeybindingsManager;
	readonly #currentCwd: string;
	readonly #model: DashboardReadModel;
	readonly #done: () => void;
	#allSnapshots: readonly ChildSnapshot[];
	#snapshots: readonly ChildSnapshot[];
	#scope: DashboardScope = "current";
	#dashboard: DashboardState;
	#dashboardRows = 1;
	#detailId: string | undefined;
	#detailScroll: DetailScrollState = createDetailScrollState();
	#detailRows = 1;
	#detailTotal = 0;
	#confirmAbortId: string | undefined;
	#notice = "";
	#unsubscribe: (() => void) | undefined;
	#timer: NodeJS.Timeout | undefined;
	#disposed = false;
	#finished = false;

	constructor(tui: TUI, theme: Theme, keybindings: KeybindingsManager, currentCwd: string, model: DashboardReadModel, done: () => void) {
		this.#tui = tui;
		this.#theme = theme;
		this.#keybindings = keybindings;
		this.#currentCwd = currentCwd;
		this.#model = model;
		this.#done = done;
		this.#allSnapshots = model.list();
		this.#snapshots = this.#visibleSnapshots();
		this.#dashboard = createDashboardState(this.#ids());
		this.#unsubscribe = model.subscribe((snapshots) => {
			if (this.#disposed) return;
			this.#allSnapshots = snapshots;
			this.#snapshots = this.#visibleSnapshots();
			this.#dashboard = reconcileDashboard(this.#dashboard, this.#ids(), this.#dashboardRows);
			this.#tui.requestRender();
		});
		this.#timer = setInterval(() => {
			if (!this.#disposed) this.#tui.requestRender();
		}, 1000);
		this.#timer.unref?.();
	}

	handleInput(data: string): void {
		if (this.#confirmAbortId) {
			if (matchesKey(data, "y") || this.#keybindings.matches(data, "tui.select.confirm")) {
				const id = this.#confirmAbortId;
				const snapshot = this.#model.get(id);
				const accepted = Boolean(snapshot?.canAbort) && this.#model.requestAbort(id);
				this.#notice = accepted ? "Cancellation requested (best effort)." : "Cancellation request rejected.";
				this.#confirmAbortId = undefined;
			} else if (matchesKey(data, "n") || this.#keybindings.matches(data, "tui.select.cancel")) {
				this.#confirmAbortId = undefined;
				this.#notice = "Cancellation request dismissed.";
			}
			this.#tui.requestRender();
			return;
		}

		if (this.#keybindings.matches(data, "tui.select.cancel")) {
			if (this.#detailId) {
				this.#detailId = undefined;
				this.#notice = "";
				this.#tui.requestRender();
			} else {
				this.#finish();
			}
			return;
		}

		if (!this.#detailId && this.#keybindings.matches(data, "tui.input.tab")) {
			this.#toggleScope();
			return;
		}

		if (matchesKey(data, "a")) {
			const snapshot = this.#selectedSnapshot();
			if (snapshot?.canAbort && !snapshot.abortRequested) {
				this.#confirmAbortId = snapshot.id;
				this.#notice = "";
			} else {
				this.#notice = snapshot?.abortRequested ? "Cancellation already requested." : "Selected child cannot accept cancellation requests.";
			}
			this.#tui.requestRender();
			return;
		}

		if (this.#detailId) this.#handleDetailInput(data);
		else this.#handleDashboardInput(data);
	}

	render(width: number): string[] {
		if (width <= 0) return [];
		return this.#detailId ? this.#renderDetail(width) : this.#renderDashboard(width);
	}

	invalidate(): void {}

	/** Idempotently close the overlay and release all dashboard resources. */
	close(): void {
		this.#finish();
	}

	dispose(): void {
		if (this.#disposed) return;
		this.#disposed = true;
		this.#unsubscribe?.();
		this.#unsubscribe = undefined;
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = undefined;
	}

	#finish(): void {
		if (this.#finished) return;
		this.#finished = true;
		this.dispose();
		this.#done();
	}

	#visibleSnapshots(): ChildSnapshot[] {
		return filterDashboardItems(this.#allSnapshots, this.#currentCwd, this.#scope);
	}

	#toggleScope(): void {
		this.#scope = this.#scope === "current" ? "all" : "current";
		this.#snapshots = this.#visibleSnapshots();
		this.#dashboard = reconcileDashboard(this.#dashboard, this.#ids(), this.#dashboardRows);
		this.#notice = "";
		this.#tui.requestRender();
	}

	#ids(): string[] {
		return this.#snapshots.map((snapshot) => snapshot.id);
	}

	#selectedSnapshot(): ChildSnapshot | undefined {
		const id = this.#detailId ?? this.#dashboard.selectedId;
		return id ? this.#model.get(id) ?? this.#snapshots.find((snapshot) => snapshot.id === id) : undefined;
	}

	#handleDashboardInput(data: string): void {
		const ids = this.#ids();
		if (this.#keybindings.matches(data, "tui.select.up")) this.#dashboard = moveDashboardSelection(this.#dashboard, ids, -1, this.#dashboardRows);
		else if (this.#keybindings.matches(data, "tui.select.down")) this.#dashboard = moveDashboardSelection(this.#dashboard, ids, 1, this.#dashboardRows);
		else if (matchesKey(data, Key.home)) this.#dashboard = selectDashboardIndex(this.#dashboard, ids, 0, this.#dashboardRows);
		else if (matchesKey(data, Key.end)) this.#dashboard = selectDashboardIndex(this.#dashboard, ids, ids.length - 1, this.#dashboardRows);
		else if (this.#keybindings.matches(data, "tui.select.confirm") && this.#dashboard.selectedId) {
			this.#detailId = this.#dashboard.selectedId;
			this.#detailScroll = createDetailScrollState();
			this.#notice = "";
		}
		this.#tui.requestRender();
	}

	#handleDetailInput(data: string): void {
		if (this.#keybindings.matches(data, "tui.select.up")) this.#detailScroll = scrollDetail(this.#detailScroll, -1, this.#detailTotal, this.#detailRows);
		else if (this.#keybindings.matches(data, "tui.select.down")) this.#detailScroll = scrollDetail(this.#detailScroll, 1, this.#detailTotal, this.#detailRows);
		else if (matchesKey(data, Key.home)) this.#detailScroll = homeDetailScroll();
		else if (matchesKey(data, Key.end)) this.#detailScroll = endDetailScroll(this.#detailTotal, this.#detailRows);
		this.#tui.requestRender();
	}

	#panelHeight(): number {
		return Math.max(5, Math.floor(this.#tui.terminal.rows * 0.9));
	}

	#renderDashboard(width: number): string[] {
		if (width === 1) return ["…"];
		const inner = width - 2;
		const availableRows = Math.max(1, this.#panelHeight() - 6);
		this.#dashboardRows = availableRows;
		const ids = this.#ids();
		this.#dashboard = reconcileDashboard(this.#dashboard, ids, availableRows);
		const visible = this.#snapshots.slice(this.#dashboard.viewportStart, this.#dashboard.viewportStart + availableRows);
		const running = this.#snapshots.filter((snapshot) => snapshot.state === "running" || snapshot.state === "queued").length;
		const cancelled = this.#snapshots.filter((snapshot) => snapshot.state === "cancelled").length;
		const failed = this.#snapshots.filter((snapshot) => snapshot.state === "failed").length;
		const scopeLabel = this.#scope === "current" ? "current folder" : "all folders";
		const lines: string[] = [this.#topBorder(` Subagents · ${scopeLabel} `, inner)];
		const count = this.#scope === "current"
			? `${this.#snapshots.length}/${this.#allSnapshots.length} children`
			: `${this.#snapshots.length} children`;
		lines.push(this.#content(` ${count} • ${running} active • ${cancelled} cancelled • ${failed} failed${this.#notice ? ` • ${this.#notice}` : ""}`, inner));
		lines.push(this.#separator(inner));
		if (visible.length === 0) {
			const empty = this.#scope === "current"
				? " No subagents in current folder. Press Tab to view all."
				: " No subagent runs found.";
			lines.push(this.#content(empty, inner));
		} else {
			for (const snapshot of visible) lines.push(this.#dashboardRow(snapshot, inner));
		}
		lines.push(this.#separator(inner));
		const selected = this.#selectedSnapshot();
		const help = this.#confirmAbortId
			? ` Request cancellation for ${compact(selected?.name ?? selected?.id, 24)}? y/confirm • n/cancel`
			: ` select up/down • Home/End • confirm detail • Tab ${this.#scope === "current" ? "all" : "current"} • a cancel • cancel close`;
		lines.push(this.#content(this.#helpText(help), inner));
		lines.push(this.#bottomBorder(inner));
		return lines.map((line) => truncateToWidth(line, width, ""));
	}

	#dashboardRow(snapshot: ChildSnapshot, inner: number): string {
		const selected = snapshot.id === this.#dashboard.selectedId;
		const mode = snapshot.mode === "foreground" ? "FG" : snapshot.mode === "background" ? "BG" : "??";
		const model = compact(snapshot.model, 8);
		const run = compact(snapshot.parentRunId, 6);
		const elapsed = formatElapsed(snapshot.startedAt ?? snapshot.runStartedAt, snapshot.completedAt, Date.now());
		const activity = compact(currentActivity(snapshot), 120);
		const prefix = selected ? "›" : " ";
		const name = compact(snapshot.name, 6);
		const directory = this.#scope === "all" ? ` d:${compact(snapshot.cwd, 20)}` : "";
		const styled = `${this.#theme.fg("accent", prefix)} ${this.#theme.fg(stateTone(snapshot.state), snapshot.state)} ${mode} r:${run} c:${name} m:${model}${directory} ${elapsed} ${activity}`;
		return this.#content(styled, inner, selected);
	}

	#renderDetail(width: number): string[] {
		if (width === 1) return ["…"];
		const inner = width - 2;
		const snapshot = this.#selectedSnapshot();
		const title = snapshot ? ` ${compact(snapshot.name, 36)} ` : " Subagent unavailable ";
		const bodyRows = Math.max(1, this.#panelHeight() - 4);
		this.#detailRows = bodyRows;
		const body = snapshot
			? wrapDetailLines(detailSourceLines(snapshot, Date.now()), inner, this.#theme)
			: [this.#theme.fg("warning", "This child is no longer present in the read model.")];
		this.#detailTotal = body.length;
		this.#detailScroll = reconcileDetailScroll(this.#detailScroll, body.length, bodyRows);
		const start = this.#detailScroll.offset;
		const visible = body.slice(start, start + bodyRows);
		const lines = [this.#topBorder(title, inner)];
		const position = body.length === 0 ? "0/0" : `${start + 1}-${Math.min(body.length, start + bodyRows)}/${body.length}`;
		const status = snapshot
			? `${snapshot.state} • ${snapshot.mode} • ${compact(snapshot.model, 20)} • ${formatElapsed(snapshot.startedAt ?? snapshot.runStartedAt, snapshot.completedAt, Date.now())}`
			: "unavailable";
		lines.push(this.#content(` ${status} • ${position}${this.#detailScroll.pinnedToBottom ? " • bottom pinned" : ""}${this.#notice ? ` • ${this.#notice}` : ""}`, inner));
		for (const line of visible) lines.push(this.#content(line, inner));
		for (let index = visible.length; index < bodyRows; index++) lines.push(this.#content("", inner));
		const canAbort = snapshot?.canAbort && !snapshot.abortRequested;
		const help = this.#confirmAbortId
			? ` Request cancellation for ${compact(snapshot?.name ?? snapshot?.id, 24)}? y/confirm • n/cancel`
			: ` select up/down • Home/End • a ${canAbort ? "request cancel" : "cancel unavailable"} • cancel back`;
		lines.push(this.#content(this.#helpText(help), inner));
		lines.push(this.#bottomBorder(inner));
		return lines.map((line) => truncateToWidth(line, width, ""));
	}

	#helpText(text: string): string {
		return this.#theme.fg(this.#confirmAbortId ? "warning" : "dim", text);
	}

	#content(text: string, inner: number, selected = false): string {
		const safe = truncateToWidth(text, inner, "…", true);
		const padded = safe + " ".repeat(Math.max(0, inner - visibleWidth(safe)));
		const content = selected ? this.#theme.bg("selectedBg", padded) : padded;
		return this.#theme.fg("border", "│") + content + this.#theme.fg("border", "│");
	}

	#topBorder(title: string, inner: number): string {
		const cleanTitle = truncateToWidth(sanitizeText(title), inner, "");
		const rest = Math.max(0, inner - visibleWidth(cleanTitle));
		return this.#theme.fg("border", "╭") + this.#theme.fg("accent", cleanTitle) + this.#theme.fg("border", `${"─".repeat(rest)}╮`);
	}

	#separator(inner: number): string {
		return this.#theme.fg("border", `├${"─".repeat(inner)}┤`);
	}

	#bottomBorder(inner: number): string {
		return this.#theme.fg("border", `╰${"─".repeat(inner)}╯`);
	}
}

export type DashboardCloseRegistrar = (close: () => void) => (() => void) | void;

/** Open the live dashboard while exposing its idempotent session-scoped closer. */
export async function openSubagentsDashboard(
	ctx: ExtensionContext,
	model: SubagentReadModel,
	registerClose?: DashboardCloseRegistrar,
): Promise<void> {
	if (ctx.mode !== "tui") {
		if (ctx.hasUI) ctx.ui.notify("/subagents requires interactive TUI mode.", "warning");
		return;
	}
	let unregister: (() => void) | undefined;
	try {
		await ctx.ui.custom<void>(
			(tui, theme, keybindings, done) => {
				const component = new SubagentsDashboardComponent(tui, theme, keybindings, ctx.cwd, model, done);
				unregister = registerClose?.(() => component.close()) ?? undefined;
				return component;
			},
			{
				overlay: true,
				overlayOptions: { anchor: "center", width: "92%", minWidth: 54, maxHeight: "90%", margin: 1 },
			},
		);
	} finally {
		unregister?.();
	}
}
