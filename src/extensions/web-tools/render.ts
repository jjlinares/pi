import { keyHint } from "./pi-compat.ts";

export function getTextContent(content: Array<{ type: string; text?: string }> | undefined): string {
	if (!content) return "";
	return content
		.filter((item): item is { type: "text"; text: string } => item.type === "text" && typeof item.text === "string")
		.map((item) => item.text)
		.join("\n");
}

export function appendExpandedPreview(
	base: string,
	text: string,
	theme: {
		fg: (name: string, value: string) => string;
	},
	options: { maxLines?: number; maxColumns?: number } = {},
): string {
	const maxLines = options.maxLines ?? 12;
	const maxColumns = options.maxColumns ?? 200;
	const lines = text.split("\n");
	for (const line of lines.slice(0, maxLines)) {
		base += `\n${theme.fg("dim", sanitizePreviewText(line).slice(0, maxColumns))}`;
	}
	if (lines.length > maxLines) {
		base += `\n${theme.fg("muted", "...")}`;
	}
	return base;
}

export function sanitizePreviewText(text: string): string {
	return text.replace(ANSI_ESCAPE_RE, "").replace(CONTROL_RE, "");
}

export function appendExpandHint(base: string, expanded: boolean): string {
	if (expanded) return base;
	return `${base} ${keyHint("app.tools.expand" as any, "for details")}`;
}

const ANSI_ESCAPE_RE = /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
const CONTROL_RE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;
