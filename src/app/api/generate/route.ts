//blood-sample-barcodes/src/app/api/generate/route.ts
import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";

import { generateBarcodeRun } from "@/logic/generateBarcodeInfo";
import { createBarcodePDF } from "@/exporters/pdfGenerator";
import type { BarcodeConfig } from "@/logic/types";
import { OUTPUT_ROOT } from "@/backend/paths";

export const runtime = "nodejs";

type GenerateRequestBody = {
  clientCode?: string;
  panelCode?: string;
  count?: number;
  template?: string; // rezervat (acum doar AAR026)
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as GenerateRequestBody;

    // MVP defaults (poți schimba ulterior din UI)
    const clientCode = body.clientCode ?? "DK010";
    const panelCode = body.panelCode ?? "APV13";
    const count = typeof body.count === "number" ? body.count : 26;

    // Asigură output root în repo
    await fs.mkdir(OUTPUT_ROOT, { recursive: true });

    const barcodeConfig: BarcodeConfig = {
      clientCode,
      panelCode,
      count,
      // IMPORTANT: outputDir trebuie să fie src/output (nu src/output/runs),
      // pentru că generateBarcodeRun adaugă singur /runs/<runId>
      outputDir: OUTPUT_ROOT,
    };

    // 1) Generate SVG + manifest per run
    const run = await generateBarcodeRun(barcodeConfig);

    // 2) Generate PDF + CSV in același runDir, plus update manifest
    await createBarcodePDF({
      svgDirectory: run.runDir,
      manifestPath: run.manifestPath,

      // ✅ timestamped file name
      outputPath: path.join(run.runDir, "labels-{timestamp}.pdf"),

      ...( {
        writeCsv: true,
        panelCode: run.panelCode,

        // ✅ timestamped file name
        csvOutputPath: path.join(run.runDir, "labels-{timestamp}.csv"),
      } as any ),
      layout: {
        pageSize: "A4",
        columns: 2,
        spacing: { vertical: 0 },
      },
    } as any);


    // 3) Return card data (linkurile vor funcționa după ce facem endpoint-ul /file)
    return NextResponse.json({
      runId: run.runId,
      createdAt: run.createdAt,
      template: run.template,
      countRequested: run.countRequested,
      countGenerated: run.countGenerated ?? 0,
      runDir: run.runDir, // util pentru debug local
      pdfUrl: `/api/barcodes/runs/${run.runId}/file?kind=pdf`,
      csvUrl: `/api/barcodes/runs/${run.runId}/file?kind=csv`,
    });
  } catch (err) {
    console.error("❌ /api/barcodes/generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate barcodes." },
      { status: 500 }
    );
  }
}
