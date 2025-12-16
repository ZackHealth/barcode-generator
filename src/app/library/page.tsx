"use client";

import { useEffect, useState } from "react";

type RunCard = {
  runId: string;
  createdAt: string;
  template: string;
  countGenerated: number;
  pdfUrl: string;
  csvUrl: string;
};

export default function LibraryPage() {
  const [runs, setRuns] = useState<RunCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const res = await fetch(`/api/barcodes/runs?limit=200&ts=${Date.now()}`, {
      headers: { "Cache-Control": "no-store" },
    });
    if (!res.ok) throw new Error(`Failed to load runs: ${res.status}`);
    const data = (await res.json()) as { runs: RunCard[] };
    setRuns(data.runs ?? []);
  }

  useEffect(() => {
    loadAll().catch(err => setError(String(err?.message ?? err)));
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Library</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>Previously generated runs</p>
        </div>

        <a href="/generator" style={{ fontSize: 14 }}>← Back to Generator</a>
      </header>

      {error && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f0b4b4", borderRadius: 10 }}>
          <strong style={{ color: "#b00020" }}>Error:</strong> {error}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        {runs.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No runs found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {runs.map(r => (
              <div
                key={r.runId}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{new Date(r.createdAt).toLocaleString("en-GB").replace(/\//g, "-")}</div>
                  <div style={{ opacity: 0.8, fontSize: 14 }}>
                    {r.countGenerated} codes • {r.template} • <span style={{ fontFamily: "monospace" }}>{r.runId}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <a href={r.pdfUrl} target="_blank" rel="noreferrer">PDF</a>
                  <a href={r.csvUrl} target="_blank" rel="noreferrer">CSV</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
