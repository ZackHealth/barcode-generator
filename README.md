# blood-sample-barcodes

This repository contains two ways to generate barcode batches:

1. **CLI workflow** – replicates the original script flow.
2. **Bun JSX web UI** – a minimal browser interface served by Bun.

## Getting started

Install dependencies once:

```bash
bun install
```

### Run the CLI generator

```bash
bun run src/main.ts
```

Artifacts (SVGs, CSV, PDF, manifests) land under `output/`.

### Run the Bun JSX web UI

```bash
bun run src/server.tsx
```

Visit <http://localhost:3000> to submit a batch and download results.

### Browse previously generated batches

The UI keeps a `batch-history.json` ledger in each output directory. Open
<http://localhost:3000/batches> (the "View old batches" link opens it in a
new tab) to see every batch that has been generated so far, along with direct
links to re-download the PDF, CSV, or manifest for re-printing.

## Working with older clones

If you cloned the project before the UI commit existed (for example,
only `bad83e3` is present on your `main` branch), you can replay the UI
changes locally without needing a remote branch. Copy the patch stored
in this repository and apply it from your clone:

```bash
# from the root of your clone that only has the CLI commit
cp /path/to/barcode-generator/patches/0001-Add-Bun-JSX-web-UI-for-barcode-batches.patch .
git am 0001-Add-Bun-JSX-web-UI-for-barcode-batches.patch
```

`git am` will create the `Add Bun JSX web UI for barcode batches`
commit on top of your existing history so you can run `src/server.tsx`
and the CLI from the same checkout.

### Verifying the UI commit landed

After applying the patch (or pulling the latest branch) you can confirm
the UI changes are present by running `git log --oneline | head`. The
newest entry should include the `Add Bun JSX web UI for barcode batches`
message and the repo should contain the JSX entry point at
`src/server.tsx`, the shared pipeline helper `src/runBatch.ts`, and the
Bun JSX runtime shims under `bun/`.

