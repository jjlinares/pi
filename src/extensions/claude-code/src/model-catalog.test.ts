import assert from "node:assert/strict"
import test from "node:test"

import { ModelCatalog, type DiscoveredClaudeModel } from "./model-catalog.js"

const effort = {
  supportsEffort: true,
  supportedEffortLevels: ["low", "medium", "high", "xhigh", "max"],
  supportsAdaptiveThinking: true,
} satisfies Partial<DiscoveredClaudeModel>

const discovered: DiscoveredClaudeModel[] = [
  {
    value: "default",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Default",
    description: "Opus 5.5 with 1M context",
    ...effort,
  },
  {
    value: "opus[1m]",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Opus",
    description: "Opus 5.5 with 1M context",
    ...effort,
  },
  {
    value: "fable",
    resolvedModel: "claude-fable-5-2",
    displayName: "Fable 5.2",
    description: "Toughest challenges",
    ...effort,
  },
  {
    value: "claude-fable-5-1[1m]",
    resolvedModel: "claude-fable-5-1",
    displayName: "Fable",
    description: "Fable 5.1",
    ...effort,
  },
  {
    value: "sonnet",
    resolvedModel: "claude-sonnet-5",
    displayName: "Sonnet",
    description: "Sonnet 5",
    ...effort,
  },
  {
    value: "haiku",
    resolvedModel: "claude-haiku-4-5-20251001",
    displayName: "Haiku",
    description: "Haiku 4.5",
  },
]

test("Claude Code's catalog rows route to the model value Claude Code accepts", () => {
  const catalog = new ModelCatalog()
  const models = discovered.map((info) => catalog.add(info))

  assert.deepEqual(
    models.map((model) => model.id),
    [
      "default",
      "claude-opus-5-5",
      "claude-fable-5-2",
      "claude-fable-5-1",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
    ],
  )

  assert.equal(catalog.route("default").nativeModel, "default")
  assert.equal(catalog.route("claude-opus-5-5").nativeModel, "opus[1m]")
  assert.equal(catalog.route("claude-fable-5-2").nativeModel, "fable")
  assert.equal(catalog.route("claude-fable-5-1").nativeModel, "claude-fable-5-1[1m]")
  assert.equal(catalog.route("claude-sonnet-5").nativeModel, "sonnet")

  const fable = models.find((model) => model.id === "claude-fable-5-2")

  assert.equal(fable?.name, "Claude Fable 5.2")
  assert.equal(fable?.contextWindow, 1_000_000)
  assert.equal(fable?.cost.input, 8)

  assert.deepEqual(
    ["default", "claude-opus-5-5", "claude-fable-5-2", "claude-fable-5-1", "claude-sonnet-5"].map(
      (id) => catalog.route(id).nativeToolChanges,
    ),
    [true, true, true, true, false],
  )
})

test("models restored before discovery route by their canonical ID", () => {
  const catalog = new ModelCatalog()

  assert.equal(catalog.route("default").nativeModel, "default")
  assert.equal(catalog.route("claude-opus-5-5").nativeModel, "claude-opus-5-5")
  assert.equal(catalog.route("opus[1m]").nativeModel, "claude-opus-5-5[1m]")
  assert.equal(catalog.route("claude-opus-5-5").disabledThinking, false)
})

test("discovered aliases become stable Pi model IDs with built-in names and prices", () => {
  const catalog = new ModelCatalog()

  const opus = catalog.add({
    value: "opus[1m]",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Opus (1M context)",
    description: "Opus 5.5 with 1M context",
    supportsEffort: true,
    supportedEffortLevels: ["low", "high", "max"],
    supportsAdaptiveThinking: true,
  })

  assert.equal(opus.id, "claude-opus-5-5")
  assert.equal(opus.name, "Claude Opus 5.5")
  assert.equal(opus.contextWindow, 1_000_000)
  assert.deepEqual(opus.cost, { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 })

  const future = catalog.add({
    value: "future",
    resolvedModel: "claude-future-1",
    displayName: "Future",
    description: "A newly available model",
  })

  assert.equal(future.id, "claude-future-1")
  assert.equal(future.name, "Future (Claude Code)")
  assert.equal(future.cost.input, 0)
  assert.equal(catalog.route("claude-future-1").nativeModel, "future")
})

test("thinking routes follow what each model accepts", () => {
  const catalog = new ModelCatalog()

  for (const info of discovered) catalog.add(info)

  // Opus 5.5 rejects disabled thinking; Haiku 4.5 has no adaptive thinking.
  assert.equal(catalog.route("claude-opus-5-5").disabledThinking, false)
  assert.equal(catalog.route("claude-haiku-4-5-20251001").adaptiveThinking, false)
  assert.equal(catalog.route("claude-haiku-4-5-20251001").disabledThinking, true)
})

test("models declare no prompt cache lifetime, so Pi never warms the cache through Claude Code", () => {
  const catalog = new ModelCatalog()

  for (const model of discovered.map((info) => catalog.add(info)))
    assert.equal(model.promptCache, undefined, model.id)
})
