import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { readContainedFileHead, readContainedFileTail } from "../artifact-files.ts";

test("dashboard artifact reads allow bounded regular files inside the canonical run directory", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-ui-files-test-"));
  const runDir = path.join(root, "run");
  await fs.mkdir(runDir);
  const file = path.join(runDir, "output.md");
  await fs.writeFile(file, "one\ntwo\nthree\n");

  assert.deepEqual(readContainedFileHead(runDir, file, 7), { text: "one\ntwo", truncated: true });
  assert.equal(readContainedFileTail(runDir, file, 10), "three\n");
});

test("dashboard artifact reads reject external paths, directories, and symlinks", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "subagents-ui-files-test-"));
  const runDir = path.join(root, "run");
  await fs.mkdir(runDir);
  const outside = path.join(root, "outside.txt");
  await fs.writeFile(outside, "secret");
  const symlink = path.join(runDir, "linked.txt");
  await fs.symlink(outside, symlink);

  assert.equal(readContainedFileHead(runDir, outside, 100).text, "");
  assert.equal(readContainedFileHead(runDir, symlink, 100).text, "");
  assert.equal(readContainedFileTail(runDir, runDir, 100), "");
});
