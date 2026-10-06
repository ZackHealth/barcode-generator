import fs from "node:fs/promises";
import path from "node:path";
import { loadUsedSampleIDs, reserveSampleIDs } from "../../src/logic/sampleIDTracker";

const options = JSON.parse(process.argv[2]!);
const ledger = path.resolve("src/used-sample-ids.json");

if (options.pause) {
  const rename = fs.rename.bind(fs);
  fs.rename = async (...args) => {
    if (options.pause === "after-rename") await rename(...args);
    console.log("READY");
    await new Promise(() => { setInterval(() => {}, 1000); });
  };
}

const writeFile = fs.writeFile.bind(fs);
fs.writeFile = async (file, ...args) => {
  if (String(file).endsWith(".svg")) {
    const sampleID = path.basename(String(file), ".svg").split("_")[1]!;
    if (!(await loadUsedSampleIDs(ledger)).has(sampleID)) {
      throw new Error("UNRESERVED ID reached the SVG writer");
    }
    if (options.failSVG) throw new Error("simulated SVG disk failure");
  }
  return writeFile(file, ...args);
};

try {
  if (options.batch) {
    const { generateBatch } = await import("../../src/batches/artifacts");
    const result = await generateBatch(options.batch);
    console.log(JSON.stringify({ ok: true, runDir: result.runDir }));
  } else if (options.reserveOnly) {
    const ids = await reserveSampleIDs(1, () => options.id);
    console.log(JSON.stringify({ ok: true, ids }));
  } else {
    const { generateBarcodeRun } = await import("../../src/logic/generateBarcodeInfo");
    const result = await generateBarcodeRun({
      clientCode: options.clientCode ?? "DK010", panelCode: options.panelCode ?? "APV13", count: options.count ?? 2,
      outputDir: path.resolve("output"),
    });
    console.log(JSON.stringify({ ok: true, count: result.countGenerated, manifestPath: result.manifestPath }));
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: String(error) }));
  process.exitCode = 1;
}
