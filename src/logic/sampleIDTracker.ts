import fs from "fs/promises";
import path from "path";
import { USED_SAMPLE_IDS_PATH } from "../backend/paths";

const TRACKER_PATH = USED_SAMPLE_IDS_PATH;
const LOCK_PATH = path.join(path.dirname(TRACKER_PATH), "used-sample-ids.lock");

// --- Lock helpers ----------------------------------------------------------

export async function acquireUsedIdsLock(): Promise<void> {
  // 'wx' => create exclusively; fails if exists
  const handle = await fs.open(LOCK_PATH, "wx");
  await handle.close();
}

export async function releaseUsedIdsLock(): Promise<void> {
  try {
    await fs.unlink(LOCK_PATH);
  } catch {
    // ignore
  }
}

// --- Tracker ---------------------------------------------------------------
export async function loadUsedSampleIDs(): Promise<Set<string>> {
  try {
    const data = await fs.readFile(TRACKER_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return new Set(parsed.usedSampleIDs ?? []);
  } catch {
    return new Set();
  }
}

export async function saveUsedSampleIDs(set: Set<string>): Promise<void> {
  const data = { usedSampleIDs: Array.from(set) };
  await fs.writeFile(TRACKER_PATH, JSON.stringify(data, null, 2), "utf-8");
}