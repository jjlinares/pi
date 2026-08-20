import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSubagents } from "./executor.mjs";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { Container, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import {
	RUN_ROOT,
	buildRunConfig,
	ensureDir,
	findRunDir,
	formatStatus,
	needsFork,
	notifyCompletion,
	randomId,
	readJson,
	statusPath,
	type ContextMode,
	type NotifyMode,
	type RunConfig,
	type RunStatus,
	type SubagentParams,
} from "./core.ts";
import { projectRunStatus, SubagentReadModel, type ChildSnapshot } from "./read-model.ts";
import { CompletionNotificationState, type NotificationRecord } from "./notification-state.ts";
import {
	formatCancellationResults,
	formatChildCheck,
	formatWaitResults,
	requestChildCancellations,
	resolveChildTargets,
	selectorsForAction,
	waitForChildTargets,
} from "./management.ts";
import { openSubagentsDashboard } from "./ui/index.ts";
import { SubagentStatusCard } from "./ui/status-card.ts";

type PreparedRun = { id: string; dir: string; notify: NotifyMode; count: number; config: RunConfig; configPath: string };

const RUNNER_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "runner.mjs");
const STATUS_ID = "subagents";

const ToolOverride = Type.Unsafe({
	anyOf: [
		{ type: "array", items: { type: "string" } },
		{ type: "string" },
		{ const: false },
	],
	description: "Child tool allowlist as comma-separated string/array, or false for --no-tools. Omit for normal Pi tools.",
});

const ThinkingSchema = Type.String({ enum: ["off", "minimal", "low", "medium", "high", "xhigh"], description: "Child thinking level passed to Pi --thinking. Default medium." });

const SubagentSchema = Type.Object({
	profile: Type.Optional(Type.String({ description: "Local YAML profile path for subagent defaults. Inline fields take priority." })),
	name: Type.Optional(Type.String({ description: "Human-readable child label." })),
	task: Type.String({ description: "User task for this child Pi session." }),
	appendSystemPrompt: Type.Optional(Type.String({ description: "Optional role/config prompt appended to Pi's core system prompt for this child. No prompt override is passed when omitted." })),
	context: Type.Optional(Type.String({ enum: ["fresh", "fork"] })),
	model: Type.Optional(Type.String()),
	thinking: Type.Optional(ThinkingSchema),
	tools: Type.Optional(ToolOverride),
	cwd: Type.Optional(Type.String()),
}, { additionalProperties: false });

const SubagentParamsSchema = Type.Object({
	action: Type.Optional(Type.String({
		enum: ["status", "check", "wait", "cancel"],
		description: "Manage existing session-owned subagent runs or launch a new run when omitted.",
	})),
	id: Type.Optional(Type.String({
		description: "Run id/prefix for status, or one run/child selector for check, wait, or cancel.",
	})),
	ids: Type.Optional(Type.Array(Type.String(), {
		minItems: 1,
		maxItems: 64,
		description: "Run ids/prefixes or child ids for wait/cancel. A run selector expands to all children in that run.",
	})),

	appendSystemPrompt: Type.Optional(Type.String({ description: "Optional default role/config prompt appended to Pi's core system prompt; used by subagents that omit appendSystemPrompt. No prompt override is passed when omitted." })),
	subagents: Type.Optional(Type.Array(SubagentSchema, { minItems: 1, description: "One or more child subagents to run." })),

	context: Type.Optional(Type.String({ enum: ["fresh", "fork"], description: "Default fresh." })),
	model: Type.Optional(Type.String({ description: "Default model override for children." })),
	thinking: Type.Optional(ThinkingSchema),
	tools: Type.Optional(ToolOverride),
	cwd: Type.Optional(Type.String({ description: "Default child cwd." })),
	concurrency: Type.Optional(Type.Integer({ minimum: 1, maximum: 16, description: "Parallel child concurrency. Default 4." })),
	timeoutMs: Type.Optional(Type.Integer({ minimum: 1, description: "Hard per-child wall-clock kill timeout in milliseconds. Omit unless the user explicitly requested a cutoff; active children are killed when this expires." })),
	includeJsonl: Type.Optional(Type.Boolean({ description: "Write raw child JSONL files, capped at 50MB per child. Default false." })),
	async: Type.Optional(Type.Boolean({ description: "Run in background and return immediately. Default false: foreground/blocking." })),
	notify: Type.Optional(Type.String({ enum: ["tui", "followUp", "none"], description: "Background completion behavior. Default tui; followUp wakes parent agent. Ignored for foreground runs." })),
}, { additionalProperties: false });

function createForkResolver(ctx: ExtensionContext, context: ContextMode): (index: number) => string | undefined {
	if (context !== "fork") return () => undefined;
	const manager = ctx.sessionManager as unknown as {
		getSessionFile(): string | undefined;
		getLeafId(): string | null;
		getSessionDir?(): string;
		openSession?: (file: string, dir?: string) => { createBranchedSession(leafId: string): string | undefined };
	};
	const parentSessionFile = manager.getSessionFile();
	if (!parentSessionFile) throw new Error("Forked subagent context requires a persisted parent session.");
	const leafId = manager.getLeafId();
	if (!leafId) throw new Error("Forked subagent context requires a current session leaf.");
	const sessionDir = manager.getSessionDir?.();
	const cache = new Map<number, string>();
	return (index: number) => {
		const cached = cache.get(index);
		if (cached) return cached;
		const source = manager.openSession?.(parentSessionFile, sessionDir) ?? SessionManager.open(parentSessionFile, sessionDir);
		const sessionFile = source.createBranchedSession(leafId);
		if (!sessionFile) throw new Error("Session manager did not return a forked session file.");
		cache.set(index, sessionFile);
		return sessionFile;
	};
}

function prepareRun(params: SubagentParams, ctx: ExtensionContext): PreparedRun {
	const runId = randomId();
	const runDir = path.join(RUN_ROOT, runId);
	ensureDir(runDir);
	const forkSessionForIndex = needsFork(params, ctx.cwd) ? createForkResolver(ctx, "fork") : undefined;
	const config = buildRunConfig({
		params,
		ctxCwd: ctx.cwd,
		runId,
		runDir,
		parentSessionId: ctx.sessionManager.getSessionId(),
		forkSessionForIndex,
	});
	config.piScript = process.argv[1];
	const configPath = path.join(runDir, "config.json");
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
	return { id: runId, dir: runDir, notify: config.notify, count: config.subagents.length, config, configPath };
}

function statusFromDetails(details: unknown): { status: RunStatus; dir?: string } | undefined {
	if (!details || typeof details !== "object") return undefined;
	const record = details as { status?: RunStatus; dir?: string };
	if (record.status?.subagents) return { status: record.status, dir: record.dir };
	return undefined;
}

function launchAsyncRun(params: SubagentParams, ctx: ExtensionContext): {
	id: string;
	dir: string;
	notify: NotifyMode;
	count: number;
	children: Array<{ id: string; name: string }>;
} {
	const run = prepareRun(params, ctx);
	const child = spawn(process.execPath, [RUNNER_PATH, run.configPath], {
		cwd: run.config.cwd,
		detached: true,
		stdio: "ignore",
		env: { ...process.env, PI_SUBAGENTS_PI_SCRIPT: process.argv[1] },
	});
	child.unref();
	return {
		id: run.id,
		dir: run.dir,
		notify: run.notify,
		count: run.count,
		children: run.config.subagents.map((subagent) => ({ id: subagent.id, name: subagent.name })),
	};
}

async function runForeground(
	params: SubagentParams,
	ctx: ExtensionContext,
	signal: AbortSignal | undefined,
	onUpdate: ((result: { content: Array<{ type: "text"; text: string }>; details: unknown; isError?: boolean }) => void) | undefined,
) {
	const run = prepareRun(params, ctx);
	let lastStatusText = "";
	const emitUpdate = (status: RunStatus) => {
		const statusText = formatStatus(run.dir);
		if (statusText === lastStatusText) return;
		lastStatusText = statusText;
		onUpdate?.({ content: [{ type: "text", text: `Subagent run ${run.id} ${status.state} (${status.subagents.filter((task) => task.state === "complete" || task.state === "cancelled" || task.state === "failed").length}/${status.subagents.length}).` }], details: { ...run, status } });
	};
	const { status, resultText } = await runSubagents(run.config, { signal, onUpdate: emitUpdate });
	return {
		content: [{ type: "text" as const, text: resultText }],
		details: { ...run, status },
		...(status.state === "failed" ? { isError: true } : {}),
	};
}

export default function registerSubagents(pi: ExtensionAPI): void {
	if (process.env.PI_SIMPLE_SUBAGENT_CHILD === "1") return;
	ensureDir(RUN_ROOT);
	let readModel: SubagentReadModel | undefined;
	let sessionCtx: ExtensionContext | undefined;
	let unsubscribe: (() => void) | undefined;
	let notificationRetry: NodeJS.Timeout | undefined;
	let activeDashboardCloser: (() => void) | undefined;
	const notifications = new CompletionNotificationState(3);

	const closeActiveDashboard = () => {
		const close = activeDashboardCloser;
		activeDashboardCloser = undefined;
		try { close?.(); } catch {}
	};

	const updateFooter = (ctx: ExtensionContext, snapshots: readonly ChildSnapshot[]) => {
		const active = snapshots.filter((snapshot) => snapshot.runState === "running");
		if (active.length === 0) {
			ctx.ui.setStatus(STATUS_ID, undefined);
			return;
		}
		const running = active.filter((snapshot) => snapshot.state === "running").length;
		const queued = active.filter((snapshot) => snapshot.state === "queued").length;
		const completed = active.filter((snapshot) => snapshot.state === "complete").length;
		const cancelled = active.filter((snapshot) => snapshot.state === "cancelled").length;
		const failed = active.filter((snapshot) => snapshot.state === "failed").length;
		const counts = [
			`${running} running`,
			...(queued ? [`${queued} queued`] : []),
			`${completed} completed`,
			`${cancelled} cancelled`,
			`${failed} failed`,
		].join(" · ");
		ctx.ui.setStatus(STATUS_ID, `subagents: ${counts} · /subagents`);
	};

	const dispatchNotification = (snapshot: ChildSnapshot, tracked: Readonly<NotificationRecord>) => {
		const ctx = sessionCtx;
		if (!ctx) throw new Error("Subagent session is no longer active.");
		notifyCompletion({
			notify: tracked.notify,
			status: {
				id: snapshot.parentRunId,
				state: snapshot.runState,
				cwd: snapshot.cwd,
				notify: tracked.notify,
				startedAt: snapshot.runStartedAt,
				updatedAt: snapshot.runUpdatedAt,
				...(snapshot.runCompletedAt !== undefined ? { completedAt: snapshot.runCompletedAt } : {}),
				subagents: [],
			},
			runDir: tracked.runDir,
			hasUI: ctx.hasUI,
			isIdle: ctx.isIdle(),
			sendUserMessage: (message, options) => pi.sendUserMessage(message, options),
			uiNotify: (message, type) => ctx.ui.notify(message, type),
		});
	};

	const clearNotificationRetry = () => {
		if (notificationRetry) clearTimeout(notificationRetry);
		notificationRetry = undefined;
	};

	const handleSnapshots = (snapshots: readonly ChildSnapshot[]) => {
		const ctx = sessionCtx;
		if (!ctx) return;
		try { updateFooter(ctx, snapshots); } catch {}
		const { retryNeeded } = notifications.observe(snapshots, dispatchNotification);
		if (!retryNeeded) clearNotificationRetry();
		else if (!notificationRetry) {
			notificationRetry = setTimeout(() => {
				notificationRetry = undefined;
				const current = readModel?.list();
				if (current) {
					try { handleSnapshots(current); } catch {}
				}
			}, 250);
			notificationRetry.unref?.();
		}
	};

	const safeHandleSnapshots = (snapshots: readonly ChildSnapshot[]) => {
		try { handleSnapshots(snapshots); } catch {}
	};

	pi.registerCommand("subagents", {
		description: "Open the live subagent dashboard",
		handler: async (_args, ctx) => {
			if (!readModel) {
				if (ctx.hasUI) ctx.ui.notify("Subagent dashboard is not available for this session.", "warning");
				return;
			}
			await openSubagentsDashboard(ctx, readModel, (close) => {
				closeActiveDashboard();
				activeDashboardCloser = close;
				return () => {
					if (activeDashboardCloser === close) activeDashboardCloser = undefined;
				};
			});
		},
	});

	pi.registerTool({
		name: "subagent",
		label: "Subagent",
		description: [
			"Launch foreground or async/background child Pi sessions for orchestration fanout.",
			"Use action status/check/wait/cancel to inspect or control existing session-owned runs and children.",
			"Pass subagents[] plus optional appendSystemPrompt/model/thinking/tools/cwd/context defaults.",
			"The extension adds no default child role or safety prompt; the orchestrator must define instructions and tool access explicitly.",
			"Default is foreground/blocking; set async:true for background execution.",
			"For background runs, default notify is TUI completion notification; set notify:'followUp' to wake the parent agent.",
		].join(" "),
		parameters: SubagentParamsSchema,
		async execute(_id, rawParams, signal, onUpdate, ctx) {
			const params = rawParams as SubagentParams;
			try {
				if (!params.action && (params.id || params.ids?.length)) {
					throw new Error("id and ids require action status, check, wait, or cancel.");
				}
				const selectors = params.action ? selectorsForAction(params.action, params.id, params.ids) : [];
				if (params.action === "status") {
					const parentSessionId = ctx.sessionManager.getSessionId();
					const runId = selectors[0];
					const runDir = runId ? findRunDir(runId, RUN_ROOT, parentSessionId) : undefined;
					const candidateStatus = runDir ? readJson<RunStatus>(statusPath(runDir)) : undefined;
					const status = candidateStatus?.parentSessionId === parentSessionId ? candidateStatus : undefined;
					return {
						content: [{
							type: "text",
							text: runId && !runDir
								? `No subagent run found for '${runId}' in this session.`
								: formatStatus(runDir, RUN_ROOT, Date.now(), parentSessionId),
						}],
						details: status ? { status, dir: runDir } : {},
					};
				}

				if (params.action === "check" || params.action === "wait" || params.action === "cancel") {
					if (!readModel) throw new Error("Subagent management is not available for this session.");
					const targets = resolveChildTargets(readModel.list(), selectors);

					if (params.action === "check") {
						if (targets.length !== 1) {
							throw new Error(`Check requires one child id; the selector matched: ${targets.map((target) => target.id).join(", ")}.`);
						}
						const target = targets[0];
						return {
							content: [{ type: "text", text: formatChildCheck(target) }],
							details: { action: "check", child: { id: target.id, runId: target.parentRunId, state: target.state } },
						};
					}

					if (params.action === "wait") {
						const settled = await waitForChildTargets(readModel, targets, signal, (pending) => {
							onUpdate?.({
								content: [{ type: "text", text: `Waiting for ${pending.map((target) => target.id).join(", ")}...` }],
								details: { action: "wait", pending: pending.map((target) => target.id) },
							});
						});
						return {
							content: [{ type: "text", text: formatWaitResults(settled) }],
							details: { action: "wait", children: settled.map((target) => ({ id: target.id, runId: target.parentRunId, state: target.state })) },
						};
					}

					const results = requestChildCancellations(readModel, targets);
					return {
						content: [{ type: "text", text: formatCancellationResults(results) }],
						details: {
							action: "cancel",
							children: results.map(({ snapshot, requested }) => ({ id: snapshot.id, runId: snapshot.parentRunId, state: snapshot.state, requested })),
						},
					};
				}

				if (params.async === true) {
					const run = launchAsyncRun(params, ctx);
					notifications.trackLaunch(run.id, run.dir, run.notify);
					const children = run.children.map((child) => `- ${child.id} "${child.name}"`).join("\n");
					return {
						content: [{
							type: "text",
							text: `Started subagent run ${run.id} (${run.count} subagent${run.count === 1 ? "" : "s"}).\nChildren:\n${children}\nStatus: subagent({ action: "status", id: "${run.id}" })\nDir: ${run.dir}`,
						}],
						details: run,
					};
				}
				return await runForeground(params, ctx, signal, onUpdate);
			} catch (error) {
				return {
					content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
					isError: true,
					details: {},
				};
			}
		},
		renderCall(args, theme) {
			const params = args as SubagentParams;
			if (params.action) {
				const targets = params.ids?.join(", ") ?? params.id ?? "";
				return new Text(`${theme.fg("toolTitle", theme.bold("subagent "))}${params.action} ${targets}`, 0, 0);
			}
			return new Container();
		},
		renderResult(result, options, theme) {
			const rendered = statusFromDetails(result.details);
			if (rendered) {
				const children = projectRunStatus(rendered.status, rendered.dir ?? path.join(RUN_ROOT, rendered.status.id));
				return new SubagentStatusCard({
					state: rendered.status.state,
					startedAt: rendered.status.startedAt,
					...(rendered.status.completedAt !== undefined ? { completedAt: rendered.status.completedAt } : {}),
					totalChildren: rendered.status.subagents.length,
					children,
				}, theme, Boolean(options?.expanded));
			}
			const text = result.content.find((item) => item.type === "text")?.text ?? "";
			return new Text(theme.fg(result.isError ? "error" : "muted", text), 0, 0);
		},
	});

	pi.on("session_start", (_event, ctx) => {
		unsubscribe?.();
		readModel?.dispose();
		clearNotificationRetry();
		sessionCtx = ctx;
		readModel = new SubagentReadModel(RUN_ROOT, ctx.sessionManager.getSessionId());
		notifications.seed(readModel.list());
		safeHandleSnapshots(readModel.list());
		unsubscribe = readModel.subscribe(safeHandleSnapshots);
	});

	pi.on("session_shutdown", (_event, ctx) => {
		unsubscribe?.();
		unsubscribe = undefined;
		readModel?.dispose();
		readModel = undefined;
		clearNotificationRetry();
		notifications.clear();
		closeActiveDashboard();
		sessionCtx = undefined;
		ctx.ui.setStatus(STATUS_ID, undefined);
	});
}
