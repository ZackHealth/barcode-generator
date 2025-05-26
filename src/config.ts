import type { BarcodeConfig } from "./logic/types";
import fs from "fs/promises";
import path from "path";

const SEQUENCE_PATH = path.resolve("last-sequence.json");

export async function getBarcodeConfig(): Promise<BarcodeConfig> {
  // Read last used number
  let lastUsed = 0;
  try {
    const data = await fs.readFile(SEQUENCE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    lastUsed = parsed.lastUsed ?? 0;
  } catch (err) {
    lastUsed = 0;
  }

  return {
    clientCode: "DK010",
    panelCode: "APV13",
    count: 10,
    outputDir: "./output/barcodes",
  };
}
