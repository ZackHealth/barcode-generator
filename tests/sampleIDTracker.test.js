import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as tracker from "../src/logic/sampleIDTracker";
const { loadUsedSampleIDs } = tracker;

let directory;
let ledger;
const originalIDs = ["ABCDEFGH23", "0X5C6X8R8O"];

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-ledger-test-"));
  ledger = path.join(directory, "used-sample-ids.json");
  await fs.writeFile(ledger, JSON.stringify({ usedSampleIDs: originalIDs }));
});

afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true });
});

describe("reading reservations", () => {
  test("loads the selected ledger, including legacy 0/O/I IDs", async () => {
    expect([...await loadUsedSampleIDs(ledger)]).toEqual(originalIDs);
  });

  test("stops when the ledger is missing", async () => {
    await fs.unlink(ledger);
    await expect(loadUsedSampleIDs(ledger)).rejects.toThrow();
  });

  test.each([
    "{broken",
    "null",
    "[]",
    "{}",
    '{"usedSampleIDs":[]}',
    '{"usedSampleIDs":"ABCDEFGH23"}',
    '{"usedSampleIDs":[null]}',
    '{"usedSampleIDs":["short"]}',
    '{"usedSampleIDs":["abcdefgh23"]}',
    '{"usedSampleIDs":["ABCDEFGH23","ABCDEFGH23"]}',
    '{"usedSampleIDs":["ABCDEFGH23"],"unexpected":true}',
  ])("stops on invalid ledger data: %s", async (raw) => {
    await fs.writeFile(ledger, raw);
    await expect(loadUsedSampleIDs(ledger)).rejects.toThrow();
    expect(await fs.readFile(ledger, "utf8")).toBe(raw);
  });
});

describe("durable reservations", () => {
  test("aliases of the ledger use the same lock and replacement target", async () => {
    const alias = path.join(directory, "alias.json");
    await fs.symlink(ledger, alias);
    await fs.writeFile(`${ledger}.lock`, "active");
    await expect(tracker.reserveSampleIDs(1, () => "NEWABCDE23", alias)).rejects.toThrow(/lock/i);
    await fs.unlink(`${ledger}.lock`);
    await tracker.reserveSampleIDs(1, () => "NEWABCDE23", alias);
    expect((await fs.lstat(alias)).isSymbolicLink()).toBe(true);
    expect([...await loadUsedSampleIDs(ledger)]).toEqual([...originalIDs, "NEWABCDE23"]);
  });

  test("reserving 500 IDs expands a temporary ledger without losing historical reservations", async () => {
    let sequence = 0;
    const reserved = await tracker.reserveSampleIDs(500, () => `TEST${String(sequence++).padStart(6, "0")}`, ledger);
    expect(reserved).toHaveLength(500);
    expect([...await loadUsedSampleIDs(ledger)]).toEqual([...originalIDs, ...reserved]);
    expect(new Set(reserved).size).toBe(500);
  });

  test("a failed file flush leaves the original ledger untouched", async () => {
    const before = await fs.readFile(ledger, "utf8");
    const realOpen = fs.open.bind(fs);
    const open = spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await realOpen(...args);
      if (String(args[0]).endsWith(".tmp")) {
        handle.sync = async () => { throw new Error("simulated flush failure"); };
      }
      return handle;
    });
    try {
      await expect(tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger)).rejects.toThrow(/flush/);
      expect(await fs.readFile(ledger, "utf8")).toBe(before);
      expect(await fs.readdir(directory)).toEqual(["used-sample-ids.json"]);
    } finally { open.mockRestore(); }
  });

  test("read permission failures stop reservation and preserve the ledger", async () => {
    const before = await fs.readFile(ledger, "utf8");
    const realRead = fs.readFile.bind(fs);
    const read = spyOn(fs, "readFile").mockImplementation((file, ...args) => {
      if (file === ledger) return Promise.reject(Object.assign(new Error("Permission denied"), { code: "EACCES" }));
      return realRead(file, ...args);
    });
    try {
      await expect(tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger)).rejects.toThrow(/Generation stopped/);
    } finally { read.mockRestore(); }
    expect(await fs.readFile(ledger, "utf8")).toBe(before);
    expect(await fs.readdir(directory)).toEqual(["used-sample-ids.json"]);
  });
  test("skips historical IDs and collisions within the new batch", async () => {
    const candidates = [originalIDs[0], "NEWABCDE23", "NEWABCDE23", "NEXTABCD23"];
    const reserved = await tracker.reserveSampleIDs(2, () => candidates.shift(), ledger);
    expect(reserved).toEqual(["NEWABCDE23", "NEXTABCD23"]);
    expect([...await loadUsedSampleIDs(ledger)]).toEqual([...originalIDs, ...reserved]);
  });

  test("does not change the ledger when collisions exhaust the retry budget", async () => {
    const before = await fs.readFile(ledger, "utf8");
    await expect(tracker.reserveSampleIDs(1, () => originalIDs[0], ledger)).rejects.toThrow();
    expect(await fs.readFile(ledger, "utf8")).toBe(before);
    expect(await fs.readdir(directory)).toEqual(["used-sample-ids.json"]);
  });

  test("rejects concurrent reservations without losing or duplicating IDs", async () => {
    let entered, release;
    const atReplacement = new Promise(resolve => { entered = resolve; });
    const proceed = new Promise(resolve => { release = resolve; });
    const realRename = fs.rename.bind(fs);
    const rename = spyOn(fs, "rename").mockImplementation(async (...args) => {
      entered();
      await proceed;
      return realRename(...args);
    });
    const first = tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger);
    try {
      await atReplacement;
      await expect(tracker.reserveSampleIDs(1, () => "NEXTABCD23", ledger)).rejects.toThrow(/lock/);
      release();
      expect(await first).toEqual(["NEWABCDE23"]);
      expect([...await loadUsedSampleIDs(ledger)]).toEqual([...originalIDs, "NEWABCDE23"]);
    } finally {
      release();
      await first;
      rename.mockRestore();
    }
  });

  test("never removes a pre-existing lock", async () => {
    await fs.writeFile(`${ledger}.lock`, "another run or a crashed process");
    await expect(tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger)).rejects.toThrow(/lock/i);
    expect(await fs.readFile(`${ledger}.lock`, "utf8")).toBe("another run or a crashed process");
    expect([...await loadUsedSampleIDs(ledger)]).toEqual(originalIDs);
  });

  test("a failed atomic replacement preserves the old ledger and cleans temporary files", async () => {
    const before = await fs.readFile(ledger, "utf8");
    const rename = spyOn(fs, "rename").mockRejectedValue(new Error("simulated disk failure"));
    try {
      await expect(tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger)).rejects.toThrow();
      expect(await fs.readFile(ledger, "utf8")).toBe(before);
      expect(await fs.readdir(directory)).toEqual(["used-sample-ids.json"]);
    } finally {
      rename.mockRestore();
    }
  });

  test("the replacement file is flushed before the live ledger is replaced", async () => {
    const realOpen = fs.open.bind(fs);
    let flushed = false;
    const open = spyOn(fs, "open").mockImplementation(async (...args) => {
      const handle = await realOpen(...args);
      if (String(args[0]).endsWith(".tmp")) {
        const sync = handle.sync.bind(handle);
        handle.sync = async () => { await sync(); flushed = true; };
      }
      return handle;
    });
    const realRename = fs.rename.bind(fs);
    const rename = spyOn(fs, "rename").mockImplementation(async (...args) => {
      expect(flushed).toBe(true);
      expect([...await loadUsedSampleIDs(ledger)]).toEqual(originalIDs);
      return realRename(...args);
    });
    try {
      await tracker.reserveSampleIDs(1, () => "NEWABCDE23", ledger);
      expect([...await loadUsedSampleIDs(ledger)]).toEqual([...originalIDs, "NEWABCDE23"]);
    } finally {
      open.mockRestore();
      rename.mockRestore();
    }
  });
});
