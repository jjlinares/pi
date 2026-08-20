import type { NotifyMode } from "./core.ts";
import type { ChildSnapshot } from "./read-model.ts";

export type NotificationRecord = {
	runDir: string;
	notify: NotifyMode;
	state: "pending" | "notified" | "exhausted";
	attempts: number;
};

export type NotificationDispatch = (snapshot: ChildSnapshot, record: Readonly<NotificationRecord>) => void;

function groupedRuns(snapshots: readonly ChildSnapshot[]): Map<string, ChildSnapshot> {
	const groups = new Map<string, ChildSnapshot>();
	for (const snapshot of snapshots) {
		if (!groups.has(snapshot.parentRunId)) groups.set(snapshot.parentRunId, snapshot);
	}
	return groups;
}

/** Session-scoped transition tracker. It deliberately does not replay unseen terminal history. */
export class CompletionNotificationState {
	readonly #maxAttempts: number;
	readonly #runs = new Map<string, NotificationRecord>();

	constructor(maxAttempts = 3) {
		this.#maxAttempts = Math.max(1, Math.floor(maxAttempts));
	}

	clear(): void {
		this.#runs.clear();
	}

	trackLaunch(id: string, runDir: string, notify: NotifyMode): void {
		this.#runs.set(id, { runDir, notify, state: "pending", attempts: 0 });
	}

	seed(snapshots: readonly ChildSnapshot[]): void {
		this.clear();
		for (const snapshot of groupedRuns(snapshots).values()) {
			if (snapshot.runState === "running" && (snapshot.mode === "background" || snapshot.mode === "unknown")) {
				this.trackLaunch(snapshot.parentRunId, snapshot.runDir, snapshot.notify);
			} else if (snapshot.mode === "background") {
				this.#runs.set(snapshot.parentRunId, {
					runDir: snapshot.runDir,
					notify: snapshot.notify,
					state: "notified",
					attempts: 0,
				});
			}
		}
	}

	observe(snapshots: readonly ChildSnapshot[], dispatch: NotificationDispatch): { retryNeeded: boolean } {
		let retryNeeded = false;
		for (const snapshot of groupedRuns(snapshots).values()) {
			let record = this.#runs.get(snapshot.parentRunId);
			if (!record) {
				if (snapshot.runState !== "running" || (snapshot.mode !== "background" && snapshot.mode !== "unknown")) continue;
				this.trackLaunch(snapshot.parentRunId, snapshot.runDir, snapshot.notify);
				record = this.#runs.get(snapshot.parentRunId)!;
			}
			if (record.state !== "pending" || snapshot.runState === "running") continue;
			try {
				dispatch(snapshot, record);
				record.state = "notified";
			} catch {
				record.attempts += 1;
				if (record.attempts >= this.#maxAttempts) record.state = "exhausted";
				else retryNeeded = true;
			}
		}
		return { retryNeeded };
	}

	get(id: string): Readonly<NotificationRecord> | undefined {
		return this.#runs.get(id);
	}
}
