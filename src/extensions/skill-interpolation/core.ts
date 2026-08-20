export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BYTES = 50 * 1024;
export const DEFAULT_MAX_LINES = 2_000;

const INTERPOLATION_PATTERN = /!`([^`]+)`/g;

type BashPolicy = { allowAll: boolean; patterns: string[] };
type CommandResult = { stdout: string; stderr?: string };

export type RunCommand = (command: string, cwd: string, options: { timeoutMs: number; signal?: AbortSignal }) => Promise<CommandResult>;

export function hasInterpolations(content: string): boolean {
	INTERPOLATION_PATTERN.lastIndex = 0;
	const found = INTERPOLATION_PATTERN.test(content);
	INTERPOLATION_PATTERN.lastIndex = 0;
	return found;
}

export function getBashPolicy(allowedTools: unknown): BashPolicy | null {
	const tokens = toolTokens(allowedTools);
	let allowAll = false;
	const patterns: string[] = [];

	for (const token of tokens) {
		if (token === "Bash") {
			allowAll = true;
			continue;
		}
		const match = token.match(/^Bash\((.*)\)$/);
		if (!match) continue;
		const inner = match[1].trim();
		if (!inner || inner === "*") allowAll = true;
		else patterns.push(...splitToolList(inner));
	}

	return allowAll || patterns.length > 0 ? { allowAll, patterns } : null;
}

export async function interpolateSkillContent(
	content: string,
	cwd: string,
	policy: BashPolicy,
	runCommand: RunCommand,
	options: { timeoutMs?: number; signal?: AbortSignal; maxBytes?: number; maxLines?: number } = {},
): Promise<string> {
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	let result = "";
	let lastIndex = 0;

	for (const match of content.matchAll(INTERPOLATION_PATTERN)) {
		const start = match.index ?? 0;
		const raw = match[0];
		const command = match[1].trim();
		result += content.slice(lastIndex, start);
		result += await interpolateCommand(command, cwd, policy, runCommand, {
			timeoutMs,
			signal: options.signal,
			maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
			maxLines: options.maxLines ?? DEFAULT_MAX_LINES,
		});
		lastIndex = start + raw.length;
	}

	return result + content.slice(lastIndex);
}

export function isCommandAllowed(command: string, policy: BashPolicy): boolean {
	if (policy.allowAll) return true;
	if (hasShellControl(command)) return false;
	return policy.patterns.some((pattern) => matchesAllowedPattern(command, pattern));
}

function toolTokens(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(toolTokens);
	if (typeof value !== "string") return [];
	return splitToolList(value);
}

function splitToolList(value: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let depth = 0;

	for (const char of value) {
		if (char === "(") depth++;
		if (char === ")" && depth > 0) depth--;
		if ((/\s/.test(char) || char === ",") && depth === 0) {
			if (current.trim()) tokens.push(unquote(current.trim()));
			current = "";
			continue;
		}
		current += char;
	}
	if (current.trim()) tokens.push(unquote(current.trim()));
	return tokens;
}

async function interpolateCommand(
	command: string,
	cwd: string,
	policy: BashPolicy,
	runCommand: RunCommand,
	options: { timeoutMs: number; signal?: AbortSignal; maxBytes: number; maxLines: number },
): Promise<string> {
	if (!isCommandAllowed(command, policy)) {
		return `[error: \`${command}\` blocked: not allowed by allowed-tools]`;
	}

	try {
		const { stdout } = await runCommand(command, cwd, { timeoutMs: options.timeoutMs, signal: options.signal });
		return truncateOutput(stdout.trimEnd(), options.maxBytes, options.maxLines);
	} catch (error) {
		const message = error instanceof Error ? error.message.split("\n", 1)[0] : String(error);
		return `[error: \`${command}\` failed: ${message}]`;
	}
}

function hasShellControl(command: string): boolean {
	let quote: "'" | '"' | null = null;
	let escaped = false;

	for (let i = 0; i < command.length; i++) {
		const char = command[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}
		if (quote) {
			if (char === quote) quote = null;
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			continue;
		}
		if (char === "$" && command[i + 1] === "(") return true;
		if (char === "\n" || char === "\r" || char === ";" || char === "|" || char === "&" || char === "<" || char === ">") return true;
	}
	return false;
}

function matchesAllowedPattern(command: string, rawPattern: string): boolean {
	const pattern = unquote(rawPattern.trim());
	if (!pattern) return false;

	if (pattern.endsWith(":")) return matchesCommandPrefix(command, pattern.slice(0, -1));
	if (pattern.endsWith(":*")) return matchesCommandPrefix(command, pattern.slice(0, -2));
	if (!pattern.includes("*")) return command === pattern || matchesCommandPrefix(command, pattern);

	const regex = new RegExp(`^${escapeRegex(pattern).replace(/\\\*/g, ".*")}$`);
	return regex.test(command);
}

function matchesCommandPrefix(command: string, prefix: string): boolean {
	const trimmed = prefix.trim();
	return command === trimmed || command.startsWith(`${trimmed} `) || command.startsWith(`${trimmed}\t`);
}

function truncateOutput(value: string, maxBytes: number, maxLines: number): string {
	const lines = value.split("\n");
	let output = lines.length > maxLines ? lines.slice(0, maxLines).join("\n") : value;
	let truncated = lines.length > maxLines;

	if (Buffer.byteLength(output, "utf8") > maxBytes) {
		output = Buffer.from(output, "utf8").subarray(0, maxBytes).toString("utf8");
		truncated = true;
	}

	return truncated ? `${output}\n[output truncated: max ${maxLines} lines / ${maxBytes} bytes]` : output;
}

function unquote(value: string): string {
	return value.replace(/^["']|["']$/g, "");
}

function escapeRegex(value: string): string {
	return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}
