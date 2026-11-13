import assert from "node:assert/strict"
import test from "node:test"

import type { AssistantMessage, Message, Tool } from "@earendil-works/pi-ai"

import { ModelCatalog } from "./model-catalog.js"
import { isRecord } from "./native-types.js"
import {
  buildExtraBody,
  makeReplayDiagnostic,
  normalizeInputSchema,
  prepareFrames,
  prepareMessages,
  prepareNativeTranscript,
  prepareTools,
  toolPrefix,
} from "./transcript.js"

const catalog = new ModelCatalog()

const sonnet = catalog.add({
  value: "sonnet",
  resolvedModel: "claude-sonnet-5",
  displayName: "Sonnet",
  description: "Sonnet 5",
  supportsAdaptiveThinking: true,
})

function assistantAt(messages: Message[], index: number): AssistantMessage {
  const message = messages[index]

  if (message?.role !== "assistant") throw new Error(`Message ${index} is not an assistant message`)

  return message
}

const usage = {
  input: 1,
  output: 1,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 2,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
}

test("prepares replay frames and groups tool results", () => {
  const assistant: AssistantMessage = {
    role: "assistant",
    api: "test",
    provider: "claude-code",
    model: "sonnet",
    content: [
      { type: "thinking", thinking: "private", thinkingSignature: "signed" },
      { type: "text", text: "checking" },
      { type: "toolCall", id: "t1", name: "read", arguments: { path: "a" } },
      { type: "toolCall", id: "t2", name: "read", arguments: { path: "b" } },
    ],
    usage,
    stopReason: "toolUse",
    timestamp: 1,
  }

  const messages: Message[] = [
    { role: "system", content: "system", timestamp: 0 },
    { role: "user", content: "inspect", timestamp: 1 },
    assistant,
    {
      role: "toolResult",
      toolCallId: "t1",
      toolName: "read",
      content: [{ type: "text", text: "A" }],
      isError: false,
      timestamp: 2,
    },
    {
      role: "toolResult",
      toolCallId: "t2",
      toolName: "read",
      content: [{ type: "text", text: "B" }],
      isError: false,
      timestamp: 2,
    },
  ]

  const frames = prepareFrames(messages)
  assert.equal(frames.length, 3)
  assert.equal(frames[0]?.shouldQuery, false)
  assert.equal(frames[1]?.type, "assistant")
  assert.deepEqual(frames[1]?.message.content[2], {
    type: "tool_use",
    id: "t1",
    name: `${toolPrefix}read`,
    input: { path: "a" },
  })
  assert.equal(frames[2]?.message.content.length, 2)
  assert.equal(frames[2]?.shouldQuery, undefined)
})

test("tags each replayed assistant frame with the model that answered it", () => {
  const reply = (text: string, responseModel?: string): AssistantMessage => ({
    role: "assistant",
    api: "test",
    provider: "claude-code",
    model: "default",
    ...(responseModel && { responseModel }),
    content: [{ type: "text", text }],
    usage,
    stopReason: "stop",
    timestamp: 1,
  })

  const frames = prepareFrames([
    { role: "user", content: "one", timestamp: 0 },
    reply("answered", "claude-opus-5-5"),
    { role: "user", content: "two", timestamp: 2 },
    reply("unrecorded"),
    { role: "user", content: "three", timestamp: 4 },
  ])

  assert.deepEqual(
    frames.map((frame) => frame.message.model),
    [undefined, "claude-opus-5-5", undefined, "default", undefined],
  )
})

test("replays an empty failed tool result with text Anthropic accepts", () => {
  const call = (id: string): AssistantMessage => ({
    role: "assistant",
    api: "test",
    provider: "claude-code",
    model: "sonnet",
    content: [{ type: "toolCall", id, name: "bash", arguments: { command: "false" } }],
    usage,
    stopReason: "toolUse",
    timestamp: 1,
  })

  const result = (id: string, isError: boolean): Message => ({
    role: "toolResult",
    toolCallId: id,
    toolName: "bash",
    content: [{ type: "text", text: " " }],
    isError,
    timestamp: 2,
  })

  const frames = prepareFrames([
    { role: "user", content: "run false", timestamp: 0 },
    call("t1"),
    result("t1", true),
    call("t2"),
    result("t2", false),
  ])

  assert.deepEqual(
    frames.filter((frame) => frame.type === "user").map((frame) => frame.message.content[0]),
    [
      { type: "text", text: "run false" },
      {
        type: "tool_result",
        tool_use_id: "t1",
        content: "Command failed with no output",
        is_error: true,
      },
      { type: "tool_result", tool_use_id: "t2", content: " ", is_error: false },
    ],
  )
})

test("replays native signed blocks only while the visible projection is unchanged", () => {
  const assistant: AssistantMessage = {
    role: "assistant",
    api: "test",
    provider: "claude-code",
    model: "sonnet",
    content: [
      { type: "thinking", thinking: "private", thinkingSignature: "signed" },
      { type: "text", text: "visible" },
    ],
    usage,
    stopReason: "stop",
    timestamp: 1,
  }

  const native = {
    id: "m1",
    role: "assistant" as const,
    content: [
      { type: "thinking" as const, thinking: "private", signature: "signed", extra: "preserved" },
      { type: "text" as const, text: "visible" },
    ],
    stop_reason: "end_turn",
  }

  assistant.diagnostics = [makeReplayDiagnostic(native, assistant)]

  const original = prepareFrames([
    { role: "user", content: "go", timestamp: 0 },
    assistant,
    { role: "user", content: "again", timestamp: 2 },
  ])

  assert.deepEqual(original[1]?.message.content[0], native.content[0])

  assistant.content[1] = { type: "text", text: "edited" }

  const edited = prepareFrames([
    { role: "user", content: "go", timestamp: 0 },
    assistant,
    { role: "user", content: "again", timestamp: 2 },
  ])

  assert.deepEqual(edited[1]?.message.content, [{ type: "text", text: "edited" }])
})

test("builds cache-stable native tool declarations and chronological system changes", () => {
  const alpha = {
    name: "alpha",
    description: "alpha",
    parameters: { type: "object", properties: {} },
  } satisfies Tool

  const beta = {
    name: "beta",
    description: "beta",
    parameters: { type: "object", properties: {} },
  } satisfies Tool

  const assistant: AssistantMessage = {
    role: "assistant",
    api: "test",
    provider: "claude-code",
    model: "opus",
    content: [{ type: "text", text: "one" }],
    usage,
    stopReason: "stop",
    timestamp: 3,
  }

  const messages: Message[] = [
    { role: "system", content: "base", toolsAdded: [alpha], timestamp: 0 },
    { role: "user", content: "first", timestamp: 1 },
    { role: "system", content: "beta is available", toolsAdded: [beta], timestamp: 2 },
    assistant,
    { role: "system", content: "alpha is gone", toolsRemoved: [{ name: "alpha" }], timestamp: 4 },
    { role: "user", content: "second", timestamp: 5 },
  ]

  const plan = prepareNativeTranscript(messages, true)!
  assert.deepEqual(
    plan.requestTools.map((tool) => [tool.name, tool.defer_loading ?? false]),
    [
      [`${toolPrefix}alpha`, false],
      ["__pi_deferred_placeholder__", true],
      [`${toolPrefix}beta`, true],
    ],
  )
  assert.deepEqual(plan.requestTools[0]?.cache_control, { type: "ephemeral", ttl: "1h" })
  assert.equal(plan.systemInjections[0]?.beforeAssistant, 0)
  assert.deepEqual(plan.systemInjections[0]?.content, [
    { type: "text", text: "beta is available" },
    { type: "tool_addition", tool: { type: "tool_reference", name: `${toolPrefix}beta` } },
  ])
  assert.equal(plan.systemInjections[1]?.beforeAssistant, null)
  assert.deepEqual(plan.systemInjections[1]?.content, [
    { type: "text", text: "alpha is gone" },
    { type: "tool_removal", tool: { type: "tool_reference", name: `${toolPrefix}alpha` } },
  ])

  assert.equal(prepareNativeTranscript(messages, false), undefined)
  assert.equal(
    prepareNativeTranscript(
      [
        { role: "system", content: "base", timestamp: 0 },
        { role: "system", content: "late", toolsAdded: [alpha], timestamp: 1 },
        { role: "user", content: "go", timestamp: 2 },
      ],
      true,
    ),
    undefined,
  )
  assert.equal(
    prepareNativeTranscript(
      [
        ...messages,
        {
          role: "system",
          content: "",
          toolsAdded: [{ ...alpha, description: "changed" }],
          timestamp: 6,
        },
      ],
      true,
    ),
    undefined,
  )
})

const thinkingOnly = (redacted = false): AssistantMessage => ({
  role: "assistant",
  api: "test",
  provider: "claude-code",
  model: "opus",
  responseModel: "claude-opus-5-5",
  content: [{ type: "thinking", thinking: "cut off", thinkingSignature: "signed", redacted }],
  usage,
  stopReason: "length",
  timestamp: 2,
})

test("skips an assistant message with only thinking, as Claude Code does", () => {
  for (const redacted of [false, true]) {
    const frames = prepareFrames([
      { role: "user", content: "go", timestamp: 1 },
      thinkingOnly(redacted),
      { role: "user", content: "next", timestamp: 3 },
    ])

    // Claude Code drops the message and merges the user messages around it.
    assert.deepEqual(frames, [
      {
        type: "user",
        message: {
          role: "user",
          content: [
            { type: "text", text: "go" },
            { type: "text", text: "next" },
          ],
        },
      },
    ])
  }
})

test("places system changes at assistant boundaries that skip thinking-only messages", () => {
  const alpha = {
    name: "alpha",
    description: "alpha",
    parameters: { type: "object", properties: {} },
  }

  const beta = { name: "beta", description: "beta", parameters: { type: "object", properties: {} } }

  const plan = prepareNativeTranscript(
    [
      { role: "system", content: "base", toolsAdded: [alpha], timestamp: 0 },
      { role: "user", content: "first", timestamp: 1 },
      thinkingOnly(),
      { role: "system", content: "beta is available", toolsAdded: [beta], timestamp: 3 },
      { role: "user", content: "second", timestamp: 4 },
      {
        role: "assistant",
        api: "test",
        provider: "claude-code",
        model: "opus",
        content: [{ type: "text", text: "answer" }],
        usage,
        stopReason: "stop",
        timestamp: 5,
      },
      { role: "user", content: "third", timestamp: 6 },
    ],
    true,
  )

  assert.deepEqual(
    plan?.systemInjections.map((injection) => injection.beforeAssistant),
    [0],
  )
})

test("flattens root combinators so branch parameters stay visible", () => {
  // TypeBox's Type.Union of two objects, with one branch behind a local $ref.
  const edit = {
    name: "edit",
    description: "Edit a file.",
    parameters: {
      $defs: {
        Replace: {
          type: "object",
          properties: { old: { type: "string" }, new: { type: "string" } },
          required: ["old", "new"],
        },
      },
      properties: { path: { type: "string", description: "root wins" } },
      required: ["path"],
      anyOf: [
        { $ref: "#/$defs/Replace" },
        {
          type: "object",
          properties: { path: { type: "number" }, content: { type: "string" } },
          required: ["content"],
        },
      ],
    },
  } satisfies Tool

  const [native] = prepareTools([edit]).nativeTools

  assert.deepEqual(native?.["input_schema"], {
    $defs: edit.parameters.$defs,
    type: "object",
    properties: {
      path: { type: "string", description: "root wins" },
      old: { type: "string" },
      new: { type: "string" },
      content: { type: "string" },
    },
    required: ["path"],
  })
  assert.equal(
    native?.["description"],
    "Input constraint: provide parameters for at least one of: (old, new) or (content).\n\nEdit a file.",
  )

  // TypeBox's Type.Intersect: every branch's requirements hold.
  assert.deepEqual(
    normalizeInputSchema({
      allOf: [
        { type: "object", properties: { a: { type: "string" } }, required: ["a"] },
        { type: "object", properties: { b: { type: ["number", "null"] } }, required: ["b"] },
      ],
    }),
    {
      schema: {
        type: "object",
        properties: { a: { type: "string" }, b: { type: "number" } },
        required: ["a", "b"],
      },
    },
  )
})

test("merges discriminated union branches so every variant stays callable", () => {
  const { schema, constraint } = normalizeInputSchema({
    oneOf: [
      {
        type: "object",
        properties: { action: { const: "create", type: "string" }, name: { type: "string" } },
        required: ["action", "name"],
      },
      {
        type: "object",
        properties: { action: { const: "delete", type: "string" }, id: { type: "number" } },
        required: ["action", "id"],
      },
      {
        type: "object",
        properties: { action: { const: "list", type: "string" }, limit: { type: "number" } },
        required: ["action"],
      },
    ],
  })

  assert.deepEqual(schema, {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "delete", "list"] },
      name: { type: "string" },
      id: { type: "number" },
      limit: { type: "number" },
    },
  })
  assert.equal(
    constraint,
    'Input constraint: provide parameters for exactly one of: (action="create", name) or (action="delete", id) or (action="list").',
  )

  // Conflicting non-constant shapes admit each one.
  assert.deepEqual(
    normalizeInputSchema({
      anyOf: [
        { properties: { target: { type: "string" } } },
        { properties: { target: { type: "object", properties: { line: { type: "number" } } } } },
      ],
    }).schema["properties"],
    {
      target: {
        anyOf: [{ type: "string" }, { type: "object", properties: { line: { type: "number" } } }],
      },
    },
  )
})

test("phrases a choice nested in a branch within that branch", () => {
  const { constraint } = normalizeInputSchema({
    oneOf: [
      {
        type: "object",
        properties: { action: { const: "create" } },
        required: ["action"],
        anyOf: [
          { properties: { path: { type: "string" } }, required: ["path"] },
          { properties: { url: { type: "string" } }, required: ["url"] },
        ],
      },
      {
        type: "object",
        properties: { action: { const: "list" } },
        required: ["action"],
        additionalProperties: false,
      },
    ],
  })

  assert.equal(
    constraint,
    'Input constraint: provide parameters for exactly one of: (action="create", at least one of: (path) or (url)) or (action="list").',
  )
})

test("a root $ref joins the root's own keywords", () => {
  const $defs = {
    base: { type: "object", properties: { base: { type: "string" } }, required: ["base"] },
  }

  assert.deepEqual(
    normalizeInputSchema({
      $defs,
      $ref: "#/$defs/base",
      properties: { root: { type: "string" } },
      required: ["root"],
      allOf: [{ properties: { extra: { type: "number" } }, required: ["extra"] }],
    }),
    {
      schema: {
        $defs,
        type: "object",
        properties: {
          root: { type: "string" },
          base: { type: "string" },
          extra: { type: "number" },
        },
        required: ["root", "base", "extra"],
      },
    },
  )
})

test("a root $ref resolves escaped names and stays when it cannot be resolved", () => {
  const $defs = {
    "a/b~c": { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
  }

  assert.deepEqual(normalizeInputSchema({ $defs, $ref: "#/$defs/a~1b~0c", allOf: [{}] }), {
    schema: { $defs, type: "object", properties: { path: { type: "string" } }, required: ["path"] },
  })

  for (const $ref of ["#/$defs/missing", "#/$defs/a~1b~0c/properties", "other.json#/$defs/x"])
    assert.deepEqual(
      normalizeInputSchema({ $defs, $ref, allOf: [{ properties: { n: { type: "number" } } }] }),
      { schema: { $ref, $defs, type: "object", properties: { n: { type: "number" } } } },
      $ref,
    )
})

test("flattens nested compositions and local $ref chains", () => {
  const nested = normalizeInputSchema({
    allOf: [
      { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
      {
        anyOf: [
          {
            type: "object",
            properties: { old: { type: "string" }, new: { type: "string" } },
            required: ["old", "new"],
          },
          { type: "object", properties: { content: { type: "string" } }, required: ["content"] },
        ],
      },
    ],
  })

  assert.deepEqual(nested, {
    schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        old: { type: "string" },
        new: { type: "string" },
        content: { type: "string" },
      },
      required: ["path"],
    },
    constraint:
      "Input constraint: provide parameters for at least one of: (old, new) or (content).",
  })

  const $defs = {
    Alias: { $ref: "#/$defs/File" },
    File: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    Loop: { allOf: [{ $ref: "#/$defs/Loop" }, { properties: { depth: { type: "number" } } }] },
  }

  assert.deepEqual(
    normalizeInputSchema({ $defs, allOf: [{ $ref: "#/$defs/Alias" }, { $ref: "#/$defs/Loop" }] }),
    {
      schema: {
        $defs,
        type: "object",
        properties: { path: { type: "string" }, depth: { type: "number" } },
        required: ["path"],
      },
    },
  )
})

test("normalizes tool schemas and builds native generation fields", () => {
  const tools = [
    {
      name: "probe",
      description: "probe",
      parameters: {
        type: "object",
        properties: { value: { anyOf: [{ type: "string" }, { type: "null" }] } },
        required: ["value"],
      },
    },
  ] satisfies Tool[]

  const prepared = prepareTools(tools)
  assert.equal(prepared.manifest[0]?.name, "probe")
  assert.equal(prepared.nativeTools[0]?.name, `${toolPrefix}probe`)
  assert.deepEqual(normalizeInputSchema({ oneOf: [{ type: "object" }, { type: "string" }] }), {
    schema: { type: "object", properties: {} },
    constraint:
      "Input constraint: provide parameters for exactly one of the documented parameter groups.",
  })
  assert.deepEqual(
    buildExtraBody(catalog.route("claude-sonnet-5"), prepared.nativeTools, {
      reasoning: "minimal",
    }),
    {
      tools: prepared.nativeTools,
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: "low" },
    },
  )
  assert.deepEqual(buildExtraBody(catalog.route("claude-haiku-4-5-20251001"), [], {}), {
    tools: [],
    thinking: { type: "disabled" },
    context_management: { edits: [] },
  })
  assert.deepEqual(buildExtraBody(catalog.route("claude-sonnet-5"), [], {}), {
    tools: [],
    thinking: { type: "disabled" },
    context_management: { edits: [] },
  })

  // Opus 5.5 rejects `thinking.type: disabled` (issue #2).
  for (const id of ["claude-opus-5-5", "default", "claude-fable-5-1"]) {
    assert.deepEqual(buildExtraBody(catalog.route(id), [], {}), {
      tools: [],
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
    })
  }
})

test("keeps native replay only for the same model without changing the source history", () => {
  const model = sonnet

  const assistant: AssistantMessage = {
    role: "assistant",
    api: model.api,
    provider: model.provider,
    model: model.id,
    content: [
      {
        type: "thinking",
        thinking: "[Reasoning redacted]",
        thinkingSignature: "opaque",
        redacted: true,
      },
      { type: "text", text: "visible" },
    ],
    usage,
    stopReason: "stop",
    timestamp: 1,
  }

  const native = {
    role: "assistant" as const,
    content: [
      { type: "redacted_thinking" as const, data: "opaque" },
      { type: "text" as const, text: "visible" },
    ],
  }

  assistant.diagnostics = [makeReplayDiagnostic(native, assistant)]

  const messages: Message[] = [
    { role: "user", content: "go", timestamp: 0 },
    assistant,
    { role: "user", content: "again", timestamp: 2 },
  ]

  const original = structuredClone(messages)

  const sameModel = prepareFrames(prepareMessages(messages, model))
  assert.deepEqual(sameModel[1]?.message.content, native.content)
  const otherModel = prepareFrames(prepareMessages(messages, { ...model, id: "opus" }))
  assert.deepEqual(otherModel[1]?.message.content, [{ type: "text", text: "visible" }])
  assert.deepEqual(messages, original)
})

test("normalizes foreign tool call ids and drops foreign reasoning before replay", () => {
  const id = "call_abc|fc_" + "x".repeat(400)

  const assistant: AssistantMessage = {
    role: "assistant",
    api: "openai-responses",
    provider: "openai",
    model: "gpt-5",
    content: [
      { type: "thinking", thinking: "", thinkingSignature: "encrypted" },
      { type: "thinking", thinking: "inspect the file", thinkingSignature: "foreign-thinking" },
      { type: "text", text: "checking", textSignature: "foreign-text" },
      {
        type: "toolCall",
        id,
        name: "read",
        arguments: { path: "a" },
        thoughtSignature: "foreign-tool",
      },
    ],
    usage,
    stopReason: "toolUse",
    timestamp: 1,
  }

  const model = sonnet

  const messages: Message[] = [
    { role: "user", content: "go", timestamp: 0 },
    assistant,
    {
      role: "toolResult",
      toolCallId: id,
      toolName: "read",
      content: [{ type: "text", text: "A" }],
      isError: false,
      timestamp: 2,
    },
  ]

  const original = structuredClone(messages)
  const prepared = prepareMessages(messages, model)
  const content = assistantAt(prepared, 1).content
  assert.deepEqual(content[0], { type: "text", text: "checking" })
  assert.equal("thoughtSignature" in content[1]!, false)
  const frames = prepareFrames(prepared)

  const toolUse = (frames[1]?.message.content ?? []).filter(isRecord)
  assert.deepEqual(
    toolUse.map((block) => block["type"]),
    ["text", "tool_use"],
  )
  const toolUseId = toolUse[1]?.["id"]
  assert.match(String(toolUseId), /^[a-zA-Z0-9_-]{1,64}$/u)
  const result = frames[2]?.message.content[0]
  assert.equal(isRecord(result) ? result["tool_use_id"] : undefined, toolUseId)
  assert.deepEqual(messages, original)
})
