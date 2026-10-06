import fs from "node:fs/promises";
import path from "node:path";
import {
  generateBarcodeRun,
  type BarcodeRun,
} from "../logic/generateBarcodeInfo";
import { loadUsedSampleIDs } from "../logic/sampleIDTracker";
import { validateAlphaNumeric } from "../logic/validateConfig";
import { createBarcodePDF } from "../exporters/pdfGenerator";

export type BatchOptions = {
  pages: number;
  clientCode: string;
  panelCode: string;
};
export function validateBatchOptions(options: BatchOptions) {
  if (
    !Number.isSafeInteger(options.pages) ||
    options.pages < 1 ||
    options.pages > 20 ||
    !validateAlphaNumeric(options.clientCode) ||
    !validateAlphaNumeric(options.panelCode)
  ) {
    throw new Error(
      "Use 1–20 whole pages and explicit alphanumeric client and panel codes.",
    );
  }
}

export async function generateBatch(
  options: BatchOptions,
): Promise<BarcodeRun> {
  validateBatchOptions(options);
  // Keep automated output local, including when an old folder was symlinked.
  const root = await fs.realpath(process.cwd());
  for (const directory of ["src", "src/output", "src/output/runs"]) {
    const target = path.join(root, directory);
    try {
      if ((await fs.realpath(target)) !== target)
        throw new Error(
          "Batch output directories must be local, without symlinks.",
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const before = await loadUsedSampleIDs();
  const run = await generateBarcodeRun({
    ...options,
    count: options.pages * 26,
    outputDir: path.resolve("src/output"),
  });
  await fs.writeFile(
    path.join(run.runDir, "ledger-before.json"),
    JSON.stringify({ usedSampleIDs: [...before] }, null, 2),
  );
  const after = await loadUsedSampleIDs();
  await fs.writeFile(
    path.join(run.runDir, "ledger-after.json"),
    JSON.stringify({ usedSampleIDs: [...after] }, null, 2),
  );
  const ids = run.barcodes.map((barcode) => barcode.sampleID);
  if (
    after.size !== before.size + ids.length ||
    [...before].some((id) => !after.has(id)) ||
    ids.some((id) => before.has(id) || !after.has(id)) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error(
      "Reservation verification failed. Keep all IDs and inspect the ledger.",
    );
  }
  const manifest = JSON.parse(await fs.readFile(run.manifestPath, "utf8"));
  manifest.pages = options.pages;
  await fs.writeFile(run.manifestPath, JSON.stringify(manifest, null, 2));
  await fs.writeFile(
    path.join(run.runDir, "reservation-check.json"),
    JSON.stringify(
      {
        beforeCount: before.size,
        afterCount: after.size,
        newIDs: ids,
        previousIDsPreserved: true,
        historicalOverlap: 0,
      },
      null,
      2,
    ),
  );
  await createBarcodePDF({
    svgDirectory: run.runDir,
    manifestPath: run.manifestPath,
    outputPath: path.join(run.runDir, "labels-{timestamp}.pdf"),
    writeCsv: true,
    panelCode: options.panelCode,
    csvOutputPath: path.join(run.runDir, "labels-{timestamp}.csv"),
  });
  return run;
}
