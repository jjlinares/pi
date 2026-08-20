import fs from "node:fs";
import path from "node:path";

function openContainedRegularFile(runDir: string, file: string | undefined): { fd: number; size: number } | undefined {
	if (!file) return undefined;
	let fd: number | undefined;
	try {
		const lexicalRoot = path.resolve(runDir);
		const lexicalFile = path.resolve(runDir, file);
		if (lexicalFile !== lexicalRoot && !lexicalFile.startsWith(`${lexicalRoot}${path.sep}`)) return undefined;
		const linkStat = fs.lstatSync(lexicalFile);
		if (!linkStat.isFile() || linkStat.isSymbolicLink()) return undefined;
		const canonicalRoot = fs.realpathSync(runDir);
		const canonicalFile = fs.realpathSync(lexicalFile);
		if (canonicalFile !== canonicalRoot && !canonicalFile.startsWith(`${canonicalRoot}${path.sep}`)) return undefined;
		fd = fs.openSync(canonicalFile, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
		const stat = fs.fstatSync(fd);
		if (!stat.isFile()) return undefined;
		const result = { fd, size: stat.size };
		fd = undefined;
		return result;
	} catch {
		return undefined;
	} finally {
		if (fd !== undefined) try { fs.closeSync(fd); } catch {}
	}
}

export function readContainedFileHead(runDir: string, file: string | undefined, maxBytes: number): { text: string; truncated: boolean } {
	const opened = openContainedRegularFile(runDir, file);
	if (!opened) return { text: "", truncated: false };
	try {
		const length = Math.min(opened.size, Math.max(0, maxBytes));
		const buffer = Buffer.allocUnsafe(length);
		const read = length > 0 ? fs.readSync(opened.fd, buffer, 0, length, 0) : 0;
		return { text: buffer.subarray(0, read).toString("utf8"), truncated: opened.size > length };
	} catch {
		return { text: "", truncated: false };
	} finally {
		try { fs.closeSync(opened.fd); } catch {}
	}
}

export function readContainedFileTail(runDir: string, file: string | undefined, maxBytes: number): string {
	const opened = openContainedRegularFile(runDir, file);
	if (!opened) return "";
	try {
		const length = Math.min(opened.size, Math.max(0, maxBytes));
		const start = opened.size - length;
		const buffer = Buffer.allocUnsafe(length);
		const read = length > 0 ? fs.readSync(opened.fd, buffer, 0, length, start) : 0;
		let text = buffer.subarray(0, read).toString("utf8");
		if (start > 0) {
			const newline = text.indexOf("\n");
			text = newline >= 0 ? text.slice(newline + 1) : "";
		}
		return text;
	} catch {
		return "";
	} finally {
		try { fs.closeSync(opened.fd); } catch {}
	}
}
