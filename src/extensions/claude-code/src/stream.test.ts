import assert from "node:assert/strict"
import * as http from "node:http"
import test, { type TestContext } from "node:test"

import { isRetryableAssistantError, normalizeContext, type Message } from "@earendil-works/pi-ai"

import { ClaudeCli } from "./cli.js"
import { fakeClaude } from "./fake-claude.js"
import { ModelCatalog } from "./model-catalog.js"
import { createStream, normalizeError } from "./stream.js"
import { ClaudeWorkers } from "./workers.js"

/** Claude Code's Opus row as discovery reports it; Claude Code resolves `opus[1m]` to `claude-opus-5-5`. */
const addOpus = (catalog: ModelCatalog) =>
  catalog.add({
    value: "opus[1m]",
    resolvedModel: "claude-opus-5-5[1m]",
    displayName: "Opus",
    description: "Opus 5.5 with 1M context",
    supportsAdaptiveThinking: true,
  })

test("hands Pi a tool call for a tool it never declared", async (t) => {
  const command = await fakeClaude(
    t,
    `
for await (const line of frames) {
  const frame = JSON.parse(line)
  if (frame.type !== "user") continue
  const name = "mcp__pi__aggregate_rum_events"

  for (const event of [
    { type: "message_start", message: { id: "m_fake", role: "assistant", model: "claude-opus-5-5-20260101", content: [], usage } },
    { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tool_fake", name, input: {} } },
    { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"query":' } },
    { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '"*"}' } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "tool_use" }, usage },
    { type: "message_stop" },
  ])
    emit({ type: "stream_event", event })

  const content = [{ type: "tool_use", id: "tool_fake", name, input: { query: "*" } }]
  emit({ type: "assistant", message: { id: "m_fake", role: "assistant", content, stop_reason: "tool_use", usage } })
  emit({ type: "result", subtype: "error_max_turns", is_error: true, usage })
}
`,
  )

  const catalog = new ModelCatalog()
  const workers = new ClaudeWorkers(new ClaudeCli({ command }))
  t.after(() => workers.close())

  const model = addOpus(catalog)

  const message = await createStream(workers, catalog)(
    model,
    normalizeContext({
      systemPrompt: "system",
      messages: [{ role: "user", content: [{ type: "text", text: "count errors" }], timestamp: 0 }],
      tools: [
        {
          name: "mcp__datadog__aggregate_rum_events",
          description: "Aggregate RUM",
          parameters: { type: "object" },
        },
      ],
    }),
    { timeoutMs: 5_000, cacheRetention: "none" },
  ).result()

  assert.equal(message.stopReason, "toolUse", message.errorMessage)

  assert.deepEqual(
    message.content.map((block) =>
      block.type === "toolCall" ? [block.name, block.arguments] : block.type,
    ),
    [["aggregate_rum_events", { query: "*" }]],
  )

  assert.ok(message.diagnostics?.some((item) => item.type === "claude-code.native-assistant.v1"))
  // Replay names the model that answered, not Pi's model id.
  assert.equal(message.responseModel, "claude-opus-5-5-20260101")
})

test("a response cut off by max_tokens mid tool call ends as length with the arguments so far", async (t) => {
  const usage = { input_tokens: 3, output_tokens: 64 }

  // Anthropic, live: the truncated tool_use block gets no content_block_stop before message_stop.
  const upstream = http.createServer(async (request, response) => {
    for await (const _chunk of request);
    response.writeHead(200, { "content-type": "text/event-stream" })

    const events = [
      { type: "message_start", message: { id: "m1", role: "assistant", content: [], usage } },
      {
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "tool_cut", name: "mcp__pi__write", input: {} },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: '{"path": "a.txt", "con' },
      },
      { type: "message_delta", delta: { stop_reason: "max_tokens" }, usage },
      { type: "message_stop" },
    ]

    response.end(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""))
  })

  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  t.after(() => new Promise<void>((resolve) => upstream.close(() => resolve())))
  const address = upstream.address()

  if (!address || typeof address === "string") throw new Error("missing address")

  // Claude Code, live: it retries the truncated request twice, then reports an error result.
  const command = await fakeClaude(
    t,
    `
for await (const line of frames) {
  const frame = JSON.parse(line)
  if (frame.type !== "user") continue

  for (let attempt = 0; attempt < 3; attempt++)
    await fetch(\`\${process.env.ANTHROPIC_BASE_URL}/v1/messages\`, { method: "POST", body: JSON.stringify({ messages: [frame.message] }) }).then((response) => response.text())

  emit({ type: "result", subtype: "error_during_execution", is_error: true, usage })
}
`,
  )

  const catalog = new ModelCatalog()
  const workers = new ClaudeWorkers(new ClaudeCli({ command }), `http://127.0.0.1:${address.port}`)
  t.after(() => workers.close())
  const model = addOpus(catalog)

  const message = await createStream(workers, catalog)(
    model,
    normalizeContext({
      systemPrompt: "system",
      messages: [{ role: "user", content: [{ type: "text", text: "write a.txt" }], timestamp: 0 }],
      tools: [{ name: "write", description: "Write a file", parameters: { type: "object" } }],
    }),
    { timeoutMs: 5_000, cacheRetention: "none" },
  ).result()

  assert.equal(message.stopReason, "length", message.errorMessage)
  assert.deepEqual(
    message.content.map((block) =>
      block.type === "toolCall" ? [block.name, block.arguments] : block.type,
    ),
    [["write", { path: "a.txt" }]],
  )
})

/**
 * A Claude Code stand-in that, like the real one, replays history into one relayed request for the model it resolved
 * and keeps a replayed message's thinking only when the message names that model. STRIP_THINKING strips it anyway.
 */
const replayingClaude = `
const running = "claude-opus-5-5"
const history = []
const isThinking = (block) => block.type === "thinking" || block.type === "redacted_thinking"

for await (const line of frames) {
  const frame = JSON.parse(line)
  const { role, content, model } = frame.message
  const kept = role === "assistant" && (model !== running || process.env.STRIP_THINKING) ? content.filter((block) => !isThinking(block)) : content
  const previous = history.at(-1)

  // A tagged message with only thinking is dropped, and the user messages around it merge.
  if (role === "assistant" && kept.every(isThinking)) {}
  else if (role === "user" && previous?.role === "user") previous.content.push(...kept)
  else history.push({ role, content: kept })

  if (frame.shouldQuery === false) emit({ type: "result", num_turns: 0, ...echo(frame) })
  if (frame.type !== "user" || frame.shouldQuery === false) continue

  const response = await fetch(\`\${process.env.ANTHROPIC_BASE_URL}/v1/messages\`, { method: "POST", body: JSON.stringify({ model: running, messages: history }) })
  await response.text()
  emit({ type: "result", subtype: "success", is_error: false, usage, ...echo(frame) })
}
`

async function replayTurn(t: TestContext, tag: string, env: Record<string, string> = {}) {
  const bodies: unknown[] = []

  const upstream = http.createServer(async (request, response) => {
    let body = ""

    for await (const chunk of request) body += chunk
    bodies.push(JSON.parse(body))
    response.writeHead(200, { "content-type": "text/event-stream" })
    const usage = { input_tokens: 3, output_tokens: 1 }

    const events = [
      {
        type: "message_start",
        message: {
          id: "m2",
          role: "assistant",
          model: "claude-opus-5-5",
          content: [],
          usage,
          input_transformations: [
            {
              type: "thinking_dropped",
              path: "messages.1.content.0",
              reason: "prefix_binding_mismatch",
            },
          ],
        },
      },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "done" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage },
      { type: "message_stop" },
    ]

    response.end(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""))
  })

  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  t.after(() => new Promise<void>((resolve) => upstream.close(() => resolve())))
  const address = upstream.address()

  if (!address || typeof address === "string") throw new Error("missing address")
  const command = await fakeClaude(t, replayingClaude)
  const catalog = new ModelCatalog()

  const workers = new ClaudeWorkers(
    new ClaudeCli({ command, env: { ...process.env, ...env } }),
    `http://127.0.0.1:${address.port}`,
  )

  t.after(() => workers.close())
  const model = addOpus(catalog)

  const message = await createStream(workers, catalog)(
    model,
    normalizeContext({
      systemPrompt: "system",
      messages: [
        { role: "user", content: [{ type: "text", text: "read a.txt" }], timestamp: 0 },
        {
          role: "assistant",
          api: model.api,
          provider: model.provider,
          model: model.id,
          responseModel: tag,
          content: [
            { type: "thinking", thinking: "plan", thinkingSignature: "sig" },
            { type: "toolCall", id: "t1", name: "read", arguments: { path: "a.txt" } },
          ],
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
          },
          stopReason: "toolUse",
          timestamp: 1,
        },
        {
          role: "toolResult",
          toolCallId: "t1",
          toolName: "read",
          content: [{ type: "text", text: "hello" }],
          isError: false,
          timestamp: 2,
        },
      ],
      tools: [{ name: "read", description: "Read a file", parameters: { type: "object" } }],
    }),
    { timeoutMs: 5_000, cacheRetention: "none" },
  ).result()

  return { message, bodies }
}

test("replays signed thinking and reports the thinking the API dropped", async (t) => {
  const { message, bodies } = await replayTurn(t, "claude-opus-5-5")

  assert.equal(message.stopReason, "stop", message.errorMessage)
  assert.deepEqual(JSON.parse(JSON.stringify(bodies[0])).messages[1].content[0], {
    type: "thinking",
    thinking: "plan",
    signature: "sig",
  })

  assert.deepEqual(
    message.diagnostics?.find((item) => item.type === "claude-code.turn-relay")?.details,
    {
      upstreamRequests: 1,
      blockedRequests: 0,
      historyThinking: 1,
      droppedThinking: { prefix_binding_mismatch: ["messages.1.content.0"] },
    },
  )
})

test("fails a turn whose replayed thinking Claude Code dropped", async (t) => {
  const { message, bodies } = await replayTurn(t, "claude-opus-5-5", { STRIP_THINKING: "1" })

  assert.equal(message.stopReason, "error")
  assert.match(
    message.errorMessage ?? "",
    /^Claude Code dropped replayed thinking from assistant message 0/,
  )
  assert.equal(bodies.length, 0)

  // A message that names another model loses its thinking as expected, and the turn goes on.
  const other = await replayTurn(t, "claude-sonnet-5")

  assert.equal(other.message.stopReason, "stop", other.message.errorMessage)
  assert.equal(
    other.message.diagnostics?.find((item) => item.type === "claude-code.turn-relay")?.details?.[
      "historyThinking"
    ],
    0,
  )
})

test("a thread goes on after an answer cut off with only thinking", async (t) => {
  const bodies: Array<{ messages: Array<{ role: string }> }> = []

  const upstream = http.createServer(async (request, response) => {
    let body = ""

    for await (const chunk of request) body += chunk
    bodies.push(JSON.parse(body))
    response.writeHead(200, { "content-type": "text/event-stream" })
    const usage = { input_tokens: 3, output_tokens: 1 }
    const first = bodies.length === 1

    const events = [
      {
        type: "message_start",
        message: {
          id: `m${bodies.length}`,
          role: "assistant",
          model: "claude-opus-5-5",
          content: [],
          usage,
        },
      },
      ...(first
        ? [
            {
              type: "content_block_start",
              index: 0,
              content_block: { type: "thinking", thinking: "", signature: "" },
            },
            {
              type: "content_block_delta",
              index: 0,
              delta: { type: "thinking_delta", thinking: "long plan" },
            },
            {
              type: "content_block_delta",
              index: 0,
              delta: { type: "signature_delta", signature: "sig" },
            },
          ]
        : [
            { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
            { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "done" } },
          ]),
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: first ? "max_tokens" : "end_turn" }, usage },
      { type: "message_stop" },
    ]

    response.end(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""))
  })

  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve))
  t.after(() => new Promise<void>((resolve) => upstream.close(() => resolve())))
  const address = upstream.address()

  if (!address || typeof address === "string") throw new Error("missing address")
  const catalog = new ModelCatalog()

  const workers = new ClaudeWorkers(
    new ClaudeCli({ command: await fakeClaude(t, replayingClaude) }),
    `http://127.0.0.1:${address.port}`,
  )

  t.after(() => workers.close())
  const model = addOpus(catalog)
  const messages: Message[] = [{ role: "user", content: "plan", timestamp: 0 }]

  const turn = () =>
    createStream(workers, catalog)(model, normalizeContext({ systemPrompt: "system", messages }), {
      timeoutMs: 5_000,
      sessionId: "thinking-only",
    }).result()

  const cut = await turn()

  assert.equal(cut.stopReason, "length", cut.errorMessage)
  assert.deepEqual(
    cut.content.map((block) => block.type),
    ["thinking"],
  )

  // Replay skips the message, so no later request could continue a worker that holds it.
  assert.equal(workers.retained, 0)
  messages.push(cut, { role: "user", content: "go on", timestamp: 1 })
  const next = await turn()

  assert.equal(next.stopReason, "stop", next.errorMessage)
  assert.deepEqual(
    bodies[1]?.messages.map((message) => message.role),
    ["user"],
  )
})

test("usage-credit rejections become non-retryable billing errors", () => {
  for (const upstream of [
    "Claude Code API error: API Error: 400 Third-party apps now draw from your extra usage, not your plan limits.",
    "Incomplete Claude Code upstream response (status 400, upstream said: You're out of extra usage. Add more at claude.ai/settings/usage and keep going.)",
  ]) {
    const message = normalizeError(new Error(upstream))

    assert.match(message, /^Claude Code billing:/)
    assert.ok(message.endsWith(upstream))

    // Transient-looking text must not make Pi retry a request Anthropic routed to usage credits.
    assert.equal(
      isRetryableAssistantError({
        role: "assistant",
        content: [],
        api: "claude-code-stream-json",
        provider: "claude-code",
        model: "sonnet",
        usage: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "error",
        errorMessage: `${message} 429 overloaded`,
        timestamp: 0,
      }),
      false,
    )
  }

  assert.equal(
    normalizeError(new Error("Claude Code API error: overloaded")),
    "Claude Code API error: overloaded",
  )
})
