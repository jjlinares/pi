# claude-code

Pi provider (`claude-code/*`) that serves Claude Pro or Max models through the local Claude Code CLI. Claude Code only talks to the model; Pi keeps the conversation and runs every tool.

This is a temporary copy of Mel's provider (`packages/claude-code` in [jjlinares/mel](https://github.com/jjlinares/mel) at commit `6bc24497077605bb24c12b438775466a7023f8da`). Mel's `docs/claude-code.md` and ADR 0001 explain the design. The code derives from [earendil-works/pi-claude-code](https://github.com/earendil-works/pi-claude-code) (MIT, see [LICENSE](LICENSE)).

## Requirements

- `claude` on `PATH`, logged in with `claude auth login`. Without a login, the provider lists no models.
- `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_FOUNDRY_API_KEY`, and the Bedrock, Vertex, and Foundry flags are refused. `ANTHROPIC_API_KEY` never reaches Claude Code.

## Billing

Requests count against the Claude plan through `claude -p`. A turn charged to usage credits fails with a non-retryable `Claude Code billing` error, and Anthropic's usage-credit rejections are reworded the same way. Turn off usage credits at claude.ai/settings/usage to stay on plan limits only.

## Differences from Mel's copy

- Interrupted turns: aborted and failed assistant messages are skipped, and a tool call without a result gets an error result, as pi-ai's `transformMessages` does for built-in providers. Without this, Esc during a tool call breaks every later request with a 400.
- Models declare no prompt cache lifetime, so Pi's cache warmer (`cacheWarming`, default `idle`) never replays idle sessions through Claude Code.

## Checks

```bash
npm run check
```

These tests use a fake Claude, so they cannot notice the real CLI changing. The provider rests on undocumented Claude Code behavior: which replayed messages keep their thinking, which message shapes survive replay, and how a charged or cut-off stream surfaces. After updating Claude Code, or when a turn fails with "Claude Code dropped replayed thinking", run Mel's contract probe (`packages/claude-code/probes/claude-code-contract.ts`, described in Mel's `docs/claude-code.md`) with its `../src` imports pointed at this extension's `src`. It uses the installed `claude` and a fake upstream, so it spends no quota.
