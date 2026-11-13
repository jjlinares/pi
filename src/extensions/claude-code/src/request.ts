import { isRecord, type JsonRecord, type NativeFrame } from "./native-types.js"
import type { NativeSystemInjection } from "./transcript.js"

/** Anthropic accepts at most four cache breakpoints per request. */
const maxCacheBreakpoints = 4

const cacheBreakpoint = { type: "ephemeral", ttl: "1h" }

interface RequestMessage extends JsonRecord {
  role?: unknown
  content?: unknown
}

function withoutCacheControl(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutCacheControl)

  if (!isRecord(value)) return value
  const output: JsonRecord = {}

  for (const [key, child] of Object.entries(value))
    if (key !== "cache_control") output[key] = withoutCacheControl(child)

  return output
}

function countCacheBreakpoints(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce<number>((count, child) => count + countCacheBreakpoints(child), 0)

  if (!isRecord(value)) return 0

  return Object.entries(value).reduce(
    (count, [key, child]) => count + (key === "cache_control" ? 1 : countCacheBreakpoints(child)),
    0,
  )
}

function setCacheBreakpoint(message: RequestMessage): void {
  if (typeof message.content === "string")
    message.content = [{ type: "text", text: message.content, cache_control: cacheBreakpoint }]

  const last = Array.isArray(message.content) ? message.content.at(-1) : undefined

  if (isRecord(last)) last["cache_control"] = cacheBreakpoint
}

/**
 * Place message breakpoints at the end of the request and, when the budget allows, at the previous query, so a tool
 * round reuses the prefix the last request cached. Lookback alone is unreliable, notably with images.
 */
function setMessageBreakpoints(messages: RequestMessage[], budget: number): void {
  const queries = messages.flatMap((message, index) => (message.role === "user" ? [index] : []))
  const previous = queries.length >= 3 ? messages[queries.at(-2) ?? -1] : undefined
  const final = messages.at(-1)

  if (final && budget >= 1) setCacheBreakpoint(final)

  if (previous && budget >= 2) setCacheBreakpoint(previous)
}

/** Claude Code's note after an image it downscaled, mapping coordinates to the original. */
function isImageScaleNote(block: unknown): boolean {
  return (
    isRecord(block) &&
    block["type"] === "text" &&
    typeof block["text"] === "string" &&
    /^\[Image: original \d+x\d+/u.test(block["text"])
  )
}

/**
 * Rebuild native user content from Pi's canonical blocks. Claude Code adds reminders to user messages and appends
 * them to tool-result text; none of that is Pi history. Canonical blocks are matched in order to Claude Code's blocks
 * by type, and anything Claude Code added is dropped. Images are the exception: Claude Code may downscale them and add
 * a coordinate note, so its copies are kept.
 */
function alignCanonicalContent(canonical: unknown[], wire: unknown[], where: string): unknown[] {
  const output: unknown[] = []
  let cursor = 0

  for (const block of canonical) {
    if (!isRecord(block))
      throw new Error(`Claude Code request has an invalid canonical block in ${where}`)

    const index = wire.findIndex(
      (candidate, position) =>
        position >= cursor &&
        isRecord(candidate) &&
        candidate["type"] === block["type"] &&
        (block["type"] !== "tool_result" || candidate["tool_use_id"] === block["tool_use_id"]),
    )

    const native = wire[index]

    if (!isRecord(native))
      throw new Error(`Claude Code request lost a ${String(block["type"])} block in ${where}`)
    cursor = index + 1

    if (block["type"] === "image") {
      output.push(native)

      if (isImageScaleNote(wire[cursor])) output.push(wire[cursor++])
    } else if (
      block["type"] === "tool_result" &&
      Array.isArray(block["content"]) &&
      Array.isArray(native["content"])
    ) {
      output.push({
        ...structuredClone(block),
        content: alignCanonicalContent(block["content"], native["content"], where),
      })
    } else {
      output.push(structuredClone(block))
    }
  }

  return output
}

function restoreCanonicalUserContent(messages: RequestMessage[], frames: NativeFrame[]): void {
  const canonical = frames.filter((frame) => frame.type === "user")
  const native = messages.filter((message) => message.role === "user")

  if (native.length !== canonical.length)
    throw new Error(
      `Claude Code request has ${native.length} user messages where Pi's history has ${canonical.length}`,
    )

  native.forEach((message, index) => {
    const wire = Array.isArray(message.content)
      ? message.content
      : typeof message.content === "string"
        ? [{ type: "text", text: message.content }]
        : []

    message.content = alignCanonicalContent(
      canonical[index]?.message.content ?? [],
      wire,
      `user message ${index}`,
    )
  })
}

const isThinkingBlock = (block: unknown): boolean =>
  isRecord(block) && (block["type"] === "thinking" || block["type"] === "redacted_thinking")

/** A model name without the context-window or date suffixes Claude Code also accepts as the same model. */
const baseModel = (model: string): string =>
  model
    .toLowerCase()
    .replace(/\[[12]m\]$/u, "")
    .replace(/-\d{8}$/u, "")

/**
 * Whether Claude Code keeps the thinking of a replayed message tagged `tag` in a request for `model`. Claude Code
 * matches model families more loosely; this stricter rule never expects thinking Claude Code would strip.
 */
const namesModel = (tag: string, model: string): boolean => baseModel(tag) === baseModel(model)

const thinkingKey = (block: unknown): string =>
  isRecord(block)
    ? JSON.stringify([block["type"], block["thinking"], block["signature"], block["data"]])
    : ""

/**
 * Replay frames name the model that answered them, so Claude Code keeps their signed thinking; without it the model
 * loses its earlier reasoning after every tool call. Claude Code strips thinking from messages that name another
 * model, as the API would reject their signatures. Fail if it dropped or changed any it should have kept.
 */
function checkAssistantThinking(
  messages: RequestMessage[],
  frames: NativeFrame[],
  model: unknown,
): void {
  const canonical = frames.filter((frame) => frame.type === "assistant")
  const native = messages.filter((message) => message.role === "assistant")

  if (native.length !== canonical.length)
    throw new Error(
      `Claude Code request has ${native.length} assistant messages where Pi's history has ${canonical.length}`,
    )

  if (typeof model !== "string") return

  native.forEach((message, index) => {
    const frame = canonical[index]?.message

    if (!frame?.model || !namesModel(frame.model, model)) return
    const expected = frame.content.filter(isThinkingBlock).map(thinkingKey)
    const sent = (Array.isArray(message.content) ? message.content : []).filter(isThinkingBlock)

    if (JSON.stringify(sent.map(thinkingKey)) !== JSON.stringify(expected))
      throw new Error(
        `Claude Code dropped replayed thinking from assistant message ${index} (${expected.length} blocks in Pi's history, ${sent.length} sent)`,
      )
  })
}

function injectNativeSystemMessages(
  messages: RequestMessage[],
  injections: NativeSystemInjection[],
): RequestMessage[] {
  const byAssistant = new Map<number, RequestMessage[]>()
  const trailing: RequestMessage[] = []

  for (const injection of injections) {
    const message = { role: "system", content: structuredClone(injection.content) }

    if (injection.beforeAssistant === null) trailing.push(message)
    else
      byAssistant.set(injection.beforeAssistant, [
        ...(byAssistant.get(injection.beforeAssistant) ?? []),
        message,
      ])
  }

  const output: RequestMessage[] = []
  let assistantOrdinal = 0

  for (const message of messages) {
    if (message.role === "assistant") {
      output.push(...(byAssistant.get(assistantOrdinal) ?? []))
      byAssistant.delete(assistantOrdinal)
      assistantOrdinal += 1
    }

    output.push(message)
  }

  if (byAssistant.size > 0)
    throw new Error("Claude Code request lost an assistant boundary needed by system history")

  return [...output, ...trailing]
}

/**
 * Rewrite the request Claude Code sends so it carries exactly Pi's conversation:
 *
 * - Claude Code's own system messages describe its private worker (cwd, git status, shell). Pi's system prompt
 *   describes the session's environment, so they are dropped.
 * - User messages are rebuilt from Pi's history without Claude Code's reminders.
 * - Assistant messages must still carry the signed thinking Pi replayed.
 * - Pi's mid-conversation system and tool changes are restored at their assistant boundaries.
 * - Cache breakpoints are placed for prefix reuse within Anthropic's limit.
 *
 * Fails rather than sending a guess when the request no longer lines up with Pi's history. Also returns the number
 * of thinking blocks the request replays.
 */
export function rewriteRequest(
  body: Buffer,
  frames: NativeFrame[],
  injections?: NativeSystemInjection[],
): { body: Buffer; historyThinking: number } {
  const payload: unknown = JSON.parse(body.toString("utf8"))

  if (!isRecord(payload) || !Array.isArray(payload["messages"]))
    throw new Error("Claude Code request has no messages")

  const wire: unknown[] = payload["messages"]
  const first = wire[0]

  if (!isRecord(first) || first["role"] !== "user" || !Array.isArray(first["content"]))
    throw new Error("Claude Code request is missing its initial user message")

  let messages: RequestMessage[] = wire
    .filter(isRecord)
    .filter((message) => message["role"] !== "system")
    .map((message) => ({ ...message, content: withoutCacheControl(message["content"]) }))

  restoreCanonicalUserContent(messages, frames)
  checkAssistantThinking(messages, frames, payload["model"])

  if (injections) {
    messages = injectNativeSystemMessages(messages, injections)
    payload["system"] = withoutCacheControl(payload["system"])
    const system = payload["system"]
    const last = Array.isArray(system) ? system.at(-1) : undefined

    if (isRecord(last)) last["cache_control"] = cacheBreakpoint
  }

  setMessageBreakpoints(
    messages,
    maxCacheBreakpoints -
      countCacheBreakpoints(payload["system"]) -
      countCacheBreakpoints(payload["tools"]),
  )

  const historyThinking = messages.reduce(
    (count, message) =>
      count +
      (message.role === "assistant" && Array.isArray(message.content)
        ? message.content.filter(isThinkingBlock).length
        : 0),
    0,
  )

  return { body: Buffer.from(JSON.stringify({ ...payload, messages })), historyThinking }
}
