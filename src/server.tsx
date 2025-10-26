/** @jsxImportSource bun */

import fs from "fs/promises";
import path from "path";

import { renderToHtml } from "bun/jsx-runtime";

import { runBarcodeBatch, type BatchResult } from "./runBatch";
import { loadBatchHistory, type BatchHistoryEntry } from "./batchHistory";

const batches = new Map<string, BatchResult>();
const historyIndex = new Map<string, BatchHistoryEntry>();
const DEFAULT_OUTPUT_DIR = "./output/barcodes";
const knownOutputDirs = new Set<string>([path.resolve(DEFAULT_OUTPUT_DIR)]);

type BatchRecord = BatchResult | BatchHistoryEntry;

async function refreshHistoryFor(outputDir: string) {
  const resolved = path.resolve(outputDir);
  knownOutputDirs.add(resolved);

  const entries = await loadBatchHistory(resolved);
  for (const [id, entry] of historyIndex.entries()) {
    if (path.resolve(entry.outputDir) === resolved) {
      historyIndex.delete(id);
    }
  }
  for (const entry of entries) {
    historyIndex.set(entry.id, entry);
  }
}

async function ensureHistoryLoaded() {
  for (const dir of knownOutputDirs) {
    await refreshHistoryFor(dir);
  }
}

function toRelative(filePath?: string) {
  if (!filePath) return undefined;
  return path.relative(process.cwd(), filePath);
}

function BatchTable({ batches }: { batches: BatchRecord[] }) {
  if (batches.length === 0) {
    return (
      <p className="empty">No batches generated in this session yet.</p>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Batch</th>
          <th>Client</th>
          <th>Panel</th>
          <th>Labels</th>
          <th>Created</th>
          <th>Files</th>
        </tr>
      </thead>
      <tbody>
        {batches.map(batch => (
          <tr>
            <td>{batch.id}</td>
            <td>{batch.clientCode}</td>
            <td>{batch.panelCode}</td>
            <td>{`${batch.generated}/${batch.requested}`}</td>
            <td>{new Date(batch.createdAt).toLocaleString()}</td>
            <td>
              <div className="file-links">
                <a href={`/download/${batch.id}/pdf`} target="_blank" rel="noopener">
                  PDF
                </a>
                <a href={`/download/${batch.id}/csv`} target="_blank" rel="noopener">
                  CSV
                </a>
                <a href={`/download/${batch.id}/manifest`} target="_blank" rel="noopener">
                  Manifest
                </a>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IndexPage({ batches }: { batches: BatchRecord[] }) {
  const script = String.raw`
    const form = document.getElementById("batch-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formEl = event.currentTarget;
      if (!(formEl instanceof HTMLFormElement)) {
        return;
      }
      const data = new FormData(formEl);
      const payload = {
        clientCode: data.get("clientCode"),
        panelCode: data.get("panelCode"),
        count: Number(data.get("count")),
        outputDir: data.get("outputDir"),
      };
      const button = formEl.querySelector("button[type=submit]");
      if (button) {
        button.disabled = true;
        button.textContent = "Generating…";
      }
      const status = document.getElementById("status");
      status?.classList.remove("error");
      status && (status.textContent = "Running batch…");
      try {
        const response = await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const body = await response.json();
        if (status) {
          status.textContent = "Created " + body.batch.generated + " label(s).";
        }
        window.location.reload();
      } catch (error) {
        console.error(error);
        status && (status.textContent = "Failed to create batch.");
        status?.classList.add("error");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Generate batch";
        }
      }
    });
  `;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Barcode batches</title>
        <style>{`
          :root {
            color-scheme: light;
            font-family: system-ui, sans-serif;
            line-height: 1.5;
          }
          body {
            margin: 0;
            background: #f8fafc;
          }
          main {
            max-width: 960px;
            margin: 0 auto;
            padding: 2.5rem 1.5rem 4rem;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1.75rem;
          }
          form {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem 1.5rem;
            align-items: end;
          }
          label {
            display: flex;
            flex-direction: column;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            color: #475569;
            gap: 0.35rem;
          }
          input {
            appearance: none;
            border-radius: 8px;
            border: 1px solid #cbd5f5;
            padding: 0.6rem 0.75rem;
            font-size: 1rem;
          }
          button {
            border: none;
            border-radius: 999px;
            background: #2563eb;
            color: white;
            font-weight: 600;
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          button:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }
          section {
            margin-top: 2.5rem;
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.95rem;
          }
          thead th {
            font-size: 0.8rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #64748b;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .file-links {
            display: flex;
            gap: 0.75rem;
          }
          .file-links a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
          }
          .page-links {
            margin-top: 1.5rem;
          }
          .page-links a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
          }
          #status {
            grid-column: 1 / -1;
            margin-top: 0.25rem;
            font-weight: 600;
            color: #047857;
          }
          #status.error {
            color: #dc2626;
          }
          .empty {
            margin: 0;
            color: #64748b;
          }
        `}</style>
      </head>
      <body>
        <main>
          <h1>Generate barcode batches</h1>
          <form id="batch-form">
            <label>
              Client code
              <input name="clientCode" type="text" required value="DK010" />
            </label>
            <label>
              Panel code
              <input name="panelCode" type="text" required value="APV13" />
            </label>
            <label>
              Label count
              <input name="count" type="number" min="1" max="52" required value="42" />
            </label>
            <label>
              Output directory
              <input
                name="outputDir"
                type="text"
                required
                value={DEFAULT_OUTPUT_DIR}
              />
            </label>
            <button type="submit">Generate batch</button>
            <div id="status" role="status"></div>
          </form>
          <nav className="page-links">
            <a href="/batches" target="_blank" rel="noopener">
              View old batches
            </a>
          </nav>
          <section>
            <h2>Recent batches</h2>
            <BatchTable batches={batches} />
          </section>
        </main>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </body>
    </html>
  );
}

function ArchivePage({ batches }: { batches: BatchHistoryEntry[] }) {
  const pageStyle = String.raw`
    :root {
      color-scheme: light;
      font-family: system-ui, sans-serif;
      line-height: 1.5;
    }
    body {
      margin: 0;
      background: #f8fafc;
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem 4rem;
    }
    h1 {
      margin-bottom: 1rem;
      font-size: 1.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.95rem;
    }
    thead th {
      font-size: 0.8rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #64748b;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .file-links {
      display: flex;
      gap: 0.75rem;
    }
    .file-links a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    .empty {
      margin: 0;
      color: #64748b;
    }
    .output {
      font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.8rem;
      color: #475569;
    }
    a.back {
      display: inline-block;
      margin-bottom: 1.5rem;
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
  `;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Old barcode batches</title>
        <style>{pageStyle}</style>
      </head>
      <body>
        <main>
          <a className="back" href="/" target="_blank" rel="noopener">
            Open generator in a new tab
          </a>
          <h1>Old batches</h1>
          {batches.length === 0 ? (
            <p className="empty">No previous batches were found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Client</th>
                  <th>Panel</th>
                  <th>Labels</th>
                  <th>Created</th>
                  <th>Output</th>
                  <th>Files</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr>
                    <td>{batch.id}</td>
                    <td>{batch.clientCode}</td>
                    <td>{batch.panelCode}</td>
                    <td>{`${batch.generated}/${batch.requested}`}</td>
                    <td>{new Date(batch.createdAt).toLocaleString()}</td>
                    <td className="output">{toRelative(batch.outputDir)}</td>
                    <td>
                      <div className="file-links">
                        <a href={`/download/${batch.id}/pdf`} target="_blank" rel="noopener">
                          PDF
                        </a>
                        <a href={`/download/${batch.id}/csv`} target="_blank" rel="noopener">
                          CSV
                        </a>
                        <a href={`/download/${batch.id}/manifest`} target="_blank" rel="noopener">
                          Manifest
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </body>
    </html>
  );
}

async function downloadFile(batch: BatchRecord, kind: string) {
  let target: string | undefined;
  if (kind === "pdf") target = batch.pdfPath;
  if (kind === "csv") target = batch.csvPath;
  if (kind === "manifest") target = batch.manifestPath;
  if (!target) {
    return new Response("File not found", { status: 404 });
  }

  try {
    await fs.access(target);
    const file = Bun.file(target);
    const name = path.basename(target);
    return new Response(file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename=\"${name}\"`,
      },
    });
  } catch (error) {
    return new Response("File not available", { status: 404 });
  }
}

function serializeBatch(batch: BatchRecord) {
  return {
    id: batch.id,
    clientCode: batch.clientCode,
    panelCode: batch.panelCode,
    requested: batch.requested,
    generated: batch.generated,
    createdAt: batch.createdAt,
    outputDir: toRelative(batch.outputDir),
    pdfPath: toRelative(batch.pdfPath),
    csvPath: toRelative(batch.csvPath),
    manifestPath: toRelative(batch.manifestPath),
  };
}

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      const recent = Array.from(batches.values()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
      const page = renderToHtml(<IndexPage batches={recent} />);
      return new Response(page, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (request.method === "GET" && url.pathname === "/batches") {
      await ensureHistoryLoaded();
      const archived = Array.from(historyIndex.values()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
      const page = renderToHtml(<ArchivePage batches={archived} />);
      return new Response(page, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/batches") {
      const payload = Array.from(batches.values())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(serializeBatch);
      return Response.json({ batches: payload });
    }

    if (request.method === "GET" && url.pathname.startsWith("/download/")) {
      const [, , id, kind] = url.pathname.split("/");
      if (!id || !kind) {
        return new Response("Batch not found", { status: 404 });
      }
      let batch: BatchRecord | undefined = batches.get(id);
      if (!batch) {
        await ensureHistoryLoaded();
        batch = historyIndex.get(id);
      }
      if (!batch) {
        return new Response("Batch not found", { status: 404 });
      }
      return downloadFile(batch, kind);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/batches/")) {
      const id = url.pathname.split("/").at(-1) ?? "";
      let batch: BatchRecord | undefined = batches.get(id);
      if (!batch) {
        await ensureHistoryLoaded();
        batch = historyIndex.get(id);
      }
      if (!batch) {
        return new Response("Batch not found", { status: 404 });
      }
      return Response.json({ batch: serializeBatch(batch) });
    }

    if (request.method === "POST" && url.pathname === "/api/batches") {
      try {
        const body = await request.json();
        const clientCode = String(body.clientCode ?? "").trim();
        const panelCode = String(body.panelCode ?? "").trim();
        const count = Number(body.count ?? 0);
        const outputDir = String(body.outputDir ?? DEFAULT_OUTPUT_DIR).trim() || DEFAULT_OUTPUT_DIR;

        if (!clientCode || !panelCode || !Number.isFinite(count) || count <= 0) {
          return new Response("Invalid payload", { status: 400 });
        }

        const result = await runBarcodeBatch({
          clientCode,
          panelCode,
          count,
          outputDir,
        });

        batches.set(result.id, result);
        await refreshHistoryFor(result.outputDir);
        return Response.json({ batch: serializeBatch(result) }, { status: 201 });
      } catch (error) {
        console.error("Failed to run batch", error);
        return new Response("Failed to run batch", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log("📡 UI server ready on http://localhost:3000");
