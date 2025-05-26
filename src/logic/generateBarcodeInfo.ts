import fs from "fs/promises";
import fsPromises from "fs/promises";
import path from "path";
import crypto from "crypto";


import { createBarcodeSVG } from "../exporters/createBarcodeSvg";
import { loadUsedSampleIDs, saveUsedSampleIDs } from "./sampleIDTracker";
import type { BarcodeConfig } from "./types";

function generateRandomID(length = 10): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O, 0, I, 1
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
  constructor(public readonly clientCode: string, public readonly sampleID: string){}

  toFileName(): string {
    return `${this.clientCode}_${this.sampleID}.svg`;
  }
}

// Generate barcode info
export async function generateBarcodeInfo(config: BarcodeConfig): Promise<BarcodeInfo[]> {
  const {
    clientCode,
    panelCode,
    count,
    outputDir,
  } = config;

    await fsPromises.mkdir(outputDir, { recursive: true });


  const barcodes: BarcodeInfo[] = [];

  const usedIDs = await loadUsedSampleIDs();
  
  let attempts = 0;
  const maxAttempts = count *10;
  
  while (barcodes.length < count && attempts < maxAttempts) {
    const sampleID = generateRandomID();
    if (usedIDs.has(sampleID)) {
      attempts++;
      continue;
    }

    usedIDs.add(sampleID);
    const barcode = `${clientCode}|${sampleID}`;
    barcodes.push(new BarcodeInfo(clientCode, sampleID));

    const svg = createBarcodeSVG(clientCode, sampleID, panelCode);
    const filename = `${barcode.replace("|", "_")}.svg`;
    await fs.writeFile(path.join(outputDir, filename), svg);

    console.log(`Generated barcode: ${barcode}`);
  }

  if (barcodes.length < count) {
    console.warn(`Only generated ${barcodes.length} unique barcodes (out of requested ${count})`);
  }
  
  await saveUsedSampleIDs(usedIDs);
  console.log("Saved used sample IDs:", usedIDs.size);

  return barcodes;
}
