import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  CONTROL_POLL_MS,
  CONTROL_PROTOCOL_VERSION,
  MAX_TRANSCRIPT_BYTES,
  eventsFilePath,
  readAbortMarker,
  resultFilePath,
  statusFilePath,
  transcriptFilePath,
} from "./_protocol.mjs";
import { MAX_TOOL_RESULT_BYTES, MAX_TOOL_RESULT_CHILD_BYTES } from "./limits.mjs";
export { MAX_TOOL_RESULT_BYTES, MAX_TOOL_RESULT_CHILD_BYTES } from "./limits.mjs";

const KILL_GRACE_MS = 3000;
const MAX_JSONL_BYTES = 50 * 1024 * 1024;
const MAX_TRANSCRIPT_FIELD_CHARS = 64 * 1024;
const MAX_TOOL_UPDATE_BYTES = 8 * 1024;

function now() {
  return Date.now();
}

function safeName(value) {
  return String(value || "task").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "task";
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function formatResumeCommand(session) {
  return `(cd -- ${shellQuote(session.cwd)} && pi --session ${session.id})`;
}

function writeTextAtomic(file, value) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, value, { mode: 0o600 });
  try {
    fs.renameSync(tmp, file);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

function writeJsonAtomic(file, value) {
  writeTextAtomic(file, `${JSON.stringify(value, null, 2)}\n`);
}

function appendEvent(eventsPath, event) {
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, { mode: 0o600 });
}

function sanitizeTranscriptText(value) {
  return String(value ?? "")
    .replace(/\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\)?)/g, "")
    .replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, "")
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .slice(0, MAX_TRANSCRIPT_FIELD_CHARS);
}

function sanitizeTranscriptValue(value, depth = 0) {
  if (typeof value === "string") return sanitizeTranscriptText(value);
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 6) return "[nested]";
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => sanitizeTranscriptValue(entry, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, entry]) => [sanitizeTranscriptText(key), sanitizeTranscriptValue(entry, depth + 1)]));
  }
  return String(value ?? "");
}

function textFromToolResult(value) {
  if (!value || typeof value !== "object") return undefined;
  const content = value.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return undefined;
  const text = content
    .map((part) => typeof part === "string" ? part : part?.type === "text" && typeof part.text === "string" ? part.text : "")
    .filter(Boolean)
    .join("\n");
  return text || undefined;
}

function transcriptValue(value) {
  if (typeof value === "string") return sanitizeTranscriptText(value);
  if (value === undefined) return undefined;
  const toolText = textFromToolResult(value);
  if (toolText !== undefined) return sanitizeTranscriptText(toolText);
  try { return sanitizeTranscriptText(JSON.stringify(sanitizeTranscriptValue(value))); } catch { return "[unserializable]"; }
}

function boundUtf8Text(value, maxBytes) {
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

function appendTranscript(subagentStatus, event, config) {
  const at = now();
  const normalized = {
    ts: at,
    type: event.type,
    ...(event.tool ? { tool: sanitizeTranscriptText(event.tool) } : {}),
    ...(event.text !== undefined ? { text: transcriptValue(event.text) } : {}),
  };
  subagentStatus.latestActivity = {
    type: normalized.type,
    ...(normalized.tool ? { tool: normalized.tool } : {}),
    ...(normalized.text ? { text: normalized.text.slice(0, 240) } : {}),
    at,
  };
  if (subagentStatus.transcriptTruncated) return;

  const requestedMax = config.maxTranscriptBytes;
  const maxBytes = Number.isFinite(requestedMax) && requestedMax > 0
    ? Math.min(requestedMax, MAX_TRANSCRIPT_BYTES)
    : MAX_TRANSCRIPT_BYTES;
  const current = subagentStatus.transcriptBytes ?? 0;
  const chunk = `${JSON.stringify(normalized)}\n`;
  const marker = `${JSON.stringify({ ts: at, type: "truncated", maxBytes })}\n`;
  if (current + Buffer.byteLength(chunk) > maxBytes - Buffer.byteLength(marker)) {
    if (current + Buffer.byteLength(marker) <= maxBytes) {
      fs.appendFileSync(subagentStatus.transcriptFile, marker, { mode: 0o600 });
      subagentStatus.transcriptBytes = current + Buffer.byteLength(marker);
    }
    subagentStatus.transcriptTruncated = true;
    return;
  }
  fs.appendFileSync(subagentStatus.transcriptFile, chunk, { mode: 0o600 });
  subagentStatus.transcriptBytes = current + Buffer.byteLength(chunk);
}

function ensurePrivateDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch {}
}

function emptyUsage() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, totalTokens: 0, turns: 0 };
}

function normalizeTools(tools) {
  if (tools === undefined || tools === null) return undefined;
  if (tools === false) return false;
  if (Array.isArray(tools)) return tools.filter(Boolean).join(",");
  if (typeof tools === "string") return tools;
  return undefined;
}

function textFromMessage(message) {
  if (!message?.content || !Array.isArray(message.content)) return "";
  return message.content
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function addUsage(target, message) {
  const usage = message?.usage;
  if (!usage) return;
  target.input += usage.input || 0;
  target.output += usage.output || 0;
  target.cacheRead += usage.cacheRead || 0;
  target.cacheWrite += usage.cacheWrite || 0;
  target.cost += usage.cost?.total || 0;
  target.totalTokens += usage.totalTokens || ((usage.input || 0) + (usage.output || 0));
}

function getPiInvocation(args, config) {
  const script = config.piScript || process.env.PI_SUBAGENTS_PI_SCRIPT;
  if (script) return { command: process.execPath, args: [script, ...args] };
  return { command: "pi", args };
}

function createStatus(config) {
  return {
    id: config.runId,
    ...(typeof config.parentSessionId === "string" ? { parentSessionId: config.parentSessionId } : {}),
    mode: config.mode ?? "foreground",
    controlProtocolVersion: CONTROL_PROTOCOL_VERSION,
    state: "running",
    cwd: config.cwd,
    notify: config.notify,
    startedAt: now(),
    updatedAt: now(),
    completedAt: undefined,
    error: undefined,
    subagents: config.subagents.map((task, index) => ({
      id: task.id,
      index,
      name: task.name,
      task: task.task,
      state: "queued",
      cwd: task.cwd ?? config.cwd,
      context: task.context,
      model: task.model,
      thinking: task.thinking,
      sessionFile: task.sessionFile,
      sessionId: undefined,
      resumeCommand: undefined,
      startedAt: undefined,
      completedAt: undefined,
      updatedAt: now(),
      exitCode: undefined,
      error: undefined,
      reason: undefined,
      warning: undefined,
      preview: "",
      currentTool: undefined,
      currentToolArgs: undefined,
      currentToolStartedAt: undefined,
      currentPath: undefined,
      toolCount: 0,
      recentTools: [],
      recentOutput: [],
      outputFile: path.join(config.runDir, `output-${index}-${safeName(task.name)}.md`),
      stderrFile: path.join(config.runDir, `subagent-${index}-${safeName(task.name)}.stderr.log`),
      ...(config.includeJsonl ? { stdoutFile: path.join(config.runDir, `subagent-${index}-${safeName(task.name)}.jsonl`) } : {}),
      transcriptFile: transcriptFilePath(config.runDir, index),
      transcriptBytes: 0,
      transcriptTruncated: false,
      latestActivity: undefined,
      usage: emptyUsage(),
    })),
  };
}

function persist(status, statusPath, onUpdate) {
  status.state = "running";
  status.completedAt = undefined;
  status.updatedAt = now();
  writeJsonAtomic(statusPath, status);
  try { onUpdate?.(status); } catch {}
}

function publishTerminal(status, statusPath, onUpdate, forcedState) {
  const failed = status.subagents.some((task) => task.state === "failed");
  const cancelled = status.subagents.some((task) => task.state === "cancelled");
  status.state = forcedState ?? (failed ? "failed" : cancelled ? "cancelled" : "complete");
  status.completedAt = now();
  status.updatedAt = now();
  writeJsonAtomic(statusPath, status);
  try { onUpdate?.(status); } catch {}
}

function writeSubagentFiles(config, task, index) {
  const name = safeName(task.name);
  const promptPath = task.appendSystemPrompt ? path.join(config.runDir, `prompt-${index}-${name}.md`) : undefined;
  if (promptPath) fs.writeFileSync(promptPath, task.appendSystemPrompt, { encoding: "utf8", mode: 0o600 });

  const taskPath = path.join(config.runDir, `input-${index}-${name}.md`);
  fs.writeFileSync(taskPath, `Task:\n${task.task}\n`, { mode: 0o600 });
  return { promptPath, taskPath };
}

function argsForSubagent(config, task, index) {
  const { promptPath, taskPath } = writeSubagentFiles(config, task, index);
  const args = ["--mode", "json", "-p", "--no-extensions", "--name", `subagent: ${task.name}`];
  if (task.sessionFile) args.push("--session", task.sessionFile);
  if (task.model) args.push("--model", task.model);
  if (task.thinking) args.push("--thinking", task.thinking);

  const tools = normalizeTools(task.tools);
  if (tools === false) args.push("--no-tools");
  else if (tools) args.push("--tools", tools);

  if (promptPath) args.push("--append-system-prompt", promptPath);
  args.push(`@${taskPath}`);
  return args;
}

function appendRawJsonl(subagentStatus, line, rawJsonlBytes, config) {
  if (!subagentStatus.stdoutFile) return;
  const maxBytes = config.maxJsonlBytes ?? MAX_JSONL_BYTES;
  const chunk = `${line}\n`;
  const current = rawJsonlBytes.get(subagentStatus.stdoutFile) ?? 0;
  const size = Buffer.byteLength(chunk, "utf8");
  if (current >= maxBytes) return;
  if (current + size > maxBytes) {
    const marker = `{"type":"subagent_jsonl_truncated","maxBytes":${maxBytes}}\n`;
    fs.appendFileSync(subagentStatus.stdoutFile, marker, { mode: 0o600 });
    rawJsonlBytes.set(subagentStatus.stdoutFile, maxBytes);
    return;
  }
  fs.appendFileSync(subagentStatus.stdoutFile, chunk, { mode: 0o600 });
  rawJsonlBytes.set(subagentStatus.stdoutFile, current + size);
}

function processJsonLine({ line, subagentStatus, config, index, setFinalOutput, status, statusPath, onUpdate, rawJsonlBytes, onFinalStop, onSession, onAssistantMessage, toolUpdateState }) {
  if (!line.trim()) return;
  appendRawJsonl(subagentStatus, line, rawJsonlBytes, config);

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    appendTranscript(subagentStatus, { type: "warning", text: "Malformed child JSON event" }, config);
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
    return;
  }

  if (event.type === "session" && typeof event.id === "string") {
    const session = { id: event.id, cwd: typeof event.cwd === "string" ? event.cwd : subagentStatus.cwd };
    subagentStatus.sessionId = event.id;
    onSession?.(session);
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
  }

  if (event.type === "message_end" && event.message) {
    if (event.message.role === "assistant") {
      onAssistantMessage?.();
      subagentStatus.usage.turns += 1;
      addUsage(subagentStatus.usage, event.message);
      const text = textFromMessage(event.message).trim();
      if (text) {
        setFinalOutput(text);
        appendTranscript(subagentStatus, { type: "assistant", text }, config);
        const outputLines = text.split("\n").filter((part) => part.trim()).slice(-5);
        subagentStatus.recentOutput = outputLines;
        subagentStatus.preview = text.split("\n").find((part) => part.trim())?.slice(0, 240) || subagentStatus.preview;
      }
      if (event.message.errorMessage) {
        subagentStatus.warning = event.message.errorMessage;
        appendTranscript(subagentStatus, { type: "warning", text: event.message.errorMessage }, config);
      }
      const stopReason = event.message.stopReason;
      const hasToolCall = Array.isArray(event.message.content) && event.message.content.some((part) => part?.type === "toolCall");
      if (stopReason === "stop" && !hasToolCall) onFinalStop?.({ clean: !event.message.errorMessage && Boolean(text) });
    }
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
  }

  if (event.type === "tool_execution_start" || event.type === "tool_call") {
    toolUpdateState.hasValue = false;
    toolUpdateState.value = undefined;
    subagentStatus.currentTool = event.toolName || event.name || "unknown";
    subagentStatus.currentToolArgs = event.args ? JSON.stringify(event.args).slice(0, 240) : undefined;
    subagentStatus.currentToolStartedAt = now();
    subagentStatus.currentPath = event.args?.path || event.args?.file_path || event.args?.command;
    subagentStatus.toolCount = (subagentStatus.toolCount || 0) + 1;
    subagentStatus.preview = `tool: ${subagentStatus.currentTool}${subagentStatus.currentPath ? ` ${String(subagentStatus.currentPath).slice(0, 160)}` : ""}`;
    appendTranscript(subagentStatus, { type: "tool_start", tool: subagentStatus.currentTool, text: event.args }, config);
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
  }

  if (event.type === "tool_execution_update") {
    const current = transcriptValue(event.partialResult ?? event.output ?? event.result ?? event.delta ?? event.content);
    if (toolUpdateState.hasValue && current === toolUpdateState.value) return;
    const text = typeof current === "string" && toolUpdateState.hasValue && typeof toolUpdateState.value === "string" && current.startsWith(toolUpdateState.value)
      ? current.slice(toolUpdateState.value.length)
      : current;
    toolUpdateState.hasValue = true;
    toolUpdateState.value = current;
    appendTranscript(subagentStatus, {
      type: "tool_update",
      tool: event.toolName || event.name || subagentStatus.currentTool || "unknown",
      ...(typeof text === "string" ? { text: boundUtf8Text(text, MAX_TOOL_UPDATE_BYTES) } : {}),
    }, config);
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
  }

  if (event.type === "tool_execution_end") {
    toolUpdateState.hasValue = false;
    toolUpdateState.value = undefined;
    const endedTool = event.toolName || event.name || subagentStatus.currentTool || "unknown";
    appendTranscript(subagentStatus, { type: "tool_end", tool: endedTool, text: event.output ?? event.result }, config);
    if (event.isError) appendTranscript(subagentStatus, { type: "error", tool: endedTool, text: event.result ?? "Tool execution failed" }, config);
    if (subagentStatus.currentTool) {
      subagentStatus.recentTools = [...(subagentStatus.recentTools || []), {
        tool: subagentStatus.currentTool,
        args: subagentStatus.currentToolArgs || "",
        endMs: now(),
      }].slice(-3);
    }
    subagentStatus.currentTool = undefined;
    subagentStatus.currentToolArgs = undefined;
    subagentStatus.currentToolStartedAt = undefined;
    subagentStatus.currentPath = undefined;
    subagentStatus.updatedAt = now();
    persist(status, statusPath, onUpdate);
  }
}

function killChild(child, signal = "SIGTERM") {
  try {
    if (child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
}

function childAddress(config, task, index) {
  return { runDir: config.runDir, runId: config.runId, childId: task.id, index };
}

function cancellationRequested(config, task, index) {
  return Boolean(readAbortMarker(childAddress(config, task, index)));
}

function isTerminalState(state) {
  return state === "complete" || state === "cancelled" || state === "failed";
}

function markCancelled(status, config, index) {
  const subagentStatus = status.subagents[index];
  if (isTerminalState(subagentStatus.state)) return false;
  subagentStatus.state = "cancelled";
  subagentStatus.reason = "Cancelled by user";
  subagentStatus.preview = subagentStatus.reason;
  subagentStatus.completedAt = now();
  subagentStatus.updatedAt = now();
  appendTranscript(subagentStatus, { type: "warning", text: subagentStatus.reason }, config);
  return true;
}

function cancelQueuedChild(status, config, statusPath, eventsPath, task, index, onUpdate) {
  if (status.subagents[index].state !== "queued" || !cancellationRequested(config, task, index)) return false;
  if (!markCancelled(status, config, index)) return false;
  appendEvent(eventsPath, { type: "subagent_end", ts: now(), index, name: task.name, error: "Cancelled by user", cancelledBeforeStart: true });
  persist(status, statusPath, onUpdate);
  return true;
}

async function runSubagent(config, status, statusPath, eventsPath, task, index, options) {
  const subagentStatus = status.subagents[index];
  if (isTerminalState(subagentStatus.state)) return;
  const cancelBeforeSpawn = () => {
    if (!cancellationRequested(config, task, index) || !markCancelled(status, config, index)) return false;
    appendEvent(eventsPath, { type: "subagent_end", ts: now(), index, name: task.name, error: "Cancelled by user", cancelledBeforeStart: true });
    persist(status, statusPath, options.onUpdate);
    return true;
  };
  if (cancelBeforeSpawn()) return;

  subagentStatus.state = "running";
  subagentStatus.startedAt = now();
  subagentStatus.updatedAt = now();
  persist(status, statusPath, options.onUpdate);

  const args = argsForSubagent(config, task, index);
  const invocation = getPiInvocation(args, config);
  if (cancelBeforeSpawn()) return;
  appendEvent(eventsPath, { type: "subagent_start", ts: now(), index, name: task.name, args: invocation.args });

  let finalOutput = "";
  let stdoutBuffer = "";
  let stderrBuffer = "";
  let session;
  let sawAssistantMessage = false;
  const onSession = (value) => {
    session = value;
    if (task.sessionFile) subagentStatus.resumeCommand = formatResumeCommand(value);
  };
  const rawJsonlBytes = new Map();
  const toolUpdateState = { hasValue: false, value: undefined };
  let timedOut = false;
  let aborted = false;
  let cancelledByUser = false;
  let childExited = false;
  let forcedFinalDrain = false;
  let cleanTerminalAssistantStop = false;
  let finalDrainTimer;
  let finalHardKillTimer;
  const hardKillTimers = [];
  const child = spawn(invocation.command, invocation.args, {
    cwd: task.cwd ?? config.cwd,
    detached: true,
    env: { ...process.env, PI_SIMPLE_SUBAGENT_CHILD: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const clearFinalDrainTimers = () => {
    if (finalDrainTimer) clearTimeout(finalDrainTimer);
    if (finalHardKillTimer) clearTimeout(finalHardKillTimer);
    finalDrainTimer = undefined;
    finalHardKillTimer = undefined;
  };

  const startFinalDrain = ({ clean }) => {
    cleanTerminalAssistantStop ||= clean;
    if (childExited || finalDrainTimer || timedOut || aborted || cancelledByUser) return;
    finalDrainTimer = setTimeout(() => {
      forcedFinalDrain = true;
      if (!cleanTerminalAssistantStop && !subagentStatus.error) subagentStatus.error = "Subagent process did not exit after final message.";
      killChild(child, "SIGTERM");
      finalHardKillTimer = setTimeout(() => killChild(child, "SIGKILL"), KILL_GRACE_MS);
      finalHardKillTimer.unref?.();
    }, 1000);
    finalDrainTimer.unref?.();
  };

  const scheduleTermination = () => {
    killChild(child, "SIGTERM");
    const hardKill = setTimeout(() => killChild(child, "SIGKILL"), KILL_GRACE_MS);
    hardKill.unref?.();
    hardKillTimers.push(hardKill);
  };

  const cancelByUser = () => {
    if (cancelledByUser || timedOut || aborted || childExited) return;
    cancelledByUser = true;
    subagentStatus.reason = "Cancelled by user";
    appendTranscript(subagentStatus, { type: "warning", text: subagentStatus.reason }, config);
    subagentStatus.updatedAt = now();
    persist(status, statusPath, options.onUpdate);
    scheduleTermination();
  };
  const controlPoll = setInterval(() => {
    if (cancellationRequested(config, task, index)) cancelByUser();
  }, CONTROL_POLL_MS);
  controlPoll.unref?.();
  if (cancellationRequested(config, task, index)) cancelByUser();

  const timeout = config.timeoutMs && config.timeoutMs > 0
    ? setTimeout(() => {
      if (cancelledByUser || aborted || childExited) return;
      timedOut = true;
      subagentStatus.error = `Timed out after ${config.timeoutMs}ms`;
      scheduleTermination();
    }, config.timeoutMs)
    : undefined;
  timeout?.unref?.();

  const abort = () => {
    if (cancelledByUser || timedOut || aborted || childExited) return;
    aborted = true;
    subagentStatus.reason = "Aborted";
    appendTranscript(subagentStatus, { type: "warning", text: subagentStatus.reason }, config);
    scheduleTermination();
  };
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });

  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() || "";
    for (const line of lines) {
      processJsonLine({ line, subagentStatus, config, index, setFinalOutput: (text) => { finalOutput = text; }, status, statusPath, onUpdate: options.onUpdate, rawJsonlBytes, onFinalStop: startFinalDrain, onSession, onAssistantMessage: () => { sawAssistantMessage = true; }, toolUpdateState });
    }
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    stderrBuffer += text;
    fs.appendFileSync(subagentStatus.stderrFile, text, { mode: 0o600 });
  });

  const exitCode = await new Promise((resolve) => {
    child.on("exit", () => {
      childExited = true;
      clearFinalDrainTimers();
    });
    child.on("close", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    child.on("error", (error) => {
      subagentStatus.error = error.message;
      resolve(1);
    });
  });

  if (timeout) clearTimeout(timeout);
  clearInterval(controlPoll);
  clearFinalDrainTimers();
  for (const timer of hardKillTimers) clearTimeout(timer);
  options.signal?.removeEventListener?.("abort", abort);

  if (stdoutBuffer.trim()) {
    processJsonLine({ line: stdoutBuffer, subagentStatus, config, index, setFinalOutput: (text) => { finalOutput = text; }, status, statusPath, onUpdate: options.onUpdate, rawJsonlBytes, onFinalStop: startFinalDrain, onSession, onAssistantMessage: () => { sawAssistantMessage = true; }, toolUpdateState });
  }
  if (!task.sessionFile && session && sawAssistantMessage) subagentStatus.resumeCommand = formatResumeCommand(session);
  if (!finalOutput && stderrBuffer.trim()) finalOutput = stderrBuffer.trim();
  if (!finalOutput && subagentStatus.warning) subagentStatus.error = subagentStatus.warning;
  if (!finalOutput) finalOutput = subagentStatus.error || subagentStatus.reason || "(no output)";

  const effectiveExitCode = forcedFinalDrain && cleanTerminalAssistantStop && finalOutput && !timedOut && !aborted && !cancelledByUser ? 0 : exitCode;
  subagentStatus.exitCode = effectiveExitCode;
  subagentStatus.completedAt = now();
  subagentStatus.updatedAt = now();
  if (timedOut) subagentStatus.error = `Timed out after ${config.timeoutMs}ms`;
  if (aborted) subagentStatus.reason = "Aborted";
  if (cancelledByUser) subagentStatus.reason = "Cancelled by user";
  subagentStatus.currentTool = undefined;
  subagentStatus.currentToolArgs = undefined;
  subagentStatus.currentToolStartedAt = undefined;
  subagentStatus.currentPath = undefined;
  fs.writeFileSync(subagentStatus.outputFile, finalOutput, { encoding: "utf8", mode: 0o600 });
  subagentStatus.preview = finalOutput.split("\n").find((line) => line.trim())?.slice(0, 240) || "(no output)";

  // Cancellation is cooperative. This last ownership-side check makes a request
  // observed before terminal publication win without pretending the marker write is atomic with exit.
  if (cancellationRequested(config, task, index)) {
    if (!cancelledByUser) appendTranscript(subagentStatus, { type: "warning", text: "Cancelled by user" }, config);
    cancelledByUser = true;
    subagentStatus.reason = "Cancelled by user";
  }
  subagentStatus.state = (cancelledByUser || aborted) && !subagentStatus.error
    ? "cancelled"
    : effectiveExitCode === 0 && !subagentStatus.error ? "complete" : "failed";
  if (subagentStatus.state === "failed") {
    appendTranscript(subagentStatus, { type: "error", text: subagentStatus.error || `Subagent process exited with code ${effectiveExitCode}` }, config);
  }
  persist(status, statusPath, options.onUpdate);
  appendEvent(eventsPath, { type: "subagent_end", ts: now(), index, name: task.name, exitCode: effectiveExitCode, error: subagentStatus.error, forcedFinalDrain });
}

async function mapConcurrent(items, concurrency, fn, signal) {
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (next < items.length && !signal?.aborted) {
      const index = next++;
      await fn(items[index], index);
    }
  });
  const settled = await Promise.allSettled(workers);
  const rejected = settled.find((result) => result.status === "rejected");
  if (rejected?.status === "rejected") throw rejected.reason;
}

function markQueuedAborted(status, config) {
  for (const task of status.subagents) {
    if (task.state !== "queued") continue;
    task.state = "cancelled";
    task.reason = "Aborted";
    task.completedAt = now();
    task.updatedAt = now();
    task.preview = task.reason;
    appendTranscript(task, { type: "warning", text: task.reason }, config);
  }
}

function truncateWithNotice(value, maxBytes, notice) {
  if (Buffer.byteLength(value, "utf8") <= maxBytes) return value;
  const requestedMarker = `\n\n${notice}`;
  const marker = boundUtf8Text(requestedMarker, maxBytes);
  const contentBudget = Math.max(0, maxBytes - Buffer.byteLength(marker, "utf8"));
  return `${boundUtf8Text(value, contentBudget)}${marker}`;
}

function writeAggregate(config, status, resultPath) {
  const fullSections = [];
  const toolSections = [];
  for (const task of status.subagents) {
    const persistedOutput = fs.existsSync(task.outputFile) ? fs.readFileSync(task.outputFile, "utf8").trim() : "";
    const output = persistedOutput || task.error || task.reason || "(no output)";
    const resume = task.resumeCommand ? `> Resume: \`${task.resumeCommand}\`\n\n` : "";
    const header = `## ${task.name} — ${task.state}\n\n${resume}`;
    fullSections.push(`${header}${output}`);
    const toolOutput = truncateWithNotice(
      output,
      MAX_TOOL_RESULT_CHILD_BYTES,
      `[Output truncated. Full output: ${task.outputFile}]`,
    );
    toolSections.push(`${header}${toolOutput}`);
  }

  const fullResultText = `# Subagent run ${config.runId}\n\n${fullSections.join("\n\n---\n\n")}\n`;
  writeTextAtomic(resultPath, fullResultText);

  const toolResultText = `# Subagent run ${config.runId}\n\n${toolSections.join("\n\n---\n\n")}\n`;
  return truncateWithNotice(
    toolResultText,
    MAX_TOOL_RESULT_BYTES,
    `[Subagent run output truncated. Full result: ${resultPath}]`,
  );
}

function markRunnerFailed(status, error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  status.error = message;
  for (const task of status.subagents) {
    if (isTerminalState(task.state)) continue;
    task.state = "failed";
    task.error = message;
    task.preview = message.split("\n", 1)[0];
    task.completedAt = now();
    task.updatedAt = now();
  }
  return message;
}

export async function runSubagents(config, options = {}) {
  ensurePrivateDir(config.runDir);
  const statusPath = statusFilePath(config.runDir);
  const eventsPath = eventsFilePath(config.runDir);
  const resultPath = resultFilePath(config.runDir);
  const status = createStatus(config);
  for (const taskStatus of status.subagents) fs.writeFileSync(taskStatus.transcriptFile, "", { mode: 0o600 });
  let runControlPoll;
  const clearRunControlPoll = () => {
    if (!runControlPoll) return;
    clearInterval(runControlPoll);
    runControlPoll = undefined;
  };
  try {
    persist(status, statusPath, options.onUpdate);
    const pollQueuedChildren = () => {
      for (let index = 0; index < config.subagents.length; index++) {
        cancelQueuedChild(status, config, statusPath, eventsPath, config.subagents[index], index, options.onUpdate);
      }
    };
    runControlPoll = setInterval(pollQueuedChildren, CONTROL_POLL_MS);
    runControlPoll.unref?.();
    pollQueuedChildren();

    await mapConcurrent(config.subagents, config.concurrency || 4, async (task, index) => {
      const child = status.subagents[index];
      if (isTerminalState(child.state)) return;
      if (cancelQueuedChild(status, config, statusPath, eventsPath, task, index, options.onUpdate)) return;
      await runSubagent(config, status, statusPath, eventsPath, task, index, options);
    }, options.signal);
    if (options.signal?.aborted) markQueuedAborted(status, config);
    clearRunControlPoll();
    const resultText = writeAggregate(config, status, resultPath);
    publishTerminal(status, statusPath, options.onUpdate);
    return { status, resultText, resultPath };
  } catch (error) {
    clearRunControlPoll();
    const message = markRunnerFailed(status, error);
    writeAggregate(config, status, resultPath);
    publishTerminal(status, statusPath, options.onUpdate, "failed");
    appendEvent(eventsPath, { type: "runner_error", ts: now(), error: message });
    throw error;
  }
}
