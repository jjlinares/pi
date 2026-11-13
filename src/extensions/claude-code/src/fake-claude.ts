import { chmod, mkdtemp, realpath, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { TestContext } from "node:test"

const prelude = `
import readline from "node:readline"

if (process.argv.includes("auth") && process.argv.includes("status")) {
  console.log(JSON.stringify({ loggedIn: true, authMethod: "claude.ai", subscriptionType: "max" }))
  process.exit(0)
}

const emit = (event) => console.log(JSON.stringify(event))
const frames = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
const usage = { input_tokens: 3, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
// Real Claude Code echoes a frame's uuid on that frame's result.
const echo = (frame) => (frame.uuid ? { user_message_uuids: [frame.uuid] } : {})

/** Stream one text reply and its result, as Claude Code does without a relayed request. */
function reply(frame, id, text, extra = {}) {
  for (const event of [
    { type: "message_start", message: { id, role: "assistant", content: [], usage } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage },
    { type: "message_stop" },
  ])
    emit({ type: "stream_event", event })

  emit({ type: "assistant", message: { id, role: "assistant", content: [{ type: "text", text }], stop_reason: "end_turn", usage } })
  for (const event of extra.before ?? []) emit(event)
  emit({ type: "result", subtype: "success", is_error: false, usage, ...echo(frame) })
}
`

/**
 * Write an executable stand-in for the Claude Code CLI and return its path. It answers `claude auth status` as a
 * logged-in Max account; `body` handles stream-json with `frames`, `emit`, `reply`, `echo`, and `usage`.
 */
export async function fakeClaude(t: TestContext, body: string): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "mel-fake-claude-")))
  t.after(() => rm(root, { recursive: true, force: true }))
  const command = join(root, "claude.mjs")
  await writeFile(command, `#!/usr/bin/env node\n${prelude}\n${body}\n`, "utf8")
  await chmod(command, 0o755)

  return command
}

export const textFrame = (text: string, shouldQuery = true) => ({
  type: "user" as const,
  message: { role: "user" as const, content: [{ type: "text", text }] },
  ...(!shouldQuery && { shouldQuery: false as const }),
})
