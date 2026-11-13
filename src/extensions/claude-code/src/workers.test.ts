import assert from "node:assert/strict"
import { appendFile, readFile } from "node:fs/promises"
import * as http from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test, { type TestContext } from "node:test"

import { isRetryableAssistantError, type AssistantMessage } from "@earendil-works/pi-ai"

import { ClaudeCli, type Env } from "./cli.js"
import { fakeClaude, textFrame } from "./fake-claude.js"
import { ClaudeWorkers, type ClaudeRequest } from "./workers.js"

const replies = `
let queries = 0

for await (const line of frames) {
  const frame = JSON.parse(line)

  if (frame.shouldQuery === false) {
    emit({ type: "result", num_turns: 0, ...echo(frame) })
    continue
  }

  if (frame.type !== "user") continue
  queries += 1
  const id = queries === 1 ? "m_fake" : \`m_fake_\${queries}\`

  if (frame.message.content.some((block) => block.text === "call-tool")) {
    const content = [{ type: "tool_use", id: "tool_fake", name: "mcp__pi__echo", input: { value: "test" } }]
    emit({ type: "stream_event", event: { type: "message_stop" } })
    emit({ type: "assistant", message: { id, role: "assistant", content, stop_reason: "tool_use", usage } })
    emit({ type: "result", subtype: "error_max_turns", is_error: true, usage, ...echo(frame) })
    continue
  }

  // A charge reported before Claude Code stalls or dies, from query CHARGE_AT on.
  if (process.env.CHARGE_THEN && queries >= Number(process.env.CHARGE_AT ?? 1)) {
    emit({ type: "rate_limit_event", rate_limit_info: { status: "allowed", overageInUse: true } })
    if (process.env.CHARGE_THEN === "exit") process.exit(1)
    continue
  }

  if (process.env.NATIVE_ERROR) {
    emit({ type: "assistant", error: "rate_limit", message: { id, role: "assistant", content: [{ type: "text", text: "Usage limit" }], usage } })
    emit({ type: "result", subtype: "success", is_error: true, usage, ...echo(frame) })
    continue
  }

  reply(frame, id, queries === 1 ? "ok" : \`ok\${queries}\`, {
    before: process.env.OVERAGE
      ? [{ type: "rate_limit_event", rate_limit_info: { status: "allowed_warning", rateLimitType: "five_hour", [process.env.OVERAGE]: true } },
        ...(process.env.OVERAGE_CLEARED ? [{ type: "rate_limit_event", rate_limit_info: { status: "allowed", rateLimitType: "five_hour" } }] : [])]
      : [],
  })

  // A result no turn waits for stays buffered until the next turn reads it.
  const stray = { type: "result", subtype: "error_during_execution", is_error: true, num_turns: 0 }
  if (process.env.STALE_RESULT === "foreign") emit({ ...stray, user_message_uuids: ["other"] })
  if (process.env.STALE_RESULT === "bare") emit(stray)
}
`

const logStarts = `
import { appendFileSync } from "node:fs"

if (process.env.PROCESS_LOG && process.argv.includes("--system-prompt-file"))
  appendFileSync(process.env.PROCESS_LOG, \`\${process.pid}\\n\`)
`

async function setup(t: TestContext, env: Env = {}, body = replies) {
  const command = await fakeClaude(t, `${logStarts}\n${body}`)
  const processLog = join(tmpdir(), `mel-claude-workers-${process.pid}-${Date.now()}.log`)
  await appendFile(processLog, "")
  t.after(() => workers.close())

  const workers = new ClaudeWorkers(
    new ClaudeCli({ command, env: { ...process.env, PROCESS_LOG: processLog, ...env } }),
  )

  const starts = async () =>
    (await readFile(processLog, "utf8")).trim().split("\n").filter(Boolean).length

  return { workers, starts }
}

const request = (
  frames: ClaudeRequest["frames"],
  extra: Partial<ClaudeRequest> = {},
): ClaudeRequest => ({
  model: "sonnet",
  frames,
  systemPrompt: "system",
  manifest: [],
  extraBody: { tools: [] },
  timeoutMs: 5_000,
  ...extra,
})

const continuation = (first: string, reply: { message: { content: unknown[] } }, next: string) => [
  textFrame(first, false),
  {
    type: "assistant" as const,
    message: { role: "assistant" as const, content: reply.message.content },
  },
  textFrame(next),
]

test("a turn runs privately, without an API key, and streams the reply", async (t) => {
  const command = await fakeClaude(
    t,
    `
import { readFileSync } from "node:fs"

const fail = (message) => { console.error(message); process.exit(3) }
if ("ANTHROPIC_API_KEY" in process.env) fail("API key leaked to Claude Code")
for (const name of ["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "DISABLE_TELEMETRY", "DISABLE_ERROR_REPORTING", "CLAUDE_CODE_DISABLE_FILE_MENTIONS"])
  if (process.env[name] !== "1") fail(\`missing \${name}\`)
if (!process.cwd().includes("mel-claude-code-")) fail(\`cwd is not private: \${process.cwd()}\`)
const system = process.argv[process.argv.indexOf("--system-prompt-file") + 1]
if (readFileSync(system, "utf8") !== "system") fail("wrong system prompt")
${replies}
`,
  )

  const workers = new ClaudeWorkers(
    new ClaudeCli({ command, env: { ...process.env, ANTHROPIC_API_KEY: "test-key" } }),
  )

  t.after(() => workers.close())
  const events: string[] = []

  const response = await workers.run(
    request(
      [
        textFrame("old", false),
        {
          type: "assistant",
          message: { role: "assistant", content: [{ type: "text", text: "old reply" }] },
        },
        textFrame("new"),
      ],
      {
        onEvent: (event) => events.push(event.type),
      },
    ),
  )

  assert.equal(response.message.id, "m_fake")
  assert.equal(response.message.stop_reason, "end_turn")
  assert.equal(response.usage.input_tokens, 3)
  assert.equal(response.relay.upstreamRequests, 0)
  assert.equal(events.at(-1), "message_stop")
})

test("linear continuations reuse a warm worker; branches replace it; two stay warm", async (t) => {
  const { workers, starts } = await setup(t)
  const first = await workers.run(request([textFrame("one")], { sessionId: "a" }))
  const second = await workers.run(request(continuation("one", first, "two"), { sessionId: "a" }))

  assert.equal(second.message.id, "m_fake_2")
  assert.equal(await starts(), 1)
  assert.equal(workers.retained, 1)

  // A branch must not reuse hidden Claude Code state.
  const branched = await workers.run(request([textFrame("branch")], { sessionId: "a" }))

  assert.equal(branched.message.id, "m_fake")
  assert.equal(await starts(), 2)

  for (const sessionId of ["b", "c"])
    await workers.run(request([textFrame(sessionId)], { sessionId }))

  assert.equal(workers.retained, 2)
  assert.equal(await starts(), 4)
})

test("the replay model tag does not stop a warm continuation", async (t) => {
  const { workers, starts } = await setup(t)
  const first = await workers.run(request([textFrame("one")], { sessionId: "a" }))

  const frames: ClaudeRequest["frames"] = [
    textFrame("one", false),
    {
      type: "assistant",
      message: { role: "assistant", content: first.message.content, model: "claude-sonnet-5" },
    },
    textFrame("two"),
  ]

  const second = await workers.run(request(frames, { sessionId: "a" }))

  assert.equal(second.message.id, "m_fake_2")
  assert.equal(await starts(), 1)
})

test("a tool call never leaves a warm worker", async (t) => {
  const { workers, starts } = await setup(t)

  // Claude Code's inert MCP server already answered the call, so its hidden history diverges from Pi's.
  const call = await workers.run(request([textFrame("call-tool")], { sessionId: "tool" }))

  assert.equal(call.message.stop_reason, "tool_use")
  assert.equal(workers.retained, 0)

  const after = await workers.run(
    request(
      [
        textFrame("call-tool", false),
        { type: "assistant", message: { role: "assistant", content: call.message.content } },
        {
          type: "user",
          message: {
            role: "user",
            content: [{ type: "tool_result", tool_use_id: "tool_fake", content: "echoed" }],
          },
        },
      ],
      { sessionId: "tool" },
    ),
  )

  assert.equal(after.message.id, "m_fake")
  assert.equal(await starts(), 2)
})

test("a late result for another message does not end the next turn", async (t) => {
  const { workers, starts } = await setup(t, { STALE_RESULT: "foreign" })
  const first = await workers.run(request([textFrame("one")], { sessionId: "s" }))
  const second = await workers.run(request(continuation("one", first, "two"), { sessionId: "s" }))

  assert.equal(second.message.id, "m_fake_2")
  assert.equal(await starts(), 1)
})

test("a warm turn that fails before any output replays once on a fresh worker", async (t) => {
  const { workers, starts } = await setup(t, { STALE_RESULT: "bare" })
  const first = await workers.run(request([textFrame("one")], { sessionId: "s" }))
  const second = await workers.run(request(continuation("one", first, "two"), { sessionId: "s" }))

  assert.equal(second.message.id, "m_fake")
  assert.equal(await starts(), 2)
})

test("a native error reports Claude Code's text", async (t) => {
  const { workers } = await setup(t, { NATIVE_ERROR: "1" })

  await assert.rejects(
    workers.run(request([textFrame("one")])),
    /Claude Code API error: Usage limit/,
  )
})

test("a charge reported before a timeout or exit still fails as billing, never retried", async (t) => {
  for (const then of ["hang", "exit"]) {
    const { workers } = await setup(t, { CHARGE_THEN: then })

    await assert.rejects(
      workers.run(request([textFrame("one")], { timeoutMs: 200 })),
      (error: Error) => {
        assert.match(error.message, /^Claude Code billing: .*usage credits/, then)
        assert.equal(isRetryableAssistantError(failed(error.message)), false)

        return true
      },
    )
  }

  // A warm worker that fails before streaming normally replays on a fresh worker; a charged one must not.
  const { workers, starts } = await setup(t, { CHARGE_THEN: "exit", CHARGE_AT: "2" })
  const first = await workers.run(request([textFrame("one")], { sessionId: "s" }))

  await assert.rejects(
    workers.run(request(continuation("one", first, "two"), { sessionId: "s" })),
    /^Error: Claude Code billing/,
  )
  assert.equal(await starts(), 1)
})

// isUsingOverage: a rejected plan window is served from usage credits. overageInUse: the request is billed there anyway.
for (const [signal, cleared] of [
  ["isUsingOverage", ""],
  ["overageInUse", ""],
  ["overageInUse", "1"],
])
  test(`a turn Claude Code reports with ${signal}${cleared ? " and then clears" : ""} fails as a non-retryable billing error`, async (t) => {
    const { workers } = await setup(t, { OVERAGE: signal, OVERAGE_CLEARED: cleared })

    await assert.rejects(workers.run(request([textFrame("one")])), (error: Error) => {
      assert.match(error.message, /^Claude Code billing: .*usage credits/)
      assert.equal(isRetryableAssistantError(failed(error.message)), false)

      return true
    })
  })

for (const key of [
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_FOUNDRY_API_KEY",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
  "CLAUDE_CODE_USE_FOUNDRY",
]) {
  test(`refuses ${key} for discovery and requests`, async (t) => {
    const { workers } = await setup(t, { [key]: "1" })
    const cli = new ClaudeCli({ command: "claude", env: { [key]: "1" } })
    const error = new RegExp(`refuses conflicting auth/backend overrides:.*${key}`)

    assert.throws(() => cli.environment("discovery", {}), error)
    await assert.rejects(workers.run(request([textFrame("one")])), error)
  })
}

function failed(errorMessage: string): AssistantMessage {
  return {
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
    errorMessage,
    timestamp: 0,
  }
}

/**
 * Run one turn through a fake Claude Code that, like the real one, sends the request through the relay and retries
 * once natively. `upstream` answers it; without one the relay points at a closed port.
 */
async function failingUpstreamTurn(
  t: TestContext,
  upstream?: (request: http.IncomingMessage, response: http.ServerResponse) => void,
): Promise<{ message: string; retryable: boolean }> {
  const server = http.createServer(upstream)
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()

  if (!address || typeof address === "string") throw new Error("missing address")

  if (upstream) t.after(() => new Promise<void>((resolve) => server.close(() => resolve())))
  else await new Promise<void>((resolve) => server.close(() => resolve()))

  const command = await fakeClaude(
    t,
    `
for await (const line of frames) {
  const frame = JSON.parse(line)
  if (frame.type !== "user") continue

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(\`\${process.env.ANTHROPIC_BASE_URL}/v1/messages\`, {
        method: "POST",
        body: JSON.stringify({ messages: [frame.message] }),
      })
      await response.text()
    } catch {}
  }

  emit({ type: "result", subtype: "error_during_execution", is_error: true })
}
`,
  )

  const workers = new ClaudeWorkers(new ClaudeCli({ command }), `http://127.0.0.1:${address.port}`)

  t.after(() => workers.close())

  const error = await workers.run(request([textFrame("hi")])).then(
    () => assert.fail("expected the upstream failure to fail the turn"),
    (error: Error) => error,
  )

  return { message: error.message, retryable: isRetryableAssistantError(failed(error.message)) }
}

test("a dropped upstream stream is retryable", async (t) => {
  const { message, retryable } = await failingUpstreamTurn(t, async (request, response) => {
    for await (const _chunk of request);
    response.writeHead(200, { "content-type": "text/event-stream" })

    response.write(
      `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "m1", role: "assistant", content: [], usage: { input_tokens: 2, output_tokens: 0 } } })}\n\n`,
    )

    setTimeout(() => response.socket?.destroy(), 20)
  })

  assert.match(message, /status 200, capture incomplete/)
  assert.match(message, /native retries denied 1/)
  assert.equal(retryable, true)
})

test("a charge in the response headers fails a cut-off stream as billing, never retried", async (t) => {
  const { message, retryable } = await failingUpstreamTurn(t, async (request, response) => {
    for await (const _chunk of request);

    response.writeHead(200, {
      "content-type": "text/event-stream",
      "anthropic-ratelimit-unified-status": "allowed",
      "anthropic-ratelimit-unified-overage-in-use": "true",
    })

    response.end(
      `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: "m1", role: "assistant", content: [], usage: { input_tokens: 2, output_tokens: 0 } } })}\n\n`,
    )
  })

  assert.match(message, /^Claude Code billing: .*usage credits .*\(rate limit status allowed\)/)
  assert.equal(retryable, false)
})

test("an upstream connection lost before a response is retryable", async (t) => {
  const hangUp = await failingUpstreamTurn(t, async (request) => {
    for await (const _chunk of request);
    request.socket.destroy()
  })

  assert.match(hangUp.message, /connection lost before a response \(status unknown/)
  assert.match(hangUp.message, /relay failure Error: socket hang up/)
  assert.equal(hangUp.retryable, true)

  const refused = await failingUpstreamTurn(t)

  assert.match(refused.message, /connection lost before a response \(status unknown/)
  assert.match(refused.message, /ECONNREFUSED/)
  assert.equal(refused.retryable, true)
})

test("upstream 5xx is retryable and 4xx is not", async (t) => {
  const overloaded = await failingUpstreamTurn(t, async (request, response) => {
    for await (const _chunk of request);
    response.writeHead(529).end()
  })

  assert.match(overloaded.message, /upstream server error \(status 529/)
  assert.equal(overloaded.retryable, true)

  const invalid = await failingUpstreamTurn(t, async (request, response) => {
    for await (const _chunk of request);

    response.writeHead(400, { "content-type": "application/json" }).end(
      JSON.stringify({
        type: "error",
        error: { type: "invalid_request_error", message: "bad request" },
      }),
    )
  })

  assert.match(
    invalid.message,
    /Incomplete Claude Code upstream response \(status 400.*upstream said: bad request/,
  )

  assert.equal(invalid.retryable, false)
})
