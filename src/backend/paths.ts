import path from "path";

/**
 * Repo root.
 * În Next dev / start și în bun run, process.cwd() poate diferi.
 * Ne ancorăm explicit la structura repo-ului.
 */
export const REPO_ROOT = path.resolve(process.cwd());

/**
 * SRC root (unde se află used-sample-ids.json).
 */
export const SRC_ROOT = path.join(REPO_ROOT, "src");

/**
 * Single source of truth for used sample IDs.
 * ⚠️ NU schimba acest path – păstrează continuitatea codurilor deja folosite.
 */
export const USED_SAMPLE_IDS_PATH = path.join(
  SRC_ROOT,
  "used-sample-ids.json"
);

/**
 * Base output directory for generated runs.
 * Fiecare run → src/output/runs/<runId>/
 */
export const OUTPUT_ROOT = path.join(SRC_ROOT, "output");

export const RUNS_ROOT = path.join(OUTPUT_ROOT, "runs");
