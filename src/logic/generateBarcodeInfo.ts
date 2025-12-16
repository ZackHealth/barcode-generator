// src/backend/generateBarcodeInfo.ts

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import { createBarcodeSVG } from "../exporters/createBarcodeSvg";
import { loadUsedSampleIDs, saveUsedSampleIDs } from "./sampleIDTracker";
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

// Simple lock to prevent parallel runs from corrupting used-sample-ids.json writes.
// (Works well for single-machine / single-process workflows.)
const LOCK_PATH = path.resolve("used-sample-ids.lock");

async function acquireLock(): Promise<void> {
  // 'wx' => create exclusively; fails if exists
  const handle = await fs.open(LOCK_PATH, "wx");
  await handle.close();
}

async function releaseLock(): Promise<void> {
  try {
    await fs.unlink(LOCK_PATH);
  } catch {
    // ignore
  }
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

  // 🔒 Clamp by grid (AAR026: 2 cols × 13 rows = 26 labels/page)
  const COLS = 2;
  const ROWS_PER_COL = 13;
  const PER_PAGE = COLS * ROWS_PER_COL;

  const pages = 1; // one page for now
  const effectiveCount = Math.min(count, PER_PAGE * pages);

  // ✅ Create a per-run folder
  const runId = generateRunId();
  const runDir = path.join(outputDir, "runs", runId);
  await fs.mkdir(runDir, { recursive: true });

  const createdAt = new Date().toISOString();

  // Checkpoint settings
  const CHECKPOINT_EVERY = 10;

  const barcodes: BarcodeInfo[] = [];
  const createdFiles: string[] = [];

  let usedIDs: Set<string> = new Set();
  let attempts = 0;
  const maxAttempts = effectiveCount * 10;

  // Lock so two generators can't trample used-sample-ids.json
  await acquireLock();

  try {
    usedIDs = await loadUsedSampleIDs();

    while (barcodes.length < effectiveCount && attempts < maxAttempts) {
      const sampleID = generateRandomID();
      if (usedIDs.has(sampleID)) {
        attempts++;
        continue;
      }

      // Mark used immediately (in-memory)
      usedIDs.add(sampleID);

      const code = `${clientCode}|${sampleID}`;
      const info = new BarcodeInfo(clientCode, sampleID);
      barcodes.push(info);

      // Write SVG into run folder
      const svg = createBarcodeSVG(clientCode, sampleID, panelCode);
      const filename = `${code.replace("|", "_")}.svg`;
      const fullPath = path.join(runDir, filename);

      await fs.writeFile(fullPath, svg);
      createdFiles.push(filename);

      console.log(`Generated barcode: ${code}`);

      // ✅ Checkpoint used IDs periodically to reduce duplicate risk on crash
      if (barcodes.length % CHECKPOINT_EVERY === 0) {
        await saveUsedSampleIDs(usedIDs);
        console.log(`💾 Checkpoint: saved used IDs (${usedIDs.size})`);
      }
    }

    if (barcodes.length < effectiveCount) {
      console.warn(
        `Only generated ${barcodes.length} unique barcodes (out of effective ${effectiveCount}, requested ${count})`
      );
    }

    // Final save
    await saveUsedSampleIDs(usedIDs);
    console.log("Saved used sample IDs:", usedIDs.size);
  } finally {
    await releaseLock();
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
