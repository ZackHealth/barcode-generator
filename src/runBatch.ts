import fs from "fs/promises";
import path from "path";

import {
  generateBarcodeInfo,
  validateClientCode,
  formatDate,
  type BarcodeConfig,
} from "./logic";
import type { BarcodeInfo } from "./logic/generateBarcodeInfo";
import type { PDFConfig } from "./logic/types";
import { createBarcodeCSVFile } from "./exporters/createBarcodeCsv";
import { createBarcodePDF } from "./exporters/pdfGenerator";

export interface BatchResult {
  id: string;
  clientCode: string;
  panelCode: string;
  requested: number;
  generated: number;
  outputDir: string;
  manifestPath: string;
  manifestFiles: string[];
  createdAt: string;
  pdfPath?: string;
  csvPath?: string;
  barcodes: BarcodeInfo[];
}

export interface RunBatchOptions {
  pdfOutputPath?: string;
  csvOutputPath?: string;
}

function toBatchId(iso?: string) {
  if (!iso) {
    return `batch-${Date.now()}`;
  }
  return `batch-${iso.replace(/[:.]/g, "-").replace("T", "_").replace("Z", "")}`;
}

export async function runBarcodeBatch(
  config: BarcodeConfig,
  options: RunBatchOptions = {}
): Promise<BatchResult> {
  validateClientCode(config);

  const barcodes = await generateBarcodeInfo(config);

  const printingDate = formatDate(new Date());
  await createBarcodeCSVFile(barcodes, config.outputDir, config.panelCode, printingDate);

  const manifestPath = path.resolve(config.outputDir, "latest-batch.json");
  let manifestCreatedAt = new Date().toISOString();
  let manifestFiles: string[] = [];
  try {
    const raw = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw) as { createdAt?: string; files?: string[] };
    if (manifest.createdAt) {
      manifestCreatedAt = manifest.createdAt;
    }
    if (Array.isArray(manifest.files)) {
      manifestFiles = manifest.files;
    }
  } catch (error) {
    console.warn("⚠️ Unable to read manifest after generation:", error);
  }

  const batchId = toBatchId(manifestCreatedAt);
  const pdfOutputPath = path.resolve(
    options.pdfOutputPath ?? path.join(config.outputDir, `${batchId}.pdf`)
  );
  const csvOutputPath = path.resolve(
    options.csvOutputPath ?? path.join(config.outputDir, `${batchId}.csv`)
  );

  await fs.mkdir(path.dirname(pdfOutputPath), { recursive: true });
  await fs.mkdir(path.dirname(csvOutputPath), { recursive: true });

  const pdfConfig: PDFConfig & {
    writeCsv: boolean;
    panelCode: string;
    csvOutputPath: string;
  } = {
    svgDirectory: config.outputDir,
    outputPath: pdfOutputPath,
    manifestPath,
    layout: {
      pageSize: "A4",
      columns: 2,
      spacing: { vertical: 0 },
    },
    writeCsv: true,
    panelCode: config.panelCode,
    csvOutputPath,
  };

  await createBarcodePDF(pdfConfig);

  return {
    id: batchId,
    clientCode: config.clientCode,
    panelCode: config.panelCode,
    requested: config.count,
    generated: barcodes.length,
    outputDir: path.resolve(config.outputDir),
    manifestPath,
    manifestFiles,
    createdAt: manifestCreatedAt,
    pdfPath: pdfOutputPath,
    csvPath: csvOutputPath,
    barcodes,
  };
}
