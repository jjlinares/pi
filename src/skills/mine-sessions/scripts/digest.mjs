#!/usr/bin/env node
// Condense recent Mel threads into small Markdown digests for review. Reads Mel's loopback API with GET only.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const USAGE = `Usage: digest.mjs [--days N] [--project TEXT]... [--exclude TEXT]... [--batch-kb N] [--url URL] [--out DIR]

  --days N          Keep turns from the last N days (default 14).
  --project TEXT    Keep threads in projects named TEXT or whose folder contains TEXT. Repeatable.
  --exclude TEXT    Drop threads in such projects, and every thread below them. Repeatable.
  --batch-kb N      Target size of each review batch in KB (default 300).
  --url URL         Mel server (default http://127.0.0.1:1370).
  --out DIR         Output directory (default: a new private temp directory).`;

const { values: args } = parseArgs({
	options: {
		days: { type: "string", default: "14" },
		project: { type: "string", multiple: true, default: [] },
		exclude: { type: "string", multiple: true, default: [] },
		"batch-kb": { type: "string", default: "300" },
		url: { type: "string", default: "http://127.0.0.1:1370" },
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
const threadBytes = 80 * 1024;
if (![days, batchBytes].every((value) => Number.isFinite(value) && value > 0)) {
	console.error(USAGE);
	process.exit(2);
}
const cutoff = Date.now() - days * 86_400_000;

async function get(route) {
	const url = new URL(route, args.url);
	const response = await fetch(url).catch((error) => {
		console.error(
			`Cannot reach Mel at ${url.origin}: ${error.cause?.code ?? error.message}.\n` +
				"Mel's API listens on 127.0.0.1 of the server's machine only. Run this from a thread whose project is on that machine, or pass --url.",
		);
		process.exit(1);
	});
	if (response.ok) return response.json();
	console.error(`Mel refused GET ${url.pathname}: ${response.status} ${(await response.text()).slice(0, 200)}`);
	process.exit(1);
}

const clip = (text, max) => {
	const flat = String(text ?? "").trim();
	return flat.length > max ? `${flat.slice(0, max)} [+${flat.length - max} chars]` : flat;
};
const oneLine = (text, max) => clip(String(text ?? "").replace(/\s+/g, " "), max);
const quote = (text, max) => clip(text, max).replace(/^/gm, "> ");
const when = (ms) => new Date(ms).toLocaleString("sv-SE").slice(0, 16);
const cell = (text) => String(text).replace(/\|/g, "/");

function describeCall({ name, input = {}, details, status }) {
	const flags = [input.agent, input.model, input.wait && "wait", input.parent === false && "no parent"].filter(Boolean);
	const text =
		name === "bash" ? `bash: ${oneLine(input.command, 200)}`
		: name === "codemode" ? `codemode: ${oneLine(String(input.code ?? "").replace(/^\/\/ @options.*\n/, ""), 200)}`
		: name === "agent_start" ? `agent_start: "${oneLine(input.title, 80)}" ${flags.join(" ")} -> thread ${details?.threadId ?? "?"}`
		: name === "thread_send" ? `thread_send -> ${input.threadId}${input.reply ? " (reply)" : ""}: ${oneLine(input.message, 100)}`
		: input.path || input.url ? `${name}: ${input.path ?? input.url}`
		: `${name}: ${oneLine(JSON.stringify(input), 120)}`;
	return ["stopped", "interrupted"].includes(status) ? `${text} [${status}]` : text;
}

// Tools end failed output with `<harness>[error] ...</harness>`; codemode reports `Script error:` instead.
function describeError(call) {
	const text = String(call.text ?? "");
	const harness = /<harness>\s*\[error\]\s*([\s\S]*?)\s*<\/harness>\s*$/.exec(text);
	const script = /Script error:\s*([\s\S]*?)\s*(?:Tool calls made before the failure|$)/.exec(text);
	const before = harness ? (text.slice(0, harness.index).trim().split("\n").at(-1) ?? "") : "";
	const subject = call.name === "bash" ? `bash \`${oneLine(call.input?.command, 80)}\`` : call.name;
	return `${subject}: ${oneLine(harness?.[1] ?? script?.[1] ?? text.slice(-200), 150)}${before ? ` | last output: ${oneLine(before, 120)}` : ""}`;
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

// Each input (the user's message, another thread's request, or a report) starts a turn. Thinking is left out.
function digestThread(snapshot) {
	const thread = { invoked: [], read: [], commands: [], tools: [], turns: [], earlier: 0, mining: false };
	thread.counts = { user: 0, request: 0, report: 0, calls: 0, failed: 0, stops: 0, compactions: 0 };
	let turn = null;
	for (const message of snapshot.messages) {
		if (message.skills?.some((skill) => skill.name === "mine-sessions")) thread.mining = true;
		if (["user", "request", "report"].includes(message.role)) {
			if (message.timestamp < cutoff) {
				thread.earlier += 1;
				turn = null;
				continue;
			}
			const midRun = Boolean(turn && !turn.reply && !turn.stopped && turn.calls.length);
			turn = { ...message, midRun, calls: [], errors: [], reply: "", stopped: false };
			thread.turns.push(turn);
			thread.counts[message.role] += 1;
			thread.invoked.push(...(message.skills ?? []).map((skill) => skill.name));
		} else if (!turn) continue;
		else if (message.role === "assistant") turn.reply = message.text;
		else if (message.role === "stopped") {
			turn.stopped = true;
			thread.counts.stops += 1;
		}
		else if (message.role === "compaction") thread.counts.compactions += 1;
		else if (message.role === "tool") {
			thread.counts.calls += 1;
			thread.tools.push(message.name);
			turn.calls.push(message);
			turn.reply = "";
			if (message.name === "bash") thread.commands.push(commandKey(message.input?.command));
			const file = String(message.input?.path ?? "");
			if (message.name === "read" && file.endsWith("/SKILL.md")) thread.read.push(path.basename(path.dirname(file)));
			if (message.status === "failed") {
				thread.counts.failed += 1;
				turn.errors.push(describeError(message));
			}
		}
	}
	return thread;
}

function renderTurn(turn, index, compact) {
	const lines = [`## Turn ${index + 1} · ${when(turn.timestamp)}${turn.midRun ? " · sent mid-run" : ""}`, ""];
	if (turn.role === "user") {
		const skills = (turn.skills ?? []).map((skill) => skill.name);
		const notes = [skills.length && ` [skills: ${skills.join(", ")}]`, turn.attachments?.length && ` [${turn.attachments.length} attachments]`];
		lines.push(`User${notes.filter(Boolean).join("")}:`, "", quote(turn.text, 2000), "");
	} else if (turn.role === "request") lines.push(`Message from thread ${turn.fromThreadId}:`, "", quote(turn.text, compact ? 600 : 1500), "");
	else lines.push(`Report from thread ${turn.fromThreadId} (${turn.outcome}${turn.userJoined ? ", user joined" : ""}):`, "", quote(turn.text, compact ? 200 : 500), "");
	if (turn.calls.length && compact) {
		const names = count(turn.calls.map((call) => call.name)).map(([name, n]) => `${name} x${n}`);
		lines.push(`Tool calls (${turn.calls.length}): ${names.join(", ")}`, "");
	} else if (turn.calls.length) {
		lines.push(`Tool calls (${turn.calls.length}):`, "", ...turn.calls.slice(0, 40).map((call) => `- ${describeCall(call)}`));
		if (turn.calls.length > 40) lines.push(`- ... ${turn.calls.length - 40} more`);
		lines.push("");
	}
	if (turn.errors.length) lines.push(`Failed calls (${turn.errors.length}):`, "", ...turn.errors.slice(0, compact ? 5 : 10).map((error) => `- ${error}`), "");
	if (turn.stopped) lines.push("Stopped by the user.", "");
	if (turn.reply) lines.push("Final reply:", "", quote(turn.reply, compact ? 300 : 600), "");
	return lines.join("\n");
}

// Over the cap, a digest drops per-call detail; still over, it keeps the first turn and the latest that fit.
function renderThread({ info, thread, snapshot }) {
	const parent = info.parentThreadId;
	const origin =
		parent ? `parent thread ${parent}${byId.has(parent) ? "" : " (not listed)"}; its first message is a brief, not the user's words`
		: info.launchedBy ? `launched by thread ${info.launchedBy} without a parent`
		: "the user";
	const children = state.threads.filter((item) => item.parentThreadId === info.id).map((item) => item.id);
	const { user, request, report, calls, failed, stops, compactions } = thread.counts;
	const header = [
		`# ${info.title}`,
		"",
		`- Thread ${info.id}; project ${project(info).name} (${project(info).cwd}); agent ${agentNames.get(info.agentId) ?? "none"}; model ${snapshot.model}`,
		`- Started by: ${origin}`,
		...(children.length ? [`- Threads it started: ${children.join(", ")}`] : []),
		`- Turns in range: ${thread.turns.length}${thread.earlier ? `; ${thread.earlier} earlier turns omitted` : ""}`,
		`- User messages ${user}; requests ${request}; reports ${report}; tool calls ${calls}; failed calls ${failed}; stops ${stops}; compactions ${compactions}`,
		`- Skills invoked: ${[...new Set(thread.invoked)].join(", ") || "none"}; skills read: ${[...new Set(thread.read)].join(", ") || "none"}`,
		...(snapshot.error ? [`- Last run failed: ${oneLine(snapshot.error, 200)}`] : []),
		"",
	].join("\n");
	const fits = (turns) => Buffer.byteLength(header + turns.join("\n")) <= threadBytes;
	const full = thread.turns.map((turn, index) => renderTurn(turn, index, false));
	if (fits(full)) return { text: `${header}\n${full.join("\n")}`, cut: "" };
	const turns = thread.turns.map((turn, index) => renderTurn(turn, index, true));
	if (fits(turns)) return { text: `${header}\n${turns.join("\n")}`, cut: "compact" };
	let size = Buffer.byteLength(header + turns[0]) + 200;
	let from = turns.length;
	while (from > 1 && (size += Buffer.byteLength(turns[from - 1])) <= threadBytes) from -= 1;
	const marker = `## ... ${from - 1} turns omitted to fit 80 KB\n`;
	return { text: `${header}\n${[turns[0], marker, ...turns.slice(from)].join("\n")}`, cut: `compact, ${from - 1} turns omitted` };
}

function count(values) {
	const counts = new Map();
	for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts].sort((a, b) => b[1] - a[1]);
}

const started = Date.now();
const state = await get("/api/state");
const projects = new Map(state.projects.map((item) => [item.id, item]));
const agentNames = new Map(state.agents.map((item) => [item.id, item.name]));
const byId = new Map(state.threads.map((item) => [item.id, item]));
const project = (item) => projects.get(item.projectId) ?? { name: "(unknown)", cwd: "" };
const ancestry = (item) => {
	const chain = [item];
	while (byId.has(chain.at(-1).parentThreadId)) chain.push(byId.get(chain.at(-1).parentThreadId));
	return chain;
};
const matches = (item, texts) => texts.some((text) => project(item).name === text || project(item).cwd.includes(text));

const dropped = { "excluded project": 0, "not in --project": 0, "mining run": 0, "no turns in range": 0 };
const queue = state.threads.filter((item) => {
	if (ancestry(item).some((above) => matches(above, args.exclude))) dropped["excluded project"] += 1;
	else if (args.project.length && !matches(item, args.project)) dropped["not in --project"] += 1;
	else return true;
	return false;
});
const loaded = [];
const fetchNext = async () => {
	for (let info = queue.shift(); info; info = queue.shift()) {
		const snapshot = await get(`/api/thread?threadId=${info.id}`);
		loaded.push({ info, snapshot, thread: digestThread(snapshot) });
	}
};
await Promise.all([fetchNext(), fetchNext(), fetchNext(), fetchNext()]);

// Mining runs and the reviewers they start would feed the next run its own output.
const mining = new Set(loaded.filter((entry) => entry.thread.mining).map((entry) => entry.info.id));
const kept = loaded.filter((entry) => {
	if (ancestry(entry.info).some((above) => mining.has(above.id))) dropped["mining run"] += 1;
	else if (!entry.thread.turns.length) dropped["no turns in range"] += 1;
	else return true;
	return false;
});

// Trees by project, each in creation order (a parent's ID is below its threads'), so batches hold related threads.
const rootOf = (entry) => ancestry(entry.info).at(-1);
const byNumber = (a, b) => Number(a) - Number(b);
kept.sort(
	(a, b) => project(rootOf(a)).name.localeCompare(project(rootOf(b)).name) || byNumber(rootOf(a).id, rootOf(b).id) || byNumber(a.info.id, b.info.id),
);

const outDir = args.out ?? fs.mkdtempSync(path.join(os.tmpdir(), "mel-thread-digest-"));
fs.mkdirSync(path.join(outDir, "threads"), { recursive: true, mode: 0o700 });
fs.chmodSync(outDir, 0o700);
const write = (file, text) => fs.writeFileSync(file, text, { mode: 0o600 });

const batches = [];
const digests = kept.map((entry) => {
	const { text, cut } = renderThread(entry);
	const digestPath = path.join(outDir, "threads", `${entry.info.id}.md`);
	write(digestPath, text);
	const size = Buffer.byteLength(text);
	const current = batches.at(-1);
	if (!current || current.size + size > batchBytes) batches.push({ size, paths: [digestPath] });
	else Object.assign(current, { size: current.size + size, paths: [...current.paths, digestPath] });
	return { ...entry, cut, size };
});
batches.forEach((batch, index) => write(path.join(outDir, `batch-${index + 1}.txt`), `${batch.paths.join("\n")}\n`));

const section = (title, headers, rows) => [`## ${title}`, "", `| ${headers.join(" | ")} |`, `|${" --- |".repeat(headers.length)}`, ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`), ""];
const kind = (info) => (info.parentThreadId ? `parent ${info.parentThreadId}` : info.launchedBy ? `launched by ${info.launchedBy}` : "top-level");
const rows = digests.map(({ info, thread, cut }) => {
	const { user, request, report, calls, failed, stops } = thread.counts;
	const digest = `[${info.id}.md](threads/${info.id}.md)`;
	return [digest, rootOf({ info }).id, project(info).name, kind(info), agentNames.get(info.agentId) ?? "none", oneLine(info.title, 60), when(thread.turns.at(-1).timestamp), user, request, report, calls, failed, stops, cut];
});
const invoked = new Map(count(kept.flatMap((entry) => [...new Set(entry.thread.invoked)])));
const read = new Map(count(kept.flatMap((entry) => [...new Set(entry.thread.read)])));
const skills = [...new Set([...invoked.keys(), ...read.keys()])].map((name) => [name, invoked.get(name) ?? 0, read.get(name) ?? 0]);
const droppedText = Object.entries(dropped).filter(([, n]) => n).map(([reason, n]) => `${n} ${reason}`).join(", ") || "none";
const index = [
	"# Thread digest",
	"",
	`Turns from the last ${days} days, from ${args.url}. Listed threads: ${state.threads.length}; kept ${kept.length}; dropped: ${droppedText}. Archived threads are not listed.`,
	`Review batches: ${batches.length} (\`batch-N.txt\`, about ${args["batch-kb"]} KB each). Digests are named by thread ID; Tree is the top thread's ID.`,
	"",
	...section("Threads", ["Digest", "Tree", "Project", "Kind", "Agent", "Title", "Last turn", "User", "Requests", "Reports", "Calls", "Failed", "Stops", "Cut"], rows),
	...section("Skills (threads)", ["Skill", "Invoked by the user", "Read by the agent"], skills),
	...section("Tools (calls)", ["Tool", "Calls"], count(kept.flatMap((entry) => entry.thread.tools)).slice(0, 20)),
	...section("Top bash commands (calls)", ["Command", "Calls"], count(kept.flatMap((entry) => entry.thread.commands)).slice(0, 40)),
];
write(path.join(outDir, "index.md"), index.join("\n"));
const totalKb = Math.round(digests.reduce((sum, digest) => sum + digest.size, 0) / 1024);
const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.error(`Kept ${kept.length} of ${state.threads.length} threads (dropped: ${droppedText}); ${totalKb} KB of digests in ${batches.length} batches; ${seconds} s.`);
if (!kept.length) console.error(`No threads have turns in the last ${days} days.`);
console.log(path.join(outDir, "index.md"));
