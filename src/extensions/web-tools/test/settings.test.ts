import test from "node:test";
import assert from "node:assert/strict";
import {
	getWebToolsSettings,
	parseEnumSetting,
	parseIntegerSetting,
	parseOnOff,
} from "../settings.ts";

test("parseOnOff accepts on/off and falls back safely", () => {
	assert.equal(parseOnOff("on", false), true);
	assert.equal(parseOnOff("off", true), false);
	assert.equal(parseOnOff("bogus", true), true);
	assert.equal(parseOnOff(undefined, false), false);
});

test("parseIntegerSetting validates integer ranges", () => {
	assert.equal(parseIntegerSetting("30", 10, { min: 1, max: 120 }), 30);
	assert.equal(parseIntegerSetting("0", 10, { min: 1, max: 120 }), 10);
	assert.equal(parseIntegerSetting("121", 10, { min: 1, max: 120 }), 10);
	assert.equal(parseIntegerSetting("not-a-number", 10, { min: 1, max: 120 }), 10);
});

test("parseEnumSetting validates allowed values", () => {
	assert.equal(parseEnumSetting("markdown", ["markdown", "text", "html"], "text"), "markdown");
	assert.equal(parseEnumSetting("pdf", ["markdown", "text", "html"], "text"), "text");
	assert.equal(parseEnumSetting(undefined, ["markdown", "text", "html"], "text"), "text");
});

test("getWebToolsSettings requires HTTPS search endpoints", () => {
	const previousEndpoint = process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT;
	try {
		process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT = "http://search.example.test/api";
		assert.equal(getWebToolsSettings().search.endpoint, "https://api.search.brave.com/res/v1/web/search");

		process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT = "https://search.example.test/api";
		assert.equal(getWebToolsSettings().search.endpoint, "https://search.example.test/api");
	} finally {
		restoreEnv("PI_WEB_TOOLS_SEARCH_ENDPOINT", previousEndpoint);
	}
});

test("getWebToolsSettings enables search only with a Brave API key by default", () => {
	const previousApiKey = process.env.PI_WEB_TOOLS_BRAVE_API_KEY;
	const previousEndpoint = process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT;
	const previousEnabled = process.env.PI_WEB_TOOLS_SEARCH_ENABLED;
	try {
		delete process.env.PI_WEB_TOOLS_BRAVE_API_KEY;
		delete process.env.PI_WEB_TOOLS_SEARCH_ENDPOINT;
		delete process.env.PI_WEB_TOOLS_SEARCH_ENABLED;
		assert.equal(getWebToolsSettings().search.enabled, false);

		process.env.PI_WEB_TOOLS_SEARCH_ENABLED = "on";
		assert.equal(getWebToolsSettings().search.enabled, false);

		process.env.PI_WEB_TOOLS_BRAVE_API_KEY = "test-key";
		delete process.env.PI_WEB_TOOLS_SEARCH_ENABLED;
		assert.equal(getWebToolsSettings().search.enabled, true);
		assert.equal(getWebToolsSettings().search.apiKey, "test-key");

		process.env.PI_WEB_TOOLS_SEARCH_ENABLED = "off";
		assert.equal(getWebToolsSettings().search.enabled, false);
	} finally {
		restoreEnv("PI_WEB_TOOLS_BRAVE_API_KEY", previousApiKey);
		restoreEnv("PI_WEB_TOOLS_SEARCH_ENDPOINT", previousEndpoint);
		restoreEnv("PI_WEB_TOOLS_SEARCH_ENABLED", previousEnabled);
	}
});

function restoreEnv(name: string, value: string | undefined): void {
	if (value === undefined) {
		delete process.env[name];
		return;
	}
	process.env[name] = value;
}
