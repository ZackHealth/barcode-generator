import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import { RUNS_ROOT } from "@/backend/paths";

export const runtime = "nodejs";

type RunManifest = {
  runId: string;
  createdAt: string;
  template?: string;
  countRequested?: number;
  countEffective?: number;
  countGenerated?: number;
  clientCode?: string;
  panelCode?: string;
  pdfFile?: string | null;
  csvFile?: string | null;
};

type RunCard = {
  runId: string;
  createdAt: string;
  template: string;
  countGenerated: number;
  pdfUrl: string;
  csvUrl: string;
};

async function readManifest(runId: string): Promise<RunManifest | null> {
  try {
    const manifestPath = path.join(RUNS_ROOT, runId, "manifest.json");
    const raw = await fs.readFile(manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<RunManifest>;
    if (!parsed.runId || !parsed.createdAt) return null;
    return parsed as RunManifest;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") ?? 50)));

    // list run folders
    let entries: string[] = [];
    try {
      entries = await fs.readdir(RUNS_ROOT);
    } catch {
      // if runs root doesn't exist yet
      return NextResponse.json({ runs: [] satisfies RunCard[] });
    }

    const manifests = await Promise.all(entries.map(readManifest));
    const valid = manifests.filter((m): m is RunManifest => !!m);

    valid.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

    const sliced = valid.slice(0, limit);

    const runs: RunCard[] = sliced.map(m => ({
      runId: m.runId,
      createdAt: m.createdAt,
      template: m.template ?? "AAR026",
      countGenerated: m.countGenerated ?? 0,
      pdfUrl: `/api/barcodes/runs/${m.runId}/file?kind=pdf`,
      csvUrl: `/api/barcodes/runs/${m.runId}/file?kind=csv`,
    }));

    return NextResponse.json({ runs });
  } catch (err) {
    console.error("❌ /api/barcodes/runs error:", err);
    return NextResponse.json({ error: "Failed to list runs." }, { status: 500 });
  }
}
