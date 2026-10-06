# 260-ID generation on 6 October 2026

Client **DK010**, panel **APV13**, template **AAR026**. One PDF contains
**10 A4 pages, 26 labels per page**. The accompanying CSV has 260 unique IDs.
The complete ledger grew from **3,415 to 3,675** reservations, retaining every
base-commit ID. No new ID overlaps a historical reservation.

Run: `20261006-155057094-fcdc01-10pages`. Generated with Bun and merged application code at
`dadca0ae25fd48f1da64ec7837319621b1996b50`. No application code changed for this batch.

Because the generator currently caps a run at 26 labels, ten runs used the
central reservation operation. Their SVGs were collected in order and the
existing multi-page PDF exporter wrote the combined PDF/CSV. The parent manifest
records all 260 filenames and ten source runs; source manifests and a before-ledger
snapshot are preserved in the ignored local output folder.

Local artifacts are under `src/output/runs/20261006-155057094-fcdc01-10pages/`:

- `labels-2026-10-06_17-50-57.pdf` — print this PDF at **actual size / 100%**, A4.
- `labels-2026-10-06_17-50-57.csv` — the same CSV is preserved in this audit directory.
- `verification.json` — counts, file hashes and ledger hashes.

Every label was rendered independently from the finished PDF at 300 DPI and
its CODE128 barcode decoded with ZXing-C++. All 260 values match the CSV,
manifest and new reservations, in order. This verifies the digital output;
physical printer alignment still depends on the printer and paper settings.

Preserve these reservations even if labels are discarded or not printed.
Merge the ledger update before generating from a fresh or different checkout.
