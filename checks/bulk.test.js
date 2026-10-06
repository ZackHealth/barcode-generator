import { test, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { prepareVerifier, verifyBatch } from "../src/batches/verification";
const project = path.resolve(import.meta.dir, "..");
test("ten-page PDF independently decodes all 260 IDs, rejects a changed CSV and preserves the real ledger", async () => {
  const ledger = path.join(project, "src/used-sample-ids.json");
  const original = await fs.readFile(ledger);
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-bulk-"));
  try {
    await fs.mkdir(path.join(fixture, "src"));
    await fs.writeFile(
      path.join(fixture, "src/used-sample-ids.json"),
      JSON.stringify({ usedSampleIDs: ["ABCDEFGH23"] }),
    );
    const python = await prepareVerifier(project);
    const child = Bun.spawn(
      [
        process.execPath,
        path.join(project, "tests/fixtures/ledger-worker.ts"),
        JSON.stringify({
          batch: { pages: 10, clientCode: "DK010", panelCode: "APV13" },
        }),
      ],
      { cwd: fixture, stdout: "pipe", stderr: "pipe" },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    expect(code, stderr + stdout).toBe(0);
    const { runDir } = JSON.parse(stdout.trim().split("\n").at(-1));
    const result = await verifyBatch(runDir, python, fixture);
    expect(result.pages).toBe(10);
    expect(result.decodedPdfBarcodes).toBe(260);
    expect(result.uniqueIDs).toBe(260);
    // Later reservations must not make an older valid batch unverifiable.
    const fixtureLedger = path.join(fixture, "src/used-sample-ids.json");
    const data = JSON.parse(await fs.readFile(fixtureLedger));
    data.usedSampleIDs.push("NEXTABCD23");
    await fs.writeFile(fixtureLedger, JSON.stringify(data));
    expect(
      (await verifyBatch(runDir, python, fixture)).decodedPdfBarcodes,
    ).toBe(260);
    const manifest = JSON.parse(
      await fs.readFile(path.join(runDir, "manifest.json")),
    );
    const csv = path.join(runDir, manifest.csvFile);
    const contents = await fs.readFile(csv, "utf8");
    await fs.writeFile(csv, contents.replace("DK010", "OTHER"));
    await expect(verifyBatch(runDir, python, fixture)).rejects.toThrow();
    expect(await fs.readFile(ledger)).toEqual(original);
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
}, 180_000);
