import { createWebFetchTool } from "./webfetch.ts";
import { createWebSearchTool } from "./websearch.ts";

interface ExtensionAPI {
	registerTool(tool: unknown): void;
}

export default function webToolsExtension(pi: ExtensionAPI) {
	pi.registerTool(createWebFetchTool());
	pi.registerTool(createWebSearchTool());
}
