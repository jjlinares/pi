import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process"
import { constants } from "node:fs"
import { access } from "node:fs/promises"
import { tmpdir } from "node:os"
import { delimiter, isAbsolute, join, resolve } from "node:path"
import { createInterface } from "node:readline"

import type { DiscoveredClaudeModel } from "./model-catalog.js"
import { isRecord } from "./native-types.js"

export type Env = Readonly<Record<string, string | undefined>>

export interface ClaudeCliOptions {
  /** Claude Code executable: a path, or a name resolved through `PATH`. Default `claude`. */
  readonly command?: string | undefined
  /** Environment Claude Code inherits before this provider's overrides. Default `process.env`. */
  readonly env?: Env | undefined
}

export interface ClaudeStatus {
  readonly loggedIn: boolean
  /** Claude Pro or Max plan, when Claude Code reports one. */
  readonly plan?: string | undefined
  /** Why Claude Code cannot serve requests. */
  readonly detail?: string | undefined
}

export const installHint =
  "Claude Code is not installed. Install it with `npm install -g @anthropic-ai/claude-code`."

export const loginHint =
  "Claude Code is installed but not logged in. Run `claude auth login` and try again."

const readyStatusTtlMs = 60_000

/** Settings that would silently change how Claude Code authenticates or bills. */
const conflictingKeys = ["ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_FOUNDRY_API_KEY"]

const conflictingFlags = [
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
]

function flagEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase()

  return !!normalized && !["0", "false", "no", "off"].includes(normalized)
}

function outputTail(text: string, limit = 500): string {
  const trimmed = text.trim()

  return trimmed.length > limit ? `...${trimmed.slice(-limit)}` : trimmed
}

/** Parse the `claude auth status` payload, tolerating leading non-JSON noise. */
function statusPayload(stdout: string): Record<string, unknown> | undefined {
  const text = stdout.trim()
  const brace = text.indexOf("{")

  for (const candidate of [text, ...(brace > 0 ? [text.slice(brace)] : [])]) {
    try {
      const parsed: unknown = JSON.parse(candidate)

      if (isRecord(parsed)) return parsed
    } catch {
      // The caller reports output that never parses.
    }
  }

  return undefined
}

function isDiscoveredModel(value: unknown): value is DiscoveredClaudeModel {
  return (
    isRecord(value) &&
    typeof value["value"] === "string" &&
    typeof value["displayName"] === "string" &&
    typeof value["description"] === "string" &&
    (value["resolvedModel"] === undefined || typeof value["resolvedModel"] === "string")
  )
}

/** Spawn Claude Code in its own process group, so `killProcessTree` reaches its children. */
export function spawnClaude(
  command: string,
  args: readonly string[],
  options: SpawnOptions,
): ChildProcess {
  return spawn(command, args, { ...options, detached: true })
}

export function childExit(child: ChildProcess): Promise<number> {
  return new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("exit", (code, signal) => {
      if (code !== null) resolve(code)
      else reject(new Error(`Claude Code exited from signal ${signal ?? "unknown"}`))
    })
  })
}

export function killProcessTree(child: ChildProcess): void {
  if (child.exitCode !== null || child.pid === undefined) return

  try {
    process.kill(-child.pid, "SIGKILL")
  } catch {
    try {
      child.kill("SIGKILL")
    } catch {
      // It exited between the checks.
    }
  }
}

/** The Claude Code CLI on this machine: its login, its model catalog, and the environment its workers get. */
export class ClaudeCli {
  private readonly command: string
  private readonly env: Readonly<Record<string, string>>
  private ready?: { readonly command: string; readonly expires: number } | undefined

  constructor(options: ClaudeCliOptions = {}) {
    this.command = options.command ?? "claude"
    const env: Record<string, string> = {}

    // Claude Code prefers an API key over the subscription login; never let one reach it.
    for (const [key, value] of Object.entries(options.env ?? process.env))
      if (value !== undefined && key !== "ANTHROPIC_API_KEY") env[key] = value

    this.env = env
  }

  async status(signal?: AbortSignal): Promise<ClaudeStatus> {
    const command = await this.resolve()

    if (!command) return { loggedIn: false, detail: installHint }
    let result: { code: number; stdout: string; stderr: string }

    try {
      result = await this.capture(command, ["auth", "status"], signal)
    } catch (error) {
      if (signal?.aborted) throw error
      const message = error instanceof Error ? error.message : String(error)

      return { loggedIn: false, detail: `Claude Code status check failed: ${message}` }
    }

    const payload = statusPayload(result.stdout)

    // A launch or CLI failure must not masquerade as a logged-out account.
    if (!payload) {
      const output = outputTail(result.stdout) || outputTail(result.stderr) || "(no output)"

      return {
        loggedIn: false,
        detail: `Claude Code status check failed (exit ${result.code}): unexpected auth status output: ${output}`,
      }
    }

    // Claude Code reports a logout as JSON with `loggedIn: false`, sometimes with a non-zero exit code.
    const loggedIn = payload["loggedIn"] === true
    const plan = payload["subscriptionType"]

    return {
      loggedIn,
      plan: loggedIn && typeof plan === "string" ? plan : undefined,
      detail: loggedIn ? undefined : loginHint,
    }
  }

  /**
   * A logged-in executable. Successful checks are cached briefly: a fresh worker starts after every tool call, and a
   * `claude auth status` process on each of those turns adds latency.
   */
  async readyCommand(signal?: AbortSignal): Promise<string> {
    if (this.ready && this.ready.expires > Date.now()) return this.ready.command
    this.ready = undefined
    const command = await this.resolve()

    if (!command) throw new Error(installHint)
    const status = await this.status(signal)

    if (!status.loggedIn) throw new Error(status.detail ?? loginHint)
    this.ready = { command, expires: Date.now() + readyStatusTtlMs }

    return command
  }

  /** Ask Claude Code for the account's selectable model catalog. */
  async discoverModels(signal?: AbortSignal, timeoutMs = 20_000): Promise<DiscoveredClaudeModel[]> {
    signal?.throwIfAborted()
    const env = this.environment("discovery", {})
    const command = await this.resolve()

    if (!command) throw new Error(installHint)

    const child = spawnClaude(
      command,
      [
        "-p",
        "--input-format",
        "stream-json",
        "--output-format",
        "stream-json",
        "--verbose",
        "--model",
        "default",
        "--tools",
        "",
        "--setting-sources",
        "",
        "--strict-mcp-config",
        "--disable-slash-commands",
        "--permission-mode",
        "dontAsk",
        "--permission-prompts",
        "none",
        "--no-session-persistence",
        "--mcp-config",
        JSON.stringify({ mcpServers: {} }),
      ],
      { cwd: tmpdir(), env, stdio: ["pipe", "pipe", "pipe"] },
    )

    let stderr = ""
    child.stderr?.setEncoding("utf8")
    child.stderr?.on("data", (chunk: string) => (stderr = (stderr + chunk).slice(-65_536)))
    const abort = () => killProcessTree(child)
    signal?.addEventListener("abort", abort, { once: true })
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      killProcessTree(child)
    }, timeoutMs)

    const requestId = `pi-claude-code-models-${Date.now()}`

    child.stdin?.write(
      `${JSON.stringify({ type: "control_request", request_id: requestId, request: { subtype: "initialize" } })}\n`,
    )

    child.stdin?.end(
      `${JSON.stringify({
        type: "user",
        message: { role: "user", content: [{ type: "text", text: "model-catalog-probe" }] },
        shouldQuery: false,
      })}\n`,
    )

    let models: DiscoveredClaudeModel[] | undefined

    try {
      if (!child.stdout) throw new Error("Claude Code has no stdout")

      for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
        const response = controlResponse(line, requestId)

        if (Array.isArray(response?.["models"]))
          models = response["models"].filter(isDiscoveredModel)
      }

      const exitCode = await childExit(child)
      signal?.throwIfAborted()

      if (timedOut) throw new Error("Claude Code model discovery timed out")

      if (exitCode !== 0)
        throw new Error(
          `Claude Code model discovery failed${stderr ? `: ${stderr.trim().slice(-500)}` : ""}`,
        )

      if (!models?.length) throw new Error("Claude Code returned no selectable models")

      return models
    } catch (error) {
      if (timedOut) throw new Error("Claude Code model discovery timed out", { cause: error })
      throw error
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener("abort", abort)

      if (child.exitCode === null) killProcessTree(child)
    }
  }

  /**
   * The environment of a conversation worker or the discovery probe. Workers never send nonessential traffic.
   * Discovery inherits the user's privacy flags, because they also hide feature-flagged models.
   */
  environment(
    purpose: "request" | "discovery",
    extraBody: Record<string, unknown>,
  ): Record<string, string> {
    const conflicts = [
      ...conflictingKeys.filter((key) => !!this.env[key]),
      ...conflictingFlags.filter((key) => flagEnabled(this.env[key])),
    ]

    if (conflicts.length)
      throw new Error(
        `Claude Code subscription provider refuses conflicting auth/backend overrides: ${conflicts.join(", ")}`,
      )

    const { CLAUDE_CODE_EXTRA_BODY: _extraBody, ...inherited } = this.env
    const env: Record<string, string> = { ...inherited }

    Object.assign(env, {
      CLAUDE_CODE_ENTRYPOINT: "pi-agent",
      ENABLE_TOOL_SEARCH: "false",
      DISABLE_AUTOUPDATER: "1",
      DISABLE_FEEDBACK_COMMAND: "1",
      CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL: "1",
      CLAUDE_CODE_DISABLE_FILE_MENTIONS: "1",
      // Claude Code would add these as reminders to user messages; the request rewrite also strips the rest.
      CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
      CLAUDE_CODE_DISABLE_CLAUDE_MDS: "1",
      CLAUDE_CODE_MAX_RETRIES: "0",
      DISABLE_AUTO_COMPACT: "1",
      DISABLE_COMPACT: "1",
      CLAUDE_CODE_TOTAL_TOKENS_REMINDER: "off",
      DISABLE_ERROR_REPORTING: "1",
    })

    if (purpose === "request") {
      env["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1"
      env["DISABLE_TELEMETRY"] = "1"
    }

    const maxTokens = extraBody["max_tokens"]

    if (typeof maxTokens === "number") env["CLAUDE_CODE_MAX_OUTPUT_TOKENS"] = String(maxTokens)

    return env
  }

  private async resolve(): Promise<string | undefined> {
    const candidates =
      isAbsolute(this.command) || this.command.includes("/")
        ? [resolve(this.command)]
        : (this.env["PATH"] ?? "")
            .split(delimiter)
            .filter(Boolean)
            .map((directory) => join(directory, this.command))

    for (const candidate of candidates) {
      try {
        await access(candidate, constants.X_OK)

        return candidate
      } catch {
        // Try the next PATH entry.
      }
    }

    return undefined
  }

  private async capture(
    command: string,
    args: readonly string[],
    signal: AbortSignal | undefined,
    timeoutMs = 20_000,
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    signal?.throwIfAborted()
    const child = spawnClaude(command, args, { env: this.env, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout?.setEncoding("utf8")
    child.stderr?.setEncoding("utf8")
    child.stdout?.on("data", (chunk: string) => (stdout = (stdout + chunk).slice(-1_000_000)))
    child.stderr?.on("data", (chunk: string) => (stderr = (stderr + chunk).slice(-65_536)))
    const abort = () => killProcessTree(child)
    signal?.addEventListener("abort", abort, { once: true })
    const timer = setTimeout(abort, timeoutMs)

    try {
      const code = await childExit(child)
      signal?.throwIfAborted()

      return { code, stdout, stderr }
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener("abort", abort)
    }
  }
}

/** The payload of the successful control response to `requestId`, if `line` is one. */
function controlResponse(line: string, requestId: string): Record<string, unknown> | undefined {
  let event: unknown

  try {
    event = JSON.parse(line)
  } catch {
    return undefined
  }

  if (!isRecord(event) || event["type"] !== "control_response") return undefined
  const envelope = event["response"]

  if (
    !isRecord(envelope) ||
    envelope["request_id"] !== requestId ||
    envelope["subtype"] !== "success"
  )
    return undefined
  const response = envelope["response"]

  return isRecord(response) ? response : undefined
}
