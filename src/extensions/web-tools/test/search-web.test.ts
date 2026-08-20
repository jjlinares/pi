import test from "node:test";
import assert from "node:assert/strict";
import { ok, type Result } from "../result.ts";
import { SearchWeb } from "../search-web.ts";
import { parsePublicHttpUrl, parseSearchQuery, type WebToolsSettings } from "../types.ts";
import type { NormalizedSearchResult, SearchProvider, SearchProviderError, SearchProviderRequest } from "../providers/types.ts";

const endpoint = parsePublicHttpUrl("https://example.test/mcp");
assert.equal(endpoint._tag, "ok");

const testSearchSettings: WebToolsSettings["search"] = {
	enabled: true,
	provider: "brave",
	endpoint: endpoint.value,
	apiKey: "test-key",
	timeoutSeconds: 25,
	defaultMaxResults: 8,
};

class FakeSearchProvider implements SearchProvider {
	readonly name = "brave" as const;
	readonly requests: SearchProviderRequest[] = [];

	constructor(private readonly response: Result<readonly NormalizedSearchResult[], SearchProviderError>) {}

	async search(
		input: SearchProviderRequest,
		_options?: { readonly signal?: AbortSignal },
	): Promise<Result<readonly NormalizedSearchResult[], SearchProviderError>> {
		this.requests.push(input);
		return this.response;
	}
}

test("SearchWeb returns provider results with query metadata", async () => {
	const query = parseSearchQuery("example");
	const resultUrl = parsePublicHttpUrl("https://example.com/");
	assert.equal(query._tag, "ok");
	assert.equal(resultUrl._tag, "ok");
	const exampleResult: NormalizedSearchResult = {
		title: "Example Domain",
		url: resultUrl.value,
		snippet: "Documentation-safe example domain.",
	};
	const provider = new FakeSearchProvider(ok([exampleResult]));
	const service = new SearchWeb({ provider, settings: testSearchSettings });

	const result = await service.search({ query: query.value, maxResults: 8 });

	assert.equal(result._tag, "ok");
	assert.equal(result.value.provider, "brave");
	assert.equal(result.value.query, "example");
	assert.equal(result.value.results.length, 1);
});

test("SearchWeb reports missing API key without calling provider", async () => {
	const query = parseSearchQuery("example");
	assert.equal(query._tag, "ok");
	const provider = new FakeSearchProvider(ok([]));
	const service = new SearchWeb({
		provider,
		settings: { ...testSearchSettings, enabled: false, apiKey: "" },
	});

	const result = await service.search({ query: query.value, maxResults: 8 });

	assert.deepEqual(result, { _tag: "err", error: { _tag: "SearchDisabled", reason: "MissingApiKey" } });
	assert.deepEqual(provider.requests, []);
});

test("SearchWeb reports explicit disabled setting without calling provider", async () => {
	const query = parseSearchQuery("example");
	assert.equal(query._tag, "ok");
	const provider = new FakeSearchProvider(ok([]));
	const service = new SearchWeb({
		provider,
		settings: { ...testSearchSettings, enabled: false, apiKey: "test-key" },
	});

	const result = await service.search({ query: query.value, maxResults: 8 });

	assert.deepEqual(result, { _tag: "err", error: { _tag: "SearchDisabled", reason: "DisabledBySetting" } });
	assert.deepEqual(provider.requests, []);
});
