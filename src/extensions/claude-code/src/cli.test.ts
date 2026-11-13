import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import test from "node:test"

import { ClaudeCli } from "./cli.js"
import { fakeClaude } from "./fake-claude.js"

const privacyFlags = [
  "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC",
  "DISABLE_TELEMETRY",
  "DO_NOT_TRACK",
  "DISABLE_GROWTHBOOK",
]

const safetyFlags = [
  "DISABLE_AUTOUPDATER",
  "DISABLE_FEEDBACK_COMMAND",
  "CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL",
  "DISABLE_ERROR_REPORTING",
]

test("discovery serves the full catalog unless the user opted out of feature flags", async (t) => {
  const command = await fakeClaude(
    t,
    `
import { writeFileSync } from "node:fs"

const names = ${JSON.stringify([...privacyFlags, ...safetyFlags])}
writeFileSync(process.env.ENVIRONMENT_LOG, JSON.stringify(Object.fromEntries(names.map((name) => [name, process.env[name]]))))

for await (const line of frames) {
  const frame = JSON.parse(line)
  if (frame.type !== "control_request") continue

  const privacy = process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC || process.env.DISABLE_TELEMETRY ||
    process.env.DISABLE_GROWTHBOOK || process.env.DO_NOT_TRACK === "1"
  const ids = privacy ? ["claude-opus-5-5"] : ["claude-opus-5-5", "claude-mythos-5-1"]

  emit({ type: "control_response", response: {
    subtype: "success", request_id: frame.request_id,
    response: { models: ids.map((id) => ({ value: id, resolvedModel: id, displayName: id, description: "Test model" })) },
  } })
}
`,
  )

  const log = join(command, "..", "environment.json")
  const base = Object.fromEntries(privacyFlags.map((name) => [name, undefined]))

  const discover = async (env: Record<string, string | undefined>) => {
    const cli = new ClaudeCli({
      command,
      env: { ...process.env, ...base, ENVIRONMENT_LOG: log, ...env },
    })

    const models = await cli.discoverModels(undefined, 5_000)
    const seen: unknown = JSON.parse(await readFile(log, "utf8"))

    return {
      values: models.map((model) => model.value),
      env: new Map(Object.entries(Object(seen))),
    }
  }

  const open = await discover({})

  assert.ok(open.values.includes("claude-mythos-5-1"))

  for (const name of privacyFlags) assert.equal(open.env.get(name), undefined, name)

  for (const name of safetyFlags) assert.equal(open.env.get(name), "1", name)

  for (const name of privacyFlags) {
    const optedOut = await discover({ [name]: "1" })

    assert.equal(optedOut.values.includes("claude-mythos-5-1"), false, name)
    assert.equal(optedOut.env.get(name), "1")
  }

  // Claude Code treats any non-empty value as set, so the user's value passes through verbatim.
  assert.equal((await discover({ DISABLE_TELEMETRY: "0" })).env.get("DISABLE_TELEMETRY"), "0")
})

test("status reports the login and plan, and a missing CLI", async (t) => {
  const command = await fakeClaude(t, "")

  assert.deepEqual(await new ClaudeCli({ command }).status(), {
    loggedIn: true,
    plan: "max",
    detail: undefined,
  })

  const missing = await new ClaudeCli({ command: join(command, "..", "missing") }).status()

  assert.equal(missing.loggedIn, false)
  assert.match(missing.detail ?? "", /not installed/)
})
