// src/exporters/pdfGenerator.ts

import fs from "fs/promises";
import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import path from "path";
import { getBarcodeRasterSize } from "../logic/barCodeDimensions";
import { getBarcodePhysicalDimensions } from "../logic/barCodeDimensions.ts"; // (îl lăsăm, chiar dacă nu-l mai folosim la dimensiuni)
import type { PDFConfig } from "../logic/types";
import { createBarcodeCSVFile } from "./createBarcodeCsv";

const { widthPx, heightPx } = getBarcodeRasterSize(300);

// --- Helpers ---------------------------------------------------------------

function mmToPt(mm: number) {
  return (mm * 72) / 25.4;
}

function formatTimestampForFilename(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD}_${hh}-${mm}-${ss}`;
}

function applyTimestampPlaceholder(p: string, ts: string) {
  return p.includes("{timestamp}") ? p.replace("{timestamp}", ts) : p;
}

function parseClientAndSample(fileName: string): { clientCode: string; sampleID: string } | null {
  const base = path.basename(fileName, ".svg");
  const idx = base.indexOf("_");
  if (idx <= 0 || idx === base.length - 1) return null;
  const clientCode = base.slice(0, idx);
  const sampleID = base.slice(idx + 1);
  return { clientCode, sampleID };
}

// --- Main ------------------------------------------------------------------

export async function createBarcodePDF(config: PDFConfig) {
  console.log("📥 Starting createBarcodePDF");

  // --- 0) Resolve the file list (latest batch first) ---
  let svgFiles: string[] = [];
  let manifestCreatedAt: string | undefined;

  if (config.svgFiles && config.svgFiles.length > 0) {
    console.log("📄 Using explicit svgFiles passed in PDFConfig");
    svgFiles = config.svgFiles.map(f => (path.isAbsolute(f) ? f : path.join(config.svgDirectory, f)));
  } else if (config.manifestPath) {
    console.log(`🧾 Reading manifest: ${config.manifestPath}`);
    const raw = await fs.readFile(config.manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as { files?: string[]; createdAt?: string };
    const files = parsed.files ?? [];
    manifestCreatedAt = parsed.createdAt;
    if (files.length === 0) {
      console.warn("⚠️ Manifest has no files. Nothing to print.");
      return;
    }
    svgFiles = files.map(f => path.join(config.svgDirectory, f));
    console.log(`📂 Manifest lists ${svgFiles.length} file(s).`);
  } else {
    console.log("↩️ No manifest/svgFiles provided, falling back to ALL .svg in directory");
    const all = (await fs.readdir(config.svgDirectory)).filter(f => f.endsWith(".svg"));
    svgFiles = all.map(f => path.join(config.svgDirectory, f));
  }

  if (svgFiles.length === 0) {
    console.log("⚠️ No SVG files to print. Exiting.");
    return;
  }

  // --- 0.1) Compute timestamped output paths -------------------------------
  const timestamp = formatTimestampForFilename(manifestCreatedAt);

  const outputPdfPath = config.outputPath
    ? applyTimestampPlaceholder(config.outputPath, timestamp)
    : path.join(config.svgDirectory, `labels-${timestamp}.pdf`);

  const outputCsvPath = (config as any).csvOutputPath
    ? applyTimestampPlaceholder((config as any).csvOutputPath, timestamp)
    : path.join(config.svgDirectory, `labels-${timestamp}.csv`);

  // --- 1) Layout setup (AAR026 exact) --------------------------------------
  // Sheet: A4 = 210 × 297 mm
  const pageW = mmToPt(210);
  const pageH = mmToPt(297);

  // Margins:
  const marginTop = mmToPt(21);
  const marginBottom = mmToPt(21);
  const marginLeft = mmToPt(17.5);
  const marginRight = mmToPt(17.5);

  // Label:
  const labelW = mmToPt(85);
  const labelH = mmToPt(15);
  const labelRadius = mmToPt(1.5);

  // Gaps:
  const gapAcross = mmToPt(5);   // între coloane
  const gapAround = mmToPt(5);   // între rânduri

  // Grid:
  const cols = 2;
  const rows = 13; // 13 pe coloană (în total 26 / pagină)

  console.log(`🗒 AAR026 grid: ${cols}×${rows}, label ${labelW.toFixed(2)}×${labelH.toFixed(2)} pt`);
  console.log(`   Margins T/R/B/L: ${marginTop}/${marginRight}/${marginBottom}/${marginLeft} pt`);

  console.log(`📂 Files to print: ${svgFiles.length}`);
  console.log(`🕒 Using timestamp: ${timestamp}`);
  console.log(`🧾 PDF will be saved as: ${outputPdfPath}`);

  // --- 2) Convert SVG → 300 DPI PNG ---
  console.log(`🔢 Raster target: ${widthPx}×${heightPx} px`);
  const images = await Promise.all(
    svgFiles.map(async fullPath => {
      const file = path.basename(fullPath);
      console.log(`🔄 Converting ${file} at 300 DPI`);
      const svgBuf = await fs.readFile(fullPath);
      const pngBuf = await sharp(svgBuf, { density: 300 })
        .resize(widthPx, heightPx, { fit: "contain", background: "#ffffff" })
        .png({ compressionLevel: 0 })
        .toBuffer();
      return { buffer: pngBuf, name: file };
    })
  );
  console.log(`✅ Converted ${images.length} images to 300 DPI PNG`);

  // --- 3) Create PDF & pipe ---
  const doc = new PDFDocument({ size: [pageW, pageH], margin: 0 });
  const stream = createWriteStream(outputPdfPath);
  console.log("📤 Piping PDFDocument to file stream");
  doc.pipe(stream);

  // Debug events
  doc.on("pageAdded", () => console.log("📄 pageAdded event"));
  doc.on("end", () => console.log("🏁 doc end event"));
  stream.on("close", () => console.log("🔒 stream close event"));
  stream.on("error", err => console.error("❌ stream error:", err));

  // --- 4) Exact placement loop (left→right, top→bottom) --------------------
  let idx = 0;
  let page = 0;

  const startX = marginLeft;
  const startY = marginTop;

  // Câte etichete / pagină:
  const perPage = cols * rows;

  while (idx < images.length) {
    console.log(`🏷 Starting page ${page + 1}`);
    if (page > 0) doc.addPage({ size: [pageW, pageH], margin: 0 });

    // pentru fiecare celulă din grilă
    for (let r = 0; r < rows && idx < images.length; r++) {
      for (let c = 0; c < cols && idx < images.length; c++) {
        const x = startX + c * (labelW + gapAcross);
        const y = startY + r * (labelH + gapAround);

        const image = images[idx]!;
        console.log(`   📍 Placing image ${idx + 1} (${image.name}) at (${x.toFixed(1)},${y.toFixed(1)})`);

        // opțional: ghid cu colțuri rotunjite (vizual/debug)
        doc
          .save()
          .lineWidth(0.5)
          .strokeColor("#E5E7EB") // gri deschis pentru ghidaj
          .roundedRect(x, y, labelW, labelH, labelRadius)
          .stroke()
          .restore();

        // plasează imaginea să "umple" eticheta
        doc.image(image.buffer, x, y, { width: labelW, height: labelH });

        idx++;
      }
    }

    page++;
  }
  console.log(`🗒 Finished layout loop; total pages: ${page}`);

  // --- 5) Finalize PDF ---
  console.log("🔚 Calling doc.end()");
  doc.end();

  console.log("⏳ Waiting for PDF to finish...");
  await new Promise<void>((resolve, reject) => {
    doc.on("end", () => {
      console.log("🏁 doc emitted end");
      resolve();
    });
    stream.on("close", () => {
      console.log("🔒 stream emitted close");
      resolve();
    });
    stream.on("error", err => {
      console.error("❌ stream error during finalize:", err);
      reject(err);
    });
    doc.on("error", err => {
      console.error("❌ doc error during finalize:", err);
      reject(err);
    });
  });

  console.log(`🎉 PDF saved to ${outputPdfPath}`);

  // --- 6) (Optional) Also write CSV for the same batch ---------------------
  if ((config as any).writeCsv) {
    const panelCode = (config as any).panelCode as string | undefined;
    if (!panelCode) {
      console.warn("⚠️ writeCsv requested, but panelCode is missing in PDFConfig. Skipping CSV.");
      return;
    }

    const barcodes = svgFiles
      .map(f => path.basename(f))
      .map(parseClientAndSample)
      .filter((x): x is { clientCode: string; sampleID: string } => !!x)
      .map(({ clientCode, sampleID }) => ({ clientCode, sampleID }));

    if (barcodes.length === 0) {
      console.warn("⚠️ No parsable filenames for CSV. Skipping CSV.");
      return;
    }

    const outputDir = config.svgDirectory;
    const labelCreationDate = timestamp.replace("_", " ");

    console.log("🧾 Creating CSV for the same batch...");
    await createBarcodeCSVFile(barcodes as any, outputDir, panelCode, labelCreationDate);

    try {
      const lines = [
        "clientCode,sampleID,panelCode,createdAt",
        ...barcodes.map(b => `${b.clientCode},${b.sampleID},${panelCode},${labelCreationDate}`),
      ];
      await fs.writeFile(outputCsvPath, lines.join("\n"), "utf-8");
      console.log(`🧾 CSV saved to ${outputCsvPath}`);
    } catch (err) {
      console.warn("⚠️ Could not write timestamped CSV file next to the PDF:", err);
    }
  }
}
