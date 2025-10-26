// main.ts

import { runBarcodeBatch } from "./runBatch";

async function main() {
  try {
    const result = await runBarcodeBatch({
      clientCode: "DK010",
      panelCode: "APV13",
      count: 42,
      outputDir: "./output/barcodes",
    });

    console.log(
      `Generated ${result.generated} barcode(s) (requested ${result.requested}).`
    );
    console.log(`Manifest: ${result.manifestPath}`);
    if (result.pdfPath) {
      console.log(`PDF saved to: ${result.pdfPath}`);
    }
    if (result.csvPath) {
      console.log(`CSV saved to: ${result.csvPath}`);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}

// Run
main();
