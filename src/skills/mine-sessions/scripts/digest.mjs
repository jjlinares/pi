#!/usr/bin/env node
// Condense recent Pi sessions into small Markdown digests for review.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const USAGE = `Usage: digest.mjs [--days N] [--cwd TEXT]... [--exclude TEXT]... [--batch-kb N] [--out DIR]

  --days N              Sessions modified in the last N days (default 14).
  --cwd TEXT            Keep sessions whose cwd contains TEXT. Repeatable.
  --exclude TEXT        Drop sessions whose cwd contains TEXT. Repeatable.
  --batch-kb N          Target size of each review batch in KB (default 300).
  --out DIR             Output directory (default: a new temp directory).`;

const { values: args } = parseArgs({
	options: {
		days: { type: "string", default: "14" },
		cwd: { type: "string", multiple: true, default: [] },
		exclude: { type: "string", multiple: true, default: [] },
		"batch-kb": { type: "string", default: "300" },
		out: { type: "string" },
		help: { type: "boolean", short: "h" },
	},
});
if (args.help) {
	console.log(USAGE);
	process.exit(0);
}

const days = Number(args.days);
const batchBytes = Number(args["batch-kb"]) * 1024;
if (!Number.isFinite(days) || days <= 0 || !Number.isFinite(batchBytes) || batchBytes <= 0) {
	console.error(USAGE);
	process.exit(2);
}

const agentDir = process.env.PI_CODING_AGENT_DIR ?? path.join(os.homedir(), ".pi", "agent");
const sessionsDir = path.join(agentDir, "sessions");
const outDir = args.out ?? fs.mkdtempSync(path.join(os.tmpdir(), "pi-session-digest-"));
fs.mkdirSync(path.join(outDir, "sessions"), { recursive: true });

const cutoff = Date.now() - days * 86_400_000;
const clip = (text, max) => {
	const flat = String(text ?? "").trim();
	return flat.length > max ? `${flat.slice(0, max)} [+${flat.length - max} chars]` : flat;
};
const oneLine = (text, max) => clip(String(text ?? "").replace(/\s+/g, " "), max);
const textOf = (content) =>
	typeof content === "string" ? content : (content ?? []).map((block) => block.text ?? "").join("");

function cleanUserText(raw) {
	const skills = [];
	const text = raw.replace(/<skill name="([^"]+)"[^>]*>[\s\S]*?<\/skill>/g, (_, name) => {
		skills.push(name);
		return `[skill:${name}]`;
	});
	return { text: text.trim(), skills };
}

const isNotification = (text) => /^Subagent run \S+ (completed|failed|cancelled)/.test(text);

function describeCall(call) {
	const input = call.arguments ?? {};
	if (call.name === "bash") return `bash: ${oneLine(input.command, 200)}`;
	if (input.path) return `${call.name}: ${input.path}`;
	return `${call.name}: ${oneLine(JSON.stringify(input), 120)}`;
}

const WRAPPERS = new Set(["timeout", "time", "env", "sudo", "nohup"]);
const RUNNERS = new Set(["uv run", "pnpm exec", "pnpm dlx", "npx", "bunx", "bun run", "npm run", "pnpm run"]);

function commandKey(command) {
	const parts = String(command)
		.split(/&&|;|\|\|/)
		.map((part) => part.trim())
		.filter((part) => part && !/^cd\s/.test(part));
	const words = (parts[0] ?? "").split(/\s+/).filter((word) => !/^[A-Z_]+=/.test(word));
	while (WRAPPERS.has(words[0])) words.splice(0, /^\d/.test(words[1] ?? "") ? 2 : 1);
	const isWord = (word) => /^[a-z][\w.:-]*$/.test(word ?? "");
	const pair = `${words[0]} ${words[1]}`;
	if (RUNNERS.has(words[0]) && isWord(words[1])) return pair;
	if (RUNNERS.has(pair) && isWord(words[2])) return `${pair} ${words[2]}`;
	return isWord(words[1]) ? pair : (words[0] ?? "");
}

function readEntries(file) {
	return fs
		.readFileSync(file, "utf8")
		.split("\n")
		.filter(Boolean)
		.flatMap((line) => {
			try {
				return [JSON.parse(line)];
			} catch {
				return [];
			}
		});
}

function loadSession(file) {
	const entries = readEntries(file);
	const header = entries.find((entry) => entry.type === "session") ?? {};
	const names = entries.filter((entry) => entry.type === "session_info" && entry.name).map((entry) => entry.name);
	return {
		file,
		entries,
		cwd: header.cwd ?? "",
		start: header.timestamp ?? "",
		parent: header.parentSession ?? "",
		name: names.at(-1) ?? "",
	};
}

// Forks and clones copy their parent's entries; `seen` skips entries already digested.
function digestSession(loaded, seen) {
	const { entries, ...rest } = loaded;
	const session = {
		...rest,
		models: new Set(),
		skills: [],
		commands: [],
		userTurns: 0,
		toolCalls: 0,
		toolErrors: 0,
		compactions: entries.filter((entry) => entry.type === "compaction").length,
		turns: [],
	};

	let turn = null;
	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const key = `${entry.id}@${entry.timestamp}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const message = entry.message;
		if (message.role === "user") {
			const raw = textOf(message.content);
			if (isNotification(raw)) continue;
			const { text, skills } = cleanUserText(raw);
			session.skills.push(...skills);
			session.userTurns += 1;
			turn = { user: text, calls: [], errors: [], reply: "" };
			session.turns.push(turn);
		} else if (message.role === "assistant" && turn) {
			if (message.model) session.models.add(message.model);
			for (const block of message.content ?? []) {
				if (block.type === "toolCall") {
					session.toolCalls += 1;
					turn.calls.push(describeCall(block));
					if (block.name === "bash") session.commands.push(commandKey(block.arguments?.command));
					const skillPath = block.arguments?.path ?? "";
					if (block.name === "read" && skillPath.endsWith("/SKILL.md")) {
						session.skills.push(path.basename(path.dirname(skillPath)));
					}
				}
			}
			const reply = textOf((message.content ?? []).filter((block) => block.type === "text"));
			if (reply.trim()) turn.reply = reply;
		} else if (message.role === "toolResult" && message.isError && turn) {
			session.toolErrors += 1;
			turn.errors.push(`${message.toolName}: ${oneLine(textOf(message.content), 200)}`);
		}
	}
	return session;
}

function renderSession(session) {
	const lines = [
		`# ${session.name || "(unnamed session)"}`,
		"",
		`- File: ${session.file}`,
		`- Cwd: ${session.cwd}`,
		`- Started: ${session.start}`,
		...(session.parent ? [`- Forked from: ${session.parent} (copied history omitted)`] : []),
		`- Models: ${[...session.models].join(", ") || "none"}`,
		`- User turns: ${session.userTurns}; tool calls: ${session.toolCalls}; tool errors: ${session.toolErrors}; compactions: ${session.compactions}`,
		`- Skills: ${[...new Set(session.skills)].join(", ") || "none"}`,
		"",
	];
	session.turns.forEach((turn, index) => {
		lines.push(`## Turn ${index + 1}`, "", "User:", "", clip(turn.user, 2000).replace(/^/gm, "> "), "");
		if (turn.calls.length) {
			const shown = turn.calls.slice(0, 40);
			lines.push(`Tool calls (${turn.calls.length}):`, "", ...shown.map((call) => `- ${call}`));
			if (turn.calls.length > shown.length) lines.push(`- ... ${turn.calls.length - shown.length} more`);
			lines.push("");
		}
		if (turn.errors.length) lines.push("Tool errors:", "", ...turn.errors.slice(0, 10).map((error) => `- ${error}`), "");
		if (turn.reply) lines.push("Final reply:", "", clip(turn.reply, 600).replace(/^/gm, "> "), "");
	});
	return lines.join("\n");
}

function count(values) {
	const counts = new Map();
	for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1]);
}

const files = fs
	.readdirSync(sessionsDir, { recursive: true })
	.filter((file) => file.endsWith(".jsonl"))
	.map((file) => path.join(sessionsDir, file))
	.filter((file) => fs.statSync(file).mtimeMs >= cutoff);

const seen = new Set();
const sessions = files
	.map(loadSession)
	.filter((session) => !args.cwd.length || args.cwd.some((text) => session.cwd.includes(text)))
	.filter((session) => !args.exclude.some((text) => session.cwd.includes(text)))
	.sort((a, b) => a.start.localeCompare(b.start))
	.map((session) => digestSession(session, seen))
	.filter((session) => session.userTurns > 0);

const digests = sessions.map((session, index) => {
	const digestName = `${String(index + 1).padStart(3, "0")}.md`;
	const digestPath = path.join(outDir, "sessions", digestName);
	fs.writeFileSync(digestPath, renderSession(session));
	return { session, digestName, digestPath, size: fs.statSync(digestPath).size };
});

// Group sessions from the same cwd so each reviewer sees related work together.
const batches = [];
for (const digest of [...digests].sort((a, b) => a.session.cwd.localeCompare(b.session.cwd))) {
	const current = batches.at(-1);
	if (!current || current.size + digest.size > batchBytes) batches.push({ size: digest.size, paths: [digest.digestPath] });
	else {
		current.size += digest.size;
		current.paths.push(digest.digestPath);
	}
}
batches.forEach((batch, index) => {
	fs.writeFileSync(path.join(outDir, `batch-${index + 1}.txt`), `${batch.paths.join("\n")}\n`);
});

const rows = digests.map(({ session, digestName }) => {
	return `| [${digestName}](sessions/${digestName}) | ${session.start.slice(0, 10)} | ${session.cwd} | ${oneLine(session.name, 60).replace(/\|/g, "/")} | ${session.userTurns} | ${session.toolCalls} | ${session.toolErrors} |`;
});

const table = (pairs, limit) => pairs.slice(0, limit).map(([key, value]) => `| ${key.replace(/\|/g, "/")} | ${value} |`);
const index = [
	"# Session digest",
	"",
	`Sessions modified in the last ${days} days: ${sessions.length} kept of ${files.length} files.`,
	`Review batches: ${batches.length} (\`batch-N.txt\`, about ${args["batch-kb"]} KB each).`,
	"",
	"## Sessions",
	"",
	"| Digest | Date | Cwd | Name | User turns | Tool calls | Errors |",
	"| --- | --- | --- | --- | --- | --- | --- |",
	...rows,
	"",
	"## Sessions per cwd",
	"",
	"| Cwd | Sessions |",
	"| --- | --- |",
	...table(count(sessions.map((session) => session.cwd)), 30),
	"",
	"## Skills used (sessions)",
	"",
	"| Skill | Sessions |",
	"| --- | --- |",
	...table(count(sessions.flatMap((session) => [...new Set(session.skills)])), 40),
	"",
	"## Top bash commands (calls)",
	"",
	"| Command | Calls |",
	"| --- | --- |",
	...table(count(sessions.flatMap((session) => session.commands)), 40),
	"",
];
fs.writeFileSync(path.join(outDir, "index.md"), index.join("\n"));
console.log(path.join(outDir, "index.md"));
