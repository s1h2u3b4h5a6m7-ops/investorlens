-- ============================================================================
--  sql/2026-07-10_mgmt_batch1_psu.sql        InvestorLens India · Session X
--  Reconstructs Session E's management batch: the eight PSUs.
--    BANKBARODA · BEL · CANBK · COALINDIA · NTPC · ONGC · PNB · POWERGRID
-- ----------------------------------------------------------------------------
--  WHY THIS FILE EXISTS, AND WHY IT IS DATED 10 JUL 2026 THOUGH IT WAS WRITTEN
--  ON 23 JUL 2026.
--
--  Session E verified these eight records and wrote them straight into the live
--  database. The migration file was never committed. Live has been correct ever
--  since -- 107 verified management records -- but the PARACHUTE never had
--  them, and nobody knew, because nothing ever tested a restore.
--
--  Session X ran the first end-to-end restore drill: 1_SCHEMA -> 2_DATA -> every
--  dated migration, on a from-scratch PostgreSQL 16. The rebuilt database came
--  up with 99 management records instead of 107 and STILL PASSED the site's
--  self-tests, because a missing mgmt_profiles row is not an error -- it renders
--  the honest "queued for a coming verification pass" placeholder. The only
--  signal was the chip reading 99 where live reads 107. Eight companies would
--  have silently lost verified human research in a real recovery.
--
--  The filename is dated to WHERE THE CHANGE BELONGS IN THE SEQUENCE, not to
--  the day it was typed. It must sort AFTER 2026-07-09_flag5_verified_on.sql
--  (which adds the verified_on column this file writes to) and BEFORE
--  2026-07-11_mgmt_batch2_private_banks.sql, whose own pre-flight judge reads
--  "expect exactly 72 (64 at flip + 8 from Session E)" -- a number that is only
--  true if this file has already run. Dating it 23 Jul would leave every later
--  batch judge printing the wrong figure on every future rebuild.
--
--  PROVENANCE: every value below was read back out of the live database on
--  23 Jul 2026, not re-researched and not reconstructed from memory. These are
--  the same human-verified sentences Session E wrote, preserved verbatim.
--
--  SAFETY
--   * IDEMPOTENT -- each row inserts only WHERE NOT EXISTS. A re-run inserts
--     nothing and rewrites nothing. Matches the house style of batches 2-7.
--   * NO-OP ON LIVE -- live already holds all eight, so running this against
--     production inserts 0 rows. That is expected, not a failure.
--   * Never UPDATEs. It cannot overwrite a value a human has since changed.
--   * Touches one table. No schema change, no grants, no RLS.
--   * Types are cast EXPLICITLY (promoter_pct::numeric, verified_on::date). A
--     bare VALUES list infers every column as text, which Postgres will not
--     implicitly cast into a DATE column -- caught by the Session X dry-run.
--
--  EXPECTED JUDGE OUTPUT
--     on a fresh parachute rebuild : psu_rows=8 · mgmt_total=72  · VERDICT PASS
--     on the live database         : psu_rows=8 · mgmt_total=107 · VERDICT PASS
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- ── PART B · the insert ─────────────────────────────────────────────────────
INSERT INTO mgmt_profiles
  (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
   as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct::numeric, v.promoter_who, v.pledge_note,
       v.capital_note, v.as_of, v.source_note, v.verified_on::date
  FROM (VALUES
    ('BANKBARODA',63.97,'Government of India (majority owner; administered by the Ministry of Finance, DFS)','None — sovereign holding; Mar 2026 exchange SHP shows nil pledged or encumbered.','FY26 dividend of ₹8.50/share (₹2,811 Cr of it to GoI) on a record ₹20,021 Cr profit — the first ₹20,000 Cr year; board also cleared a ₹6,000 Cr bond raise in May 2026 to fund a stated aim of doubling the bank in five years.','Mar 2026','NSE/BSE SHP Mar 2026 + Screener/Groww trackers','2026-07-09'),
    ('BEL',51.14,'Government of India (Ministry of Defence)','None — sovereign holding; exchange SHP shows nil pledged or encumbered.','Pays out about a third of profit — FY26 interims (₹1.95/share, Mar 2026) plus a ₹0.55/share final recommended 19 May 2026 — while staying near debt-free; growth is funded internally against a ₹74,000 Cr order book.','Mar 2026','Exchange SHP Mar 2026 + Screener + board-meeting coverage','2026-07-09'),
    ('CANBK',62.93,'Government of India (majority owner; administered by the Ministry of Finance, DFS)','None — FY26 SEBI SAST annual disclosure confirms nil encumbrance on the 62.93% GoI stake.','FY26 dividend of ₹4.20/share, 210% of face value (₹2,397 Cr cheque to GoI, Jun 2026), on profit up 12.7% to ₹19,187 Cr; the rest is retained to fund loan-book growth.','Mar 2026','SEBI SAST FY26 disclosure + exchange SHP + Screener','2026-07-09'),
    ('COALINDIA',63.13,'Government of India (Ministry of Coal)','None — sovereign holding; exchange SHP shows nil pledged or encumbered.','FY26 dividend of ₹26.75/share in total (about 47% payout, roughly 5.5% yield) held despite a 12% profit dip; also listed subsidiary Bharat Coking Coal via a heavily oversubscribed IPO while retaining 90%.','Mar 2026','Exchange SHP Mar 2026 + Screener + FY26 results coverage','2026-07-09'),
    ('NTPC',51.10,'Government of India (Ministry of Power)','None — sovereign holding; exchange SHP shows nil pledged or encumbered.','33rd straight dividend year — FY26 interims including ₹2.75/share (Feb 2026; ₹2,667 Cr to GoI) plus a final considered in May 2026; growth capex increasingly rides in the roughly 89%-held listed arm NTPC Green Energy.','Mar 2026','Exchange SHP Mar 2026 + Screener + company release','2026-07-09'),
    ('ONGC',58.89,'Government of India (Ministry of Petroleum and Natural Gas)','None — sovereign holding; exchange SHP shows nil pledged or encumbered.','Paid GoI ₹9,817 Cr in FY26 dividends — the second-largest single-company PSU payout — including a ₹6/share interim in Nov 2025, near 38% payout, alongside continued exploration and production capex.','Mar 2026','Exchange SHP Mar 2026 + Screener + FY26 dividend coverage','2026-07-09'),
    ('PNB',70.08,'Government of India (majority owner; administered by the Ministry of Finance, DFS)','None — bank disclosure dated 4 Apr 2026 states the 70.08% GoI stake stayed unencumbered through FY26.','Handed GoI a ₹2,416 Cr FY26 dividend cheque (Jun 2026); earnings are otherwise retained for loan growth and self-built capital rather than fresh equity raises.','Mar 2026','SEBI SAST FY26 disclosure + exchange SHP + Screener','2026-07-09'),
    ('POWERGRID',51.34,'Government of India (Ministry of Power)','None — FY26 SEBI SAST annual disclosure declares nil encumbrance on promoter shares.','FY26 dividend of ₹9.00/share (₹4.50 and ₹3.25 interims plus a ₹1.25 final recommended 15 May 2026) — a roughly 67% payout on regulated returns — while a fresh ₹5,000 Cr term loan part-funds transmission capex.','Mar 2026','SEBI SAST FY26 disclosure + exchange SHP + Screener','2026-07-09')
) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
       as_of, source_note, verified_on)
WHERE NOT EXISTS (                       -- <<< the guard: never overwrites
  SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker
);

-- ── PART C · judge (read this before moving on) ─────────────────────────────
SELECT check_name, value FROM (
  SELECT 1 AS ord, 'psu_rows_present' AS check_name, COUNT(*)::text AS value
    FROM mgmt_profiles
   WHERE ticker IN ('BANKBARODA','BEL','CANBK','COALINDIA','NTPC','ONGC','PNB','POWERGRID')
  UNION ALL
  SELECT 2, 'mgmt_total', COUNT(*)::text FROM mgmt_profiles
  UNION ALL
  SELECT 3, 'companies_without_mgmt', COUNT(*)::text
    FROM companies c
   WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = c.ticker)
  UNION ALL
  SELECT 4, 'VERDICT',
         CASE WHEN (SELECT COUNT(*) FROM mgmt_profiles
                     WHERE ticker IN ('BANKBARODA','BEL','CANBK','COALINDIA',
                                      'NTPC','ONGC','PNB','POWERGRID')) = 8
              THEN 'PASS - all 8 PSU records present'
              ELSE 'FAIL - STOP AND READ THE ROWS ABOVE' END
) j ORDER BY ord;
