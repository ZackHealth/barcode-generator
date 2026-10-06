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
export async function loadUsedSampleIDs(
  ledgerPath = TRACKER_PATH
): Promise<Set<string>> {
  try {
    const data = await fs.readFile(ledgerPath, "utf-8");
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected an object containing usedSampleIDs.");
    }
    const ids = (parsed as { usedSampleIDs?: unknown }).usedSampleIDs;
    if (!Array.isArray(ids) || ids.length === 0 ||
      ids.some(id => typeof id !== "string" || !/^[A-Z0-9]{10}$/.test(id))) {
      throw new Error("Expected a nonempty array of ten-character uppercase alphanumeric IDs.");
    }
    const unique = new Set<string>(ids);
    if (unique.size !== ids.length) {
      throw new Error("The ledger contains duplicate reservations.");
    }
    return unique;
  } catch (cause) {
    throw new Error(
      `Cannot read a valid barcode ledger at ${ledgerPath}. Generation stopped; restore the complete ledger before retrying.`,
      { cause }
    );
  }
}

export async function saveUsedSampleIDs(set: Set<string>): Promise<void> {
  const data = { usedSampleIDs: Array.from(set) };
  await fs.writeFile(TRACKER_PATH, JSON.stringify(data, null, 2), "utf-8");
}
