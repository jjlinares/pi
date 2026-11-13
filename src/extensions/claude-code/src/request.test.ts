import assert from "node:assert/strict"
import test from "node:test"

import { isRecord, type NativeFrame } from "./native-types.js"
import { rewriteRequest } from "./request.js"
import type { NativeSystemInjection } from "./transcript.js"

type Message = { role: string; content: unknown }

const text = (value: string) => ({ type: "text", text: value })

const toolUse = (id: string) => ({ type: "tool_use", id, name: "mcp__pi__read", input: {} })

const toolResult = (id: string, content: unknown) => ({
  type: "tool_result",
  tool_use_id: id,
  content,
})

const breakpoint = { type: "ephemeral", ttl: "1h" }

const memory = "<system-reminder>[MEMORY.md contents]</system-reminder>"

const account = "<system-reminder># userEmail\nuser@example.com</system-reminder>"

/** Canonical frames for the user and assistant messages of a request. */
function framesFor(messages: Message[]): NativeFrame[] {
  return messages.flatMap((message): NativeFrame[] =>
    message.role === "user" || message.role === "assistant"
      ? [
          {
            type: message.role,
            message: {
              role: message.role,
              content: Array.isArray(message.content) ? structuredClone(message.content) : [],
            },
          },
        ]
      : [],
  )
}

function rewrite(
  body: Record<string, unknown>,
  frames: NativeFrame[],
  injections?: NativeSystemInjection[],
): { messages: Message[]; system?: unknown; tools?: unknown } {
  const parsed: unknown = JSON.parse(
    rewriteRequest(Buffer.from(JSON.stringify(body)), frames, injections).body.toString("utf8"),
  )

  assert.ok(isRecord(parsed) && Array.isArray(parsed["messages"]))

  return { ...parsed, messages: parsed["messages"] }
}

const withoutBreakpoints = (value: unknown): unknown =>
  JSON.parse(
    JSON.stringify(value, (key, child: unknown) => (key === "cache_control" ? undefined : child)),
  )

function countBreakpoints(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce<number>((sum, child) => sum + countBreakpoints(child), 0)

  if (!isRecord(value)) return 0

  return Object.entries(value).reduce(
    (sum, [key, child]) => sum + (key === "cache_control" ? 1 : countBreakpoints(child)),
    0,
  )
}

const lastBlock = (message: Message | undefined): unknown =>
  Array.isArray(message?.content) ? message.content.at(-1) : undefined

test("drops Claude Code's system messages and reminders, keeping exactly Pi's history", () => {
  const canonical = [
    { role: "user", content: [text("inspect")] },
    { role: "assistant", content: [text("first reply")] },
    { role: "user", content: [text("follow up")] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", "result")] },
  ]

  const wire = [
    { role: "user", content: [text("inspect")] },
    { role: "system", content: [text("# Environment\nPrimary working directory: /tmp/worker")] },
    { role: "assistant", content: [text("first reply")] },
    { role: "user", content: [text(memory), text(account), text("follow up")] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", `result\n${memory}${account}`)] },
    { role: "system", content: [{ ...text("date reminder"), cache_control: breakpoint }] },
  ]

  assert.deepEqual(
    withoutBreakpoints(rewrite({ messages: wire }, framesFor(canonical)).messages),
    canonical,
  )
})

test("strips reminder tails from tool results whatever their separator", () => {
  const frames = framesFor([
    { role: "user", content: [text("inspect")] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", "result")] },
  ])

  for (const tail of [`\n${memory}\n${account}`, `\n\n${account}`, account]) {
    const { messages } = rewrite(
      {
        messages: [
          { role: "user", content: [text("inspect")] },
          { role: "assistant", content: [toolUse("t1")] },
          { role: "user", content: [toolResult("t1", `result${tail}`)] },
        ],
      },
      frames,
    )

    assert.deepEqual(withoutBreakpoints(messages[2]?.content), [toolResult("t1", "result")], tail)
  }
})

test("keeps Claude Code's downscaled images and their coordinate notes", () => {
  const image = {
    type: "image",
    source: { type: "base64", media_type: "image/png", data: "original" },
  }

  const resized = {
    type: "image",
    source: { type: "base64", media_type: "image/png", data: "resized" },
  }

  const note = text(
    "[Image: original 4000x4000, displayed at 2000x2000. Multiply coordinates by 2.00.]",
  )

  const frames = framesFor([
    { role: "user", content: [text("look"), image] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", [text("result"), image])] },
  ])

  const { messages } = rewrite(
    {
      messages: [
        { role: "user", content: [text(memory), text("look"), resized, note] },
        { role: "assistant", content: [toolUse("t1")] },
        {
          role: "user",
          content: [toolResult("t1", [text("result"), image, text(`\n${account}`)]), text(memory)],
        },
      ],
    },
    frames,
  )

  assert.deepEqual(withoutBreakpoints(messages[0]?.content), [text("look"), resized, note])
  assert.deepEqual(withoutBreakpoints(messages[2]?.content), [
    toolResult("t1", [text("result"), image]),
  ])
})

test("keeps user-authored reminder-like text", () => {
  const canonical = [
    { role: "user", content: [text("<system-reminder>mine</system-reminder>"), text("inspect")] },
  ]

  assert.deepEqual(
    withoutBreakpoints(
      rewrite({ messages: structuredClone(canonical) }, framesFor(canonical)).messages,
    ),
    canonical,
  )
})

const thinking = { type: "thinking", thinking: "plan", signature: "sig" }

const redacted = { type: "redacted_thinking", data: "opaque" }

/** Pi's history with thinking on both assistant messages, each tagged with the model that answered it. */
function thinkingHistory(tag: string) {
  const canonical = [
    { role: "user", content: [text("inspect")] },
    { role: "assistant", content: [thinking, toolUse("t1")] },
    { role: "user", content: [toolResult("t1", "result")] },
    { role: "assistant", content: [redacted, text("done")] },
    { role: "user", content: [text("thanks")] },
  ]

  const frames = framesFor(canonical).map((frame) =>
    frame.type === "assistant" ? { ...frame, message: { ...frame.message, model: tag } } : frame,
  )

  // What Claude Code sends when it strips the thinking.
  const stripped = canonical.map((message) =>
    message.role === "assistant"
      ? {
          ...message,
          content: message.content.filter(
            (block) => block.type !== "thinking" && block.type !== "redacted_thinking",
          ),
        }
      : message,
  )

  return { canonical, frames, stripped }
}

test("fails the turn when Claude Code drops thinking from a message naming its model", () => {
  for (const tag of ["claude-opus-5-5", "claude-opus-5-5[1m]", "claude-opus-5-5-20260101"]) {
    const { canonical, frames, stripped } = thinkingHistory(tag)
    const model = "claude-opus-5-5"

    assert.deepEqual(
      withoutBreakpoints(rewrite({ model, messages: canonical }, frames).messages),
      canonical,
      tag,
    )

    assert.throws(
      () => rewrite({ model, messages: stripped }, frames),
      /Claude Code dropped replayed thinking from assistant message 0/,
      tag,
    )

    const reordered = structuredClone(canonical)
    reordered[3] = { role: "assistant", content: [text("done"), redacted] }
    reordered[1] = {
      role: "assistant",
      content: [{ ...thinking, signature: "other" }, toolUse("t1")],
    }

    assert.throws(
      () => rewrite({ model, messages: reordered }, frames),
      /dropped replayed thinking from assistant message 0/,
      tag,
    )
  }
})

test("sends no thinking for messages that name another model", () => {
  // An alias, or a model the alias no longer resolves to: Claude Code strips their thinking, as it must.
  for (const tag of ["default", "opus[1m]", "claude-sonnet-5"]) {
    const { frames, stripped } = thinkingHistory(tag)

    assert.deepEqual(
      withoutBreakpoints(
        rewrite({ model: "claude-opus-5-5", messages: stripped }, frames).messages,
      ),
      stripped,
      tag,
    )
  }
})

test("refuses requests that do not line up with Pi's history", () => {
  const frames = framesFor([
    { role: "user", content: [text("inspect")] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", "result")] },
  ])

  assert.throws(
    () => rewrite({ messages: [{ role: "user", content: [text("inspect")] }] }, frames),
    /1 user messages where Pi's history has 2/,
  )

  assert.throws(
    () =>
      rewrite(
        {
          messages: [
            { role: "user", content: [text("inspect")] },
            { role: "user", content: [toolResult("t1", "result")] },
          ],
        },
        frames,
      ),
    /0 assistant messages where Pi's history has 1/,
  )

  assert.throws(
    () =>
      rewrite(
        {
          messages: [
            { role: "user", content: [text("inspect")] },
            { role: "assistant", content: [toolUse("t1")] },
            { role: "user", content: [toolResult("other", "result")] },
          ],
        },
        frames,
      ),
    /lost a tool_result block in user message 1/,
  )
})

test("injects Pi's system history at assistant boundaries with one system breakpoint", () => {
  const messages = [
    { role: "user", content: [text("first")] },
    { role: "assistant", content: [text("answer")] },
    { role: "user", content: [text("second")] },
  ]

  const rewritten = rewrite(
    {
      system: [
        { ...text("identity"), cache_control: breakpoint },
        { ...text("prompt"), cache_control: breakpoint },
      ],
      messages,
    },
    framesFor(messages),
    [
      {
        beforeAssistant: 0,
        content: [
          { type: "tool_addition", tool: { type: "tool_reference", name: "mcp__pi__beta" } },
        ],
      },
      {
        beforeAssistant: null,
        content: [
          { type: "tool_removal", tool: { type: "tool_reference", name: "mcp__pi__alpha" } },
        ],
      },
    ],
  )

  assert.deepEqual(
    rewritten.messages.map((message) => message.role),
    ["user", "system", "assistant", "user", "system"],
  )

  assert.deepEqual(withoutBreakpoints(rewritten.system), [text("identity"), text("prompt")])
  assert.equal(countBreakpoints(rewritten.system), 1)
  assert.deepEqual(lastBlock(rewritten.messages.at(-1)), {
    type: "tool_removal",
    tool: { type: "tool_reference", name: "mcp__pi__alpha" },
    cache_control: breakpoint,
  })
})

test("places message breakpoints at the previous query and the tail within Anthropic's limit", () => {
  const messages = [
    { role: "user", content: [text("one")] },
    { role: "assistant", content: [toolUse("t1")] },
    { role: "user", content: [toolResult("t1", "a")] },
    { role: "assistant", content: [toolUse("t2")] },
    { role: "user", content: [toolResult("t2", "b")] },
  ]

  const system = [text("billing"), { ...text("identity"), cache_control: breakpoint }]
  const both = rewrite({ system, messages }, framesFor(messages))

  assert.equal(countBreakpoints(both), 3)
  assert.equal(countBreakpoints(both.messages[2]), 1)
  assert.equal(countBreakpoints(both.messages[4]), 1)

  // Claude Code's own markers already use three of four breakpoints: only the tail gets one.
  const tools = [
    { name: "mcp__pi__read", input_schema: { type: "object" }, cache_control: breakpoint },
  ]

  const crowded = rewrite(
    { system: [...system, { ...text("prompt"), cache_control: breakpoint }], tools, messages },
    framesFor(messages),
  )

  assert.equal(countBreakpoints(crowded), 4)
  assert.equal(countBreakpoints(crowded.messages[2]), 0)
  assert.equal(countBreakpoints(crowded.messages[4]), 1)
})
