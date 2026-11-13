import type { Model } from "@earendil-works/pi-ai"
import { getBuiltinModels } from "@earendil-works/pi-ai/providers/all"

export const providerId = "claude-code"

export const apiId = "claude-code-stream-json"

export type ClaudeCodeModel = Model<typeof apiId>

/** One row of Claude Code's selectable model catalog. */
export interface DiscoveredClaudeModel {
  value: string
  resolvedModel?: string
  displayName: string
  description: string
  supportsEffort?: boolean
  supportedEffortLevels?: Array<"low" | "medium" | "high" | "xhigh" | "max">
  supportsAdaptiveThinking?: boolean
}

/** How to ask Claude Code for one Pi model. */
export interface ModelRoute {
  /** The `--model` value Claude Code accepts. */
  readonly nativeModel: string
  readonly adaptiveThinking: boolean
  /** Whether the API accepts `thinking: { type: "disabled" }`. */
  readonly disabledThinking: boolean
  /** Whether Anthropic accepts native mid-conversation tool blocks. */
  readonly nativeToolChanges: boolean
}

const builtinAnthropicModels = new Map(
  getBuiltinModels("anthropic").map((model) => [model.id, model]),
)

const aliases: Record<string, string> = {
  sonnet: "claude-sonnet-5",
  haiku: "claude-haiku-4-5-20251001",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  opus: "claude-opus-5-5",
  fable: "claude-fable-5-2",
}

function withoutContextSuffix(model: string): string {
  return model.replace(/\[1m\]$/u, "")
}

function canonicalRoute(model: string): string {
  const withoutSuffix = withoutContextSuffix(model)

  return aliases[withoutSuffix] ?? withoutSuffix
}

function canonicalModelId(info: DiscoveredClaudeModel): string {
  if (info.value === "default") return "default"

  return withoutContextSuffix(
    info.resolvedModel || aliases[withoutContextSuffix(info.value)] || info.value,
  )
}

function fallbackModel(info: DiscoveredClaudeModel, id: string): ClaudeCodeModel {
  const levels = info.supportedEffortLevels

  return {
    id,
    name: `${info.displayName} (Claude Code)`,
    api: apiId,
    provider: providerId,
    baseUrl: "process://claude-code",
    reasoning: info.supportsAdaptiveThinking === true || info.supportsEffort === true,
    ...(levels?.length
      ? { thinkingLevelMap: Object.fromEntries(levels.map((level) => [level, level])) }
      : {}),
    input: ["text", "image"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: /\b1M context\b/iu.test(info.description) ? 1_000_000 : 200_000,
    maxTokens: 64_000,
  }
}

function fromBuiltin(id: string, builtin: Model<"anthropic-messages">): ClaudeCodeModel {
  const {
    api: _api,
    provider: _provider,
    baseUrl: _baseUrl,
    compat: _compat,
    ...metadata
  } = builtin

  return {
    ...metadata,
    id,
    name: id === "default" ? `Default (${builtin.name})` : builtin.name,
    api: apiId,
    provider: providerId,
    baseUrl: "process://claude-code",
  }
}

/** Pi models for Claude Code's catalog, and the route each one takes through Claude Code. */
export class ModelCatalog {
  private readonly routes = new Map<string, ModelRoute>()

  /** Name and price a catalog row like Pi's built-in Anthropic model, and remember its route. */
  add(info: DiscoveredClaudeModel): ClaudeCodeModel {
    const id = canonicalModelId(info)

    const builtin = builtinAnthropicModels.get(
      id === "default" ? withoutContextSuffix(info.resolvedModel ?? "") : id,
    )

    this.routes.set(id, {
      nativeModel: info.value,
      adaptiveThinking: info.supportsAdaptiveThinking === true,
      // Pi marks models that reject disabled thinking with `off: null`. Unknown adaptive models are assumed newer.
      disabledThinking: builtin
        ? builtin.thinkingLevelMap?.off !== null
        : info.supportsAdaptiveThinking !== true,
      nativeToolChanges: builtin?.compat?.supportsMidConvoToolChanges === true,
    })

    return builtin ? fromBuiltin(id, builtin) : fallbackModel(info, id)
  }

  route(model: string): ModelRoute {
    const canonical = canonicalRoute(model)
    const known = this.routes.get(model) ?? this.routes.get(canonical)

    if (known) return known
    const builtin = builtinAnthropicModels.get(canonical)
    // Unknown models are assumed to support adaptive thinking.
    const adaptiveThinking = true

    return {
      nativeModel: model.endsWith("[1m]") ? `${canonical}[1m]` : canonical,
      adaptiveThinking,
      disabledThinking: builtin ? builtin.thinkingLevelMap?.off !== null : !adaptiveThinking,
      nativeToolChanges: builtin?.compat?.supportsMidConvoToolChanges === true,
    }
  }
}
