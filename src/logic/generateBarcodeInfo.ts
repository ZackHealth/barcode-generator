// src/backend/generateBarcodeInfo.ts

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import { createBarcodeSVG } from "../exporters/createBarcodeSvg";
import { reserveSampleIDs } from "./sampleIDTracker";
import { validateClientCode } from "./validateConfig";
import type { BarcodeConfig } from "../logic/types";

function generateRandomID(length = 10): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O,0,I,1
  let id = "";

  while (id.length < length) {
    const byte = crypto.randomBytes(1)[0]!;
    const index = byte % charset.length;
    const char = charset[index];

    // Optional: avoid repeating last char
    if (id.length > 0 && id[id.length - 1] === char) continue;
    id += char;
  }
  return id;
}

function generateRunId(): string {
  // Example: 20251214-163012-7f3a
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rand = crypto.randomBytes(2).toString("hex"); // 4 chars
  return `${YYYY}${MM}${DD}-${hh}${mm}${ss}-${rand}`;
}

export class BarcodeInfo {
  constructor(
    public readonly clientCode: string,
    public readonly sampleID: string
  ) {}

  toFileName(): string {
    return `${this.clientCode}_${this.sampleID}.svg`;
  }
}

export type BarcodeRun = {
  runId: string;
  runDir: string;
  manifestPath: string;
  createdAt: string;
  template: string;
  barcodes: BarcodeInfo[];
  countRequested: number;
  countEffective: number;
  countGenerated: number;
  clientCode: string;
  panelCode: string;
  files: string[]; // svg filenames relative to runDir
};

/**
 * Convenience wrapper for Next/API usage:
 * returns run metadata + barcodes + where the files were written.
 */
export async function generateBarcodeRun(
  config: BarcodeConfig
): Promise<BarcodeRun> {
  const { clientCode, panelCode, count, outputDir } = config;
  validateClientCode(config);
  if (!Number.isSafeInteger(count) || count < 1 || count > 520) {
    throw new Error("Barcode count must be an integer between 1 and 520.");
  }
  // The exporter lays out 26 labels per page. Reserve the full requested batch.
  const effectiveCount = count;

  // ✅ Create a per-run folder
  const runId = generateRunId();
  const runDir = path.join(outputDir, "runs", runId);
  // IDs remain reserved even if output generation fails or the process crashes.
  const sampleIDs = await reserveSampleIDs(effectiveCount, generateRandomID);
  const barcodes = sampleIDs.map(id => new BarcodeInfo(clientCode, id));
  await fs.mkdir(path.dirname(runDir), { recursive: true });
  await fs.mkdir(runDir); // Never overwrite another run on a run-ID collision.
  const createdAt = new Date().toISOString();
  const createdFiles: string[] = [];
  for (const barcode of barcodes) {
    const filename = barcode.toFileName();
    await fs.writeFile(
      path.join(runDir, filename),
      createBarcodeSVG(clientCode, barcode.sampleID, panelCode),
      { flag: "wx" }
    );
    createdFiles.push(filename);
  }

  // Write manifest for THIS run (not "latest-batch.json")
  const manifest = {
    runId,
    createdAt,
    template: "AAR026",
    countRequested: count,
    countEffective: effectiveCount,
    countGenerated: barcodes.length,
    clientCode,
    panelCode,
    // filenames relative to runDir
    files: createdFiles,
    // These will be filled later by your PDF/CSV step:
    pdfFile: null as string | null,
    csvFile: null as string | null,
  };

  const manifestPath = path.join(runDir, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`🧾 Wrote manifest: ${manifestPath} (${createdFiles.length} files)`);
  console.log(`📁 Run folder: ${runDir}`);

  return {
    runId,
    runDir,
    manifestPath,
    createdAt,
    template: "AAR026",
    barcodes,
    countRequested: count,
    countEffective: effectiveCount,
    countGenerated: barcodes.length,
    clientCode,
    panelCode,
    files: createdFiles,
  };
}

/**
 * Backwards-compatible wrapper (keeps existing callers intact):
 * returns only the barcodes array.
 */
export async function generateBarcodeInfo(
  config: BarcodeConfig
): Promise<BarcodeInfo[]> {
  const run = await generateBarcodeRun(config);
  return run.barcodes;
}
