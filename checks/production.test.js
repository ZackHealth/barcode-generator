import { expect, test } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";

const root = path.resolve(import.meta.dir, "..");

async function freePort() {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}

test("the production Bun server reserves IDs, exports PDF/CSV, and rejects a corrupt ledger", async () => {
  const realLedger = path.join(root, "src/used-sample-ids.json");
  const original = await fs.readFile(realLedger, "utf8");
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "barcode-bun-api-test-"));
  let child, stdout, stderr;
  try {
    await fs.mkdir(path.join(directory, "src"));
    const ledger = path.join(directory, "src/used-sample-ids.json");
    const initial = ["ABCDEFGH23", "0X5C6X8R8O"];
    await fs.writeFile(ledger, JSON.stringify({ usedSampleIDs: initial }));
    for (const name of [".next", "node_modules"]) {
      await fs.symlink(path.join(root, name), path.join(directory, name), "dir");
    }
    await fs.copyFile(path.join(root, "package.json"), path.join(directory, "package.json"));
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    // Direct Bun execution prevents the Next CLI's Node shebang selecting Node.
    child = Bun.spawn([process.execPath, path.join(root, "node_modules/next/dist/bin/next"),
      "start", "--hostname", "127.0.0.1", "--port", String(port)], {
      cwd: directory, stdout: "pipe", stderr: "pipe",
    });
    stdout = new Response(child.stdout).text();
    stderr = new Response(child.stderr).text();
    let ready = false;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline && child.exitCode === null) {
      try {
        const response = await fetch(`${base}/generator`, { signal: AbortSignal.timeout(1000) });
        await response.arrayBuffer();
        if (response.ok) { ready = true; break; }
      } catch { /* Wait for startup; the final failure includes server output. */ }
      await Bun.sleep(100);
    }
    if (!ready) {
      if (child.exitCode === null) child.kill();
      await child.exited;
      throw new Error(`Bun server did not start: ${await stdout}\n${await stderr}`);
    }
    const generate = () => fetch(`${base}/api/generate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 2, clientCode: "DK010", panelCode: "APV13" }),
      signal: AbortSignal.timeout(30_000),
    });
    const response = await generate();
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.countGenerated).toBe(2);
    const ids = JSON.parse(await fs.readFile(ledger, "utf8")).usedSampleIDs;
    expect(ids.slice(0, 2)).toEqual(initial);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);

    const csvResponse = await fetch(base + result.csvUrl);
    expect(csvResponse.status).toBe(200);
    const [header, ...rows] = (await csvResponse.text()).trim().split(/\r?\n/);
    expect(header).toBe("clientCode,sampleID,panelCode,createdAt");
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.split(",")[1]).sort()).toEqual(ids.slice(2).sort());
    for (const row of rows) {
      const [client, , panel, createdAt] = row.split(",");
      expect(client).toBe("DK010");
      expect(panel).toBe("APV13");
      // Existing CSV format uses filename-style time separators, not ISO time.
      expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}$/);
      const [date, time] = createdAt.split(" ");
      expect(Number.isNaN(Date.parse(`${date}T${time.replaceAll("-", ":")}Z`))).toBe(false);
    }

    const pdfResponse = await fetch(base + result.pdfUrl);
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers.get("content-type")).toContain("application/pdf");
    const pdf = Buffer.from(await pdfResponse.arrayBuffer());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.subarray(-20).toString()).toContain("%%EOF");
    const runDirectory = path.join(directory, "src/output/runs", result.runId);
    const manifest = JSON.parse(await fs.readFile(path.join(runDirectory, "manifest.json"), "utf8"));
    expect(manifest.files.map(file => path.basename(file, ".svg").split("_")[1]).sort()).toEqual(ids.slice(2).sort());
    expect(pdf).toEqual(await fs.readFile(path.join(runDirectory, manifest.pdfFile)));
    expect(manifest.csvFile.endsWith(".csv")).toBe(true);

    await fs.writeFile(ledger, "{corrupt");
    const rejected = await generate();
    expect(rejected.status).toBe(500);
    await rejected.arrayBuffer();
    expect(await fs.readFile(ledger, "utf8")).toBe("{corrupt");
    expect(await fs.readdir(path.join(directory, "src/output/runs"))).toEqual([result.runId]);
    expect(await fs.readFile(realLedger, "utf8")).toBe(original);
  } finally {
    if (child) {
      if (child.exitCode === null) child.kill();
      await child.exited;
      await Promise.all([stdout, stderr]);
    }
    await fs.rm(directory, { recursive: true, force: true });
  }
}, 60_000);
