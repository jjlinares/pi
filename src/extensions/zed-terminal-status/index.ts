import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 120;

function enabled(): boolean {
	return process.env.PI_ZED_TERMINAL_STATUS !== "0";
}

function title(pi: ExtensionAPI, state: "idle" | "working", frame?: string): string {
	const cwd = path.basename(process.cwd());
	const session = pi.getSessionName();
	const prefix = state === "working" ? frame ?? SPINNER_FRAMES[0] : "○";
	const base = session ? `π - ${session} - ${cwd}` : `π - ${cwd}`;
	return `${prefix} ${base}`;
}

export default function registerZedTerminalStatus(pi: ExtensionAPI): void {
	let timer: ReturnType<typeof setInterval> | undefined;
	let frameIndex = 0;

	function stopSpinner(): void {
		if (timer) clearInterval(timer);
		timer = undefined;
		frameIndex = 0;
	}

	function setIdle(ctx: ExtensionContext): void {
		if (!enabled()) return;
		stopSpinner();
		ctx.ui.setTitle(title(pi, "idle"));
	}

	function setWorking(ctx: ExtensionContext): void {
		if (!enabled()) return;
		stopSpinner();
		ctx.ui.setTitle(title(pi, "working", SPINNER_FRAMES[0]));
		frameIndex = 1;
		timer = setInterval(() => {
			const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
			ctx.ui.setTitle(title(pi, "working", frame));
			frameIndex++;
		}, SPINNER_INTERVAL_MS);
	}

	pi.on("session_start", async (_event, ctx) => {
		setIdle(ctx);
	});

	pi.on("agent_start", async (_event, ctx) => {
		setWorking(ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		setIdle(ctx);
		if (enabled()) process.stdout.write("\x07");
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		setIdle(ctx);
	});
}
