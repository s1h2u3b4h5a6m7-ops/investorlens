-- ============================================================================
-- InvestorLens — sql/2026-07-09_flag5_verified_on.sql   (Session F, Flag 5)
-- Makes §5's "Verified <date>" data-driven: adds mgmt_profiles.verified_on
-- (date, NULLABLE on purpose — a missing date must render an honest "—", and
-- the verified 1_SCHEMA/2_DATA pair must stay re-runnable, which a NOT NULL
-- here would break) and backfills the 72 existing records.
--
-- Run in: Supabase SQL Editor. IDEMPOTENT — safe to run twice: the ALTER is
-- IF NOT EXISTS and both UPDATEs only touch rows whose verified_on is NULL.
-- Parachute order: 1_SCHEMA_complete.sql → 2_DATA_complete.sql → this file.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Expect: 72 on the live database today. (64 on a parachute rebuild — fine.)
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- ── PART B · the migration + Judge 1 ────────────────────────────────────────
ALTER TABLE mgmt_profiles ADD COLUMN IF NOT EXISTS verified_on date;

-- Session E, Batch 1 — the 8 government-promoter rows, verified 09 Jul 2026:
UPDATE mgmt_profiles
   SET verified_on = DATE '2026-07-09'
 WHERE ticker IN ('BANKBARODA','CANBK','PNB','COALINDIA',
                  'NTPC','ONGC','POWERGRID','BEL')
   AND verified_on IS NULL;

-- Everything else = the 64 at-flip records, verified 02 Jul 2026:
UPDATE mgmt_profiles
   SET verified_on = DATE '2026-07-02'
 WHERE verified_on IS NULL;

-- Judge 1 — expect EXACTLY two rows: 2026-07-02 → 64  and  2026-07-09 → 8.
SELECT verified_on, COUNT(*) AS records
  FROM mgmt_profiles
 GROUP BY verified_on
 ORDER BY verified_on;

-- ── PART C · Judge 2 ────────────────────────────────────────────────────────
-- Expect: 0. Every record now carries its own verification date.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;
