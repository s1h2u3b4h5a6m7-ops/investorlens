# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phases 1–3: DONE.** Site live off Supabase (old 5-table schema); nightly
  mcap robot + weekly backup both delivered; **six backup files confirmed
  landed in `investorlens-backups` (founder-verified)** — the undo exists.
- **Phase 4 — DRY RUN PASSED ✅ (5–6 Jul 2026).** The founder's two files
  (`1_SCHEMA_complete.sql` = new 8-table design; `2_DATA_complete.sql` =
  107 companies) were executed end-to-end in a local PostgreSQL 16, UTF-8
  (same encoding as Supabase). **Exit code 0, full COMMIT, zero errors.**
  Schema proven idempotent (ran twice cleanly).

## Dry-run audit results (verified by query, not by eye)

- Row counts: companies 107 · metric_snapshots 599 · chain_nodes 518 ·
  tech_geo_tags 321 · bull_bear_cases 642 · mgmt_profiles 64 ·
  cross_company_narratives 4 · staged 0 (by design).
- Quality bar: business_core / value_chain_position / moat_note / source_note
  = **107/107 each**. Chain nodes, factor tags, bull+bear, market caps =
  **107/107 companies**. Bull/bear discipline: exactly 3+3 for all 107.
- 21 honest NULL metric values (matches the old dataset's honesty count).
  Zero duplicate (ticker, metric, date) rows.
- All 599 metric rows status='verified'; all 321 tags is_active=true →
  nothing will be hidden by the RLS read policies.
- **Mgmt reconciliation: 64 = old 15 + all 49 new companies.** The 43 still
  missing are ALL from the original 58 cohort:
  ADANIPORTS, APOLLOHOSP, ASIANPAINT, AUBANK, AXISBANK, BAJAJ-AUTO,
  BANDHANBNK, BANKBARODA, BEL, CANBK, CHOLAFIN, CIPLA, COALINDIA, DRREDDY,
  EICHERMOT, ETERNAL, FEDERALBNK, GRASIM, HCLTECH, HDFCLIFE, HINDALCO,
  IDFCFIRSTB, INDIGO, JIOFIN, JSWSTEEL, M&M, MAXHEALTH, NESTLEIND, NTPC,
  ONGC, PNB, POWERGRID, SBILIFE, SHRIRAMFIN, SUNPHARMA, TATACONSUM,
  TATASTEEL, TECHM, TITAN, TMPV, TRENT, ULTRACEMCO, WIPRO.
- Mcap freshness: original 58 dated 2026-06-29; the 49 new dated 2026-03-31
  (≈3 months stale until robot v2's first night refreshes all 107).
- The 4 cross_company_narratives = the old 4 CHAINMAP maps
  (banca, holding, metals-auto, power). chain_nodes use
  direction ∈ {upstream, downstream} (old schema used up/down — data layer
  must translate).
- Encoding note: the ONLY dry-run failure was on a mis-built SQL_ASCII test
  DB; on UTF-8 (Supabase's encoding) the file is clean. Bonus: that failure
  proved the transaction wrapper rolls back to zero rows — no partial loads.

## ⚠️ THE SEQUENCING DISCOVERY (critical — read before migrating)

The new schema **reuses the table name `companies`**. On the live DB this
means: 1_SCHEMA won't build alongside — it EXTENDS the existing companies
table (adds value_chain_position etc., harmless). But 2_DATA's
`TRUNCATE companies ... CASCADE` **also empties the old metrics, factors,
chains, mgmt tables** (they hold foreign keys into companies) and never
refills them (it fills the NEW tables). **The moment 2_DATA runs on live,
the current site breaks** (renders companies with no metrics/forces/chains).
So this is an in-place migration with a short, planned blackout — NOT a
side-by-side flip. Therefore: **frontend rewrite comes FIRST, held ready;
DB flip second; commit the new frontend immediately after (≈2–5 min gap).**

## The locked migration order (one session each)

- **Session A (next): rewrite the data layer.** New `js/data.js` (and any
  touched readers) mapping the 8 new tables → the EXACT in-memory shapes the
  UI already uses (SEED, forces, chains, CHAINMAP, mgmt). market_cap_cr =
  latest metric_snapshots row per ticker. upstream/downstream → up/down.
  narratives JSONB → CHAINMAP. Verified with a round-trip harness against
  the dry-run DB. **Founder saves files but does NOT commit yet.**
  Zero new features: migration ≠ features (bull/bear + value-chain-position
  UI come later).
- **Session B: DB flip day (~15 min).** (1) Manually run the backup workflow
  = fresh undo. (2) Run 1_SCHEMA in Supabase SQL Editor (old site unaffected).
  (3) Run 2_DATA (site degrades NOW). (4) Immediately paste/commit the
  prepared js files (site returns, 107 companies). (5) Acid test: status chip
  shows 107, spot-check a new company (e.g. DMART) and an old one (HDFCBANK).
- **Session C: robot v2.** refresh.py writes market cap as a new dated
  metric_snapshots row (machine-verifiable number → status='verified' direct;
  staging table stays reserved for future scraped metrics needing review).
  Until then the old robot keeps PATCHing the vestigial companies.market_cap_cr
  column — harmless, nothing reads it post-flip.
- **Session D+: the 43 mgmt profiles** (list above), then NEW UI for
  bull/bear cases + value_chain_position/note.

## Mission lock (unchanged)

Business UNDERSTANDING first — value chains, business cores, moats, live
factors, management quality. Valuation secondary; stock-picking out of scope.
Machines refresh NUMBERS; only humans write/verify SENTENCES.

## Counts after the flip (CONTRACT.md must be updated to match)

107 companies · 599 metric snapshots (21 honest NULLs) · 518 chain nodes ·
321 factor tags · 642 bull/bear cases · 64 mgmt profiles · 4 narratives.

## Changelog

- **v3.1 / Phase 4 dry run (this pass):** Both founder SQL files executed
  cleanly end-to-end on local PostgreSQL 16 UTF-8; full audit green (quality
  bar 107/107; mgmt 64 with named 43-gap; zero dupes; zero hidden rows).
  Discovered the companies-name collision → locked the frontend-first,
  fast-flip migration order (Sessions A–D). Encoding failure on SQL_ASCII
  test rig documented as a non-issue for Supabase.
- **v3.0 / Phase 4 kickoff:** 107-company SQL revealed; pre-load backup rule.
- **v3.0 / Phase 3a+3b:** nightly mcap robot; weekly backup (6 files landed).
- **v3.0 / Phase 2:** five tables seeded; acid test passed.
- **v3.0 / Phase 1:** monolith split; self-tests identical.
