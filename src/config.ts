// src/config.ts

import type { BarcodeConfig, PDFConfig } from "./logic/types";
import fs from "fs/promises";
import path from "path";

const SEQUENCE_PATH = path.resolve("last-sequence.json");

export async function getBarcodeConfig(): Promise<BarcodeConfig> {
  // (Currently unused in return object, but harmless to keep reading)
  try {
    const data = await fs.readFile(SEQUENCE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    const lastUsed = parsed.lastUsed ?? 0;
    void lastUsed;
  } catch {
    // ignore
  }

  return {
    clientCode: "DK010",
    panelCode: "APV13",
    count: 10,
    outputDir: "./output/barcodes",
  };
}

// ✅ NEW: PDF config pointing to the latest-batch manifest
export async function getPdfConfig(): Promise<PDFConfig> {
  const svgDirectory = "./output/barcodes";
  const manifestPath = path.join(svgDirectory, "latest-batch.json");

  return {
    svgDirectory,
    manifestPath, // <- tells the PDF to use only the latest batch
    outputPath: path.join(svgDirectory, "labels-latest.pdf"),
    layout: {
      pageSize: "A4", // or whatever key you use in PAGE_SIZES
      columns: 2,
      spacing: { vertical: 8 },
    },
  };
}
