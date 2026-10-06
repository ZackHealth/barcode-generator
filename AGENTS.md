# Barcode generator conventions

- Use Bun 1.3.14 and Bun/bunx commands for installation, scripts and checks.
  Keep `bun.lock` as the sole dependency lockfile. Install with
  `bun install --frozen-lockfile`; explicitly run Next.js under Bun.
- Verify changes with `bun run test`, `bun run typecheck`, `bun run build`,
  then `bun run test:production`. The last check needs a completed build and
  permission to bind localhost. Also run `bun run test:bulk` to decode
  all 260 labels in a temporary ten-page PDF. CI runs all five checks.
- Keep every existing ID in `src/used-sample-ids.json`. Never reset reservations
  after a failed generation or use the real ledger for tests. Follow
  `docs/ledger-safety.md` for operation and recovery.
- Standard `node:` imports and Next.js's `nodejs` route designation are
  compatibility APIs; keep them where appropriate while executing under Bun.

- Real batches use `bun run batch`; follow `docs/batch-sop.md`. Never run a
  real batch to test code. Do not access Drive or operate a printer.
