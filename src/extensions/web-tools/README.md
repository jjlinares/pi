# web-tools

Pi extension that registers two public-web tools:

- `webfetch` — fetch one public URL as markdown, text, html, or an inline raster image
- `websearch` — search the public web for current information and candidate URLs

## Tools

### `webfetch`

Parameters:

- `url` — required
- `format` — optional: `markdown`, `text`, `html`
- `timeout` — optional timeout in seconds, clamped to `1..120`

Current defaults:

- `defaultFormat`: `markdown`
- `timeoutSeconds`: `30`
- `maxResponseBytes`: `5 MB`
- `blockPrivateHosts`: `true`
- `maxRedirects`: `5`
- `fallbackUserAgent`: `pi-web-tools`

Behavior notes:

- only `http://` and `https://` URLs are supported
- URL userinfo credentials (`https://user:pass@example.com`) are rejected and redacted in diagnostics
- private/local hosts and IPs are blocked by default
- raster images (`png`, `jpeg`, `gif`, `webp`) are returned inline as images
- HTML is converted to markdown or text when requested
- markdown HTML fetches include best-effort Defuddle metadata in `details.metadata`
- binary content is rejected
- if a site returns `403` with `cf-mitigated: challenge`, the tool retries with the fallback user agent

### `websearch`

Parameters:

- `query` — required
- `maxResults` — optional, clamped to `1..20`

Current defaults:

- `enabled`: `true` only when `PI_WEB_TOOLS_BRAVE_API_KEY` is set; otherwise `false`
- `provider`: `brave`
- `endpoint`: Brave Search API endpoint, overridable with `PI_WEB_TOOLS_SEARCH_ENDPOINT`
- `timeoutSeconds`: `25`
- `defaultMaxResults`: `8`

Behavior notes:

- uses Brave Search API (`https://api.search.brave.com/res/v1/web/search` by default)
- sends `X-Subscription-Token` from `PI_WEB_TOOLS_BRAVE_API_KEY`
- search responses are limited to `1 MB`

## Configuration

The extension has an internal settings shape:

```ts
{
  fetch: {
    defaultFormat: "markdown" | "text" | "html";
    timeoutSeconds: number;
    maxResponseBytes: number;
    blockPrivateHosts: boolean;
    maxRedirects: number;
    fallbackUserAgent: string;
  };
  search: {
    enabled: boolean;
    provider: "brave";
    endpoint: PublicHttpUrl;
    apiKey: string;
    timeoutSeconds: number;
    defaultMaxResults: number;
  };
}
```

Configuration comes from environment variables:

| Variable | Values |
| --- | --- |
| `PI_WEB_TOOLS_FETCH_FORMAT` | `markdown`, `text`, `html` |
| `PI_WEB_TOOLS_FETCH_TIMEOUT_SECONDS` | `1..120` |
| `PI_WEB_TOOLS_FETCH_MAX_RESPONSE_BYTES` | bytes |
| `PI_WEB_TOOLS_FETCH_BLOCK_PRIVATE_HOSTS` | `on`, `off` |
| `PI_WEB_TOOLS_FETCH_MAX_REDIRECTS` | `0..20` |
| `PI_WEB_TOOLS_FETCH_FALLBACK_USER_AGENT` | user-agent string |
| `PI_WEB_TOOLS_BRAVE_API_KEY` | Brave Search API key |
| `PI_WEB_TOOLS_SEARCH_ENDPOINT` | optional Brave-compatible HTTPS endpoint override |
| `PI_WEB_TOOLS_SEARCH_ENABLED` | `on`, `off` |
| `PI_WEB_TOOLS_SEARCH_TIMEOUT_SECONDS` | `1..120` |
| `PI_WEB_TOOLS_SEARCH_MAX_RESULTS` | `1..20` |

Per-call overrides still work for `webfetch.format`, `webfetch.timeout`, and `websearch.maxResults`.

## Source of truth

- extension entry: `pi/extensions/web-tools/index.ts`
- settings/defaults: `pi/extensions/web-tools/settings.ts`
- fetch Pi adapter: `pi/extensions/web-tools/webfetch.ts`
- fetch service: `pi/extensions/web-tools/fetch-page.ts`
- public web adapter: `pi/extensions/web-tools/network.ts`
- search Pi adapter: `pi/extensions/web-tools/websearch.ts`
- search service: `pi/extensions/web-tools/search-web.ts`
- Brave provider adapter: `pi/extensions/web-tools/providers/brave.ts`
- tool output projection: `pi/extensions/web-tools/tool-output.ts`
