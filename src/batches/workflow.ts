import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadUsedSampleIDs } from "../logic/sampleIDTracker";
import { validateBatchOptions, type BatchOptions } from "./artifacts";
import type { BarcodeRun } from "../logic/generateBarcodeInfo";
const execute = promisify(execFile);
export type CommandResult = { code: number; stdout: string; stderr?: string };
export type Runner = (tool: string, args: string[]) => Promise<CommandResult>;
export function commandRunner(root: string): Runner {
  return async (tool, args) => {
    try {
      const result = await execute(tool, args, {
        cwd: root,
        timeout: 120_000,
        maxBuffer: 8 * 1024 * 1024,
      });
      return { code: 0, stdout: result.stdout };
    } catch (cause) {
      const error = cause as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message: string;
      };
      return {
        code: typeof error.code === "number" ? error.code : 1,
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? error.message,
      };
    }
  };
}
export class MainUpdatedError extends Error {}
export type PendingBatch = {
  branch: string;
  repository: string;
  audit: string;
  base: string;
  status: "verified" | "failed";
};
export type WorkflowHooks = {
  prepare: () => Promise<void>;
  generate: (options: BatchOptions) => Promise<BarcodeRun>;
  verify: (run: BarcodeRun) => Promise<unknown>;
};
const auth = [
  "-c",
  "credential.helper=",
  "-c",
  "credential.helper=!gh auth git-credential",
];
const pendingPath = (root: string) =>
  path.join(root, ".cache/pending-barcode-batch.json");
function remote(repository: string) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error("Invalid GitHub repository identity.");
  return `https://github.com/${repository}.git`;
}
function commands(runner: Runner) {
  return async (tool: string, args: string[]) => {
    const result = await runner(tool, args);
    if (result.code !== 0)
      throw new Error(
        `${tool} ${args[0]} failed: ${result.stderr || result.stdout}`,
      );
    return result.stdout.trimEnd();
  };
}
async function workflowLock(root: string) {
  const ledger = await fs.realpath(path.join(root, "src/used-sample-ids.json"));
  const file = ledger + ".workflow.lock";
  const lock = await fs.open(file, "wx", 0o600);
  const token = randomUUID();
  const previous = process.env.BARCODE_WORKFLOW_TOKEN;
  try {
    await lock.writeFile(
      JSON.stringify({
        pid: process.pid,
        token,
        createdAt: new Date().toISOString(),
      }),
    );
    if (
      await fs.stat(ledger + ".lock").then(
        () => true,
        (error) => {
          if (error.code === "ENOENT") return false;
          throw error;
        },
      )
    )
      throw new Error(
        "A reservation is active or has a crash lock. Stop and recover it first.",
      );
    process.env.BARCODE_WORKFLOW_TOKEN = token;
  } catch (error) {
    await lock.close();
    await fs.unlink(file);
    throw error;
  }
  return async () => {
    process.env.BARCODE_WORKFLOW_TOKEN = previous;
    if (previous === undefined) delete process.env.BARCODE_WORKFLOW_TOKEN;
    try {
      await lock.close();
    } finally {
      await fs.unlink(file);
    }
  };
}
async function syncMain(root: string, pending: PendingBatch, runner: Runner) {
  const run = commands(runner);
  if (await run("git", ["status", "--porcelain"]))
    throw new Error(
      "Local changes remain; preserve them before switching to main.",
    );
  const local = await loadUsedSampleIDs(
    path.join(root, "src/used-sample-ids.json"),
  );
  await run("git", [
    ...auth,
    "fetch",
    remote(pending.repository),
    "main:refs/remotes/origin/main",
  ]);
  const merged = JSON.parse(
    await run("git", ["show", "origin/main:src/used-sample-ids.json"]),
  );
  const ids = new Set(merged.usedSampleIDs);
  if ([...local].some((id) => !ids.has(id)))
    throw new Error("Main is missing reservations; local branch retained.");
  await run("git", ["switch", "main"]);
  await run("git", ["merge", "--ff-only", "origin/main"]);
  const branch = await run("git", ["branch", "--list", pending.branch]);
  if (branch) await run("git", ["branch", "-d", pending.branch]);
  await fs.rm(pendingPath(root), { force: true });
}
export async function publishPending(
  root: string,
  pending: PendingBatch,
  runner: Runner,
  sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  attempts = 60,
) {
  const run = commands(runner);
  const currentBranch = await run("git", ["branch", "--show-current"]);
  if (currentBranch === "main") {
    const completed = JSON.parse(
      await run("gh", [
        "pr",
        "list",
        "--repo",
        pending.repository,
        "--head",
        pending.branch,
        "--state",
        "all",
        "--json",
        "url,state",
      ]),
    );
    if (completed.length !== 1 || completed[0].state !== "MERGED")
      throw new Error("Resume from the recorded batch branch.");
    await syncMain(root, pending, runner);
    return completed[0].url as string;
  }
  if (currentBranch !== pending.branch)
    throw new Error("Resume from the recorded batch branch.");
  const changes = (
    await run("git", ["status", "--porcelain", "--untracked-files=all"])
  )
    .split("\n")
    .filter(Boolean);
  if (
    changes.some((line) => {
      const file = line.slice(3);
      return (
        file !== "src/used-sample-ids.json" &&
        !file.startsWith(pending.audit + "/")
      );
    })
  ) {
    throw new Error("Unrelated local changes block automatic publication.");
  }
  const baseline = JSON.parse(
    await run("git", ["show", `${pending.base}:src/used-sample-ids.json`]),
  );
  const reservations = await loadUsedSampleIDs(
    path.join(root, "src/used-sample-ids.json"),
  );
  if (baseline.usedSampleIDs.some((id: string) => !reservations.has(id)))
    throw new Error("Historical IDs were removed; publication stopped.");
  const receiptPath = path.join(root, pending.audit, "reservations.json");
  const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  await fs.writeFile(
    receiptPath,
    JSON.stringify(
      {
        ...receipt,
        status: pending.status,
        beforeCount: baseline.usedSampleIDs.length,
        afterCount: reservations.size,
        newIDs: [...reservations].filter(
          (id) => !baseline.usedSampleIDs.includes(id),
        ),
      },
      null,
      2,
    ),
  );
  await run("git", ["add", "src/used-sample-ids.json", pending.audit]);
  if (await run("git", ["diff", "--cached", "--name-only"])) {
    await run("git", [
      "commit",
      "-m",
      `data: preserve barcode reservations (${pending.status})`,
    ]);
  }
  const head = await run("git", ["rev-parse", "HEAD"]);
  await run("git", [
    ...auth,
    "push",
    remote(pending.repository),
    `HEAD:refs/heads/${pending.branch}`,
  ]);
  const prs = JSON.parse(
    await run("gh", [
      "pr",
      "list",
      "--repo",
      pending.repository,
      "--head",
      pending.branch,
      "--state",
      "all",
      "--json",
      "url,state",
    ]),
  );
  if (prs.length > 1) throw new Error("Multiple batch PRs require inspection.");
  let pr = prs[0];
  if (!pr) {
    const body = path.join(root, ".cache/barcode-pr-body.md");
    await fs.writeFile(
      body,
      `Preserve all new barcode reservations. Batch status: ${pending.status}.\n\nAudit: ${pending.audit}. Failed runs keep their IDs permanently. No Drive or printer actions.\n`,
    );
    const url = await run("gh", [
      "pr",
      "create",
      "--repo",
      pending.repository,
      "--base",
      "main",
      "--head",
      pending.branch,
      "--title",
      `Preserve barcode batch reservations (${pending.status})`,
      "--body-file",
      body,
    ]);
    pr = { url, state: "OPEN" };
  }
  if (pr.state === "CLOSED")
    throw new Error(`Reservation PR was closed without merge: ${pr.url}`);
  if (pr.state !== "MERGED") {
    let passed = false;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = await runner("gh", [
        "pr",
        "checks",
        pr.url,
        "--repo",
        pending.repository,
        "--json",
        "name,bucket,event,workflow",
      ]);
      if (
        result.code !== 0 &&
        result.code !== 8 &&
        !result.stderr?.includes("no checks")
      ) {
        throw new Error(`Cannot verify CI: ${result.stderr || result.stdout}`);
      }
      const checks = result.stdout.trim() ? JSON.parse(result.stdout) : [];
      if (
        checks.some((check: { bucket: string }) =>
          ["fail", "cancel"].includes(check.bucket),
        )
      ) {
        throw new Error(
          `CI failed. Reservations remain committed on ${pending.branch}: ${pr.url}`,
        );
      }
      const safety = checks.filter(
        (check: { workflow: string }) => check.workflow === "Ledger safety",
      );
      if (
        safety.some(
          (check: { event: string }) => check.event === "pull_request",
        ) &&
        checks.every((check: { bucket: string }) => check.bucket === "pass")
      ) {
        passed = true;
        break;
      }
      await sleep(10_000);
    }
    if (!passed)
      throw new Error(`CI did not finish; resume this batch later: ${pr.url}`);
    await run("gh", [
      "pr",
      "merge",
      pr.url,
      "--repo",
      pending.repository,
      "--merge",
      "--match-head-commit",
      head,
    ]);
  }
  await syncMain(root, pending, runner);
  return pr.url as string;
}
export async function runBatchWorkflow(
  root: string,
  options: BatchOptions,
  hooks: WorkflowHooks,
  runner: Runner,
) {
  validateBatchOptions(options);
  const unlock = await workflowLock(root);
  const run = commands(runner);
  try {
    if (
      await fs.stat(pendingPath(root)).then(
        () => true,
        () => false,
      )
    )
      throw new Error(
        "Resume the pending batch instead of generating new IDs.",
      );
    if (
      (await run("git", ["rev-parse", "--show-toplevel"])) !== root ||
      (await run("git", ["branch", "--show-current"])) !== "main" ||
      (await run("git", ["status", "--porcelain"]))
    ) {
      throw new Error(
        "Start from a clean main checkout at the repository root.",
      );
    }
    const repository = await run("gh", [
      "repo",
      "view",
      "--json",
      "nameWithOwner",
      "--jq",
      ".nameWithOwner",
    ]);
    await run("gh", ["auth", "status"]);
    const before = await loadUsedSampleIDs(
      path.join(root, "src/used-sample-ids.json"),
    );
    await run("git", [
      ...auth,
      "fetch",
      remote(repository),
      "main:refs/remotes/origin/main",
    ]);
    const base = await run("git", ["rev-parse", "origin/main"]);
    const remoteLedger = JSON.parse(
      await run("git", ["show", "origin/main:src/used-sample-ids.json"]),
    );
    if ([...before].some((id) => !remoteLedger.usedSampleIDs.includes(id)))
      throw new Error("Main lacks local reservations; reconcile first.");
    const head = await run("git", ["rev-parse", "HEAD"]);
    await run("git", ["merge", "--ff-only", "origin/main"]);
    if (head !== base)
      throw new MainUpdatedError(
        "Main updated. Restart with the merged implementation.",
      );
    await hooks.prepare();
    const batchId = `${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
    const pending: PendingBatch = {
      branch: `chore/barcode-batch-${batchId}`,
      repository,
      base,
      audit: `docs/ledger-generations/${batchId}`,
      status: "failed",
    };
    await run("git", ["switch", "-c", pending.branch]);
    await fs.mkdir(path.join(root, pending.audit), { recursive: true });
    await fs.writeFile(
      path.join(root, pending.audit, "reservations.json"),
      JSON.stringify({ ...pending, options }),
    );
    await fs.mkdir(path.dirname(pendingPath(root)), { recursive: true });
    await fs.writeFile(pendingPath(root), JSON.stringify(pending));
    let batch: BarcodeRun | undefined;
    let failure: unknown;
    try {
      batch = await hooks.generate(options);
      await hooks.verify(batch);
      pending.status = "verified";
    } catch (error) {
      failure = error;
    }
    const after = await loadUsedSampleIDs(
      path.join(root, "src/used-sample-ids.json"),
    );
    if ([...before].some((id) => !after.has(id)))
      throw new Error(
        "Historical reservation lost. Stop and recover; do not switch branches.",
      );
    if (after.size === before.size) {
      await fs.rm(path.join(root, pending.audit), {
        recursive: true,
        force: true,
      });
      await fs.rm(pendingPath(root), { force: true });
      await run("git", ["switch", "main"]);
      await run("git", ["branch", "-d", pending.branch]);
      throw failure || new Error("No reservations were added.");
    }
    await fs.writeFile(pendingPath(root), JSON.stringify(pending));
    if (batch) {
      for (const file of ["manifest.json", "verification.json"]) {
        try {
          await fs.copyFile(
            path.join(batch.runDir, file),
            path.join(root, pending.audit, file),
          );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
      const manifest = JSON.parse(
        await fs.readFile(batch.manifestPath, "utf8"),
      );
      if (manifest.csvFile)
        await fs.copyFile(
          path.join(batch.runDir, path.basename(manifest.csvFile)),
          path.join(root, pending.audit, path.basename(manifest.csvFile)),
        );
    }
    await fs.writeFile(
      path.join(root, pending.audit, "reservations.json"),
      JSON.stringify(
        {
          ...pending,
          options,
          beforeCount: before.size,
          afterCount: after.size,
          newIDs: [...after].filter((id) => !before.has(id)),
          runId: batch?.runId,
          error: failure ? String(failure) : null,
        },
        null,
        2,
      ),
    );
    await fs.mkdir(path.dirname(pendingPath(root)), { recursive: true });
    await fs.writeFile(pendingPath(root), JSON.stringify(pending));
    const pr = await publishPending(root, pending, runner);
    if (failure)
      throw new Error(
        `Batch failed; reservations preserved and merged in ${pr}. ${String(failure)}`,
      );
    return { run: batch!, pr };
  } finally {
    await unlock();
  }
}
export async function resumeBatch(root: string, runner: Runner) {
  const unlock = await workflowLock(root);
  try {
    const pending = JSON.parse(await fs.readFile(pendingPath(root), "utf8"));
    const pr = await publishPending(root, pending, runner);
    return { pr, status: pending.status };
  } finally {
    await unlock();
  }
}
