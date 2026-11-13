import {
  calculateCost,
  collapseSystemMessages,
  createAssistantMessageEventStream,
  getCurrentSystemPrompt,
  getCurrentTools,
  getInitialSystemMessage,
  getSystemMessageText,
  ToolCallArgumentsStream,
  type Api,
  type AssistantMessage,
  type AssistantMessageEventStream,
  type Model,
  type SimpleStreamOptions,
  type StopReason,
  type ToolCall,
  type TranscriptContext,
} from "@earendil-works/pi-ai"

import { describeUsageCreditsRejection } from "./billing.js"
import type { ModelCatalog } from "./model-catalog.js"
import type {
  AnthropicStreamEvent,
  NativeContentBlock,
  NativeMessage,
  NativeUsage,
} from "./native-types.js"
import {
  buildExtraBody,
  diagnostic,
  makeReplayDiagnostic,
  nativeToolChangesBeta,
  prepareFrames,
  prepareMessages,
  prepareNativeTranscript,
  prepareTools,
  toolPrefix,
} from "./transcript.js"
import type { ClaudeWorkers } from "./workers.js"

function emptyUsage(): AssistantMessage["usage"] {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  }
}

function mapStopReason(reason: string | null | undefined): {
  stopReason: StopReason
  errorMessage?: string
} {
  switch (reason) {
    case "end_turn":
    case "pause_turn":
    case "stop_sequence":
      return { stopReason: "stop" }
    case "max_tokens":
    case "model_context_window_exceeded":
      return { stopReason: "length" }
    case "tool_use":
      return { stopReason: "toolUse" }
    case "refusal":
      return { stopReason: "error", errorMessage: "The model refused to complete the request" }
    case "sensitive":
      return { stopReason: "error", errorMessage: "Provider stopped with: sensitive" }
    default:
      return {
        stopReason: "error",
        errorMessage: `Unhandled Claude Code stop reason: ${reason ?? "missing"}`,
      }
  }
}

function setStopReason(output: AssistantMessage, reason: string | null | undefined): void {
  const mapped = mapStopReason(reason)
  output.stopReason = mapped.stopReason

  if (reason) output.rawStopReason = reason
  else delete output.rawStopReason

  if (mapped.errorMessage) output.errorMessage = mapped.errorMessage
  else delete output.errorMessage
}

function updateUsage(
  output: AssistantMessage,
  model: Model<Api>,
  usage: Partial<NativeUsage> | undefined,
): void {
  if (!usage) return

  if (typeof usage.input_tokens === "number") output.usage.input = usage.input_tokens

  if (typeof usage.output_tokens === "number") output.usage.output = usage.output_tokens

  if (typeof usage.cache_read_input_tokens === "number")
    output.usage.cacheRead = usage.cache_read_input_tokens

  if (typeof usage.cache_creation_input_tokens === "number")
    output.usage.cacheWrite = usage.cache_creation_input_tokens

  const oneHour = usage.cache_creation?.ephemeral_1h_input_tokens

  if (typeof oneHour === "number") output.usage.cacheWrite1h = oneHour
  const thinking = usage.output_tokens_details?.thinking_tokens

  if (typeof thinking === "number") output.usage.reasoning = thinking

  output.usage.totalTokens =
    output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite

  calculateCost(model, output.usage)
}

function comparableContent(content: AssistantMessage["content"]): unknown[] {
  return content.map((block) => {
    if (block.type === "text") return { type: "text", text: block.text }

    if (block.type === "thinking")
      return {
        type: "thinking",
        thinking: block.thinking,
        thinkingSignature: block.thinkingSignature,
        redacted: block.redacted,
      }

    return { type: "toolCall", id: block.id, name: block.name, arguments: block.arguments }
  })
}

// Claude can name a tool Pi never declared. Pi answers that with a "not found" tool result the model can recover
// from, so the name passes through rather than failing the turn.
function piToolName(nativeName: string): string {
  return nativeName.startsWith(toolPrefix) ? nativeName.slice(toolPrefix.length) : nativeName
}

function piContent(block: NativeContentBlock): AssistantMessage["content"][number] {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text }
    case "thinking":
      return {
        type: "thinking",
        thinking: block.thinking,
        thinkingSignature: block.signature ?? "",
      }
    case "redacted_thinking":
      return {
        type: "thinking",
        thinking: "[Reasoning redacted]",
        thinkingSignature: block.data,
        redacted: true,
      }
    case "tool_use":
      return {
        type: "toolCall",
        id: block.id,
        name: piToolName(block.name),
        // SAFETY: Tool input is parsed JSON.
        arguments: block.input as ToolCall["arguments"],
      }
  }
}

/** Translates Anthropic stream events into Pi's assistant message stream. */
class EventTranslator {
  /** Stream state per native block index, kept off the content blocks so it never reaches partials. */
  private readonly open = new Map<
    number,
    { contentIndex: number; arguments?: ToolCallArgumentsStream }
  >()

  private sawContentEvent = false

  constructor(
    private readonly model: Model<Api>,
    private readonly output: AssistantMessage,
    private readonly stream: AssistantMessageEventStream,
  ) {}

  event(event: AnthropicStreamEvent): void {
    switch (event.type) {
      case "message_start":
        if (event.message.id) this.output.responseId = event.message.id

        // Replay tags the message with this model so Claude Code keeps its thinking.
        if (event.message.model) this.output.responseModel = event.message.model
        updateUsage(this.output, this.model, event.message.usage)
        break
      case "content_block_start":
        this.startBlock(event.index, event.content_block)
        break
      case "content_block_delta":
        this.delta(event.index, event.delta)
        break
      case "content_block_stop":
        this.stopBlock(event.index)
        break
      case "message_delta":
        if (event.delta.stop_reason) setStopReason(this.output, event.delta.stop_reason)
        updateUsage(this.output, this.model, event.usage)
        break
    }
  }

  /** Check the streamed content against the final response and record its native form for replay. */
  finish(message: NativeMessage, usage: NativeUsage): void {
    const authoritative = message.content.map(piContent)

    if (!this.sawContentEvent) this.emitComplete(authoritative)
    else if (
      JSON.stringify(comparableContent(this.output.content)) !==
      JSON.stringify(comparableContent(authoritative))
    )
      throw new Error("Claude Code final response differs from its incremental stream")

    if (message.id) this.output.responseId = message.id

    if (message.model) this.output.responseModel = message.model
    updateUsage(this.output, this.model, usage)
    setStopReason(this.output, message.stop_reason)
    this.output.diagnostics = [
      ...(this.output.diagnostics ?? []),
      makeReplayDiagnostic(message, this.output),
    ]
  }

  private startBlock(nativeIndex: number, native: NativeContentBlock): void {
    this.sawContentEvent = true
    const contentIndex = this.output.content.length

    if (native.type === "tool_use") {
      this.output.content.push({
        type: "toolCall",
        id: native.id,
        name: piToolName(native.name),
        arguments: {},
      })
      this.open.set(nativeIndex, { contentIndex, arguments: new ToolCallArgumentsStream() })
      this.stream.push({ type: "toolcall_start", contentIndex, partial: this.output })

      return
    }

    this.output.content.push(piContent(native))
    this.open.set(nativeIndex, { contentIndex })

    this.stream.push({
      type: native.type === "text" ? "text_start" : "thinking_start",
      contentIndex,
      partial: this.output,
    })
  }

  private delta(
    nativeIndex: number,
    delta: Extract<AnthropicStreamEvent, { type: "content_block_delta" }>["delta"],
  ): void {
    const open = this.open.get(nativeIndex)

    if (!open) return
    const { contentIndex } = open
    const block = this.output.content[contentIndex]

    if (delta.type === "text_delta" && block?.type === "text") {
      block.text += delta.text
      this.stream.push({
        type: "text_delta",
        contentIndex,
        delta: delta.text,
        partial: this.output,
      })
    } else if (delta.type === "thinking_delta" && block?.type === "thinking") {
      block.thinking += delta.thinking

      this.stream.push({
        type: "thinking_delta",
        contentIndex,
        delta: delta.thinking,
        partial: this.output,
      })
    } else if (delta.type === "signature_delta" && block?.type === "thinking") {
      block.thinkingSignature = (block.thinkingSignature ?? "") + delta.signature
    } else if (delta.type === "input_json_delta" && block?.type === "toolCall" && open.arguments) {
      block.arguments = open.arguments.append(delta.partial_json)

      this.stream.push({
        type: "toolcall_delta",
        contentIndex,
        delta: delta.partial_json,
        partial: this.output,
      })
    }
  }

  private stopBlock(nativeIndex: number): void {
    const open = this.open.get(nativeIndex)
    this.open.delete(nativeIndex)

    if (!open) return
    const { contentIndex } = open
    const block = this.output.content[contentIndex]

    if (block?.type === "text") {
      this.stream.push({
        type: "text_end",
        contentIndex,
        content: block.text,
        partial: this.output,
      })
    } else if (block?.type === "thinking") {
      this.stream.push({
        type: "thinking_end",
        contentIndex,
        content: block.thinking,
        partial: this.output,
      })
    } else if (block?.type === "toolCall") {
      if (open.arguments) Object.assign(block, open.arguments.finish())
      this.stream.push({
        type: "toolcall_end",
        contentIndex,
        toolCall: block,
        partial: this.output,
      })
    }
  }

  private emitComplete(content: AssistantMessage["content"]): void {
    for (const source of content) {
      const contentIndex = this.output.content.length
      this.output.content.push({ ...source })

      if (source.type === "text") {
        this.stream.push({ type: "text_start", contentIndex, partial: this.output })

        if (source.text)
          this.stream.push({
            type: "text_delta",
            contentIndex,
            delta: source.text,
            partial: this.output,
          })

        this.stream.push({
          type: "text_end",
          contentIndex,
          content: source.text,
          partial: this.output,
        })
      } else if (source.type === "thinking") {
        this.stream.push({ type: "thinking_start", contentIndex, partial: this.output })

        if (source.thinking && !source.redacted)
          this.stream.push({
            type: "thinking_delta",
            contentIndex,
            delta: source.thinking,
            partial: this.output,
          })

        this.stream.push({
          type: "thinking_end",
          contentIndex,
          content: source.thinking,
          partial: this.output,
        })
      } else {
        this.stream.push({ type: "toolcall_start", contentIndex, partial: this.output })

        this.stream.push({
          type: "toolcall_delta",
          contentIndex,
          delta: JSON.stringify(source.arguments),
          partial: this.output,
        })

        this.stream.push({
          type: "toolcall_end",
          contentIndex,
          toolCall: source,
          partial: this.output,
        })
      }
    }
  }
}

/** Word errors so Pi's retry and overflow classifiers recognize them. */
export function normalizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const usageCredits = describeUsageCreditsRejection(message)

  if (usageCredits) return usageCredits

  if (
    /prompt is too long|context(?:_| )length|context window exceeded|too many input tokens/iu.test(
      message,
    )
  )
    return `context_length_exceeded: ${message}`

  return message
}

/** Pi's stream function for Claude Code models. */
export function createStream(workers: ClaudeWorkers, catalog: ModelCatalog) {
  return (
    model: Model<Api>,
    sourceContext: TranscriptContext,
    options?: SimpleStreamOptions,
  ): AssistantMessageEventStream => {
    const stream = createAssistantMessageEventStream()

    const output: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: emptyUsage(),
      stopReason: "pending",
      timestamp: Date.now(),
    }

    void (async () => {
      try {
        const route = catalog.route(model.id)

        const context = {
          ...sourceContext,
          messages: prepareMessages(sourceContext.messages, model),
        }

        const nativeTranscript = prepareNativeTranscript(context.messages, route.nativeToolChanges)
        const transcript = nativeTranscript ? context : collapseSystemMessages(context)
        const initialSystem = getInitialSystemMessage(transcript.messages)

        const systemPrompt = nativeTranscript
          ? initialSystem
            ? getSystemMessageText(initialSystem)
            : ""
          : getCurrentSystemPrompt(transcript.messages)

        const preparedTools = prepareTools(getCurrentTools(transcript.messages))
        const translator = new EventTranslator(model, output, stream)
        stream.push({ type: "start", partial: output })

        const response = await workers.run({
          model: route.nativeModel,
          frames: prepareFrames(transcript.messages),
          systemPrompt,
          manifest: preparedTools.manifest,
          extraBody: buildExtraBody(
            route,
            nativeTranscript?.requestTools ?? preparedTools.nativeTools,
            options,
          ),
          signal: options?.signal,
          timeoutMs: options?.timeoutMs,
          nativeSystemInjections: nativeTranscript?.systemInjections,
          betas: nativeTranscript ? [nativeToolChangesBeta] : undefined,
          sessionId: options?.cacheRetention === "none" ? undefined : options?.sessionId,
          onEvent: (event) => translator.event(event),
        })

        translator.finish(response.message, response.usage)

        if (options?.reasoning) output.providerThinkingLevel = options.reasoning

        output.diagnostics = [
          ...(output.diagnostics ?? []),
          diagnostic("claude-code.turn-relay", response.relay),
          ...(response.rateLimit ? [diagnostic("claude-code.rate-limit", response.rateLimit)] : []),
        ]

        if (
          output.stopReason === "error" ||
          output.stopReason === "aborted" ||
          output.stopReason === "pending"
        )
          throw new Error(output.errorMessage || `Claude Code ended with ${output.stopReason}`)

        stream.push({ type: "done", reason: output.stopReason, message: output })
      } catch (error) {
        output.stopReason = options?.signal?.aborted ? "aborted" : "error"
        output.errorMessage = normalizeError(error)
        stream.push({ type: "error", reason: output.stopReason, error: output })
      }

      stream.end()
    })()

    return stream
  }
}
