# Ledger operation and recovery

## Single-operator contract

DJ operates one current checkout on a local filesystem. The complete
`src/used-sample-ids.json` is the reservation authority; Git stores its central
copy. Output folders, manifests, PDFs, CSVs and batch history are evidence of
runs, not substitutes for the ledger. Stop older app processes before updating
to this implementation.

Before a real generation, stop the app, check for uncommitted reservations,
and ensure the checkout includes the latest merged ledger. Do not reset, switch
branches or overwrite the file while the app is generating. Preserve local
reservations before pulling; if histories conflict, reconcile by taking the
union of all IDs, never by choosing one side of a Git conflict.

After each real generation, verify the CSV IDs, PDF labels and run manifest,
then commit and push the expanded ledger before distributing or using labels.
The [automated batch SOP](batch-sop.md) handles these steps and keeps exports
locally, without Drive or printing. Merge the reservation
update into main before another machine or fresh checkout is used. Failed runs
also require preserving and committing any added reservations.

Do not generate from a second checkout, an old branch, a shared network drive,
or a machine with an unsynchronized ledger. The local lock cannot coordinate
independent copies. Restoring an older but valid JSON file can re-enable used
IDs; schema checks cannot detect that rollback. Retain a backup and the Git
history. Recovery evidence is in `docs/ledger-recovery/`.

## Reservation behavior

All existing generation entry points call `generateBarcodeRun`, which calls
the central `reserveSampleIDs` operation before creating label files:

1. Resolve the ledger's real path and exclusively acquire its `.lock` file.
2. Read and validate the entire ledger. Missing, unreadable, malformed, empty,
   duplicate or invalid IDs stop generation. Legacy uppercase alphanumeric
   ten-character IDs remain valid, including `0`, `O` and `I`.
3. Exclude historical and within-batch collisions. Reserve the complete batch.
4. Write a separate file in the same directory, flush and close it, then
   atomically replace the ledger. On POSIX, also flush the directory entry.
5. Release the lock and return the reserved IDs to the artifact writer.

If saving fails, no labels are written. If label/PDF/CSV generation fails after
reservation, keep all reserved IDs permanently, even if no usable file remains.
Deleting an output folder never releases its IDs. The automated workflow also holds a `.workflow.lock` through publication;
central reservations reject other callers while this lock exists.
Locks cover reservations;
artifact writing can overlap safely because its IDs are already reserved.

Tests and CI verify Linux/WSL behavior, including forced process termination
before and after replacement. Windows skips directory flushing and is not
covered by this CI. Filesystem/hardware power-loss guarantees are outside these
tests; keep backups. Run the app from the repository root so it resolves the
intended ledger and output folder.

## A lock or failed run blocks generation

An existing `src/used-sample-ids.json.lock` stops new reservations. A stale
`.workflow.lock` also blocks generation and needs the same recovery discipline. A crashed
process deliberately leaves its lock behind; the app never automatically
reclaims it based on a PID or elapsed time.

1. Stop every generator process and confirm no reservation is active. Inspect
   the lock's PID and timestamp, but do not treat a missing PID alone as proof.
2. Back up the current ledger, lock, staging files and any partial run artifacts.
3. Check that the ledger includes all IDs already produced or potentially used.
   If damaged or stale, reconcile the latest Git copy, saved local copies and
   historical CSV/PDF/run evidence into one complete union. A temporary file
   alone is not authoritative; never replace the ledger with a smaller set.
4. Only once the ledger is complete and no writer is running, remove the stale
   lock and orphan staging files, run the tests, and restart the app.

For an ambiguous run, preserve its IDs. Recovery may waste IDs; reuse is worse.

## Verification scope

Automated tests cover corrupt/missing/unreadable ledgers, historical-ID
retention (including every ID in the PR base commit), deliberate collisions,
500 reservations in a temporary ledger,
overlapping processes, locks, flush/rename failures, forced crashes and label
write failures. They check that each SVG's ID is saved before that SVG is written.
They do not prove physical print quality. `bun run test:bulk` generates ten
pages with a temporary ledger and independently decodes all 260 PDF barcodes
against the CSV, manifest and before/after ledger snapshots. The automated
CLI supports up to 520 labels; its publication and failure recovery are covered
by integration tests using temporary Git repositories.

After `bun run build`, `bun run test:production` starts the built Next.js server
under Bun against a temporary ledger. It verifies API reservation, CSV IDs and
metadata, the PDF download and its manifest, and rejection of a corrupt ledger.
It preserves the real ledger and deletes temporary outputs when finished.
