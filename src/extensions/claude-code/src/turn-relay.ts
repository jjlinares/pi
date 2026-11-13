import { randomBytes } from "node:crypto"
import * as http from "node:http"
import * as https from "node:https"

import { ToolCallArgumentsStream } from "@earendil-works/pi-ai"

import type { RateLimitInfo } from "./billing.js"
import {
  isRecord,
  type AnthropicStreamEvent,
  type NativeMessage,
  type NativeUsage,
} from "./native-types.js"

/**
 * Makes the API list the thinking it dropped from the request in `message_start.message.input_transformations`. It
 * only reports: the API drops a block whose request prefix changed with or without it. Claude Code adds it only on a
 * first-party base URL, which the relay is not.
 */
export const thinkingBindingBeta = "thinking-binding-controls-2026-08-01"

/** Paths of the thinking blocks the API dropped from the request, by reason. */
export type DroppedThinking = Record<string, string[]>

function droppedThinking(transformations: unknown): DroppedThinking {
  const dropped: DroppedThinking = {}

  for (const item of Array.isArray(transformations) ? transformations : [])
    if (isRecord(item) && item["type"] === "thinking_dropped") {
      const reason = typeof item["reason"] === "string" ? item["reason"] : "unknown"
      dropped[reason] = [...(dropped[reason] ?? []), String(item["path"])]
    }

  return dropped
}

/** Rebuilds the response message from Anthropic's SSE stream, before Claude Code sees it. */
export class AnthropicCapture {
  message?: NativeMessage
  complete = false
  droppedThinking: DroppedThinking = {}
  /** Error reported inside an otherwise successful (HTTP 200) event stream. */
  error?: string
  private pending = ""
  private readonly decoder = new TextDecoder()
  private readonly argumentsByIndex = new Map<number, string>()

  constructor(private readonly onEvent?: (event: AnthropicStreamEvent) => void) {}

  feed(chunk: Uint8Array): void {
    this.pending += this.decoder.decode(chunk, { stream: true })
    this.consumeFrames()
  }

  finish(): void {
    this.pending += this.decoder.decode()
    this.consumeFrames()
  }

  private consumeFrames(): void {
    for (;;) {
      const match = /\r?\n\r?\n/u.exec(this.pending)

      if (!match) return
      const frame = this.pending.slice(0, match.index)
      this.pending = this.pending.slice(match.index + match[0].length)

      const data = frame
        .split(/\r?\n/u)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n")

      if (!data || data === "[DONE]") continue
      // SAFETY: Anthropic's Messages stream sends one stream event per SSE data frame.
      const event = JSON.parse(data) as AnthropicStreamEvent
      this.apply(event)
      this.onEvent?.(event)
    }
  }

  private apply(event: AnthropicStreamEvent): void {
    switch (event.type) {
      case "message_start":
        this.message = structuredClone(event.message)
        this.droppedThinking = droppedThinking(event.message["input_transformations"])
        break
      case "content_block_start":
        if (this.message) this.message.content[event.index] = structuredClone(event.content_block)
        break
      case "content_block_delta": {
        const block = this.message?.content[event.index]

        if (!block) break
        const delta = event.delta

        if (delta.type === "text_delta" && block.type === "text") block.text += delta.text
        else if (delta.type === "thinking_delta" && block.type === "thinking")
          block.thinking += delta.thinking
        else if (delta.type === "signature_delta" && block.type === "thinking")
          block.signature = (block.signature ?? "") + delta.signature
        else if (delta.type === "input_json_delta" && block.type === "tool_use")
          this.argumentsByIndex.set(
            event.index,
            (this.argumentsByIndex.get(event.index) ?? "") + delta.partial_json,
          )
        break
      }

      case "content_block_stop": {
        const block = this.message?.content[event.index]
        const raw = this.argumentsByIndex.get(event.index)

        if (block?.type === "tool_use" && raw !== undefined) {
          const input: unknown = raw.trim() ? JSON.parse(raw) : {}

          if (!isRecord(input)) throw new Error("Claude tool input is not an object")
          block.input = input
          this.argumentsByIndex.delete(event.index)
        }

        break
      }

      case "message_delta":
        if (this.message) {
          Object.assign(this.message, event.delta)

          if (event.usage)
            // SAFETY: message_start carries the required counts; deltas only update them.
            this.message.usage = { ...this.message.usage, ...event.usage } as NativeUsage
        }

        break
      case "message_stop":
        // A response cut off by its token limit never closes its last tool call. Keep the arguments parsed so far, as
        // Pi's own Anthropic stream does, so the turn ends as "length" rather than as a broken stream.
        if (this.message?.stop_reason === "max_tokens")
          for (const [index, raw] of this.argumentsByIndex) {
            const block = this.message.content[index]

            if (block?.type === "tool_use") block.input = new ToolCallArgumentsStream().append(raw)
            this.argumentsByIndex.delete(index)
          }

        this.complete = !!this.message?.stop_reason && this.argumentsByIndex.size === 0
        break
      case "error": {
        const { type, message } = event.error ?? {}
        this.error = [type, message].filter(Boolean).join(": ") || "unknown stream error"
        break
      }
    }
  }
}

interface Destroyable {
  destroy(error?: Error): void
}

const strippedRequestHeaders = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "proxy-authorization",
  "proxy-connection",
  "accept-encoding",
])

const strippedResponseHeaders = new Set(["connection", "transfer-encoding", "server", "date"])

/**
 * Describe a relay failure without losing what Node puts outside `message`: connection errors carry their reason in
 * `code`, and a connection attempt to every address of a host fails with an `AggregateError` without a message.
 */
export function describeFailure(error: unknown): string {
  if (!(error instanceof Error)) return "UnknownError"
  let text = error.message ? `${error.name}: ${error.message}` : error.name
  const code = "code" in error ? error.code : undefined

  if (typeof code === "string" && !text.includes(code)) text += ` (${code})`

  if (error instanceof AggregateError && error.errors.length > 0)
    text += ` [${error.errors.map(describeFailure).join("; ")}]`

  return text
}

interface Turn {
  readonly onEvent?: ((event: AnthropicStreamEvent) => void) | undefined
  readonly transformRequest?: ((body: Buffer) => Buffer) | undefined
  readonly betas?: readonly string[] | undefined
}

/**
 * A loopback Anthropic endpoint for one Claude Code worker. Each turn forwards exactly one Messages request upstream,
 * so Pi, not Claude Code, decides whether to retry or continue after a tool call.
 */
export class TurnRelay {
  capture: AnthropicCapture
  used = false
  denied = 0
  status?: number | undefined
  requestId?: string | undefined
  failure?: string | undefined
  /** The upstream request failed before Anthropic sent a response status. */
  upstreamFailed = false
  /** The request rewrite refused Claude Code's request, so nothing went upstream. */
  rewriteFailure?: Error | undefined
  /** Anthropic's response headers said this request was billed to usage credits. */
  usageCreditsCharge?: RateLimitInfo | undefined
  errorBody = Buffer.alloc(0)

  private readonly upstream: URL
  private readonly prefix = `/turn/${randomBytes(32).toString("base64url")}`
  private readonly server: http.Server
  private readonly sockets = new Set<Destroyable>()
  private readonly active = new Set<Promise<void>>()
  private turn: Turn = {}
  private cancelled = false
  private closed = false

  constructor(
    upstream: string,
    private readonly timeoutMs: number,
  ) {
    this.upstream = new URL(upstream)
    const loopback = ["127.0.0.1", "::1", "localhost"].includes(this.upstream.hostname)

    if (
      (this.upstream.protocol !== "https:" && !(this.upstream.protocol === "http:" && loopback)) ||
      this.upstream.username ||
      this.upstream.password ||
      this.upstream.search ||
      this.upstream.hash
    )
      throw new Error("Claude Code upstream must be HTTPS or a loopback HTTP fixture")

    this.capture = new AnthropicCapture()

    this.server = http.createServer((request, response) => {
      const operation = this.handle(request, response).finally(() => this.active.delete(operation))
      this.active.add(operation)
    })
  }

  /** Arm the relay for one new Claude turn. */
  beginTurn(turn: Turn = {}): void {
    if (this.closed) throw new Error("Claude Code turn relay is closed")

    if (this.active.size > 0) throw new Error("Claude Code turn relay still has an active request")
    this.capture = new AnthropicCapture(turn.onEvent)
    this.used = false
    this.denied = 0
    this.status = undefined
    this.requestId = undefined
    this.failure = undefined
    this.upstreamFailed = false
    this.rewriteFailure = undefined
    this.usageCreditsCharge = undefined
    this.errorBody = Buffer.alloc(0)
    this.turn = turn
    this.cancelled = false
  }

  /** Disarm the current turn without closing the worker's HTTP server. */
  finishTurn(): void {
    if (this.cancelled) return
    this.cancelled = true

    for (const socket of this.sockets) socket.destroy(new Error("Claude Code request aborted"))
    this.sockets.clear()
    this.server.closeAllConnections()
  }

  async start(): Promise<string> {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject)
      this.server.listen(0, "127.0.0.1", () => {
        this.server.off("error", reject)
        resolve()
      })
    })

    const address = this.server.address()

    if (!address || typeof address === "string") throw new Error("Turn relay has no TCP address")

    return `http://127.0.0.1:${address.port}${this.prefix}`
  }

  errorText(): string {
    if (this.capture.error) return this.capture.error
    const text = this.errorBody.toString("utf8")

    try {
      const payload: unknown = JSON.parse(text)
      const error = isRecord(payload) ? payload["error"] : undefined
      const message = isRecord(error) ? error["message"] : undefined

      return typeof message === "string" ? message : text
    } catch {
      return text
    }
  }

  async settled(): Promise<void> {
    await Promise.allSettled(this.active)
  }

  async close(): Promise<void> {
    this.closed = true
    this.finishTurn()
    await new Promise<void>((resolve) => {
      if (!this.server.listening) return resolve()
      this.server.close(() => resolve())
    })
    await this.settled()
  }

  private async handle(
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ): Promise<void> {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1")

    if (
      request.method !== "POST" ||
      requestUrl.pathname !== `${this.prefix}/v1/messages` ||
      request.headers.origin
    ) {
      response.writeHead(404).end()

      return
    }

    if (this.cancelled || this.used) {
      this.denied += 1

      const body = Buffer.from(
        JSON.stringify({
          type: "error",
          error: { type: "invalid_request_error", message: "MEL_CLAUDE_CODE_TURN_RELAY_CONSUMED" },
        }),
      )

      response
        .writeHead(400, { "content-type": "application/json", "content-length": body.length })
        .end(body)

      return
    }

    this.used = true
    this.sockets.add(request)
    this.sockets.add(response)
    let upstreamRequest: http.ClientRequest | undefined

    try {
      const original = await readBody(request)
      let body: Buffer

      try {
        body = this.turn.transformRequest?.(original) ?? original
      } catch (error) {
        this.rewriteFailure = error instanceof Error ? error : new Error(String(error))
        throw error
      }

      if (this.cancelled) return
      const headers: http.OutgoingHttpHeaders = {}

      for (const [name, value] of Object.entries(request.headers))
        if (!strippedRequestHeaders.has(name.toLowerCase()) && value !== undefined)
          headers[name] = value

      headers["accept-encoding"] = "identity"
      headers["content-length"] = body.length

      const existing = [request.headers["anthropic-beta"] ?? []].flat().join(",")

      headers["anthropic-beta"] = [
        ...new Set([
          ...existing
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          ...(this.turn.betas ?? []),
          thinkingBindingBeta,
        ]),
      ].join(",")

      const transport = this.upstream.protocol === "https:" ? https : http

      upstreamRequest = transport.request({
        protocol: this.upstream.protocol,
        hostname: this.upstream.hostname,
        port: this.upstream.port || undefined,
        method: "POST",
        path: `${this.upstream.pathname.replace(/\/$/u, "")}/v1/messages${requestUrl.search}`,
        headers,
        timeout: this.timeoutMs,
      })

      const sent = upstreamRequest
      this.sockets.add(sent)

      const upstreamResponse = await new Promise<http.IncomingMessage>((resolve, reject) => {
        sent.once("response", resolve)
        sent.once("error", reject)
        sent.end(body)
      })

      this.sockets.add(upstreamResponse)
      this.status = upstreamResponse.statusCode
      this.usageCreditsCharge = usageCreditsCharge(upstreamResponse.headers)

      this.requestId =
        String(
          upstreamResponse.headers["request-id"] ?? upstreamResponse.headers["x-request-id"] ?? "",
        ) || undefined

      const responseHeaders: http.OutgoingHttpHeaders = {}

      for (const [name, value] of Object.entries(upstreamResponse.headers))
        if (!strippedResponseHeaders.has(name.toLowerCase()) && value !== undefined)
          responseHeaders[name] = value

      responseHeaders["connection"] = "close"
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders)

      for await (const chunk of upstreamResponse) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))

        if (this.status === 200) this.capture.feed(bytes)
        else if (this.errorBody.length < 65_536)
          this.errorBody = Buffer.concat([this.errorBody, bytes]).subarray(0, 65_536)

        if (!response.write(bytes)) await waitForDrain(response)
      }

      if (this.status === 200) this.capture.finish()
      response.end()
    } catch (error) {
      this.failure = describeFailure(error)

      this.upstreamFailed =
        upstreamRequest !== undefined && this.status === undefined && !this.cancelled

      if (!response.headersSent) response.writeHead(this.cancelled ? 499 : 502).end()
      else response.destroy()
    } finally {
      if (upstreamRequest) this.sockets.delete(upstreamRequest)
      this.sockets.delete(request)
      this.sockets.delete(response)
      upstreamRequest?.destroy()
    }
  }
}

/**
 * The charge Claude Code would report in a later `rate_limit_event`, read from the headers it derives that event
 * from. The headers arrive first, so a stream cut off before Claude Code reports still counts as charged.
 */
function usageCreditsCharge(headers: http.IncomingHttpHeaders): RateLimitInfo | undefined {
  const header = (name: string) => {
    const value = headers[`anthropic-ratelimit-unified-${name}`]

    return typeof value === "string" ? value : undefined
  }

  if (header("overage-in-use")?.toLowerCase() !== "true") return undefined
  const status = header("status")
  const rateLimitType = header("representative-claim")

  return { overageInUse: true, ...(status && { status }), ...(rateLimitType && { rateLimitType }) }
}

async function waitForDrain(response: http.ServerResponse): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      response.off("drain", onDrain)
      response.off("close", onClose)
      response.off("error", onError)
    }

    const onDrain = () => {
      cleanup()
      resolve()
    }

    const onClose = () => {
      cleanup()
      reject(new Error("Claude Code disconnected from the turn relay"))
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    response.once("drain", onDrain)
    response.once("close", onClose)
    response.once("error", onError)
  })
}

async function readBody(request: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of request)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))

  return Buffer.concat(chunks)
}
