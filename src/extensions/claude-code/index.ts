import type { Provider } from "@earendil-works/pi-ai"

import { createClaudeCode } from "./src/index.js"

interface ExtensionAPI {
  registerProvider(provider: Provider): void
  on(event: "session_shutdown", handler: () => Promise<void>): void
}

export default function claudeCodeExtension(pi: ExtensionAPI): void {
  const claudeCode = createClaudeCode()
  pi.registerProvider(claudeCode.provider)
  pi.on("session_shutdown", () => claudeCode.close())
}
