import path from "node:path";
import { spawn } from "node:child_process";
import {
  generateBatch,
  validateBatchOptions,
  type BatchOptions,
} from "./artifacts";
import { prepareVerifier, verifyBatch } from "./verification";
import {
  runBatchWorkflow,
  resumeBatch,
  commandRunner,
  MainUpdatedError,
} from "./workflow";
export function parseBatchArgs(args: string[]): BatchOptions {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!;
    const value = args[index + 1];
    if (
      !["--pages", "--client", "--panel"].includes(key) ||
      !value ||
      values.has(key)
    ) {
      throw new Error(
        "Use exactly --pages <1–20> --client <code> --panel <code>.",
      );
    }
    values.set(key, value);
  }
  if (values.size !== 3)
    throw new Error("Page count, client and panel must all be explicit.");
  const options = {
    pages: Number(values.get("--pages")),
    clientCode: values.get("--client")!,
    panelCode: values.get("--panel")!,
  };
  validateBatchOptions(options);
  return options;
}
async function main() {
  const [operation, ...args] = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "bun run batch --pages 10 --client DK010 --panel APV13\nbun run batch:resume\nbun run batch:verify --run-id <local-run-id>",
    );
    return;
  }
  const root = process.cwd();
  if (operation === "generate") {
    const options = parseBatchArgs(args);
    let python = "";
    const result = await runBatchWorkflow(
      root,
      options,
      {
        prepare: async () => {
          python = await prepareVerifier(root);
        },
        generate: generateBatch,
        verify: (run) => verifyBatch(run.runDir, python, root),
      },
      commandRunner(root),
    );
    console.log(
      JSON.stringify({
        runId: result.run.runId,
        directory: result.run.runDir,
        count: result.run.countGenerated,
        mergedPR: result.pr,
      }),
    );
  } else if (operation === "resume" && args.length === 0) {
    console.log(JSON.stringify(await resumeBatch(root, commandRunner(root))));
  } else if (
    operation === "verify" &&
    args.length === 2 &&
    args[0] === "--run-id" &&
    /^[A-Za-z0-9_-]+$/.test(args[1]!)
  ) {
    const python = await prepareVerifier(root);
    console.log(
      JSON.stringify(
        await verifyBatch(
          path.join(root, "src/output/runs", args[1]!),
          python,
          root,
        ),
      ),
    );
  } else
    throw new Error(
      "Unknown operation or arguments. Use --help; output destinations cannot be overridden.",
    );
}
if (import.meta.main) {
  main().catch(async (error) => {
    if (
      error instanceof MainUpdatedError &&
      Number(process.env.BARCODE_MAIN_REFRESHES || 0) < 3
    ) {
      const child = spawn(process.execPath, process.argv.slice(1), {
        stdio: "inherit",
        env: {
          ...process.env,
          BARCODE_MAIN_REFRESHES: String(
            Number(process.env.BARCODE_MAIN_REFRESHES || 0) + 1,
          ),
        },
      });
      child.on("exit", (code) => {
        process.exitCode = code ?? 1;
      });
      child.on("error", (cause) => {
        console.error(cause);
        process.exitCode = 1;
      });
      return;
    }
    console.error(String(error));
    console.error(
      "Keep all reservations and outputs. If publication is pending, run bun run batch:resume; never regenerate the failed batch.",
    );
    process.exitCode = 1;
  });
}
