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

export class BarcodeInfo {
  constructor(public readonly clientCode: string, public readonly sampleID: string) {}

  toFileName(): string {
    return `${this.clientCode}_${this.sampleID}.svg`;
  }
}

// Generate barcode info + write SVGs + write latest-batch.json
export async function generateBarcodeInfo(config: BarcodeConfig): Promise<BarcodeInfo[]> {
  const { clientCode, panelCode, count, outputDir } = config;

  // 🔒 Clamp by grid
  const COLS = 2;
  const ROWS_PER_COL = 13;             // no of rows per column
  const PER_PAGE = COLS * ROWS_PER_COL; // per page

  const pages = 1; // one page
  const effectiveCount = Math.min(count, PER_PAGE * pages);

  await fs.mkdir(outputDir, { recursive: true });

  const barcodes: BarcodeInfo[] = [];
  const usedIDs = await loadUsedSampleIDs();

  const createdFiles: string[] = [];
  let attempts = 0;
  const maxAttempts = effectiveCount * 10;

  while (barcodes.length < effectiveCount && attempts < maxAttempts) {
    const sampleID = generateRandomID();
    if (usedIDs.has(sampleID)) {
      attempts++;
      continue;
    }

    usedIDs.add(sampleID);
    const code = `${clientCode}|${sampleID}`;
    const info = new BarcodeInfo(clientCode, sampleID);
    barcodes.push(info);

    const svg = createBarcodeSVG(clientCode, sampleID, panelCode);
    const filename = `${code.replace("|", "_")}.svg`;
    const fullPath = path.join(outputDir, filename);
    await fs.writeFile(fullPath, svg);
    createdFiles.push(filename);

    console.log(`Generated barcode: ${code}`);
  }

  if (barcodes.length < count) {
    console.warn(`Only generated ${barcodes.length} unique barcodes (out of requested ${count})`);
  }

  await saveUsedSampleIDs(usedIDs);
  console.log("Saved used sample IDs:", usedIDs.size);

  // ✅ Write manifest for the latest batch
  const manifest = {
    createdAt: new Date().toISOString(),
    files: createdFiles, // filenames relative to outputDir
  };
  const manifestPath = path.join(outputDir, "latest-batch.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`🧾 Wrote manifest: ${manifestPath} (${createdFiles.length} files)`);

  return barcodes;
}
