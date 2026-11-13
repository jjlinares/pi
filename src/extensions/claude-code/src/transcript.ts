import {
  getDeclaredTools,
  getInitialSystemMessage,
  hasToolRedefinitions,
  renderSystemMessageUpdate,
  type Api,
  type AssistantMessage,
  type ImageContent,
  type Message,
  type Model,
  type SimpleStreamOptions,
  type SystemMessage,
  type TextContent,
  type Tool,
  type ToolResultMessage,
} from "@earendil-works/pi-ai"

import type { ModelRoute } from "./model-catalog.js"
import {
  isRecord,
  type NativeContentBlock,
  type NativeFrame,
  type NativeMessage,
} from "./native-types.js"

export const toolPrefix = "mcp__pi__"

export const nativeReplayDiagnostic = "claude-code.native-assistant.v1"

export const nativeToolChangesBeta = "mid-conversation-tool-changes-2026-07-01"

const deferredToolPlaceholder = {
  name: "__pi_deferred_placeholder__",
  description: "Reserved placeholder. Never available. Never call this.",
  input_schema: { type: "object", properties: {}, required: [] },
  defer_loading: true,
}

export interface NativeSystemInjection {
  /** Insert immediately before this zero-based assistant message, or at the request tail. */
  beforeAssistant: number | null
  content: Array<Record<string, unknown>>
}

export interface NativeTranscriptPlan {
  requestTools: Array<Record<string, unknown>>
  systemInjections: NativeSystemInjection[]
}

/** The native response behind an assistant message, kept so replay keeps its signed blocks. */
interface ReplayCarrier {
  version: 1
  message: NativeMessage
  projection: AssistantProjection
}

interface AssistantProjection {
  text: string
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>
}

function sanitizeSurrogates(text: string): string {
  return text.replace(/[\uD800-\uDFFF]/gu, "\uFFFD")
}

function nativeToolUseId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
}

/** Make another model's history replayable: drop its reasoning and normalize its tool call IDs. */
export function prepareMessages(messages: Message[], model: Model<Api>): Message[] {
  const toolCallIds = new Map<string, string>()

  return messages.map((message) => {
    if (message.role === "toolResult") {
      const id = toolCallIds.get(message.toolCallId)

      return id && id !== message.toolCallId ? { ...message, toolCallId: id } : message
    }

    if (
      message.role !== "assistant" ||
      (message.provider === model.provider &&
        message.api === model.api &&
        message.model === model.id)
    )
      return message

    const diagnostics = message.diagnostics?.filter((item) => item.type !== nativeReplayDiagnostic)

    return {
      ...message,
      ...(diagnostics && { diagnostics }),
      content: message.content.flatMap((block): AssistantMessage["content"] => {
        // Signatures validate only for their own model, and replaying reasoning as text reads as a visible reply.
        if (block.type === "thinking") return []

        if (block.type === "text") return [{ type: "text", text: block.text }]
        const id = nativeToolUseId(block.id)
        toolCallIds.set(block.id, id)
        const { thoughtSignature: _thoughtSignature, ...toolCall } = block

        return [{ ...toolCall, id }]
      }),
    }
  })
}

function assistantProjection(message: AssistantMessage): AssistantProjection {
  const text = message.content
    .filter((block): block is TextContent => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim()

  const toolCalls = message.content.flatMap((block) =>
    block.type === "toolCall"
      ? [{ id: block.id, name: block.name, input: structuredClone(block.arguments) }]
      : [],
  )

  return { text, toolCalls }
}

function isReplayCarrier(value: unknown): value is ReplayCarrier {
  return (
    isRecord(value) &&
    value["version"] === 1 &&
    isRecord(value["message"]) &&
    isRecord(value["projection"])
  )
}

function replayCarrier(message: AssistantMessage): ReplayCarrier | undefined {
  const diagnostic = message.diagnostics?.find((item) => item.type === nativeReplayDiagnostic)
  const candidate = diagnostic?.details?.["carrier"]

  return isReplayCarrier(candidate) ? candidate : undefined
}

function imageBlock(block: ImageContent): Record<string, unknown> {
  return {
    type: "image",
    source: { type: "base64", media_type: block.mimeType, data: block.data },
  }
}

function userContent(content: string | (TextContent | ImageContent)[]): unknown[] {
  if (typeof content === "string")
    return content ? [{ type: "text", text: sanitizeSurrogates(content) }] : []

  return content.map((block) =>
    block.type === "text"
      ? { type: "text", text: sanitizeSurrogates(block.text) }
      : imageBlock(block),
  )
}

function toolResultContent(message: ToolResultMessage): string | unknown[] {
  if (!message.content.some((block) => block.type === "image")) {
    const text = message.content
      .filter((block): block is TextContent => block.type === "text")
      .map((block) => block.text)
      .join("\n")

    // Anthropic rejects an empty tool_result marked is_error. Claude Code's placeholder never reaches the API
    // because the request rewrite restores this content.
    return message.isError && !text.trim()
      ? "Command failed with no output"
      : sanitizeSurrogates(text)
  }

  return message.content.map((block) =>
    block.type === "text"
      ? { type: "text", text: sanitizeSurrogates(block.text) }
      : imageBlock(block),
  )
}

function canonicalAssistantContent(message: AssistantMessage): NativeContentBlock[] {
  const blocks: NativeContentBlock[] = []

  for (const block of message.content) {
    if (block.type === "text" && block.text.trim()) {
      blocks.push({ type: "text", text: sanitizeSurrogates(block.text) })
    } else if (block.type === "thinking" && block.thinking.trim() && block.thinkingSignature) {
      blocks.push(
        block.redacted
          ? { type: "redacted_thinking", data: block.thinkingSignature }
          : {
              type: "thinking",
              thinking: sanitizeSurrogates(block.thinking),
              signature: block.thinkingSignature,
            },
      )
    } else if (block.type === "toolCall") {
      blocks.push({
        type: "tool_use",
        id: block.id,
        name: `${toolPrefix}${block.name}`,
        input: structuredClone(block.arguments),
      })
    }
  }

  return blocks
}

const isThinking = (block: NativeContentBlock): boolean =>
  block.type === "thinking" || block.type === "redacted_thinking"

/**
 * The native content Claude Code replays for an assistant message, or nothing. Claude Code drops a replayed message
 * that holds only thinking and merges the user messages around it, so Pi's frames and boundary counts must skip it
 * too, or the request no longer lines up with them.
 */
function assistantContent(message: AssistantMessage): NativeContentBlock[] {
  const content = nativeAssistantContent(message)

  return content.every(isThinking) ? [] : content
}

function nativeAssistantContent(message: AssistantMessage): NativeContentBlock[] {
  const carrier = replayCarrier(message)

  if (!carrier) return canonicalAssistantContent(message)

  if (JSON.stringify(assistantProjection(message)) === JSON.stringify(carrier.projection))
    return structuredClone(carrier.message.content)

  // A changed projection must not restore stale signed thinking.
  return canonicalAssistantContent({
    ...message,
    content: message.content.filter((block) => block.type !== "thinking"),
  })
}

/** Claude Code stream-json frames for Pi's history. Only the last frame is a query. */
export function prepareFrames(messages: Message[]): NativeFrame[] {
  const frames: NativeFrame[] = []

  for (const message of messages) {
    if (message.role === "system") continue

    const [role, blocks]: ["user" | "assistant", unknown[]] =
      message.role === "user"
        ? ["user", userContent(message.content)]
        : message.role === "assistant"
          ? ["assistant", assistantContent(message)]
          : [
              "user",
              [
                {
                  type: "tool_result",
                  tool_use_id: message.toolCallId,
                  content: toolResultContent(message),
                  is_error: message.isError,
                },
              ],
            ]

    if (blocks.length === 0) continue
    const previous = frames.at(-1)

    if (role === "user" && previous?.type === "user") previous.message.content.push(...blocks)
    else if (message.role === "assistant")
      // Claude Code keeps a replayed message's thinking only when the message names the running model.
      frames.push({
        type: role,
        message: { role, content: blocks, model: message.responseModel ?? message.model },
      })
    else frames.push({ type: role, message: { role, content: blocks } })
  }

  const final = frames.at(-1)

  if (!final || final.type !== "user" || final.message.content.length === 0)
    throw new Error("Claude Code history must end in a non-empty user or tool-result message")

  for (const frame of frames.slice(0, -1)) if (frame.type === "user") frame.shouldQuery = false

  return frames
}

function withoutNullVariant(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(withoutNullVariant)

  if (!isRecord(schema)) return schema
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(schema)) output[key] = withoutNullVariant(value)

  const type = output["type"]

  if (Array.isArray(type) && type.includes("null")) {
    const remaining = type.filter((value) => value !== "null")
    output["type"] = remaining.length === 1 ? remaining[0] : remaining
  }

  const anyOf = output["anyOf"]

  if (Array.isArray(anyOf)) {
    const nonNull = anyOf.filter((branch) => !(isRecord(branch) && branch["type"] === "null"))
    const replacement = nonNull[0]

    if (nonNull.length === 1 && nonNull.length !== anyOf.length) {
      delete output["anyOf"]

      if (isRecord(replacement)) Object.assign(output, replacement)
    }
  }

  return output
}

const choiceCombinators = ["oneOf", "anyOf"] as const

interface FlatSchema {
  properties: Map<string, unknown[]>
  required: Set<string>
  choices: string[]
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

/** The `$defs` or `definitions` entry a local JSON pointer names, decoding its `~1` and `~0` escapes. */
function localRef(ref: string, root: Record<string, unknown>): unknown {
  const match = /^#\/(\$defs|definitions)\/([^/]+)$/u.exec(ref)
  const defs = match?.[1] ? root[match[1]] : undefined
  const name = match?.[2]?.replaceAll("~1", "/").replaceAll("~0", "~")

  return name && isRecord(defs) && Object.hasOwn(defs, name) ? defs[name] : undefined
}

/**
 * Gather the properties of `node`, its local `$ref` target, and every nested composition. Required fields hold only on
 * unconditional paths (the node itself, `$ref`, and `allOf`). Each `oneOf`/`anyOf` becomes a choice phrase; a choice
 * inside a branch is phrased within that branch. `path` holds the refs being followed so cycles stop.
 */
function collect(
  node: unknown,
  root: Record<string, unknown>,
  into: FlatSchema,
  unconditional: boolean,
  path: ReadonlySet<string> = new Set(),
): void {
  if (!isRecord(node)) return
  const seen = new Set(path)
  const properties = node["properties"]

  if (isRecord(properties))
    for (const [key, value] of Object.entries(properties))
      into.properties.set(key, [...(into.properties.get(key) ?? []), value])

  if (unconditional)
    for (const key of asArray(node["required"])) if (typeof key === "string") into.required.add(key)

  const ref = node["$ref"]

  if (typeof ref === "string" && !seen.has(ref)) {
    seen.add(ref)
    collect(localRef(ref, root), root, into, unconditional, seen)
  }

  for (const branch of asArray(node["allOf"])) collect(branch, root, into, unconditional, seen)

  for (const combinator of choiceCombinators) {
    const branches = asArray(node[combinator])

    if (branches.length === 0) continue

    // Branch properties join the flat object; their own choices belong to their group, not to every call.
    for (const branch of branches) collect(branch, root, { ...into, choices: [] }, false, seen)

    const groups = [
      ...new Set(
        branches.flatMap((branch) => {
          const group = branchGroup(branch, root, seen)

          return group ? [`(${group})`] : []
        }),
      ),
    ]

    const rule = combinator === "oneOf" ? "exactly one of" : "at least one of"
    into.choices.push(
      groups.length ? `${rule}: ${groups.join(" or ")}` : `${rule} the documented parameter groups`,
    )
  }
}

function branchGroup(
  branch: unknown,
  root: Record<string, unknown>,
  path: ReadonlySet<string>,
): string | undefined {
  const flat: FlatSchema = { properties: new Map(), required: new Set(), choices: [] }
  collect(branch, root, flat, true, path)

  const constant = (key: string) => {
    const [only, ...rest] = flat.properties.get(key) ?? []

    return rest.length === 0 && isRecord(only) && "const" in only
      ? `${key}=${JSON.stringify(only["const"])}`
      : undefined
  }

  const keys = [...new Set([...[...flat.properties.keys()].filter(constant), ...flat.required])]
  const named = keys.length || flat.choices.length ? keys : [...flat.properties.keys()]

  return [...named.map((key) => constant(key) ?? key), ...flat.choices].join(", ") || undefined
}

/** One schema that admits every branch's version of a property. */
function mergeProperty(candidates: unknown[]): unknown {
  const distinct = [...new Map(candidates.map((value) => [JSON.stringify(value), value])).values()]

  if (distinct.length === 1) return distinct[0]

  const values = distinct.map((candidate) =>
    !isRecord(candidate)
      ? undefined
      : "const" in candidate
        ? [candidate["const"]]
        : Array.isArray(candidate["enum"])
          ? candidate["enum"]
          : undefined,
  )

  if (values.some((value) => value === undefined)) return { anyOf: distinct }
  const types = new Set(distinct.map((candidate) => isRecord(candidate) && candidate["type"]))
  const [type] = types

  return {
    ...(types.size === 1 && typeof type === "string" && { type }),
    enum: [...new Map(values.flat().map((value) => [JSON.stringify(value), value])).values()],
  }
}

/**
 * The model sees one flat object: root properties win, conflicting branch properties merge into one that admits each,
 * and only unconditional requirements stay required. Pi still validates arguments against the full schema, so each
 * lost choice is restated as text.
 */
function flattenRootCombinators(schema: Record<string, unknown>): {
  schema: Record<string, unknown>
  constraint?: string
} {
  if (!["allOf", ...choiceCombinators].some((key) => Array.isArray(schema[key]))) return { schema }

  const flat: FlatSchema = { properties: new Map(), required: new Set(), choices: [] }
  collect(schema, schema, flat, true)
  const own = isRecord(schema["properties"]) ? schema["properties"] : {}

  const properties = Object.fromEntries(
    [...flat.properties].map(([key, candidates]) => [
      key,
      key in own ? own[key] : mergeProperty(candidates),
    ]),
  )

  const {
    $ref: ref,
    anyOf: _anyOf,
    oneOf: _oneOf,
    allOf: _allOf,
    required: _required,
    ...rest
  } = schema

  // A root `$ref` target is merged in, so it goes; one that cannot be resolved stays for Claude Code to resolve.
  const unresolved = typeof ref === "string" && !isRecord(localRef(ref, schema))

  return {
    schema: {
      ...(unresolved && { $ref: ref }),
      ...rest,
      type: "object",
      properties,
      ...(flat.required.size && { required: [...flat.required] }),
    },
    ...(flat.choices.length && {
      constraint: flat.choices
        .map((choice) => `Input constraint: provide parameters for ${choice}.`)
        .join("\n"),
    }),
  }
}

/**
 * Claude Code's MCP inventory rejects nullable and root-composed schemas. Simplify them, and return the constraint
 * flattening lost so the tool description can state it.
 */
export function normalizeInputSchema(schema: unknown): {
  schema: Record<string, unknown>
  constraint?: string
} {
  const simplified = withoutNullVariant(schema)
  const flattened = flattenRootCombinators(isRecord(simplified) ? simplified : {})
  const normalized = flattened.schema

  if (!normalized["type"]) normalized["type"] = "object"

  if (normalized["type"] === "object" && !isRecord(normalized["properties"]))
    normalized["properties"] = {}

  return flattened
}

export interface ToolManifestEntry {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export function prepareTools(tools: Tool[]): {
  manifest: ToolManifestEntry[]
  nativeTools: Array<Record<string, unknown>>
} {
  const names = new Set<string>()
  const manifest: ToolManifestEntry[] = []
  const nativeTools: Array<Record<string, unknown>> = []

  for (const tool of tools) {
    if (!/^[A-Za-z0-9_-]{1,50}$/u.test(tool.name) || names.has(tool.name))
      throw new Error(
        "Claude Code tool names must be unique ASCII identifiers of at most 50 characters",
      )

    names.add(tool.name)
    const { schema, constraint } = normalizeInputSchema(tool.parameters)
    const description = constraint ? `${constraint}\n\n${tool.description}` : tool.description
    manifest.push({ name: tool.name, description, inputSchema: schema })
    nativeTools.push({
      name: `${toolPrefix}${tool.name}`,
      description,
      input_schema: schema,
    })
  }

  return { manifest, nativeTools }
}

function nativeSystemBlocks(message: SystemMessage): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []
  const text = renderSystemMessageUpdate(message)

  if (text) blocks.push({ type: "text", text: sanitizeSurrogates(text) })

  for (const tool of message.toolsRemoved ?? [])
    blocks.push({
      type: "tool_removal",
      tool: { type: "tool_reference", name: `${toolPrefix}${tool.name}` },
    })

  for (const tool of message.toolsAdded ?? [])
    blocks.push({
      type: "tool_addition",
      tool: { type: "tool_reference", name: `${toolPrefix}${tool.name}` },
    })

  return blocks
}

/**
 * Anthropic's cache-preserving native representation of transcript tool changes. The placeholder keeps deferred-tool
 * prompt scaffolding stable from the first request.
 */
export function prepareNativeTranscript(
  messages: Message[],
  supported: boolean,
): NativeTranscriptPlan | undefined {
  const initialTools = getInitialSystemMessage(messages)?.toolsAdded ?? []

  if (!supported || initialTools.length === 0 || hasToolRedefinitions(messages)) return undefined

  const declared = getDeclaredTools(messages)

  const nativeByName = new Map(
    prepareTools(declared).nativeTools.map((tool) => [
      String(tool["name"]).slice(toolPrefix.length),
      tool,
    ]),
  )

  const native = (name: string) => {
    const tool = nativeByName.get(name)

    if (!tool) throw new Error(`Claude Code lost the declaration of tool ${name}`)

    return structuredClone(tool)
  }

  const initialNames = new Set(initialTools.map((tool) => tool.name))
  const initialNative = initialTools.map((tool) => native(tool.name))
  const lastInitial = initialNative.at(-1)

  if (lastInitial) lastInitial["cache_control"] = { type: "ephemeral", ttl: "1h" }

  const laterNative = declared
    .filter((tool) => !initialNames.has(tool.name))
    .map((tool) => ({ ...native(tool.name), defer_loading: true }))

  const systemInjections: NativeSystemInjection[] = []
  let pending: Array<Array<Record<string, unknown>>> = []
  let assistantOrdinal = 0

  const flush = (beforeAssistant: number | null) => {
    for (const content of pending) systemInjections.push({ beforeAssistant, content })
    pending = []
  }

  for (const message of messages.slice(1)) {
    if (message.role === "system") {
      const blocks = nativeSystemBlocks(message)

      if (blocks.length) pending.push(blocks)
    } else if (message.role === "assistant" && assistantContent(message).length > 0) {
      flush(assistantOrdinal)
      assistantOrdinal += 1
    }
  }

  flush(null)

  return {
    requestTools: [...initialNative, structuredClone(deferredToolPlaceholder), ...laterNative],
    systemInjections,
  }
}

/** Request fields Claude Code forwards through `CLAUDE_CODE_EXTRA_BODY`. */
export function buildExtraBody(
  route: ModelRoute,
  nativeTools: Array<Record<string, unknown>>,
  options?: SimpleStreamOptions,
): Record<string, unknown> {
  const body: Record<string, unknown> = { tools: nativeTools }

  if (options?.maxTokens !== undefined) body["max_tokens"] = options.maxTokens

  if (options?.reasoning) {
    if (route.adaptiveThinking) body["thinking"] = { type: "adaptive", display: "summarized" }
    body["output_config"] = {
      effort: options.reasoning === "minimal" ? "low" : options.reasoning,
    }
  } else if (!route.disabledThinking) {
    // Models such as Opus 5.5 reject `disabled`; use the lowest adaptive effort instead.
    body["thinking"] = { type: "adaptive" }
    body["output_config"] = { effort: "low" }
  } else {
    body["thinking"] = { type: "disabled" }
    // Native clear-thinking edits are invalid when thinking is disabled.
    body["context_management"] = { edits: [] }
  }

  return body
}

type Diagnostic = NonNullable<AssistantMessage["diagnostics"]>[number]

export function diagnostic(type: string, details: object): Diagnostic {
  // SAFETY: A JSON round trip leaves only JSON values.
  const json = JSON.parse(JSON.stringify(details)) as Diagnostic["details"]

  return { type, timestamp: Date.now(), ...(json && { details: json }) }
}

export function makeReplayDiagnostic(message: NativeMessage, output: AssistantMessage): Diagnostic {
  const carrier: ReplayCarrier = {
    version: 1,
    message: structuredClone(message),
    projection: assistantProjection(output),
  }

  return diagnostic(nativeReplayDiagnostic, { carrier })
}
