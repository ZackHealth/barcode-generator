# Barcode generator conventions

- Use Bun 1.3.14 and Bun/bunx commands for installation, scripts and checks.
  Keep `bun.lock` as the sole dependency lockfile. Install with
  `bun install --frozen-lockfile`; explicitly run Next.js under Bun.
- Verify changes with `bun run test`, `bun run typecheck`, `bun run build`,
  then `bun run test:production`. The last check needs a completed build and
  permission to bind localhost. CI runs all four checks.
- Keep every existing ID in `src/used-sample-ids.json`. Never reset reservations
  after a failed generation or use the real ledger for tests. Follow
  `docs/ledger-safety.md` for operation and recovery.
- Standard `node:` imports and Next.js's `nodejs` route designation are
  compatibility APIs; keep them where appropriate while executing under Bun.
