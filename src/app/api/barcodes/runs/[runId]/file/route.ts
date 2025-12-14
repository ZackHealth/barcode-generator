import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { NextResponse } from "next/server";

import { RUNS_ROOT } from "@/backend/paths";

export const runtime = "nodejs";

type Kind = "pdf" | "csv";

async function readManifest(runDir: string) {
  const manifestPath = path.join(runDir, "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(raw) as {
    runId?: string;
    createdAt?: string;
    pdfFile?: string | null;
    csvFile?: string | null;
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await ctx.params;

    const url = new URL(_req.url);
    const kind = (url.searchParams.get("kind") ?? "pdf") as Kind;

    if (kind !== "pdf" && kind !== "csv") {
      return NextResponse.json(
        { error: "Invalid kind. Use ?kind=pdf or ?kind=csv" },
        { status: 400 }
      );
    }

    const runDir = path.join(RUNS_ROOT, runId);

    // verify manifest exists
    const manifest = await readManifest(runDir);

    const filenameFromManifest =
      kind === "pdf" ? manifest.pdfFile : manifest.csvFile;

    // If manifest hasn't been updated yet, fall back to conventional names
    const fallbackName = kind === "pdf" ? "labels.pdf" : "labels.csv";
    const filename = filenameFromManifest || fallbackName;

    const filePath = path.join(runDir, filename);

    // Ensure file exists
    await fs.access(filePath);

    const stream = createReadStream(filePath);

    const contentType =
      kind === "pdf" ? "application/pdf" : "text/csv; charset=utf-8";

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("❌ /api/barcodes/runs/[runId]/file error:", err);
    return NextResponse.json(
      { error: "File not found." },
      { status: 404 }
    );
  }
}
