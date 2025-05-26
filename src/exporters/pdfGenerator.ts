import fsPromises from "fs/promises";
import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import path from "path";
import { getBarcodeRasterSize } from "../logic/barCodeDimensions";
import { getBarcodePhysicalDimensions, } from "../logic/barCodeDimensions.ts";
import type { PDFConfig } from "../logic/types";
import { DEFAULT_LAYOUT, PAGE_SIZES } from "./pdfDefaults";


const { widthPx, heightPx } = getBarcodeRasterSize(300);



export async function createBarcodePDF(config: PDFConfig) {
  console.log("📥 Starting createBarcodePDF");
  const layout = { ...DEFAULT_LAYOUT, ...config.layout };
  const { width: pageW, height: pageH } = PAGE_SIZES[layout.pageSize];
  const { widthPt: w, heightPt: h } = getBarcodePhysicalDimensions();
  console.log(`🗒 Layout: ${layout.columns} columns, page ${pageW}×${pageH}pt`);

  // 1) Read SVG filenames
  const svgFiles = (await fsPromises.readdir(config.svgDirectory))
    .filter(f => f.endsWith(".svg"));
  console.log(`📂 Found ${svgFiles.length} SVG files`);


  // 2) Convert SVG → high-res PNG at 300 DPI
  console.log(`🔢 Raster target: ${widthPx}×${heightPx} px`);
  const images = await Promise.all(svgFiles.map(async file => {
    console.log(`🔄 Converting ${file} at 300 DPI`);
    const svgBuf = await fsPromises.readFile(path.join(config.svgDirectory, file));
    const pngBuf = await sharp(svgBuf, { density: 300 })
      .resize(widthPx, heightPx, {
        fit:        "contain",
        background: "#ffffff"    // ← fill any transparent bars with white
      })
      .png({ compressionLevel: 0 })
      .toBuffer();
    return { buffer: pngBuf };
  }));
  console.log(`✅ Converted ${images.length} images to 300 DPI PNG`);

  // 3) Create PDF document & pipe
  const doc = new PDFDocument({ size: [pageW, pageH], margin: 0 });
  const stream = createWriteStream(config.outputPath);
  console.log("📤 Piping PDFDocument to file stream");
  doc.pipe(stream);

  // Debug events
  doc.on("pageAdded", () => console.log("📄 pageAdded event"));
  doc.on("end",       () => console.log("🏁 doc end event"));
  stream.on("close",   () => console.log("🔒 stream close event"));
  stream.on("error",   err => console.error("❌ stream error:", err));

  // 4) Layout loop
  const cols   = layout.columns;
  const centralGap = 10;                          // gap = barcode height
  const totalW    = cols * w + centralGap;       // 2*w + gap
  const offsetX   = (pageW - totalW) / 2;        // center the block
  const vSpace = layout.spacing.vertical;
  const rowsPerCol = Math.floor(pageH / (h + vSpace));
  const maxRows    = Math.floor(pageH / (h + vSpace));
  const borderIndex = Math.floor(rowsPerCol / 2);
  let offsetY     = (pageH / 2) - (borderIndex * (h + vSpace));
  const totalHeight = maxRows * (h + vSpace) - vSpace;

    // clamp offsetY so the block stays on the page
  if (offsetY < 0) {
    offsetY = 0;
  } else if (offsetY + totalHeight > pageH) {
    offsetY = pageH - totalHeight;
  }
  
  console.log(`🇾 offsetY=${offsetY.toFixed(1)}, totalHeight=${totalHeight.toFixed(1)}, pageH=${pageH}`);
  console.log(`📐 rowsPerCol: ${rowsPerCol}`);


  let idx = 0, page = 0;
  while (idx < images.length) {
    console.log(`🏷 Starting page ${page + 1}`);
    if (page > 0) {
      doc.addPage({ size: [pageW, pageH], margin: 0 });
    }
    for (let col = 0; col < cols && idx < images.length; col++) {
      for (let row = 0; row < maxRows && idx < images.length; row++) {
        const x = offsetX + col * (w + centralGap);
        let y = offsetY + row * (h + vSpace);
        if (row >= borderIndex) {
          y += centralGap;
        }

        if (row >= borderIndex) {
          y += centralGap;
        }

        console.log(`   📍 Placing image ${idx + 1} at (${x.toFixed(1)},${y.toFixed(1)})`);
        const image = images[idx]!;
        doc.image(image.buffer, x, y, { width: w, height: h });
        // draw a 1-point horizontal border at the bottom of the label
        doc
          .save()
          .strokeColor('#EEEEEE')           
          .lineWidth(1)
          // top border (optional)
          .moveTo(x, y)
          .lineTo(x + w, y)
          // right border
          .moveTo(x + w, y)
          .lineTo(x + w, y + h)
          // bottom border
          .moveTo(x + w, y + h)
          .lineTo(x,     y + h)
          // left border
          .moveTo(x,     y + h)
          .lineTo(x,     y)
          .stroke()
          .restore();
              idx++;
        }
      }
    page++;    
    offsetY = 0;
  }
  console.log(`🗒 Finished layout loop; total pages: ${page}`);

  // 5) Finalize
  console.log("🔚 Calling doc.end()");
  doc.end();

  console.log("⏳ Waiting for PDF to finish...");
  await new Promise<void>((resolve, reject) => {
    // resolve on either doc.end or stream.close
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

  console.log(`🎉 PDF saved to ${config.outputPath}`);
}
