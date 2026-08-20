import { decodeTextBuffer, isAbortError, parseContentType, readBodyWithLimit } from "../network.ts";
import { err, ok, type Result } from "../result.ts";
import { parsePublicHttpUrl, type PublicHttpUrl } from "../types.ts";
import type { NormalizedSearchResult, SearchProvider, SearchProviderError, SearchProviderRequest } from "./types.ts";

export const BRAVE_SEARCH_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
export const MAX_SEARCH_RESPONSE_BYTES = 1 * 1024 * 1024;

export interface BraveSearchProviderOptions {
	readonly endpoint: PublicHttpUrl;
	readonly apiKey: string;
}

interface BraveSearchResponse {
	readonly web?: {
		readonly results?: unknown[];
	};
}

export class BraveSearchProvider implements SearchProvider {
	readonly name = "brave" as const;

	constructor(private readonly options: BraveSearchProviderOptions) {}

	/** Search Brave and return normalized public-web results. */
	async search(
		input: SearchProviderRequest,
		options: { readonly signal?: AbortSignal } = {},
	): Promise<Result<readonly NormalizedSearchResult[], SearchProviderError>> {
		const url = new URL(this.options.endpoint);
		url.searchParams.set("q", input.query);
		url.searchParams.set("count", String(input.maxResults));

		let response: Response;
		try {
			response = await fetch(url, {
				method: "GET",
				headers: {
					accept: "application/json",
					"x-subscription-token": this.options.apiKey,
				},
				redirect: "manual",
				signal: options.signal,
			});
		} catch (cause: unknown) {
			if (options.signal?.aborted || isAbortError(cause)) {
				return err({ _tag: "SearchProviderCancelled", provider: this.name, cause });
			}
			return err({ _tag: "SearchProviderUnavailable", provider: this.name, cause });
		}

		if (response.status < 200 || response.status >= 300) {
			await response.body?.cancel().catch(() => undefined);
			return err({ _tag: "SearchProviderStatusRejected", provider: this.name, status: response.status });
		}

		const contentLength = response.headers.get("content-length");
		if (contentLength) {
			const declaredBytes = Number.parseInt(contentLength, 10);
			if (Number.isFinite(declaredBytes) && declaredBytes > MAX_SEARCH_RESPONSE_BYTES) {
				await response.body?.cancel().catch(() => undefined);
				return err({ _tag: "SearchProviderResponseTooLarge", provider: this.name, maxBytes: MAX_SEARCH_RESPONSE_BYTES });
			}
		}

		let bodyText: string;
		try {
			const parsedContentType = parseContentType(response.headers.get("content-type"));
			const body = await readBodyWithLimit(response, MAX_SEARCH_RESPONSE_BYTES, options.signal);
			bodyText = decodeTextBuffer(body.buffer, parsedContentType.charset).text;
		} catch (cause: unknown) {
			if (options.signal?.aborted || isAbortError(cause)) {
				return err({ _tag: "SearchProviderCancelled", provider: this.name, cause });
			}
			if (cause instanceof Error && cause.message.startsWith("Response too large")) {
				return err({ _tag: "SearchProviderResponseTooLarge", provider: this.name, maxBytes: MAX_SEARCH_RESPONSE_BYTES });
			}
			return err({ _tag: "SearchProviderUnavailable", provider: this.name, cause });
		}

		let payload: unknown;
		try {
			payload = JSON.parse(bodyText);
		} catch {
			return err({ _tag: "SearchProviderProtocolInvalid", provider: this.name, reason: "Invalid JSON response" });
		}

		const results = parseBraveSearchResults(payload);
		if (results._tag === "err") {
			return results;
		}
		return ok(results.value.slice(0, input.maxResults));
	}
}

export function parseBraveSearchResults(
	payload: unknown,
): Result<readonly NormalizedSearchResult[], SearchProviderError> {
	if (!isRecord(payload)) {
		return err({ _tag: "SearchProviderProtocolInvalid", provider: "brave", reason: "Expected object response" });
	}

	const response = payload as BraveSearchResponse;
	const rawResults = response.web?.results;
	if (!Array.isArray(rawResults)) {
		return hasEmptyBraveResultBuckets(payload)
			? ok([])
			: err({ _tag: "SearchProviderNoRecognizedResults", provider: "brave" });
	}

	const results: NormalizedSearchResult[] = [];
	for (const item of rawResults) {
		const parsed = parseBraveSearchResult(item);
		if (parsed) results.push(parsed);
	}

	if (rawResults.length > 0 && results.length === 0) {
		return err({ _tag: "SearchProviderNoRecognizedResults", provider: "brave" });
	}

	return ok(results);
}

function hasEmptyBraveResultBuckets(payload: Record<string, unknown>): boolean {
	const mixed = payload.mixed;
	if (!isRecord(mixed)) return false;
	return ["main", "top", "side"].every((bucket) => Array.isArray(mixed[bucket]) && mixed[bucket].length === 0);
}

function parseBraveSearchResult(item: unknown): NormalizedSearchResult | undefined {
	if (!isRecord(item)) return undefined;
	if (typeof item.title !== "string" || typeof item.url !== "string") return undefined;

	const url = parsePublicHttpUrl(item.url);
	if (url._tag === "err") return undefined;

	return {
		title: cleanText(item.title),
		url: url.value,
		snippet: typeof item.description === "string" ? cleanText(item.description) : undefined,
		source: getSource(item, url.value),
	};
}

function getSource(item: Record<string, unknown>, url: PublicHttpUrl): string | undefined {
	const profile = item.profile;
	if (isRecord(profile) && typeof profile.name === "string" && profile.name.trim()) {
		return cleanText(profile.name);
	}
	try {
		return new URL(url).hostname;
	} catch {
		return undefined;
	}
}

function cleanText(value: string): string {
	return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
