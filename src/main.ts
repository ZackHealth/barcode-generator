// main.ts

// Logic and config
import {
  generateBarcodeInfo,
  validateClientCode,
  formatDate,
  type BarcodeConfig,
} from "./logic";

// Exporters
import { createBarcodeCSVFile } from "./exporters/createBarcodeCsv";
import { createBarcodePDF } from "./exporters/pdfGenerator";
import type { PDFConfig } from "./logic/types";

import path from "path";

async function main() {
  try {
    // 1️⃣ Generate barcodes (NEW batch)
    const barcodeConfig: BarcodeConfig = {
      clientCode: "DK010",
      panelCode:  "APV13",
      count:      42,
      outputDir:  "./output/barcodes",
    };

    validateClientCode(barcodeConfig);
    console.log("Generating barcodes...");
    const barcodes = await generateBarcodeInfo(barcodeConfig); // writes SVGs + latest-batch.json

    // 2️⃣ Export CSV for the same batch
    const labelCreationDate = formatDate(new Date());
    await createBarcodeCSVFile(
      barcodes,
      barcodeConfig.outputDir,
      barcodeConfig.panelCode,
      labelCreationDate
    );
    console.log(`Generated ${barcodes.length} barcodes and saved CSV.`);

    // 3️⃣ Export PDF for ONLY the latest batch
    const pdfConfig: PDFConfig & {
      writeCsv?: boolean;
      panelCode?: string;
      csvOutputPath?: string;
    } = {
      svgDirectory: barcodeConfig.outputDir,
      // Optional placeholder — gets replaced:
      outputPath:   "./output/labels-{timestamp}.pdf",
      manifestPath: path.join(barcodeConfig.outputDir, "latest-batch.json"),
      layout: {
        pageSize: "A4",
        columns:  2,
        spacing:  { vertical: 0 },
      },

      // NEW: turn on CSV export for the same batch (optional)
      writeCsv: true,
      panelCode: barcodeConfig.panelCode,
      // Optional: control CSV path & name (supports {timestamp})
      csvOutputPath: "./output/labels-{timestamp}.csv",
    };


    console.log("Creating PDF of latest batch...");
    await createBarcodePDF(pdfConfig);
    console.log("PDF generation complete (latest batch only).");

  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}

// Run
main();
