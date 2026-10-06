import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
const project = path.resolve(import.meta.dirname, "../..");
export async function prepareVerifier(root = process.cwd()): Promise<string> {
  const environment = path.join(root, ".cache/barcode-verifier");
  const python = path.join(
    environment,
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const check =
    "import importlib.metadata as m; import pymupdf,numpy,zxingcpp; assert all(m.version(p)==v for p,v in [('pymupdf','1.28.2'),('numpy','2.5.3'),('zxing-cpp','3.1.1')])";
  try {
    await execute(python, ["-c", check]);
    return python;
  } catch {
    /* Prepare the pinned, isolated verifier before reserving IDs. */
  }
  await fs.mkdir(path.dirname(environment), { recursive: true });
  await execute(process.platform === "win32" ? "python" : "python3", [
    "-m",
    "venv",
    environment,
  ]);
  await execute(
    python,
    [
      "-m",
      "pip",
      "install",
      "-r",
      path.join(project, "scripts/verifier-requirements.txt"),
    ],
    { timeout: 180_000 },
  );
  await execute(python, ["-c", check]);
  return python;
}
export async function verifyBatch(
  runDirectory: string,
  python: string,
  root = process.cwd(),
) {
  const runs = await fs.realpath(path.join(root, "src/output/runs"));
  const run = await fs.realpath(runDirectory);
  const checkout = await fs.realpath(root);
  if (!runs.startsWith(checkout + path.sep) || !run.startsWith(runs + path.sep))
    throw new Error("Verify only local run folders inside this checkout.");
  await execute(
    python,
    [
      path.join(project, "scripts/verify-batch.py"),
      run,
      path.join(root, "src/used-sample-ids.json"),
    ],
    { timeout: 180_000, maxBuffer: 4 * 1024 * 1024 },
  );
  return JSON.parse(
    await fs.readFile(path.join(run, "verification.json"), "utf8"),
  );
}
