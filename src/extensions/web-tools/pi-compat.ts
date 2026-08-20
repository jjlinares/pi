import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "typebox";

export const DEFAULT_MAX_BYTES = 50 * 1024;
export const DEFAULT_MAX_LINES = 2_000;

export interface TruncationResult {
	readonly content: string;
	readonly truncated: boolean;
	readonly truncatedBy?: "bytes" | "lines";
	readonly totalLines: number;
	readonly totalBytes: number;
	readonly outputLines: number;
	readonly outputBytes: number;
	readonly lastLinePartial: boolean;
	readonly firstLineExceedsLimit: boolean;
	readonly maxLines: number;
	readonly maxBytes: number;
}

export class Text {
	constructor(
		private readonly text: string = "",
		private readonly paddingX: number = 1,
		private readonly paddingY: number = 1,
	) {}

	render(width: number): string[] {
		if (!this.text.trim()) return [];
		const horizontalPadding = " ".repeat(this.paddingX);
		const emptyLine = " ".repeat(Math.max(0, width));
		const contentWidth = Math.max(1, width - this.paddingX * 2);
		const lines = this.text.split("\n").flatMap((line) => wrapLine(line.replace(/\t/g, "   "), contentWidth));
		const padded = lines.map((line) => padToWidth(`${horizontalPadding}${line}${horizontalPadding}`, width));
		const verticalPadding = Array.from({ length: this.paddingY }, () => emptyLine);
		return [...verticalPadding, ...padded, ...verticalPadding];
	}
}

export function StringEnum<T extends string>(values: readonly T[], options: Record<string, unknown> = {}) {
	return Type.Unsafe<T>({ type: "string", enum: [...values], ...options });
}

export function formatSize(bytes: number): string {
	if (!Number.isFinite(bytes)) return "0B";
	const abs = Math.abs(bytes);
	if (abs < 1024) return `${Math.round(bytes)}B`;
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1024;
	let unit = units[0];
	for (let index = 1; Math.abs(value) >= 1024 && index < units.length; index++) {
		value /= 1024;
		unit = units[index];
	}
	return `${value.toFixed(1)}${unit}`;
}

export function keyHint(id: string, description: string): string {
	const key = keyText(id);
	return key ? `${key} ${description}` : description;
}

export function keyText(id: string): string {
	const keys = configuredKeys(id) ?? DEFAULT_KEYBINDINGS[id] ?? [];
	return keys.map(formatKeyText).join("/");
}

export function truncateHead(input: string, options: { readonly maxBytes: number; readonly maxLines: number }): TruncationResult {
	const maxBytes = Math.max(0, options.maxBytes);
	const maxLines = Math.max(0, options.maxLines);
	const lines = input.split("\n");
	const totalBytes = byteLength(input);
	const totalLines = lines.length;
	const output: string[] = [];
	let outputBytes = 0;
	let lastLinePartial = false;
	let firstLineExceedsLimit = false;
	let truncatedBy: "bytes" | "lines" | undefined;

	for (const line of lines) {
		if (output.length >= maxLines) {
			truncatedBy = "lines";
			break;
		}

		const separatorBytes = output.length === 0 ? 0 : 1;
		const availableBytes = maxBytes - outputBytes - separatorBytes;
		if (availableBytes < 0) {
			truncatedBy = "bytes";
			break;
		}

		const lineBytes = byteLength(line);
		if (lineBytes > availableBytes) {
			const partial = takeBytes(line, Math.max(0, availableBytes));
			if (partial || output.length === 0) {
				output.push(partial);
				outputBytes += separatorBytes + byteLength(partial);
			}
			lastLinePartial = true;
			firstLineExceedsLimit = output.length === 1;
			truncatedBy = "bytes";
			break;
		}

		output.push(line);
		outputBytes += separatorBytes + lineBytes;
	}

	const content = output.join("\n");
	return {
		content,
		truncated: Boolean(truncatedBy),
		truncatedBy,
		totalLines,
		totalBytes,
		outputLines: output.length,
		outputBytes: byteLength(content),
		lastLinePartial,
		firstLineExceedsLimit,
		maxLines,
		maxBytes,
	};
}

const DEFAULT_KEYBINDINGS: Record<string, readonly string[]> = {
	"app.tools.expand": ["ctrl+o"],
};

function configuredKeys(id: string): string[] | undefined {
	let parsed: unknown;
	try {
		parsed = JSON.parse(readFileSync(join(homedir(), ".pi", "agent", "keybindings.json"), "utf8"));
	} catch {
		return undefined;
	}
	if (!isRecord(parsed)) return undefined;
	const value = parsed[id];
	if (typeof value === "string") return value ? [value] : [];
	if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.length > 0);
	return undefined;
}

function formatKeyText(key: string): string {
	return key
		.split("/")
		.map((part) => part.split("+").map(formatKeyPart).join("+"))
		.join("/");
}

function formatKeyPart(part: string): string {
	return process.platform === "darwin" && part.toLowerCase() === "alt" ? "option" : part;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function byteLength(value: string): number {
	return Buffer.byteLength(value, "utf8");
}

function takeBytes(value: string, maxBytes: number): string {
	let result = "";
	let bytes = 0;
	for (const char of value) {
		const charBytes = byteLength(char);
		if (bytes + charBytes > maxBytes) break;
		result += char;
		bytes += charBytes;
	}
	return result;
}

function wrapLine(line: string, width: number): string[] {
	if (visibleWidth(line) <= width) return [line];

	const chunks: string[] = [];
	let current = "";
	let currentWidth = 0;
	for (const token of ansiAwareTokens(line)) {
		if (isAnsiEscape(token)) {
			current += token;
			continue;
		}

		for (const char of token) {
			if (currentWidth >= width) {
				chunks.push(current);
				current = "";
				currentWidth = 0;
			}
			current += char;
			currentWidth += 1;
		}
	}
	if (current || chunks.length === 0) chunks.push(current);
	return chunks;
}

function padToWidth(line: string, width: number): string {
	const length = visibleWidth(line);
	return length >= width ? line : line + " ".repeat(width - length);
}

function visibleWidth(value: string): number {
	return stripAnsi(value).length;
}

function stripAnsi(value: string): string {
	return value.replace(ansiPattern(), "");
}

function ansiAwareTokens(value: string): string[] {
	return value.split(ansiPattern()).filter(Boolean);
}

function isAnsiEscape(value: string): boolean {
	return ansiPattern().test(value);
}

function ansiPattern(): RegExp {
	return /([\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~])))/g;
}
