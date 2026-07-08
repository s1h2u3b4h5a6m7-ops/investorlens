# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phases 1–4: DONE.** The site is live on the eight-table schema with
  **107 companies** (flip completed in the early hours of 8 Jul 2026 IST).
- **Robots v2: DONE (Session C, 8 Jul 2026).** Both GitHub Actions robots now
  speak the eight-table schema — details below.
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

## Session C — robots v2 (done, harness-proven)

- **`etl/refresh.py` v2 (nightly, 20:30 UTC = 02:00 IST).** Each night it
  writes **one dated `metric_snapshots` row per ticker**
  (`metric_key='market_cap_cr'`, `status='verified'` direct — market cap is
  price × shares inside sane fences, so no human review needed), then stamps
  `companies.fetched_at` for the tickers that succeeded. It no longer touches
  the vestigial `companies.market_cap_cr` / `updated_at` leftovers and speaks
  **only Phase-4 columns**, so it also works on a database rebuilt from
  `1_SCHEMA_complete.sql`.
- **Idempotent-per-day:** the schema has no "one row per company per day"
  rule, so the robot brings its own — before inserting it deletes **today's**
  market-cap rows for **exactly the tickers it is re-inserting** (never
  yesterday, never another metric, never a ticker it has no fresh number
  for). Run it five times in a day: one row per ticker remains. On a **total
  source outage it writes NOTHING** and exits non-zero (GitHub emails);
  same-day earlier rows survive. The keep-alive ping is unchanged.
- Dates are the runner's UTC date (at 02:00 IST that is the previous IST
  calendar day) — consistent night to night; newest-date-wins unaffected.
- **`etl/backup.py` v2 (weekly, Sun 21:30 UTC).** Dumps **all eight tables**
  + manifest (`"schema": "phase4-eight-tables"`), pages past 1,000 rows,
  sorts companies/mgmt_profiles by `ticker` and the rest by `id`, and refuses
  to write a backup with 0 companies **or 0 metric snapshots** (an empty
  `staged_metric_snapshots` is healthy and saved as `[]`).
- **Both workflow files unchanged** — verified zero functional need
  (`git add -A` picks up the new filenames). A stale "five tables" comment
  remains in `backup.yml`; deliberately left, cosmetic only.
- **Verification:** 28/28 harness checks against a fake PostgREST (fresh
  night; same-day re-run replaces without duplicates; total-outage writes
  nothing; 3-page backup pagination; empty-backup refusal; `M&M` /
  `BAJAJ-AUTO` travel quoted through every `in.()` filter) + 5/5 round-trip
  through the **exact live `data.js` bytes** (tonight's rows win by newest
  date; market cap stays out of `metric_order` and `HIGHER_IS_BETTER`).

## Live counts

107 companies · 599 metric snapshots **at flip** (107 market-cap rows + 492
business metrics; 21 honest NULLs) · 518 chain nodes · 321 factor tags ·
642 bull/bear · 64 mgmt profiles · 4 narratives · staging 0.
`metric_snapshots` now grows by ~107 rows per successful night (599 + one row
per fetched company per night; ≈706 after the first v2 run).

## ⚠️ Flags carried (accepted, not blockers)

1. **Map page lists stories alphabetically** (banca → holding → metals-auto →
   power). Cosmetic; permanent fix = tiny `display_order` column, Session D.
   Do NOT edit the verified SQL files for this.
2. **LTIM sits alone in "IT Services"** while TCS/INFY/WIPRO/HCLTECH/TECHM are
   in "IT" — LTIM shows no compare chip. Founder to decide; the fix is a
   one-word row edit in Supabase Table Editor, no code ship.
3. **Four stale husk files** (`metrics.json`, `factors.json`, `chains.json`,
   `mgmt.json`) sit in `investorlens-backups` at pre-flip content. Optional
   tidy-up: delete them via the web UI after the first v2 backup — their
   history stays in git forever.
4. **Snapshot growth:** ~3.2k rows/month. `data.js` paginates (verified), so
   the site keeps working, but every +1,000 rows adds one request to page
   load. Before it matters (several months), plan a prune/view session:
   keep the last N days + first-of-month rows.

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
  decision; replace the retired `/sql` files with the Phase-4 pair;
  snapshot prune/view strategy (flag 4).

## Lessons Session B added

- The iPad GitHub web editor can **silently drop a commit** (and the "create a
  new branch" option can fail to take). Rule: after every commit, confirm it
  landed — the file page must show the new content, or the commits list the
  new entry — before doing anything that depends on it.
- **"The site renders" ≠ "the tests pass."** Acid tests read the chip
  word-for-word.
- Direct repo verification (commit feed, sha-pinned file fetches, full-tree
  diffs) caught both misses on flip day; eyeballs caught neither.

## Lessons Session C added

- When the schema has no uniqueness rule for a job, **the robot brings its
  own discipline** (delete today's rows only for the tickers being
  re-inserted) — proven by the same-day re-run test, not assumed.
- On a total source outage the robot must **write nothing at all** — a
  half-write would destroy same-day rows it cannot replace.
- Robot code should speak **only the current schema's columns**, never
  leftovers that happen to exist on the live table — otherwise a parachute
  rebuild breaks the robot.

## Mission lock (unchanged)

Business UNDERSTANDING first — value chains, business cores, moats, live
factors, management quality. Valuation secondary; stock-picking out of scope.
Machines refresh NUMBERS; only humans write/verify SENTENCES.

## Changelog

- **v3.4 / Phase 4 Session C (this pass):** Robots v2 shipped. `refresh.py`
  writes one dated, idempotent-per-day market-cap row per ticker into
  `metric_snapshots` (`status='verified'`) + stamps `companies.fetched_at`;
  `backup.py` dumps all eight tables with pagination + manifest; both
  workflows verified unchanged. 28/28 fake-PostgREST harness checks + 5/5
  round-trip through live `data.js` bytes. New flags: backup-repo husk files
  (optional delete), snapshot growth / future prune session.
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
