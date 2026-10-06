import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { USED_SAMPLE_IDS_PATH } from "../backend/paths";

const TRACKER_PATH = USED_SAMPLE_IDS_PATH;
// --- Tracker ---------------------------------------------------------------
export async function loadUsedSampleIDs(
  ledgerPath = TRACKER_PATH
): Promise<Set<string>> {
  try {
    const data = await fs.readFile(ledgerPath, "utf-8");
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.keys(parsed).length !== 1 || !Object.hasOwn(parsed, "usedSampleIDs")) {
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

async function writeReservations(ledgerPath: string, ids: Set<string>): Promise<void> {
  const temporaryPath = path.join(
    path.dirname(ledgerPath), `.${path.basename(ledgerPath)}.${randomUUID()}.tmp`
  );
  try {
    const handle = await fs.open(temporaryPath, "wx", 0o600);
    try {
      await handle.writeFile(JSON.stringify({ usedSampleIDs: [...ids] }, null, 2) + "\n");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(temporaryPath, ledgerPath);
    // Persist the directory entry too on POSIX. Windows cannot fsync directories.
    if (process.platform !== "win32") {
      const directory = await fs.open(path.dirname(ledgerPath), "r");
      try { await directory.sync(); } finally { await directory.close(); }
    }
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }
}

/** Reserve the whole batch durably before returning any IDs to artifact writers. */
export async function reserveSampleIDs(
  count: number,
  createID: () => string,
  ledgerPath = TRACKER_PATH
): Promise<string[]> {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10_000) {
    throw new Error("Reservation count must be an integer between 1 and 10,000.");
  }
  // Resolve aliases before locking; never replace a symlink instead of its ledger.
  ledgerPath = await fs.realpath(ledgerPath);
  const lockPath = `${ledgerPath}.lock`;
  let lock;
  try {
    lock = await fs.open(lockPath, "wx", 0o600);
  } catch (cause) {
    throw new Error(`Cannot acquire ledger lock ${lockPath}. Another run may be active; inspect the lock before retrying.`, { cause });
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }) + "\n");
    const usedIDs = await loadUsedSampleIDs(ledgerPath);
    const reserved: string[] = [];
    for (let attempt = 0; reserved.length < count && attempt < count * 10; attempt++) {
      const id = createID();
      if (typeof id !== "string" || !/^[A-Z0-9]{10}$/.test(id)) {
        throw new Error("Generated sample ID is invalid; no reservations were written.");
      }
      if (usedIDs.has(id)) continue;
      usedIDs.add(id);
      reserved.push(id);
    }
    if (reserved.length !== count) {
      throw new Error("Could not reserve a complete unique batch; no reservations were written.");
    }
    await writeReservations(ledgerPath, usedIDs);
    return reserved;
  } finally {
    try { await lock.close(); } finally { await fs.unlink(lockPath); }
  }
}
