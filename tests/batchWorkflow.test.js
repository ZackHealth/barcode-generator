import { test, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  commandRunner,
  runBatchWorkflow,
  resumeBatch,
} from "../src/batches/workflow";
import { parseBatchArgs } from "../src/batches/cli";
let root, remote, directory, runner, checks, pushed, calls;
const initial = "ABCDEFGH23",
  added = "NEWABCDE23";
const options = { pages: 1, clientCode: "DK010", panelCode: "APV13" };
async function git(...args) {
  const result = await commandRunner(root)("git", args);
  if (result.code) throw Error(result.stderr);
  return result.stdout.trim();
}
beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-workflow-"));
  root = path.join(directory, "checkout");
  remote = path.join(directory, "remote.git");
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(
    path.join(root, "src/used-sample-ids.json"),
    JSON.stringify({ usedSampleIDs: [initial] }),
  );
  await fs.writeFile(
    path.join(root, ".gitignore"),
    ".cache/\n*.lock\nsrc/output/\n",
  );
  await git("init", "-b", "main");
  await git("config", "user.name", "Test");
  await git("config", "user.email", "test@example.com");
  await git("add", ".");
  await git("commit", "-m", "baseline");
  await git("init", "--bare", remote);
  await git("remote", "add", "origin", remote);
  await git("push", "origin", "main");
  checks = "pass";
  pushed = false;
  calls = [];
  runner = async (tool, args) => {
    calls.push([tool, ...args]);
    if (tool === "git")
      return commandRunner(root)(
        tool,
        args.map((x) => (x.startsWith("https://github.com/") ? remote : x)),
      );
    if (args[0] === "repo") return { code: 0, stdout: "Test/barcodes" };
    if (args[0] === "auth") return { code: 0, stdout: "" };
    if (args[1] === "list")
      return {
        code: 0,
        stdout: pushed
          ? '[{"url":"https://github.com/Test/barcodes/pull/1","state":"OPEN"}]'
          : "[]",
      };
    if (args[1] === "create") {
      pushed = true;
      return { code: 0, stdout: "https://github.com/Test/barcodes/pull/1" };
    }
    if (args[1] === "checks")
      return {
        code: 0,
        stdout: JSON.stringify([
          { workflow: "Ledger safety", event: "pull_request", bucket: checks },
        ]),
      };
    if (args[1] === "merge") {
      await git("push", "origin", "HEAD:main");
      return { code: 0, stdout: "" };
    }
    throw Error("Unexpected command");
  };
});
afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true });
});
function hooks(failure) {
  return {
    prepare: async () => {},
    generate: async () => {
      await fs.writeFile(
        path.join(root, "src/used-sample-ids.json"),
        JSON.stringify({ usedSampleIDs: [initial, added] }),
      );
      if (failure === "generation") throw Error("disk failed");
      const runDir = path.join(root, "src/output/runs/test");
      await fs.mkdir(runDir, { recursive: true });
      const manifestPath = path.join(runDir, "manifest.json");
      await fs.writeFile(manifestPath, "{}");
      return { runDir, runId: "test", manifestPath };
    },
    verify: async () => {
      if (failure === "verification") throw Error("barcode mismatch");
    },
  };
}
test("successful batch publishes reservations and returns to clean main", async () => {
  const result = await runBatchWorkflow(root, options, hooks(), runner);
  expect(result.pr).toContain("/pull/1");
  expect(await git("branch", "--show-current")).toBe("main");
  expect(await git("status", "--porcelain")).toBe("");
  expect(
    JSON.parse(await fs.readFile(path.join(root, "src/used-sample-ids.json")))
      .usedSampleIDs,
  ).toEqual([initial, added]);
  expect(
    await fs.exists(path.join(root, ".cache/pending-barcode-batch.json")),
  ).toBe(false);
  expect(calls.every((call) => ["git", "gh"].includes(call[0]))).toBe(true);
});
test.each(["generation", "verification"])(
  "%s failure still commits and merges burned IDs",
  async (failure) => {
    await expect(
      runBatchWorkflow(root, options, hooks(failure), runner),
    ).rejects.toThrow("reservations preserved and merged");
    expect(await git("branch", "--show-current")).toBe("main");
    expect(await git("status", "--porcelain")).toBe("");
    expect(
      JSON.parse(await fs.readFile(path.join(root, "src/used-sample-ids.json")))
        .usedSampleIDs,
    ).toContain(added);
  },
);
test("failed CI preserves the batch and resume publishes without generation", async () => {
  checks = "fail";
  await expect(
    runBatchWorkflow(root, options, hooks(), runner),
  ).rejects.toThrow("CI failed");
  expect(await git("branch", "--show-current")).toStartWith(
    "chore/barcode-batch-",
  );
  expect(await git("status", "--porcelain")).toBe("");
  checks = "pass";
  await resumeBatch(root, runner);
  expect(await git("branch", "--show-current")).toBe("main");
  expect(
    JSON.parse(await fs.readFile(path.join(root, "src/used-sample-ids.json")))
      .usedSampleIDs,
  ).toEqual([initial, added]);
});
test("dirty checkout and missing verifier stop before reservation", async () => {
  await fs.writeFile(path.join(root, "unrelated"), "work");
  await expect(
    runBatchWorkflow(root, options, hooks(), runner),
  ).rejects.toThrow("clean main");
  await fs.rm(path.join(root, "unrelated"));
  const broken = hooks();
  broken.prepare = async () => {
    throw Error("no python");
  };
  await expect(runBatchWorkflow(root, options, broken, runner)).rejects.toThrow(
    "no python",
  );
  expect(await git("branch", "--show-current")).toBe("main");
  expect(await git("status", "--porcelain")).toBe("");
});
test.each(
  [
    [],
    ["--pages", "0", "--client", "DK010", "--panel", "APV13"],
    ["--pages", "21", "--client", "DK010", "--panel", "APV13"],
    [
      "--pages",
      "10",
      "--client",
      "DK010",
      "--panel",
      "APV13",
      "--output",
      "I:/Drive",
    ],
  ].map((args) => ({ args })),
)("invalid command %j fails closed", ({ args }) => {
  expect(() => parseBatchArgs(args)).toThrow();
});

test("missing PR CI never allows merge", async () => {
  const { publishPending } = await import("../src/batches/workflow");
  checks = "fail";
  await expect(
    runBatchWorkflow(root, options, hooks(), runner),
  ).rejects.toThrow("CI failed");
  const pending = JSON.parse(
    await fs.readFile(path.join(root, ".cache/pending-barcode-batch.json")),
  );
  const noChecks = async (tool, args) =>
    tool === "gh" && args[1] === "checks"
      ? { code: 0, stdout: "[]" }
      : runner(tool, args);
  await expect(
    publishPending(root, pending, noChecks, async () => {}, 1),
  ).rejects.toThrow("CI did not finish");
  expect(calls.some((call) => call[0] === "gh" && call[2] === "merge")).toBe(
    false,
  );
});
test("failure after checkout of main can resume cleanup of an already merged PR", async () => {
  let merged = false,
    failOnce = true;
  const interrupted = async (tool, args) => {
    if (tool === "gh" && args[1] === "merge") merged = true;
    if (merged && tool === "git" && args[0] === "merge" && failOnce) {
      failOnce = false;
      return { code: 1, stdout: "", stderr: "interrupted" };
    }
    if (merged && tool === "gh" && args[1] === "list")
      return {
        code: 0,
        stdout:
          '[{"url":"https://github.com/Test/barcodes/pull/1","state":"MERGED"}]',
      };
    return runner(tool, args);
  };
  await expect(
    runBatchWorkflow(root, options, hooks(), interrupted),
  ).rejects.toThrow("interrupted");
  expect(await git("branch", "--show-current")).toBe("main");
  await resumeBatch(root, interrupted);
  expect(await git("status", "--porcelain")).toBe("");
  expect(
    await fs.exists(path.join(root, ".cache/pending-barcode-batch.json")),
  ).toBe(false);
  expect(
    JSON.parse(await fs.readFile(path.join(root, "src/used-sample-ids.json")))
      .usedSampleIDs,
  ).toContain(added);
});
