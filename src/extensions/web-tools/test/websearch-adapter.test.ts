import test from "node:test";
import assert from "node:assert/strict";
import { err, ok, type Result } from "../result.ts";
import { SearchWeb } from "../search-web.ts";
import { createWebSearchTool } from "../websearch.ts";
import { parsePublicHttpUrl } from "../types.ts";
import type { WebToolsSettings } from "../types.ts";
import type { ToolOutputStore, ToolOutputStoreError } from "../tool-output.ts";
import type { NormalizedSearchResult, SearchProvider, SearchProviderError, SearchProviderRequest } from "../providers/types.ts";

const endpoint = parsePublicHttpUrl("https://example.test/mcp");
assert.equal(endpoint._tag, "ok");

const settings: WebToolsSettings = {
	fetch: {
		defaultFormat: "markdown",
		timeoutSeconds: 30,
		maxResponseBytes: 5 * 1024 * 1024,
		blockPrivateHosts: true,
		maxRedirects: 5,
		fallbackUserAgent: "pi-web-tools",
	},
	search: {
		enabled: true,
		provider: "brave",
		endpoint: endpoint.value,
		apiKey: "test-key",
		timeoutSeconds: 25,
		defaultMaxResults: 8,
	},
};

class FakeProvider implements SearchProvider {
	readonly name = "brave" as const;

	constructor(private readonly response: Result<readonly NormalizedSearchResult[], SearchProviderError>) {}

	async search(
		_input: SearchProviderRequest,
		_options?: { readonly signal?: AbortSignal },
	): Promise<Result<readonly NormalizedSearchResult[], SearchProviderError>> {
		return this.response;
	}
}

class UnusedOutputStore implements ToolOutputStore {
	async writeTextFile(
		_prefix: string,
		_fileName: string,
		_content: string,
	): Promise<Result<string, ToolOutputStoreError>> {
		return ok("/tmp/unused.txt");
	}
}

test("websearch execute throws safe message for provider protocol failures", async () => {
	const searchWeb = new SearchWeb({
		settings: settings.search,
		provider: new FakeProvider(
			err({
				_tag: "SearchProviderProtocolInvalid",
				provider: "brave",
				reason: "missing result content raw details",
			}),
		),
	});
	const tool = createWebSearchTool({ settings, searchWeb, outputStore: new UnusedOutputStore() });

	await assert.rejects(
		tool.execute("id", { query: "example" }),
		/Search provider returned an invalid response/,
	);
});

test("websearch execute tells users to set the Brave API key when missing", async () => {
	const disabledSettings: WebToolsSettings = {
		...settings,
		search: { ...settings.search, enabled: false, apiKey: "" },
	};
	const searchWeb = new SearchWeb({
		settings: disabledSettings.search,
		provider: new FakeProvider(ok([])),
	});
	const tool = createWebSearchTool({ settings: disabledSettings, searchWeb, outputStore: new UnusedOutputStore() });

	await assert.rejects(
		tool.execute("id", { query: "example" }),
		/PI_WEB_TOOLS_BRAVE_API_KEY is not set/,
	);
});
