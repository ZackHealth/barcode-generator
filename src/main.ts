// Logic and config
import {
  generateBarcodeInfo,
  validateClientCode,
  formatDate,
  type BarcodeConfig,
} from "./logic";

// Exporters
import { createBarcodeSVG } from "./exporters/createBarcodeSvg";
import { createBarcodeCSVFile } from "./exporters/createBarcodeCsv";
import { createBarcodePDF } from "./exporters/pdfGenerator";
import type { PDFConfig } from "./logic/types";

async function main() {
  try {
    // 1️⃣ Generate barcodes
    const barcodeConfig: BarcodeConfig = {
      clientCode: "DK010",
      panelCode:  "APV13",
      count:      40,
      outputDir:  "./output/barcodes",
    };

    validateClientCode(barcodeConfig);
    console.log("Generating barcodes...");
    const barcodes = await generateBarcodeInfo(barcodeConfig);

    // 2️⃣ Export CSV
    const labelCreationDate = formatDate(new Date());
    await createBarcodeCSVFile(
      barcodes,
      barcodeConfig.outputDir,
      barcodeConfig.panelCode,
      labelCreationDate
    );
    console.log(`Generated ${barcodes.length} barcodes and saved CSV.`);

    // 3️⃣ Export PDF
    const pdfConfig: PDFConfig = {
      svgDirectory: barcodeConfig.outputDir,
      outputPath:   "./output/barcodes.pdf",
      layout: {
        pageSize:           "A4",
        margins:            0,
        columns:            2,
        spacing:            { horizontal: 0, vertical: 0 },
        preservePhysicalSize: true,
      },
    };
    console.log("Creating PDF of barcodes...");
    await createBarcodePDF(pdfConfig);
    console.log("PDF generation complete.");

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run
main();
