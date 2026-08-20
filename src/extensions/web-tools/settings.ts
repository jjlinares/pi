import {
	parsePublicHttpUrl,
	type PublicHttpUrl,
	type SearchProviderName,
	type WebFetchFormat,
	type WebToolsSettings,
} from "./types.ts";

export const WEB_FETCH_FORMATS = ["markdown", "text", "html"] as const satisfies readonly WebFetchFormat[];
export const SEARCH_PROVIDERS = ["brave"] as const satisfies readonly SearchProviderName[];

export const FETCH_TIMEOUT_SECONDS = {
	default: 30,
	min: 1,
	max: 120,
} as const;

export const SEARCH_TIMEOUT_SECONDS = {
	default: 25,
	min: 1,
	max: 120,
} as const;

export const SEARCH_MAX_RESULTS = {
	default: 8,
	min: 1,
	max: 20,
} as const;

export const FETCH_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
export const FETCH_MAX_REDIRECTS = 5;

export type ToolInputParseError =
	| { readonly _tag: "InvalidToolInput"; readonly message: string }
	| { readonly _tag: "InvalidToolField"; readonly field: string; readonly message: string }
	| { readonly _tag: "UnknownToolField"; readonly field: string };

const DEFAULTS = {
	fetchDefaultFormat: "markdown",
	fetchTimeoutSeconds: FETCH_TIMEOUT_SECONDS.default,
	fetchMaxResponseBytes: FETCH_MAX_RESPONSE_BYTES,
	fetchBlockPrivateHosts: true,
	fetchMaxRedirects: FETCH_MAX_REDIRECTS,
	fetchFallbackUserAgent: "pi-web-tools",
	searchProvider: "brave",
	searchEndpoint: "https://api.search.brave.com/res/v1/web/search",
	searchTimeoutSeconds: SEARCH_TIMEOUT_SECONDS.default,
	searchDefaultMaxResults: SEARCH_MAX_RESULTS.default,
} as const;

/** Clamp a finite number to an inclusive integer range. */
export function clampInteger(
	value: number,
	bounds: { readonly min: number; readonly max: number; readonly fallback: number },
): number {
	if (!Number.isFinite(value)) {
		return bounds.fallback;
	}

	return Math.max(bounds.min, Math.min(bounds.max, Math.round(value)));
}

export function parseOnOff(value: string | undefined, fallback: boolean): boolean {
	if (!value) return fallback;
	const normalized = value.trim().toLowerCase();
	if (normalized === "on") return true;
	if (normalized === "off") return false;
	return fallback;
}

export function parseIntegerSetting(
	value: string | undefined,
	fallback: number,
	options: { min?: number; max?: number } = {},
): number {
	const parsed = Number.parseInt(value?.trim() ?? "", 10);
	if (!Number.isFinite(parsed)) return fallback;
	if (options.min !== undefined && parsed < options.min) return fallback;
	if (options.max !== undefined && parsed > options.max) return fallback;
	return parsed;
}

export function parseEnumSetting<T extends string>(
	value: string | undefined,
	allowed: readonly T[],
	fallback: T,
): T {
	if (!value) return fallback;
	const normalized = value.trim() as T;
	return allowed.includes(normalized) ? normalized : fallback;
}

/** Return web-tools settings from environment variables, with safe defaults. */
export function getWebToolsSettings(): WebToolsSettings {
	const searchEndpoint = parseSearchEndpoint(process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT);
	const apiKey = process.env.PI_WEB_TOOLS_BRAVE_API_KEY?.trim() ?? "";

	return {
		fetch: {
			defaultFormat: parseEnumSetting(
				process.env.PI_WEB_TOOLS_FETCH_FORMAT,
				WEB_FETCH_FORMATS,
				DEFAULTS.fetchDefaultFormat,
			),
			timeoutSeconds: parseIntegerSetting(
				process.env.PI_WEB_TOOLS_FETCH_TIMEOUT_SECONDS,
				DEFAULTS.fetchTimeoutSeconds,
				{ min: FETCH_TIMEOUT_SECONDS.min, max: FETCH_TIMEOUT_SECONDS.max },
			),
			maxResponseBytes: parseIntegerSetting(
				process.env.PI_WEB_TOOLS_FETCH_MAX_RESPONSE_BYTES,
				DEFAULTS.fetchMaxResponseBytes,
				{ min: 1 },
			),
			blockPrivateHosts: parseOnOff(
				process.env.PI_WEB_TOOLS_FETCH_BLOCK_PRIVATE_HOSTS,
				DEFAULTS.fetchBlockPrivateHosts,
			),
			maxRedirects: parseIntegerSetting(
				process.env.PI_WEB_TOOLS_FETCH_MAX_REDIRECTS,
				DEFAULTS.fetchMaxRedirects,
				{ min: 0, max: 20 },
			),
			fallbackUserAgent: process.env.PI_WEB_TOOLS_FETCH_FALLBACK_USER_AGENT?.trim() || DEFAULTS.fetchFallbackUserAgent,
		},
		search: {
			enabled: Boolean(apiKey) && parseOnOff(process.env.PI_WEB_TOOLS_SEARCH_ENABLED, true),
			provider: DEFAULTS.searchProvider,
			endpoint: searchEndpoint,
			apiKey,
			timeoutSeconds: parseIntegerSetting(
				process.env.PI_WEB_TOOLS_SEARCH_TIMEOUT_SECONDS,
				DEFAULTS.searchTimeoutSeconds,
				{ min: SEARCH_TIMEOUT_SECONDS.min, max: SEARCH_TIMEOUT_SECONDS.max },
			),
			defaultMaxResults: parseIntegerSetting(
				process.env.PI_WEB_TOOLS_SEARCH_MAX_RESULTS,
				DEFAULTS.searchDefaultMaxResults,
				{ min: SEARCH_MAX_RESULTS.min, max: SEARCH_MAX_RESULTS.max },
			),
		},
	};
}

function parseSearchEndpoint(input: string | undefined): PublicHttpUrl {
	const parsed = parsePublicHttpUrl(input ?? DEFAULTS.searchEndpoint);
	if (parsed._tag === "ok" && new URL(parsed.value).protocol === "https:") {
		return parsed.value;
	}
	return mustParsePublicHttpUrl(DEFAULTS.searchEndpoint);
}

function mustParsePublicHttpUrl(input: string): PublicHttpUrl {
	const parsed = parsePublicHttpUrl(input);
	if (parsed._tag === "err") {
		throw new Error("Invalid bundled web-tools search endpoint fallback");
	}
	return parsed.value;
}
