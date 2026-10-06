# Barcode generator

Local Next.js app for generating sample labels and downloading PDFs and CSVs.
The authoritative reservation ledger is `src/used-sample-ids.json`.
Use the [batch SOP](docs/batch-sop.md) for real generations and read
[ledger operation and recovery](docs/ledger-safety.md) before recovery.

```bash
bun run batch --pages 10 --client DK010 --panel APV13
```

This reserves 260 IDs, creates and independently verifies the PDF and CSV,
then commits, pushes and merges the reservation update after CI passes.
Outputs stay local; the command does not access Drive or print anything.

## Run locally

From the repository root, with Bun 1.3.14:

```bash
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:3000/generator>. Existing runs appear in `/library`;
generated files and manifests live in `src/output/runs/` and are ignored by Git.

## Verify changes

Scripts explicitly run Next.js under Bun. Tests use temporary ledgers and
preserve the real ledger. CI installs from `bun.lock` and runs the same checks:

```bash
bun run test
bun run typecheck
bun run build
bun run test:production
bun run test:bulk
```

## Current batch limits

The automated CLI supports 1–20 pages (26–520 labels). It reserves the whole
batch before producing any output. The browser is a 26-label shortcut.
See the SOP for recovery and `batch:resume`; the legacy demo CLI is disabled.

`bun run start` serves the production build. Next.js scripts use the explicit
`bun --bun` runtime flag, following the [Bun Next.js guide](https://bun.sh/guides/ecosystem/nextjs).
Native dependency installation scripts are allowed only for `canvas` and `sharp`.
