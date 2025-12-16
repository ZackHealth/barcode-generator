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

export default function GeneratorPage() {
  const [template] = useState("AAR026"); // MVP: fixed
  const [runs, setRuns] = useState<RunCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshRuns() {
    const res = await fetch(`/api/barcodes/runs?limit=20&ts=${Date.now()}`, {
  headers: { "Cache-Control": "no-store" },
});
    if (!res.ok) throw new Error(`Failed to load runs: ${res.status}`);
    const data = (await res.json()) as { runs: RunCard[] };
    setRuns(data.runs ?? []);
  }

  useEffect(() => {
    refreshRuns().catch(err => setError(String(err?.message ?? err)));
  }, []);

  async function onGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // MVP: hard-coded values; we’ll make them editable later
        body: JSON.stringify({
          template,
          clientCode: "DK010",
          panelCode: "APV13",
          count: 26,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Generate failed (${res.status}). ${txt.slice(0, 200)}`);
      }

      // We don’t strictly need the response, because we refresh list anyway.
      await refreshRuns();
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Barcodes Generator</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Template: <strong>{template}</strong>
          </p>
        </div>

        <a href="/library" style={{ fontSize: 14 }}>Open Library →</a>
      </header>

      <section style={{ marginTop: 16 }}>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Generating..." : "Generate new codes"}
        </button>

        {error && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #f0b4b4", borderRadius: 10 }}>
            <strong style={{ color: "#b00020" }}>Error:</strong> {error}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 10 }}>Recently generated (this session)</h2>

        {runs.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No runs yet.</p>
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
                  <div style={{ fontWeight: 600 }}>{new Date(r.createdAt).toLocaleString()}</div>
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
