import type { ChildSnapshot } from "../read-model.ts";
import { sanitizeText } from "./model.ts";

export type StatusCardTone = "text" | "toolTitle" | "accent" | "muted" | "dim" | "success" | "warning" | "error";

export type StatusCardTheme = {
	fg(tone: StatusCardTone, text: string): string;
	bold(text: string): string;
};

export type StatusCardRun = {
	state: "running" | "complete" | "cancelled" | "failed";
	startedAt: number;
	completedAt?: number;
	totalChildren: number;
	children: readonly ChildSnapshot[];
};

type Align = "left" | "right";

function characterWidth(character: string): number {
	const codePoint = character.codePointAt(0) ?? 0;
	if (codePoint === 0 || codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
	if (/\p{Mark}/u.test(character) || codePoint === 0x200d || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)) return 0;
	if (
		codePoint >= 0x1100 && (
			codePoint <= 0x115f
			|| codePoint === 0x2329 || codePoint === 0x232a
			|| (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f)
			|| (codePoint >= 0xac00 && codePoint <= 0xd7a3)
			|| (codePoint >= 0xf900 && codePoint <= 0xfaff)
			|| (codePoint >= 0xfe10 && codePoint <= 0xfe19)
			|| (codePoint >= 0xfe30 && codePoint <= 0xfe6f)
			|| (codePoint >= 0xff00 && codePoint <= 0xff60)
			|| (codePoint >= 0xffe0 && codePoint <= 0xffe6)
			|| (codePoint >= 0x1f300 && codePoint <= 0x1faff)
			|| (codePoint >= 0x20000 && codePoint <= 0x3fffd)
		)
	) return 2;
	return 1;
}

function textWidth(value: string): number {
	return Array.from(value).reduce((total, character) => total + characterWidth(character), 0);
}

function clip(value: string, width: number): string {
	if (width <= 0) return "";
	if (textWidth(value) <= width) return value;
	if (width === 1) return "…";
	let result = "";
	let used = 0;
	for (const character of value) {
		const next = characterWidth(character);
		if (used + next > width - 1) break;
		result += character;
		used += next;
	}
	return `${result}…`;
}

function fit(value: string, width: number, align: Align = "left"): string {
	const clipped = clip(value, width);
	const padding = " ".repeat(Math.max(0, width - textWidth(clipped)));
	return align === "right" ? `${padding}${clipped}` : `${clipped}${padding}`;
}

function takeToWidth(value: string, width: number): { head: string; tail: string } {
	let head = "";
	let used = 0;
	let offset = 0;
	for (const character of value) {
		const next = characterWidth(character);
		if (used + next > width) break;
		head += character;
		used += next;
		offset += character.length;
	}
	if (!head && value) {
		const first = Array.from(value)[0] ?? "";
		return { head: "…", tail: value.slice(first.length) };
	}
	return { head, tail: value.slice(offset) };
}

function wrapTask(value: string, width: number): string[] {
	if (width <= 0) return [];
	const wrapped: string[] = [];
	for (const sourceLine of sanitizeText(value).split("\n")) {
		let remaining = sourceLine.trim();
		if (!remaining) {
			wrapped.push("");
			continue;
		}
		while (textWidth(remaining) > width) {
			const candidate = takeToWidth(remaining, width);
			const breakAt = candidate.head.lastIndexOf(" ");
			if (breakAt > 0) {
				wrapped.push(candidate.head.slice(0, breakAt));
				remaining = `${candidate.head.slice(breakAt + 1)}${candidate.tail}`.trimStart();
			} else {
				wrapped.push(candidate.head);
				remaining = candidate.tail;
			}
		}
		wrapped.push(remaining);
	}
	return wrapped;
}

function taskLines(child: ChildSnapshot, theme: StatusCardTheme, width: number): string[] {
	if (!child.task) return [];
	const indent = "    ";
	const label = "TASK  ";
	const contentWidth = Math.max(1, width - textWidth(indent) - textWidth(label));
	const wrapped = wrapTask(child.task, contentWidth);
	return wrapped.map((line, index) => index === 0
		? `${indent}${theme.fg("dim", label)}${theme.fg("text", line)}`
		: `${indent}${" ".repeat(textWidth(label))}${theme.fg("text", line)}`);
}

function compactNumber(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
	return String(Math.max(0, Math.round(value)));
}

function clock(ms: number): string {
	const totalSeconds = Math.max(0, Math.round(ms / 1000));
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hours = Math.floor(totalMinutes / 60);
	const pair = (value: number) => String(value).padStart(2, "0");
	return hours > 0 ? `${pair(hours)}:${pair(minutes)}:${pair(seconds)}` : `${pair(totalMinutes)}:${pair(seconds)}`;
}

function childTokens(child: ChildSnapshot): number {
	return child.usage?.totalTokens || ((child.usage?.input ?? 0) + (child.usage?.output ?? 0));
}

function childElapsed(child: ChildSnapshot, now: number): string {
	if (!child.startedAt) return "—";
	return clock((child.completedAt ?? now) - child.startedAt);
}

function displayState(state: ChildSnapshot["state"]): string {
	return state === "complete" ? "done" : state;
}

function glyph(state: ChildSnapshot["state"] | StatusCardRun["state"]): string {
	if (state === "complete") return "✓";
	if (state === "cancelled") return "−";
	if (state === "failed") return "✗";
	if (state === "running") return "◐";
	return "◦";
}

function tone(state: ChildSnapshot["state"] | StatusCardRun["state"]): StatusCardTone {
	if (state === "complete") return "success";
	if (state === "cancelled") return "warning";
	if (state === "failed") return "error";
	if (state === "running") return "accent";
	return "dim";
}

function childConfig(child: ChildSnapshot): string {
	return `${child.model ?? "default"} / ${child.thinking ?? "default"}`;
}

function childMetrics(child: ChildSnapshot, now: number): string {
	return [
		childElapsed(child, now),
		`${child.usage?.turns ?? 0} turns`,
		`${child.toolCount ?? 0} calls`,
		`${compactNumber(childTokens(child))} tok`,
		`$${(child.usage?.cost ?? 0).toFixed(4)}`,
	].join("  ");
}

function summarize(children: readonly ChildSnapshot[]): { turns: number; calls: number; tokens: number; cost: number } {
	return children.reduce((total, child) => ({
		turns: total.turns + (child.usage?.turns ?? 0),
		calls: total.calls + (child.toolCount ?? 0),
		tokens: total.tokens + childTokens(child),
		cost: total.cost + (child.usage?.cost ?? 0),
	}), { turns: 0, calls: 0, tokens: 0, cost: 0 });
}

function headerLines(run: StatusCardRun, theme: StatusCardTheme, width: number, now: number): string[] {
	const done = run.children.filter((child) => child.state === "complete" || child.state === "cancelled" || child.state === "failed").length;
	const usage = summarize(run.children);
	const leftPlain = `${glyph(run.state)} SUBAGENTS  ${run.state.toUpperCase()}  ${done}/${run.totalChildren}`;
	const rightPlain = `${clock((run.completedAt ?? now) - run.startedAt)}  ${compactNumber(usage.tokens)} tok  $${usage.cost.toFixed(4)}`;
	const left = `${theme.fg(tone(run.state), glyph(run.state))} ${theme.fg("toolTitle", theme.bold("SUBAGENTS"))}  ${theme.fg(tone(run.state), run.state.toUpperCase())}  ${theme.fg("text", `${done}/${run.totalChildren}`)}`;

	if (textWidth(leftPlain) + 2 + textWidth(rightPlain) <= width) {
		const gap = " ".repeat(width - textWidth(leftPlain) - textWidth(rightPlain));
		return [`${left}${gap}${theme.fg("text", rightPlain)}`];
	}
	return [left, theme.fg("text", `  ${clip(rightPlain, Math.max(0, width - 2))}`)];
}

function wideRows(children: readonly ChildSnapshot[], theme: StatusCardTheme, width: number, now: number, expanded: boolean): string[] {
	const statusWidth = 11;
	const timeWidth = 8;
	const turnsWidth = 7;
	const callsWidth = 7;
	const tokensWidth = 9;
	const costWidth = 9;
	const fixedWidth = 2 + statusWidth + timeWidth + turnsWidth + callsWidth + tokensWidth + costWidth + 8;
	const flexibleWidth = Math.max(28, width - fixedWidth);
	const agentWidth = Math.max(13, Math.min(24, Math.floor(flexibleWidth * 0.42)));
	const configWidth = Math.max(15, flexibleWidth - agentWidth);
	const gap = " ";
	const lines = [
		theme.fg("dim", [
			"  ",
			fit("STATUS", statusWidth),
			fit("AGENT", agentWidth),
			fit("MODEL / THINKING", configWidth),
			fit("TIME", timeWidth, "right"),
			fit("TURNS", turnsWidth, "right"),
			fit("CALLS", callsWidth, "right"),
			fit("TOKENS", tokensWidth, "right"),
			fit("COST", costWidth, "right"),
		].join(gap)),
	];

	for (const child of children) {
		lines.push([
			"  ",
			theme.fg(tone(child.state), fit(`${glyph(child.state)} ${displayState(child.state)}`, statusWidth)),
			theme.fg("text", theme.bold(fit(child.name, agentWidth))),
			theme.fg("muted", fit(childConfig(child), configWidth)),
			theme.fg("text", fit(childElapsed(child, now), timeWidth, "right")),
			theme.fg("text", fit(String(child.usage?.turns ?? 0), turnsWidth, "right")),
			theme.fg("text", fit(String(child.toolCount ?? 0), callsWidth, "right")),
			theme.fg("text", fit(compactNumber(childTokens(child)), tokensWidth, "right")),
			theme.fg("text", fit(`$${(child.usage?.cost ?? 0).toFixed(4)}`, costWidth, "right")),
		].join(gap));
		if (expanded) lines.push(...taskLines(child, theme, width));
	}
	return lines;
}

function mediumRows(children: readonly ChildSnapshot[], theme: StatusCardTheme, width: number, now: number, expanded: boolean): string[] {
	const lines: string[] = [];
	for (const child of children) {
		const statePlain = `${glyph(child.state)} ${displayState(child.state)}`;
		const stateWidth = 11;
		const remaining = Math.max(20, width - 2 - stateWidth - 2);
		const agentWidth = Math.max(12, Math.floor(remaining * 0.46));
		const configWidth = Math.max(8, remaining - agentWidth);
		lines.push([
			"  ",
			theme.fg(tone(child.state), fit(statePlain, stateWidth)),
			theme.fg("text", theme.bold(fit(child.name, agentWidth))),
			"  ",
			theme.fg("muted", fit(childConfig(child), configWidth)),
		].join(""));
		lines.push(theme.fg("text", `    ${clip(childMetrics(child, now), Math.max(0, width - 4))}`));
		if (expanded) lines.push(...taskLines(child, theme, width));
	}
	return lines;
}

function narrowRows(children: readonly ChildSnapshot[], theme: StatusCardTheme, width: number, now: number, expanded: boolean): string[] {
	const lines: string[] = [];
	for (const child of children) {
		lines.push(`${theme.fg(tone(child.state), `  ${glyph(child.state)} ${displayState(child.state)}`)}  ${theme.fg("text", theme.bold(clip(child.name, Math.max(1, width - 16))))}`);
		lines.push(theme.fg("muted", `    ${clip(childConfig(child), Math.max(0, width - 4))}`));
		lines.push(theme.fg("text", `    ${clip(childMetrics(child, now), Math.max(0, width - 4))}`));
		if (expanded) lines.push(...taskLines(child, theme, width));
	}
	return lines;
}

export function renderStatusCardLines(run: StatusCardRun, theme: StatusCardTheme, width: number, now = Date.now(), expanded = false): string[] {
	if (width <= 0) return [];
	const lines = [...headerLines(run, theme, width, now), ""];
	if (width >= 100) lines.push(...wideRows(run.children, theme, width, now, expanded));
	else if (width >= 72) lines.push(...mediumRows(run.children, theme, width, now, expanded));
	else lines.push(...narrowRows(run.children, theme, width, now, expanded));
	return lines;
}

export class SubagentStatusCard {
	readonly #run: StatusCardRun;
	readonly #theme: StatusCardTheme;
	readonly #expanded: boolean;

	constructor(run: StatusCardRun, theme: StatusCardTheme, expanded = false) {
		this.#run = run;
		this.#theme = theme;
		this.#expanded = expanded;
	}

	render(width: number): string[] {
		return renderStatusCardLines(this.#run, this.#theme, width, Date.now(), this.#expanded);
	}

	invalidate(): void {}
}
