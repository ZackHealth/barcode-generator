# Barcode generator

Local Next.js app for generating sample labels and downloading PDFs and CSVs.
The authoritative reservation ledger is `src/used-sample-ids.json`.
Read [ledger operation and recovery](docs/ledger-safety.md) before generating real labels.

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
```

## Current batch limits

The AAR026 layout currently generates at most 26 labels per run, even when a
larger count is requested. Multi-page generation needs separate work before a
250–500-label batch can be requested in one run. The legacy CLI's export step
still references `latest-batch.json`; use the web app for current run exports.

`bun run start` serves the production build. Next.js scripts use the explicit
`bun --bun` runtime flag, following the [Bun Next.js guide](https://bun.sh/guides/ecosystem/nextjs).
Native dependency installation scripts are allowed only for `canvas` and `sharp`.
