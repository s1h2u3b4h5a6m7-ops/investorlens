# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phases 1–3: DONE.** Site live off Supabase (old 5-table schema); nightly
  mcap robot + weekly backup both delivered; **six backup files confirmed
  landed in `investorlens-backups` (founder-verified)** — the undo exists.
- **Phase 4 dry run: PASSED (5–6 Jul).** Both founder SQL files execute
  cleanly end-to-end on PostgreSQL 16 UTF-8; full audit green (see v3.1).
- **Phase 4 Session A: DONE ✅ (7 Jul 2026) — the frontend is written,
  PROVEN, and held ready. Nothing is committed to `main` yet; the live
  site is untouched.**

## Session A results (verified by harness, not by eye)

Two files were produced and are being held for flip day:

- **`js/data.js` (new waiter):** reads the 8 new tables and rebuilds the
  exact old in-memory shapes. Key translations: market cap = newest
  `metric_snapshots` row per ticker (`metric_key='market_cap_cr'`,
  excluded from the metrics section); metric display order = row-id order
  (proven equal to the old curated `metric_order` for ALL 58 originals —
  zero diffs at SQL level AND end-to-end); newest snapshot_date wins per
  (ticker, metric); `upstream/downstream` → `up/down`; bull/bear from
  `bull_bear_cases` (newest date, case_order 1→3); narratives JSONB →
  CHAINMAP. Local-JSON fallback fully retired (rollback = revert the
  flip-day commit, stated in the file header).
- **`js/compare.js` (+9 lines only):** the 107-company dataset uses 8 peer
  groups the UI didn't know (Renewable Energy, PSU Infrastructure Lenders,
  Capital Goods, Realty, Defence & Aerospace, Chemicals, Auto Components,
  IT Services — 19 companies). Added to GROUP_LABELS in house style;
  without this the selftest fails 19× on flip day.

Round-trip harness (Node vm "browser"; fake fetch also ASSERTS the order
clauses; RLS filters simulated in the dumps):

- NEW pipeline: **selftest PASS — 107 companies, 492 metric bindings,
  14 forces, 139 exposure links, 4 maps (17 links), 64 mgmt records.**
- OLD pipeline baseline: PASS — 58 / 295 / 14 / 85 / 4 / 15 (= live site).
- 58-company overlap old-vs-new: **0 structural diffs, 0 value diffs** —
  byte-identical content through the new schema, market caps included.
- Sanity: no company missing a positive mcap; 3+3 bull/bear on all 107;
  `market_cap_cr` never leaks into any metric_order; 110 HIGHER_IS_BETTER
  keys; schema idempotency re-proven (ran twice clean).

## ⚠️ Two flags (accepted, not blockers)

1. **CHAINMAP order changes (cosmetic).** `cross_company_narratives` has no
   order column, so the Map page will list banca → holding → metals-auto →
   power (alphabetical) instead of the old curated power-first order. All
   four stories are content-identical. Permanent fix if wanted = tiny
   `display_order` column in Session D; do NOT edit the verified SQL files
   for this now.
2. **LTIM sits alone in "IT Services"** while TCS/INFY/WIPRO/HCLTECH/TECHM
   are in "IT" — LTIM's compare page will show only itself. If unintended,
   the fix is a one-word row edit in Supabase later (no code ship). Founder
   to decide; label added either way so nothing breaks.

## ⚠️ THE SEQUENCING DISCOVERY (unchanged — read before migrating)

The new schema reuses the name `companies`. 1_SCHEMA on live only EXTENDS
it (harmless). But 2_DATA's `TRUNCATE … CASCADE` also empties the old
metrics/factors/chains/mgmt tables and never refills them — **the moment
2_DATA runs on live, the current site breaks** until the new frontend is
committed. In-place migration with a short planned blackout; frontend
held ready FIRST (done), DB flip second, commit immediately after.

## Session B — DB flip day (~15 min, next session)

Hold mechanism decided in Session A handover: either (a) both js files
parked in iPad Files, pasted on flip day, or (b) RECOMMENDED: committed
today to branch `phase4-frontend` with a draft PR — flip day is then one
Merge tap instead of two big pastes. Site unaffected either way until the
merge/paste (GitHub Pages serves `main` only).

1. Manually run the backup workflow = fresh undo (verify new files land in
   `investorlens-backups`).
2. Supabase SQL Editor → run **1_SCHEMA_complete.sql** (old site unaffected;
   expect a few "already exists, skipping" notices — that's the file being
   polite, not an error).
3. Run **2_DATA_complete.sql** (site degrades NOW — blackout starts).
4. Immediately merge the PR **or** paste the two prepared files
   (`js/data.js`, `js/compare.js`) into `main` (site returns, 107 companies).
5. Acid test: status chip shows **107 companies, 492 metric bindings,
   14 forces, 139 exposure links, 4 value-chain maps, 64 verified
   management records**; open DMART (new) and HDFCBANK (old); open the
   Map page (expect the new alphabetical order); open Compare for a
   Renewable Energy company.
6. Commit updated CONTRACT.md + this STATE.md to `main` (docs, zero risk).

## After the flip

- **Session C: robot v2.** refresh.py writes market cap as a NEW dated
  `metric_snapshots` row (status='verified' direct). Until then caps stay
  frozen at 2026-06-29 (58 originals) / 2026-03-31 (49 new) — the old
  robot keeps PATCHing the vestigial `companies.market_cap_cr` column,
  which nothing reads post-flip. Note for C: the fetch-all pattern on
  metric_snapshots grows by 107 rows/night; fine for months, but C should
  note a pruning/view strategy for later.
- **Session D+:** the 43 mgmt profiles (list in v3.1 changelog / below),
  then NEW UI for bull/bear + value_chain_position/note, optional
  CHAINMAP display_order, LTIM group decision.
- 43 mgmt gaps (all from the original 58): ADANIPORTS, APOLLOHOSP,
  ASIANPAINT, AUBANK, AXISBANK, BAJAJ-AUTO, BANDHANBNK, BANKBARODA, BEL,
  CANBK, CHOLAFIN, CIPLA, COALINDIA, DRREDDY, EICHERMOT, ETERNAL,
  FEDERALBNK, GRASIM, HCLTECH, HDFCLIFE, HINDALCO, IDFCFIRSTB, INDIGO,
  JIOFIN, JSWSTEEL, M&M, MAXHEALTH, NESTLEIND, NTPC, ONGC, PNB, POWERGRID,
  SBILIFE, SHRIRAMFIN, SUNPHARMA, TATACONSUM, TATASTEEL, TECHM, TITAN,
  TMPV, TRENT, ULTRACEMCO, WIPRO.

## Mission lock (unchanged)

Business UNDERSTANDING first — value chains, business cores, moats, live
factors, management quality. Valuation secondary; stock-picking out of
scope. Machines refresh NUMBERS; only humans write/verify SENTENCES.

## Counts after the flip (CONTRACT.md to be updated at Session B step 6)

107 companies · 599 metric snapshots (21 honest NULLs; 107 are market-cap
rows, 492 are business metrics) · 518 chain nodes · 321 factor tags ·
642 bull/bear cases · 64 mgmt profiles · 4 narratives.

## Changelog

- **v3.2 / Phase 4 Session A (this pass):** New 8-table `data.js` written;
  `compare.js` +8 peer groups (9 lines). Round-trip harness: NEW selftest
  PASS (107/492/14/139/4/64); OLD baseline PASS (58/295/14/85/4/15);
  58-overlap **zero structural + zero value diffs**; order-by-id proven ==
  curated metric_order for all 58. Flags: CHAINMAP alphabetical order
  (cosmetic), LTIM solo in "IT Services". Files held ready; `main`
  untouched. Session B run sheet finalized.
- **v3.1 / Phase 4 dry run:** Both founder SQL files executed cleanly on
  local PostgreSQL 16 UTF-8; full audit green (quality bar 107/107; mgmt
  64 with named 43-gap; zero dupes; zero hidden rows). Discovered the
  companies-name collision → locked the frontend-first, fast-flip order.
  Encoding failure on SQL_ASCII test rig documented as a Supabase
  non-issue.
- **v3.0 / Phase 4 kickoff:** 107-company SQL revealed; pre-load backup rule.
- **v3.0 / Phase 3a+3b:** nightly mcap robot; weekly backup (6 files landed).
- **v3.0 / Phase 2:** five tables seeded; acid test passed.
- **v3.0 / Phase 1:** monolith split; self-tests identical.
