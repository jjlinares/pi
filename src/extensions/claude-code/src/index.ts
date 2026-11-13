import { createProvider, type Provider } from "@earendil-works/pi-ai"

import { ClaudeCli, type ClaudeCliOptions } from "./cli.js"
import { ModelCatalog, providerId } from "./model-catalog.js"
import { createStream } from "./stream.js"
import { ClaudeWorkers } from "./workers.js"

export interface ClaudeCode {
  /** Pi provider for Claude Pro or Max models, routed through the Claude Code CLI. */
  readonly provider: Provider
  /** Close warm Claude Code workers. */
  close(): Promise<void>
}

/**
 * Claude subscription models through the local Claude Code CLI. Claude Code only talks to the model; Pi keeps the
 * conversation and runs every tool. Models are offered only while `claude auth status` reports a login, and Claude
 * Code owns that login: nothing here reads or stores its credentials. The catalog is purely discovered, so models
 * appear once a refresh restores a stored list or Claude Code answers discovery.
 */
export function createClaudeCode(options: ClaudeCliOptions = {}): ClaudeCode {
  const cli = new ClaudeCli(options)
  const catalog = new ModelCatalog()
  const workers = new ClaudeWorkers(cli)
  const stream = createStream(workers, catalog)
  let discovered: ReadonlySet<string> | undefined

  const provider = createProvider({
    id: providerId,
    name: "Claude Code",
    baseUrl: "process://claude-code",
    auth: {
      apiKey: {
        name: "Claude Code login",
        async check({ signal }) {
          const status = await cli.status(signal)

          return status.loggedIn
            ? { type: "api_key", source: `Claude Code ${status.plan ?? "login"}` }
            : undefined
        },
        async resolve({ signal }) {
          signal.throwIfAborted()

          // Workers authenticate through Claude Code; Pi only needs a placeholder.
          return { auth: { apiKey: "claude-code" }, source: "Claude Code" }
        },
      },
    },
    models: [],
    async fetchModels({ signal }) {
      const models = (await cli.discoverModels(signal)).map((info) => catalog.add(info))
      discovered = new Set(models.map((model) => model.id))

      return models
    },
    filterModels: (models) =>
      discovered ? models.filter((model) => discovered?.has(model.id)) : models,
    api: { stream, streamSimple: stream },
  })

  return { provider, close: () => workers.close() }
}
