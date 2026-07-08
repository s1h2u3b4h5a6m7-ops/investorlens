# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phases 1–4: DONE.** The site is live on the eight-table schema with
  **107 companies** (flip completed in the early hours of 8 Jul 2026 IST).
- The Phase-2 five-table world is retired: the flip emptied its dependent
  tables (rows preserved in `investorlens-backups`, including a fresh manual
  run taken minutes before the flip). `sql/schema.sql` + `sql/seed.sql` in the
  repo are now historical.
- **CONTRACT.md v1** describes the new shapes. It is the menu again.

## Session B — how flip day actually went (verified, not narrated)

- The branch hold didn't take: `data.js` (+ STATE v3.2) landed **straight on
  `main`** (~19:26–19:56 UTC, 7 Jul) → GitHub Pages published immediately →
  early blackout while live Supabase still held the old tables.
- Decision: verify forward, fast. Same-day re-proofs before any live click:
  both SQL files re-run clean on a fresh PostgreSQL 16 UTF-8 (idempotency +
  all-or-nothing + full audit green); then the round-trip harness against the
  **actual bytes on `main`** — order clauses asserted correct, and precisely
  the 19 predicted peer-group failures appeared, nothing else.
- Founder ran: fresh backup → `1_SCHEMA_complete.sql` → `2_DATA_complete.sql`
  on live. Site returned on the new schema.
- `compare.js` took two attempts: the first commit **silently never landed**
  — caught by direct repo verification (commit feed + byte-diff), not by eye.
  The fix file was built from `main`'s exact bytes +9 lines (the 8 groups,
  house style), harness-proven, committed (`8139799`), then verified
  byte-identical end to end. Full-tree diff: nothing else changed.
- Harness on the exact live bytes: **all checks passed — 107 companies,
  492 metric bindings, 14 forces, 139 exposure links, 4 value-chain maps
  (17 links), 64 verified management records.** Home chip text:
  `● data checks: 107 companies · 492 metric bindings · 14 forces · 64
  verified promoter records`.

## Live counts

107 companies · 599 metric snapshots (107 market-cap rows + 492 business
metrics; 21 honest NULLs) · 518 chain nodes · 321 factor tags · 642 bull/bear
· 64 mgmt profiles · 4 narratives · staging 0.

## ⚠️ Flags carried (accepted, not blockers)

1. **Map page lists stories alphabetically** (banca → holding → metals-auto →
   power). Cosmetic; permanent fix = tiny `display_order` column, Session D.
   Do NOT edit the verified SQL files for this.
2. **LTIM sits alone in "IT Services"** while TCS/INFY/WIPRO/HCLTECH/TECHM are
   in "IT" — LTIM shows no compare chip. Founder to decide; the fix is a
   one-word row edit in Supabase Table Editor, no code ship.

## ⚠️ The robots still speak the old schema — Session C (next)

- **refresh.py (nightly)** still PATCHes the vestigial
  `companies.market_cap_cr` column — harmless, nothing reads it — so site
  market caps are **frozen** (2026-06-29 for the 58 originals / 2026-03-31 for
  the 49 new) until robot v2 writes one dated `metric_snapshots` row per
  ticker per night (`status='verified'` direct). Note for C: that grows the
  table by 107 rows/night — fine for months; note a pruning/view strategy.
- **backup.py (weekly)** still dumps the old five tables — post-flip that
  captures `companies` (107 rows) plus four empty husks. **The new world has
  no automated backup yet.** Interim parachute: `1_SCHEMA_complete.sql` +
  `2_DATA_complete.sql` fully regenerate the database (copies in iPad Files;
  optionally commit the pair under `/sql` — founder call).
- **Session C single concern: robots v2** — retarget both scripts to the
  eight tables. Files: `etl/refresh.py`, `etl/backup.py`,
  `.github/workflows/refresh.yml`, `.github/workflows/backup.yml`.

## Session D+

- The **43 mgmt gaps** (all from the original 58): ADANIPORTS, APOLLOHOSP,
  ASIANPAINT, AUBANK, AXISBANK, BAJAJ-AUTO, BANDHANBNK, BANKBARODA, BEL,
  CANBK, CHOLAFIN, CIPLA, COALINDIA, DRREDDY, EICHERMOT, ETERNAL, FEDERALBNK,
  GRASIM, HCLTECH, HDFCLIFE, HINDALCO, IDFCFIRSTB, INDIGO, JIOFIN, JSWSTEEL,
  M&M, MAXHEALTH, NESTLEIND, NTPC, ONGC, PNB, POWERGRID, SBILIFE, SHRIRAMFIN,
  SUNPHARMA, TATACONSUM, TATASTEEL, TECHM, TITAN, TMPV, TRENT, ULTRACEMCO,
  WIPRO.
- NEW UI: bull/bear display + `value_chain_position/note` display.
- Optional: `display_order` on `cross_company_narratives`; LTIM group
  decision; replace the retired `/sql` files with the Phase-4 pair.

## Lessons Session B added

- The iPad GitHub web editor can **silently drop a commit** (and the "create a
  new branch" option can fail to take). Rule: after every commit, confirm it
  landed — the file page must show the new content, or the commits list the
  new entry — before doing anything that depends on it.
- **"The site renders" ≠ "the tests pass."** Acid tests read the chip
  word-for-word.
- Direct repo verification (commit feed, sha-pinned file fetches, full-tree
  diffs) caught both misses on flip day; eyeballs caught neither.

## Mission lock (unchanged)

Business UNDERSTANDING first — value chains, business cores, moats, live
factors, management quality. Valuation secondary; stock-picking out of scope.
Machines refresh NUMBERS; only humans write/verify SENTENCES.

## Changelog

- **v3.3 / Phase 4 Session B (this pass):** DB flipped live (fresh backup →
  1_SCHEMA → 2_DATA); `compare.js` +8 peer groups on `main` (commit `8139799`,
  byte-verified); harness green on the exact live bytes
  (107/492/14/139/4/64). Incidents documented above: early blackout (commits
  landed on `main`, no branch) and a silently-dropped commit — both caught by
  direct repo verification and resolved forward. Robots v2 promoted to
  Session C with the backup gap flagged.
- **v3.2 / Phase 4 Session A:** New 8-table `data.js` written; `compare.js`
  +8 peer groups (9 lines). Round-trip harness: NEW selftest PASS
  (107/492/14/139/4/64); OLD baseline PASS (58/295/14/85/4/15); 58-overlap
  zero structural + zero value diffs; order-by-id proven == curated
  metric_order for all 58. Flags: CHAINMAP alphabetical order (cosmetic),
  LTIM solo in "IT Services".
- **v3.1 / Phase 4 dry run:** Both founder SQL files executed cleanly on local
  PostgreSQL 16 UTF-8; full audit green. Discovered the companies-name
  collision → locked the frontend-first, fast-flip order.
- **v3.0 / Phase 4 kickoff:** 107-company SQL revealed; pre-load backup rule.
- **v3.0 / Phase 3a+3b:** nightly mcap robot; weekly backup (6 files landed).
- **v3.0 / Phase 2:** five tables seeded; acid test passed.
- **v3.0 / Phase 1:** monolith split; self-tests identical.
