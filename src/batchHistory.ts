import fs from "fs/promises";
import path from "path";

import type { BatchResult } from "./runBatch";

export const HISTORY_FILENAME = "batch-history.json";

export type BatchHistoryEntry = Pick<
  BatchResult,
  | "id"
  | "clientCode"
  | "panelCode"
  | "requested"
  | "generated"
  | "outputDir"
  | "manifestPath"
  | "createdAt"
  | "pdfPath"
  | "csvPath"
> & {
  manifestFiles?: string[];
};

function toHistoryPath(outputDir: string) {
  return path.resolve(outputDir, HISTORY_FILENAME);
}

export function toHistoryEntry(batch: BatchResult): BatchHistoryEntry {
  return {
    id: batch.id,
    clientCode: batch.clientCode,
    panelCode: batch.panelCode,
    requested: batch.requested,
    generated: batch.generated,
    outputDir: path.resolve(batch.outputDir),
    manifestPath: batch.manifestPath,
    createdAt: batch.createdAt,
    pdfPath: batch.pdfPath,
    csvPath: batch.csvPath,
    manifestFiles: batch.manifestFiles,
  };
}

export async function loadBatchHistory(outputDir: string): Promise<BatchHistoryEntry[]> {
  const historyPath = toHistoryPath(outputDir);
  try {
    const raw = await fs.readFile(historyPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry: Record<string, unknown>) => typeof entry?.id === "string")
      .map((entry: BatchHistoryEntry) => ({
        ...entry,
        outputDir: path.resolve(entry.outputDir),
      }));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }
    console.warn("⚠️ Failed to load batch history", error);
    return [];
  }
}

async function saveBatchHistory(outputDir: string, entries: BatchHistoryEntry[]) {
  const historyPath = toHistoryPath(outputDir);
  await fs.mkdir(path.dirname(historyPath), { recursive: true });
  await fs.writeFile(historyPath, JSON.stringify(entries, null, 2));
}

export async function appendBatchHistory(batch: BatchResult): Promise<BatchHistoryEntry> {
  const entry = toHistoryEntry(batch);
  const history = await loadBatchHistory(entry.outputDir);
  const filtered = history.filter(existing => existing.id !== entry.id);
  filtered.push(entry);
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await saveBatchHistory(entry.outputDir, filtered);
  return entry;
}
