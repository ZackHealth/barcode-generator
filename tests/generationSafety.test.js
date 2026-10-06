import { afterEach, beforeEach, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const worker = path.resolve(import.meta.dir, "fixtures/ledger-worker.ts");
const initial = ["ABCDEFGH23", "0X5C6X8R8O"];
let directory, ledger;

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-generation-test-"));
  await fs.mkdir(path.join(directory, "src"));
  ledger = path.join(directory, "src/used-sample-ids.json");
  await fs.writeFile(ledger, JSON.stringify({ usedSampleIDs: initial }));
});
afterEach(async () => { await fs.rm(directory, { recursive: true, force: true }); });

function spawn(options) {
  return Bun.spawn([process.execPath, worker, JSON.stringify(options)], {
    cwd: directory, stdout: "pipe", stderr: "pipe",
  });
}
async function run(options) {
  const child = spawn(options);
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  const result = JSON.parse(stdout.trim().split("\n").at(-1));
  return { ...result, code, stderr };
}
async function ids() { return JSON.parse(await fs.readFile(ledger, "utf8")).usedSampleIDs; }

test("every SVG ID has already been persisted, and the run manifest matches the new IDs", async () => {
  const result = await run({ count: 26 });
  expect(result.ok).toBe(true);
  expect(result.count).toBe(26);
  const reserved = await ids();
  expect(reserved.slice(0, initial.length)).toEqual(initial);
  expect(reserved).toHaveLength(28);
  const manifest = JSON.parse(await fs.readFile(result.manifestPath, "utf8"));
  expect(manifest.files.map(file => file.split("_")[1].replace(".svg", ""))).toEqual(reserved.slice(2));
});

test("a label-write failure burns the entire reserved batch instead of releasing IDs", async () => {
  const result = await run({ failSVG: true });
  expect(result.ok).toBe(false);
  expect(result.error).toContain("simulated SVG disk failure");
  expect(await ids()).toHaveLength(4);
  expect(await fs.exists(`${ledger}.lock`)).toBe(false);
  const retry = await run({});
  expect(retry.ok).toBe(true);
  expect(new Set(await ids()).size).toBe(6);
});

test("invalid ledger stops before creating output files or directories", async () => {
  await fs.writeFile(ledger, "{corrupt");
  const result = await run({});
  expect(result.ok).toBe(false);
  expect(await fs.exists(path.join(directory, "output"))).toBe(false);
  expect(await fs.readFile(ledger, "utf8")).toBe("{corrupt");
});

test.each([
  { count: 0 }, { count: -1 }, { count: 1.5 },
  { clientCode: "../escape" }, { panelCode: "APV13,extra" },
])("invalid generation settings do not reserve IDs or create outputs: %j", async options => {
  const result = await run(options);
  expect(result.ok).toBe(false);
  expect(await ids()).toEqual(initial);
  expect(await fs.exists(path.join(directory, "output"))).toBe(false);
});

test("separate processes cannot reserve the same ID", async () => {
  const results = await Promise.all([
    run({ reserveOnly: true, id: "NEWABCDE23" }),
    run({ reserveOnly: true, id: "NEWABCDE23" }),
  ]);
  expect(results.filter(result => result.ok)).toHaveLength(1);
  expect(await ids()).toEqual([...initial, "NEWABCDE23"]);
});

test.each(["before-rename", "after-rename"])("process crash %s retains a complete ledger and blocks retry", async pause => {
  const child = spawn({ reserveOnly: true, id: "NEWABCDE23", pause });
  try {
    const reader = child.stdout.getReader();
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toContain("READY");
    child.kill("SIGKILL");
    await child.exited;
    expect(await ids()).toEqual(pause === "before-rename" ? initial : [...initial, "NEWABCDE23"]);
    expect(await fs.exists(`${ledger}.lock`)).toBe(true);
    const retry = await run({ reserveOnly: true, id: "NEXTABCD23" });
    expect(retry.ok).toBe(false);
    expect(retry.error).toContain("lock");
  } finally {
    child.kill("SIGKILL");
    await child.exited;
  }
}, 10_000);
