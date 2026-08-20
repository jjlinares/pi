import fs from "node:fs";
import path from "node:path";

export const STATUS_FILENAME = "status.json";
export const RESULT_FILENAME = "result.md";
export const EVENTS_FILENAME = "events.jsonl";
export const CONTROL_DIRNAME = "control";
export const READ_MODEL_POLL_MS = 250;
export const CONTROL_POLL_MS = 100;
export const MAX_TRANSCRIPT_BYTES = 1024 * 1024;
export const MAX_STATUS_BYTES = 1024 * 1024;
export const CONTROL_PROTOCOL_VERSION = 1;

export function statusFilePath(runDir) {
  return path.join(runDir, STATUS_FILENAME);
}

export function resultFilePath(runDir) {
  return path.join(runDir, RESULT_FILENAME);
}

export function eventsFilePath(runDir) {
  return path.join(runDir, EVENTS_FILENAME);
}

export function transcriptFilePath(runDir, index) {
  return path.join(runDir, `transcript-${index}.jsonl`);
}

export function abortMarkerPath(runDir, index) {
  return path.join(runDir, CONTROL_DIRNAME, `abort-${index}.json`);
}

function validSegment(value) {
  return typeof value === "string" && value !== "." && value !== ".." && /^[A-Za-z0-9._-]+$/.test(value);
}

export function validateChildAddress({ runDir, runId, childId, index }) {
  return typeof runDir === "string"
    && path.basename(runDir) === runId
    && validSegment(runId)
    && validSegment(childId)
    && Number.isSafeInteger(index)
    && index >= 0
    && childId === `${runId}-${index}`;
}

export function writeAbortMarker(address) {
  if (!validateChildAddress(address)) return false;
  const controlDir = path.join(address.runDir, CONTROL_DIRNAME);
  fs.mkdirSync(controlDir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(controlDir, 0o700); } catch {}

  const marker = abortMarkerPath(address.runDir, address.index);
  const existing = readAbortMarker(address);
  if (existing) return true;
  const tmp = `${marker}.${process.pid}.${Date.now()}.tmp`;
  const value = {
    version: CONTROL_PROTOCOL_VERSION,
    action: "abort",
    runId: address.runId,
    childId: address.childId,
    index: address.index,
    requestedAt: Date.now(),
  };
  fs.writeFileSync(tmp, `${JSON.stringify(value)}\n`, { mode: 0o600, flag: "wx" });
  try {
    fs.renameSync(tmp, marker);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
  return true;
}

export function readAbortMarker(address) {
  if (!validateChildAddress(address)) return undefined;
  try {
    const value = JSON.parse(fs.readFileSync(abortMarkerPath(address.runDir, address.index), "utf8"));
    if (value?.version !== CONTROL_PROTOCOL_VERSION || value.action !== "abort") return undefined;
    if (value.runId !== address.runId || value.childId !== address.childId || value.index !== address.index) return undefined;
    return value;
  } catch {
    return undefined;
  }
}
