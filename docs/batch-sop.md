# Generate a barcode batch

DJ operates one current local checkout. This workflow saves generated files
locally and automates reservation, PDF/CSV verification and publication of the
expanded ledger to GitHub main. It does not access Drive or print anything.
The ledger remains the authority for avoiding reuse; never delete a reservation.

## One-time setup

Install Bun 1.3.14, Git, an authenticated GitHub CLI (`gh auth login`) with
permission to push branches and merge PRs in this repository, and Python 3 with
venv support. From the repository root:

```bash
bun install --frozen-lockfile
```

The first batch prepares an isolated Python verifier in
`.cache/barcode-verifier` using the pinned requirements in `scripts/`.
This happens before reserving IDs. Bun runs the application and orchestration;
Python renders and independently decodes PDF barcodes. Internet access is
needed for GitHub and the verifier's first installation. Stop older app
processes and use only this checkout.

## Generate and save

Start from a clean `main` checkout. Specify page count, client and panel;
there are no implicit production defaults:

```bash
bun run batch --pages 10 --client DK010 --panel APV13
```

Each page contains 26 AAR026 labels on A4. The supported range is 1–20 pages
(26–520 IDs). This command creates a real batch immediately.

The command:

1. Locks the workflow, checks GitHub access, fetches main and updates the clean
   checkout. If source changes, it restarts with the updated implementation
   before generating. A ledger that loses local reservations blocks operation.
2. Prepares the verifier, creates a batch branch and records a recovery journal.
3. Reserves the entire batch durably before writing any label. It creates SVGs,
   one multipage PDF and one CSV under `src/output/runs/<run-id>/`.
4. Checks that all previous IDs remain reserved and that the ledger gained
   exactly the requested number of unique IDs. It renders every PDF label at
   300 DPI and independently decodes CODE128, matching the CSV and manifest
   in order. It also checks metadata, A4 page dimensions and page count.
5. Commits the expanded ledger, CSV and audit records under
   `docs/ledger-generations/`, pushes a branch and creates a PR. It waits for
   passing `Ledger safety` PR checks, then merges the exact checked commit
   using normal repository permissions. It returns to main, fetches the
   merged ledger and removes the local batch branch and recovery journal.

Success prints the local run directory, count and merged PR URL. PDF, SVGs,
previews and local ledger snapshots stay in the ignored run directory. Git
stores the ledger, CSV, manifest, verification receipt and reservation audit;
it does not store the PDFs. Retain the local output folder. There is no Drive
upload, file migration or printer step in this command.

Digital decoding confirms the generated files. It does not certify physical
print quality. The browser remains a single-page shortcut; use this command
for the automated operating procedure.

## A failure or interruption

Any IDs reserved before an error are permanently burned. A generation or
verification error still attempts to commit and merge those reservations,
marking the audit `failed`. Those outputs must not be used. A failed batch
is never automatically replaced.

If push, CI or merge fails, the batch branch and
`.cache/pending-barcode-batch.json` remain. Fix the reported problem, then:

```bash
bun run batch:resume
```

Resume publishes the existing reservations; it generates no new IDs and does
not reclassify a failed batch as verified. Failed or absent CI checks block
merge. After ten minutes of waiting for CI, resume later. Preserve the journal
until main contains all reservations. Do not reset Git or delete the checkout.
Unrelated changes block automatic publication; save them separately first.

A crash deliberately leaves `.workflow.lock` or `.lock` next to the ledger.
Do not remove these merely because a PID looks stale. Stop all generators,
back up the ledger, pending journal and outputs, reconcile all potentially
issued IDs, then follow [lock recovery](ledger-safety.md). Remove the stale
locks only after confirming no writer is active and the ledger is complete;
resume the recorded batch instead of generating again.

If a crash happens after merge while switching back to main, resume can
finish cleanup from main once the recorded PR is confirmed merged. Keep every
ID; never force-reset to bypass a recovery error.

## Reverify a saved run

```bash
bun run batch:verify --run-id <local-run-id>
```

This checks the saved before/after snapshots against the current ledger and
repeats PDF decoding. Later reservations are allowed; removal of any saved ID
fails verification. This command expects the snapshot format created by this
workflow. Historical runs retain their original verification evidence.

## Before changing the generator

Use temporary ledgers and run:

```bash
bun run test
bun run typecheck
bun run build
bun run test:production
bun run test:bulk
```

The bulk check generates and decodes 260 labels in a temporary checkout, tests
CSV tampering and rechecks the batch after later reservations. Tests must leave
the real ledger unchanged. The old `src/main.ts` demo is disabled; it does not
generate labels. Use the commands above instead of the old `latest-batch.json`
CLI export path.
