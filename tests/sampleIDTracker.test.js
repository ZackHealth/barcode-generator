import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadUsedSampleIDs } from "../src/logic/sampleIDTracker";

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
  ])("stops on invalid ledger data: %s", async (raw) => {
    await fs.writeFile(ledger, raw);
    await expect(loadUsedSampleIDs(ledger)).rejects.toThrow();
    expect(await fs.readFile(ledger, "utf8")).toBe(raw);
  });
});
