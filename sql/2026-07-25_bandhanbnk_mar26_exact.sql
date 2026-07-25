-- ============================================================================
-- 2026-07-25_bandhanbnk_mar26_exact.sql
-- Session 2h · InvestorLens India
--
-- WHAT THIS FIXES
-- mgmt_profiles.promoter_pct for BANDHANBNK holds 39.0. The filed Mar-2026
-- shareholding pattern gives the promoter total as **38.98%** — 628,023,845
-- shares, of which Bandhan Financial Holdings Ltd holds 625,978,369 (38.86%)
-- and Bandhan Mutual Fund holds 2,045,476 (0.13%). 38.86 + 0.13 = 38.99 on the
-- printed sub-percentages, 38.98 on the share count, and the filing's own total
-- line reads 38.98.
--
-- WHY IT WAS WRONG
-- The source_note records the provenance honestly, and that is what gave the
-- error away: "Kotak Neo + Share.Market trackers (promoter 39.0% as on
-- Mar-2026)". It was taken from aggregators, at one decimal place, not from the
-- filing. On 25 Jul 2026 the same Kotak Neo page was observed serving INDIGO's
-- rounded **Mar**-2026 figure under a **Jun '26** label — the precise failure
-- Session Q logged as "aggregator latest is a lie with a straight face". An
-- aggregator may corroborate; it may not originate.
--
-- A NUMBER IS EVERY SENTENCE THAT MENTIONS IT (Session P). Two fields carry it:
--   1. promoter_pct  39.0 -> 38.98
--   2. source_note   the "(promoter 39.0% as on Mar-2026)" clause and its
--                    aggregator attribution
-- capital_note is deliberately NOT touched: its 40.00% and 37.93% are BFHL's
-- own holding across the Sep-2025 -> 12-May-2026 sell-down, a different measure
-- (BFHL alone, and dated after the 31-Mar snapshot). Both remain correct.
--
-- SCOPE: one row, two columns. No schema change. No row count changes, so the
-- acid-test chip is unaffected by construction:
--   107 companies · 492 metric bindings · 14 forces · 139 exposure links
--   · 4 value-chain maps · 107 verified management records
--
-- IDEMPOTENT: every UPDATE is value-guarded. First run reports 1; every run
-- after reports 0 and changes nothing.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- pre-flight
-- Read-only. If 00a is false the row is already corrected (or was never 39.0)
-- and the UPDATEs below will legitimately report 0.
CREATE TEMP TABLE _judge(step text, ok boolean, detail text) ON COMMIT DROP;

-- The gate passes in BOTH legitimate states: not yet applied (39.0 present) or
-- already applied (38.98 present). It fails only on a value neither run could
-- have produced. An idempotent migration must read clean on EVERY run — a
-- pre-flight that asserts "the old value is still here" prints *** FAIL *** on
-- a correct second run, and an operator cannot then tell a harmless no-op from
-- a real problem. That is a judge defect, not a data one.
INSERT INTO _judge
SELECT '00a gate: promoter_pct is 39.0 (to apply) or 38.98 (applied)',
       (SELECT promoter_pct IN (39.0, 38.98) FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       (SELECT 'found ' || promoter_pct::text
               || CASE WHEN promoter_pct = 39.0 THEN ' — will apply'
                       WHEN promoter_pct = 38.98 THEN ' — already applied, expect UPDATE 0'
                       ELSE ' — UNEXPECTED, STOP' END
          FROM mgmt_profiles WHERE ticker = 'BANDHANBNK');

INSERT INTO _judge
SELECT '00b gate: source_note is the tracker text or the filed text',
       (SELECT position('promoter 39.0% as on Mar-2026' in source_note) > 0
             OR position('38.98% (628,023,845 shares' in source_note) > 0
          FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       (SELECT left(source_note, 52) FROM mgmt_profiles WHERE ticker = 'BANDHANBNK');

INSERT INTO _judge
SELECT '00c pre: exactly one BANDHANBNK row',
       (SELECT count(*) = 1 FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       (SELECT count(*)::text FROM mgmt_profiles WHERE ticker = 'BANDHANBNK');

-- ------------------------------------------------------------------ UPDATE 1
-- Guarded on the OLD value, so this can only ever move 39.0 and can only run
-- once. A second run matches nothing.
UPDATE mgmt_profiles
   SET promoter_pct = 38.98
 WHERE ticker = 'BANDHANBNK'
   AND promoter_pct = 39.0;

-- ------------------------------------------------------------------ UPDATE 2
-- The sentence that carries the number, and the attribution that produced it.
UPDATE mgmt_profiles
   SET source_note = replace(
         source_note,
         'Kotak Neo + Share.Market trackers (promoter 39.0% as on Mar-2026) + BFHL SEBI Reg 29(2) disclosure dated 13-May-2026 (40.00% → 37.93%)',
         'Filed Mar-2026 shareholding pattern: promoter total 38.98% (628,023,845 shares — BFHL 625,978,369 / 38.86% plus Bandhan Mutual Fund 2,045,476 / 0.13%), read from the quarter-labelled exchange table on 25-Jul-2026. Corroborated, not sourced, by trackers. Plus BFHL SEBI Reg 29(2) disclosure dated 13-May-2026 (40.00% → 37.93%, BFHL alone, after the 31-Mar snapshot)'
       )
 WHERE ticker = 'BANDHANBNK'
   AND position('promoter 39.0% as on Mar-2026' in source_note) > 0;

-- --------------------------------------------------------------- post-judge
INSERT INTO _judge
SELECT '01 post: promoter_pct is 38.98',
       (SELECT promoter_pct = 38.98 FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       (SELECT promoter_pct::text FROM mgmt_profiles WHERE ticker = 'BANDHANBNK');

INSERT INTO _judge
SELECT '02 post: the 39.0 tracker clause is gone',
       (SELECT position('promoter 39.0% as on Mar-2026' in source_note) = 0
          FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       'must be true';

INSERT INTO _judge
SELECT '03 post: source_note names the filed total and the share count',
       (SELECT position('38.98% (628,023,845 shares' in source_note) > 0
          FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       'must be true';

INSERT INTO _judge
SELECT '04 post: capital_note UNTOUCHED (40.00% -> 37.93% survives)',
       (SELECT position('40.00% to about 37.93%' in capital_note) > 0
          FROM mgmt_profiles WHERE ticker = 'BANDHANBNK'),
       'must be true';

INSERT INTO _judge
SELECT '05 post: no other row touched',
       (SELECT count(*) = 0 FROM mgmt_profiles
         WHERE ticker <> 'BANDHANBNK' AND promoter_pct = 38.98),
       (SELECT count(*)::text FROM mgmt_profiles
         WHERE ticker <> 'BANDHANBNK' AND promoter_pct = 38.98);

INSERT INTO _judge
SELECT '06 post: management record count unchanged at 107',
       (SELECT count(*) = 107 FROM mgmt_profiles),
       (SELECT count(*)::text FROM mgmt_profiles);

-- The SQL Editor shows only the LAST statement's grid, so every check is
-- surfaced here in one result set.
SELECT step, CASE WHEN ok THEN 'PASS' ELSE '*** FAIL ***' END AS result, detail
  FROM _judge
 ORDER BY step;

COMMIT;
