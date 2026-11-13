import type { ChildProcess } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"

import {
  isChargedToUsageCredits,
  UsageCreditsCharged,
  usageCreditsChargeError,
  type RateLimitInfo,
} from "./billing.js"
import { childExit, killProcessTree, spawnClaude, type ClaudeCli } from "./cli.js"
import type {
  AnthropicStreamEvent,
  NativeFrame,
  NativeMessage,
  NativeOutputEvent,
  NativeResult,
  NativeUsage,
} from "./native-types.js"
import { rewriteRequest } from "./request.js"
import type { NativeSystemInjection, ToolManifestEntry } from "./transcript.js"
import { TurnRelay, type DroppedThinking } from "./turn-relay.js"

const workerMaxAgeMs = 5 * 60 * 1_000

const maxRetainedWorkers = 2

const defaultTimeoutMs = 180_000

const inertMcpPath = fileURLToPath(new URL("./inert-mcp.mjs", import.meta.url))

export interface ClaudeRequest {
  /** The `--model` value Claude Code accepts. */
  model: string
  frames: NativeFrame[]
  systemPrompt: string
  manifest: ToolManifestEntry[]
  /** Request fields Claude Code forwards through `CLAUDE_CODE_EXTRA_BODY`. */
  extraBody: Record<string, unknown>
  signal?: AbortSignal | undefined
  timeoutMs?: number | undefined
  /** Pi system and tool changes to restore at their assistant boundaries. */
  nativeSystemInjections?: NativeSystemInjection[] | undefined
  /** Beta features the turn relay adds to Claude Code's request header. */
  betas?: string[] | undefined
  onEvent?: ((event: AnthropicStreamEvent) => void) | undefined
  /** Pi session whose linear continuation may reuse a warm worker. */
  sessionId?: string | undefined
}

export interface ClaudeResponse {
  message: NativeMessage
  result: NativeResult
  usage: NativeUsage
  relay: {
    upstreamRequests: number
    blockedRequests: number
    requestId?: string | undefined
    /** Thinking blocks the request replayed from history. */
    historyThinking?: number | undefined
    /** Replayed thinking the API dropped, by reason. Legitimate after a prefix change, so it never fails the turn. */
    droppedThinking?: DroppedThinking | undefined
  }
  /** Latest plan-limit status Claude Code reported for this turn. */
  rateLimit?: RateLimitInfo | undefined
}

class AsyncQueue<T> {
  private readonly values: T[] = []
  private readonly waiters: Array<(value: IteratorResult<T, undefined>) => void> = []
  private ended = false
  private failure?: Error

  push(value: T): void {
    const waiter = this.waiters.shift()

    if (waiter) waiter({ value, done: false })
    else this.values.push(value)
  }

  end(error?: Error): void {
    this.ended = true

    if (error) this.failure = error

    for (const waiter of this.waiters.splice(0)) waiter({ value: undefined, done: true })
  }

  async next(signal: AbortSignal | undefined, timeoutMs: number): Promise<T | undefined> {
    if (this.values.length) return this.values.shift()

    if (this.ended) {
      if (this.failure) throw this.failure

      return undefined
    }

    signal?.throwIfAborted()

    return new Promise<T | undefined>((resolve, reject) => {
      let settled = false

      const finish = (settle: () => void) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        signal?.removeEventListener("abort", onAbort)
        const index = this.waiters.indexOf(waiter)

        if (index >= 0) this.waiters.splice(index, 1)
        settle()
      }

      const waiter = (item: IteratorResult<T, undefined>) =>
        finish(() => {
          if (item.done && this.failure) reject(this.failure)
          else resolve(item.value)
        })

      const onAbort = () =>
        finish(() => reject(signal?.reason ?? new Error("Claude Code request aborted")))

      const timer = setTimeout(
        () => finish(() => reject(new Error("Claude Code stream timed out"))),
        timeoutMs,
      )

      this.waiters.push(waiter)
      signal?.addEventListener("abort", onAbort, { once: true })
    })
  }
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return "null"

  if (value === null || typeof value !== "object") return JSON.stringify(value)

  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`

  return `{${Object.entries(value)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(",")}}`
}

function digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex")
}

/** Only what Claude Code holds counts: the replay model tag is absent from the frame `commit` records. */
function historyHash(frames: NativeFrame[]): string {
  return digest(
    frames.map((frame) => ({
      type: frame.type,
      message: { role: frame.message.role, content: frame.message.content },
    })),
  )
}

/** Workers that differ in anything Claude Code fixed at launch cannot continue each other's conversation. */
function fingerprint(request: ClaudeRequest): string {
  return digest({
    extraBody: request.extraBody,
    manifest: request.manifest,
    model: request.model,
    systemPrompt: request.systemPrompt,
    timeoutMs: request.timeoutMs ?? defaultTimeoutMs,
  })
}

/** Writes a frame stamped with a fresh uuid, which Claude Code echoes back on that frame's result. */
async function writeFrame(child: ChildProcess, frame: NativeFrame): Promise<string> {
  const stdin = child.stdin

  if (!stdin?.writable) throw new Error("Claude Code stdin closed during history replay")
  const uuid = randomUUID()

  if (!stdin.write(`${JSON.stringify({ ...frame, uuid })}\n`))
    await new Promise<void>((resolve, reject) => {
      stdin.once("drain", resolve)
      stdin.once("error", reject)
    })

  return uuid
}

/** True when the result names user messages and this turn's frame is not one of them. */
function resultIsForAnotherMessage(result: NativeResult, uuid: string): boolean {
  const ids = result["user_message_uuids"]

  return Array.isArray(ids) && ids.length > 0 && !ids.includes(uuid)
}

function nativeErrorText(
  event: Extract<NativeOutputEvent, { type: "assistant" }>,
): string | undefined {
  if (!event.error && !event.message["error"]) return undefined

  return event.message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
}

/** One `claude -p` process and its turn relay, private to one conversation at a time. */
class Worker {
  busy = false
  readonly createdAt = Date.now()
  lastUsed = this.createdAt
  private tipHash?: string | undefined
  private expiryTimer?: NodeJS.Timeout | undefined
  private closed = false
  private delivered = false
  private stderr = ""

  private constructor(
    readonly fingerprint: string,
    private readonly root: string,
    private readonly child: ChildProcess,
    private readonly relay: TurnRelay,
    private readonly queue: AsyncQueue<NativeOutputEvent>,
    private readonly readTask: Promise<void>,
    private readonly exitOutcome: Promise<{ code?: number; error?: Error }>,
    private readonly timeoutMs: number,
  ) {
    child.stderr?.setEncoding("utf8")
    child.stderr?.on(
      "data",
      (chunk: string) => (this.stderr = (this.stderr + chunk).slice(-65_536)),
    )
  }

  static async create(
    cli: ClaudeCli,
    upstreamUrl: string,
    request: ClaudeRequest,
  ): Promise<Worker> {
    request.signal?.throwIfAborted()
    const command = await cli.readyCommand(request.signal)
    const timeoutMs = request.timeoutMs ?? defaultTimeoutMs
    const env = cli.environment("request", request.extraBody)
    // Claude Code tells the model its process cwd; a private directory reveals nothing about the user's workspace.
    const root = await mkdtemp(join(tmpdir(), "pi-claude-code-"))
    const toolsPath = join(root, "tools.json")
    const settingsPath = join(root, "settings.json")
    const systemPath = join(root, "system.md")
    let child: ChildProcess | undefined
    let relay: TurnRelay | undefined

    try {
      await Promise.all([
        writeFile(toolsPath, JSON.stringify(request.manifest), "utf8"),
        writeFile(
          settingsPath,
          JSON.stringify({ env: { CLAUDE_CODE_EXTRA_BODY: JSON.stringify(request.extraBody) } }),
          "utf8",
        ),
        writeFile(systemPath, request.systemPrompt, "utf8"),
      ])

      relay = new TurnRelay(upstreamUrl, timeoutMs)
      const baseUrl = await relay.start()

      const mcp = {
        mcpServers: { pi: { command: process.execPath, args: [inertMcpPath, toolsPath] } },
      }

      child = spawnClaude(
        command,
        [
          "-p",
          "--model",
          request.model,
          "--input-format",
          "stream-json",
          "--output-format",
          "stream-json",
          "--verbose",
          "--include-partial-messages",
          "--tools",
          "",
          "--system-prompt-file",
          systemPath,
          "--settings",
          settingsPath,
          "--setting-sources",
          "",
          "--strict-mcp-config",
          "--disable-slash-commands",
          "--max-turns",
          "1",
          "--permission-mode",
          "dontAsk",
          "--no-session-persistence",
          "--mcp-config",
          JSON.stringify(mcp),
        ],
        {
          cwd: root,
          env: { ...env, ANTHROPIC_BASE_URL: baseUrl },
          stdio: ["pipe", "pipe", "pipe"],
        },
      )

      const stdout = child.stdout

      if (!stdout) throw new Error("Claude Code has no stdout")
      const queue = new AsyncQueue<NativeOutputEvent>()

      const readTask = (async () => {
        try {
          for await (const line of createInterface({ input: stdout, crlfDelay: Infinity })) {
            if (!line.trim()) continue

            try {
              // SAFETY: Claude Code's stream-json output is one output event per line.
              queue.push(JSON.parse(line) as NativeOutputEvent)
            } catch (error) {
              throw new Error(`Invalid Claude Code stream-json output: ${line.slice(0, 300)}`, {
                cause: error,
              })
            }
          }

          queue.end()
        } catch (error) {
          queue.end(error instanceof Error ? error : new Error(String(error)))
        }
      })()

      const exitOutcome = childExit(child).then(
        (code) => ({ code }),
        (error: unknown) => ({ error: error instanceof Error ? error : new Error(String(error)) }),
      )

      return new Worker(
        fingerprint(request),
        root,
        child,
        relay,
        queue,
        readTask,
        exitOutcome,
        timeoutMs,
      )
    } catch (error) {
      relay?.finishTurn()

      if (child && child.exitCode === null) killProcessTree(child)
      await relay?.close()
      await rm(root, { recursive: true, force: true })
      throw error
    }
  }

  isAlive(): boolean {
    return !this.closed && this.child.exitCode === null && !!this.child.stdin?.writable
  }

  isExpired(now = Date.now()): boolean {
    return now - this.createdAt >= workerMaxAgeMs
  }

  canContinue(request: ClaudeRequest): boolean {
    if (!this.tipHash || request.frames.length === 0) return false

    return historyHash(request.frames.slice(0, -1)) === this.tipHash
  }

  clearExpiryTimer(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer)
    this.expiryTimer = undefined
  }

  /** Mark the worker idle and schedule its close for the end of its lifetime. */
  armExpiryTimer(expire: () => void): void {
    this.clearExpiryTimer()
    this.lastUsed = Date.now()
    this.expiryTimer = setTimeout(
      expire,
      Math.max(0, workerMaxAgeMs - (this.lastUsed - this.createdAt)),
    )
    this.expiryTimer.unref()
  }

  /**
   * Record the history Claude Code now holds. Claude Code runs MCP calls internally before its max-turns result, so
   * after a tool call its hidden history holds the inert MCP denial where Pi will append the real result. Such a
   * worker cannot continue; the next request replays from Pi.
   */
  commit(request: ClaudeRequest, message: NativeMessage): boolean {
    // Replay skips a message with nothing but thinking, so the next request cannot match the history recorded here.
    const thinkingOnly = message.content.every(
      (block) => block.type === "thinking" || block.type === "redacted_thinking",
    )

    if (thinkingOnly || message.content.some((block) => block.type === "tool_use")) {
      this.tipHash = undefined

      return false
    }

    this.tipHash = historyHash([
      ...request.frames,
      { type: "assistant", message: { role: "assistant", content: message.content } },
    ])

    return true
  }

  /** True once the current turn streamed output or reached the upstream API. */
  get startedOutput(): boolean {
    return this.delivered || this.relay.used
  }

  async run(request: ClaudeRequest, continuation: boolean): Promise<ClaudeResponse> {
    if (!this.isAlive()) throw new Error("Claude Code process is no longer available")
    request.signal?.throwIfAborted()
    let sawMessageStop = false
    this.delivered = false

    const deliver = (event: AnthropicStreamEvent) => {
      this.delivered = true

      if (event.type === "message_stop") sawMessageStop = true
      request.onEvent?.(event)
    }

    let historyThinking: number | undefined

    this.relay.beginTurn({
      onEvent: deliver,
      transformRequest: (body) => {
        const rewritten = rewriteRequest(body, request.frames, request.nativeSystemInjections)
        historyThinking = rewritten.historyThinking

        return rewritten.body
      },
      betas: request.betas,
    })

    const abort = () => this.closeNow()
    request.signal?.addEventListener("abort", abort, { once: true })
    const assistants: NativeMessage[] = []
    let result: NativeResult | undefined
    let nativeError: string | undefined
    let turnUuid: string | undefined
    let rateLimit: RateLimitInfo | undefined
    // A later event may not repeat the charge, so the first charged event decides the turn. The relay also latches a
    // charge from Anthropic's response headers, which arrive even when the stream is cut off before any event.
    let charged: RateLimitInfo | undefined

    const observeRateLimit = (event: NativeOutputEvent) => {
      if (event.type !== "rate_limit_event" || !event.rate_limit_info) return
      rateLimit = event.rate_limit_info

      if (!charged && isChargedToUsageCredits(rateLimit)) charged = rateLimit
    }

    try {
      for (const frame of continuation ? request.frames.slice(-1) : request.frames) {
        const uuid = await writeFrame(this.child, frame)

        if (frame.shouldQuery !== false) {
          turnUuid = uuid
          continue
        }

        for (;;) {
          const event = await this.queue.next(request.signal, this.timeoutMs)

          if (!event)
            throw await this.exitError("Claude Code exited before acknowledging history replay")

          observeRateLimit(event)

          if (event.type !== "result") continue

          if (event.num_turns !== 0 || event.is_error)
            throw new Error("Claude Code rejected zero-turn history replay")
          break
        }
      }

      for (;;) {
        const event = await this.queue.next(request.signal, this.timeoutMs)

        if (!event) throw await this.exitError("Claude Code exited before completing its response")

        if (event.type === "assistant") {
          const error = nativeErrorText(event)

          if (error !== undefined) nativeError = error
          else assistants.push(event.message)
        } else if (event.type === "result") {
          // A late result from an earlier turn may still sit in the queue.
          if (turnUuid && resultIsForAnotherMessage(event, turnUuid)) continue
          result = event
          break
        } else if (event.type === "rate_limit_event") {
          observeRateLimit(event)
        } else if (event.type === "stream_event" && !this.relay.used) {
          deliver(event.event)
        }
      }

      await this.relay.settled()
      request.signal?.throwIfAborted()

      // A charged turn fails as billing even if its response succeeded; the catch below covers every other exit.
      const charge = charged ?? this.relay.usageCreditsCharge

      if (charge) throw usageCreditsChargeError(charge)

      let message: NativeMessage | undefined

      if (this.relay.used) {
        message = this.relay.capture.message

        if (this.relay.status !== 200 || !this.relay.capture.complete || !message)
          throw this.relayError()
        sawMessageStop = true
      } else {
        message = assistants.at(-1)
      }

      // Native error assistants are not collected; report their text instead of "Incomplete".
      if (!message && nativeError) throw new Error(`Claude Code API error: ${nativeError}`)

      if (!message || !sawMessageStop || !result)
        throw new Error(
          `Incomplete Claude Code response: assistant, message_stop and one result required${this.stderr ? ` (${this.stderr.trim().slice(-500)})` : ""}`,
        )

      const nativeFailureHandled = this.relay.denied > 0 || message.stop_reason === "refusal"

      if (nativeError && !nativeFailureHandled)
        throw new Error(`Claude Code API error: ${nativeError}`)

      const maxTurnsBoundary =
        message.content.some((block) => block.type === "tool_use") &&
        result.subtype === "error_max_turns"

      if (
        !maxTurnsBoundary &&
        !nativeFailureHandled &&
        (result.is_error || result.subtype !== "success")
      )
        throw new Error(`Claude Code request failed: ${result.subtype ?? "unknown result"}`)

      const usage = message.usage ?? result.usage

      if (
        !usage ||
        typeof usage.input_tokens !== "number" ||
        typeof usage.output_tokens !== "number"
      )
        throw new Error("Claude Code response did not include complete token usage")

      return {
        message,
        result,
        usage,
        relay: {
          upstreamRequests: Number(this.relay.used),
          blockedRequests: this.relay.denied,
          requestId: this.relay.requestId,
          ...(this.relay.used && {
            historyThinking,
            droppedThinking: this.relay.capture.droppedThinking,
          }),
        },
        rateLimit,
      }
    } catch (error) {
      // Timeouts, exits, and relay failures read as retryable, and a retry is charged again. A user abort also
      // reports the charge: Pi never retries an abort, and the user learns why the turn cost credits.
      const charge = charged ?? this.relay.usageCreditsCharge

      if (charge && !(error instanceof UsageCreditsCharged)) throw usageCreditsChargeError(charge)
      throw error
    } finally {
      request.signal?.removeEventListener("abort", abort)
      this.relay.finishTurn()
    }
  }

  async close(): Promise<void> {
    this.closeNow()
    await Promise.allSettled([this.readTask, this.exitOutcome, this.relay.close()])
    await rm(this.root, { recursive: true, force: true })
  }

  /**
   * Claude Code's native retries are off, so Pi's retry classifier is the only retry left. Transient failures are
   * worded so it recognizes them.
   */
  private relayError(): Error {
    const relay = this.relay

    if (relay.rewriteFailure) return relay.rewriteFailure
    let detail = `status ${relay.status ?? "unknown"}, capture ${relay.capture.complete ? "complete" : "incomplete"}`

    if (relay.failure) detail += `, relay failure ${relay.failure}`

    if (relay.denied) detail += `, native retries denied ${relay.denied}`
    const upstreamError = relay.errorText()

    if (upstreamError) detail += `, upstream said: ${upstreamError.slice(0, 500)}`

    if (relay.status === 200 && !relay.capture.complete && !upstreamError)
      return new Error(`Claude Code upstream stream ended before message_stop (${detail})`)

    if (relay.status === undefined && relay.upstreamFailed)
      return new Error(`Claude Code upstream connection lost before a response (${detail})`)

    // 5xx such as 529 (overloaded) are transient regardless of the body.
    if (relay.status !== undefined && relay.status >= 500)
      return new Error(`Claude Code upstream server error (${detail})`)

    return new Error(`Incomplete Claude Code upstream response (${detail})`)
  }

  private closeNow(): void {
    if (this.closed) return
    this.closed = true
    this.clearExpiryTimer()
    this.relay.finishTurn()

    if (this.child.exitCode === null) killProcessTree(this.child)
  }

  private async exitError(fallback: string): Promise<Error> {
    const outcome = await this.exitOutcome

    if (outcome.error) return outcome.error
    const detail = this.stderr.trim().slice(-500)

    return new Error(
      `${fallback} (exit ${outcome.code ?? "unknown"}${detail ? `: ${detail}` : ""})`,
    )
  }
}

interface Acquired {
  readonly worker: Worker
  readonly retained: boolean
  readonly continuation: boolean
}

/**
 * Claude Code workers. A linear continuation of a Pi session reuses its warm worker; branches, edits, setting
 * changes, errors, and tool calls start a fresh worker that replays Pi's full history. At most two workers stay warm,
 * none for more than five minutes.
 */
export class ClaudeWorkers {
  private readonly warm = new Map<string, Worker>()
  private tail: Promise<void> = Promise.resolve()

  constructor(
    private readonly cli: ClaudeCli,
    private readonly upstreamUrl = "https://api.anthropic.com",
  ) {}

  /** Number of warm workers. */
  get retained(): number {
    return this.warm.size
  }

  async run(request: ClaudeRequest): Promise<ClaudeResponse> {
    request.signal?.throwIfAborted()
    const acquired = await this.acquire(request)
    const { worker } = acquired

    try {
      const response = await worker.run(request, acquired.continuation)
      const sessionId = request.sessionId

      if (
        worker.commit(request, response.message) &&
        acquired.retained &&
        sessionId &&
        this.warm.get(sessionId) === worker
      ) {
        worker.busy = false
        worker.armExpiryTimer(() => void this.expire(sessionId, worker))
      } else {
        await this.discard(request.sessionId, worker)
      }

      return response
    } catch (error) {
      await this.discard(request.sessionId, worker)

      // A warm worker can hold stale hidden state. If it failed before streaming or reaching the API, nothing was
      // shown or charged, so replay once on a fresh worker. A reported usage-credits charge never replays.
      if (
        acquired.continuation &&
        !worker.startedOutput &&
        !request.signal?.aborted &&
        !(error instanceof UsageCreditsCharged)
      )
        return this.run(request)
      throw error
    }
  }

  /** Close every warm worker. Running requests keep their workers until they finish. */
  async close(): Promise<void> {
    const workers = await this.locked(() => {
      const all = [...this.warm.values()]
      this.warm.clear()

      return all
    })

    await Promise.allSettled(workers.map((worker) => worker.close()))
  }

  private async locked<T>(operation: () => Promise<T> | T): Promise<T> {
    const previous = this.tail
    const { promise, resolve } = Promise.withResolvers<void>()
    this.tail = promise
    await previous

    try {
      return await operation()
    } finally {
      resolve()
    }
  }

  private acquire(request: ClaudeRequest): Promise<Acquired> {
    return this.locked(async () => {
      const sessionId = request.sessionId
      const cached = sessionId ? this.warm.get(sessionId) : undefined

      if (cached && !cached.busy) {
        cached.clearExpiryTimer()

        if (
          cached.isAlive() &&
          !cached.isExpired() &&
          cached.fingerprint === fingerprint(request) &&
          cached.canContinue(request)
        ) {
          cached.busy = true

          return { worker: cached, retained: true, continuation: true }
        }

        if (sessionId) this.warm.delete(sessionId)
        await cached.close()
      }

      // A concurrent request must not mutate the warm conversation. It gets a one-shot worker, as does a request
      // without a session.
      const retain = !!sessionId && !cached?.busy

      while (retain && this.warm.size >= maxRetainedWorkers) {
        const victim = [...this.warm.entries()]
          .filter(([, worker]) => !worker.busy)
          .sort((left, right) => left[1].lastUsed - right[1].lastUsed)[0]

        if (!victim) break
        this.warm.delete(victim[0])
        await victim[1].close()
      }

      const worker = await Worker.create(this.cli, this.upstreamUrl, request)
      worker.busy = true
      const retained = retain && this.warm.size < maxRetainedWorkers

      if (retained && sessionId) this.warm.set(sessionId, worker)

      return { worker, retained, continuation: false }
    })
  }

  private async expire(sessionId: string, worker: Worker): Promise<void> {
    const expired = await this.locked(() => {
      if (this.warm.get(sessionId) !== worker || worker.busy || !worker.isExpired()) return false
      this.warm.delete(sessionId)

      return true
    })

    if (expired) await worker.close()
  }

  private async discard(sessionId: string | undefined, worker: Worker): Promise<void> {
    if (sessionId && this.warm.get(sessionId) === worker)
      await this.locked(() => {
        if (this.warm.get(sessionId) === worker) this.warm.delete(sessionId)
      })

    await worker.close()
  }
}
