import { expect, test } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadUsedSampleIDs } from "../src/logic/sampleIDTracker";

test("ledger changes preserve every reservation in the base commit", async () => {
  const root = path.resolve(import.meta.dir, "..");
  const base = process.env.LEDGER_BASE_REF || "origin/main";
  const previous = JSON.parse(execFileSync("git", ["show", `${base}:src/used-sample-ids.json`], { cwd: root, encoding: "utf8" }));
  const current = await loadUsedSampleIDs(path.join(root, "src/used-sample-ids.json"));
  expect(previous.usedSampleIDs.length).toBeGreaterThan(0);
  expect(previous.usedSampleIDs.filter(id => !current.has(id))).toEqual([]);
});

test("the committed ledger retains every recovered historical ID", async () => {
  const root = path.resolve(import.meta.dir, "..");
  const ledger = await loadUsedSampleIDs(path.join(root, "src/used-sample-ids.json"));
  const evidence = await fs.readFile(path.join(root, "docs/ledger-recovery/2026-10-06-recovered-ids.csv"), "utf8");
  const recovered = evidence.trim().split(/\r?\n/).slice(1).map(row => row.split(",", 1)[0]);
  expect(recovered.length).toBeGreaterThan(0);
  expect(recovered.filter(id => !ledger.has(id))).toEqual([]);
});
