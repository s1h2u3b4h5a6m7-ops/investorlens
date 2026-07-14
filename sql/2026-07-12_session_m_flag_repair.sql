-- ============================================================================
-- InvestorLens — sql/2026-07-12_session_m_flag_repair.sql
-- Session M · Repair: the two [VERIFY] flags from Batches 5 and 7 were pasted
-- into production unresolved, so scaffolding text is currently rendering on
-- the live SUNPHARMA and INDIGO company pages. This file removes it properly.
--
--   SUNPHARMA — the Organon clause is now CONFIRMED at the primary source:
--     definitive agreement announced 26-27 Apr 2026 (joint Sun-Organon press
--     release carrying Sun's NSE/BSE identifiers; Organon SEC Form 8-K).
--     US$14.00/share all-cash, EV US$11.75 bn, 103% premium to the unaffected
--     9-Apr price, close expected early 2027. The clause is upgraded from
--     "Forbes reports" to the filing, and the bracket is deleted.
--   INDIGO — the 40.48% headline remains a DERIVED figure (IGE ~35.7 + RG
--     residual ~4.78). The bracket scaffolding becomes an honest reader-facing
--     sentence in house style (compare the TMPV pledge line). The exact
--     Mar-2026 SHP figure is still owed; when you have it, run the one-line
--     UPDATE at the bottom of this file (commented out until then).
--
-- Run in: Supabase SQL Editor (service_role). IDEMPOTENT: every UPDATE is
-- guarded by a LIKE on the marker text it removes — a second run matches
-- nothing and changes nothing.
-- Pre-flight: expect 107 rows, 2 flagged. Post-flight: expect 107 rows,
-- 0 flagged, anywhere in any text column of mgmt_profiles.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect 107 (all batches pasted). If not 107, finish the batch
-- pastes first; this file repairs rows that must already exist.
SELECT COUNT(*) AS mgmt_rows FROM mgmt_profiles;

-- Judge 0b — expect exactly 2 rows: SUNPHARMA and INDIGO, the flagged pair.
SELECT ticker FROM mgmt_profiles
 WHERE promoter_who  LIKE '%VERIFY%'
    OR pledge_note   LIKE '%VERIFY%'
    OR capital_note  LIKE '%VERIFY%'
    OR source_note   LIKE '%VERIFY%'
 ORDER BY ticker;

-- ── PART B · the repairs ────────────────────────────────────────────────────

-- B1 · SUNPHARMA capital_note: speculation → signed deal, bracket deleted.
UPDATE mgmt_profiles
   SET capital_note = replace(capital_note,
     'and Forbes reports it has agreed to buy Organon & Co., a deal that would more than double annual revenue to roughly $12.4 billion and put Sun among the world''s top 25 drugmakers. [VERIFY THIS CLAUSE AGAINST SUN''S OWN DISCLOSURE BEFORE PASTING.]',
     'and on 26 Apr 2026 it signed the biggest one yet: a definitive agreement to acquire Organon & Co. (NYSE: OGN) outright — US$14.00 per share in cash, a 103% premium to the unaffected 9-Apr price, enterprise value US$11.75 billion, the largest acquisition ever by an Indian pharma company. Funded from cash plus committed bank financing; expected to close in early 2027, subject to antitrust clearances and Organon stockholder approval. Organon brings ~US$6.2 bn of revenue and US$8.6 bn of debt, and the combined business would be a top-25 global drugmaker at ~US$12.4 bn revenue.')
 WHERE ticker = 'SUNPHARMA'
   AND capital_note LIKE '%VERIFY THIS CLAUSE%';

-- B2 · SUNPHARMA source_note: Forbes-UNVERIFIED → the joint release + 8-K.
UPDATE mgmt_profiles
   SET source_note = replace(source_note,
     '+ Forbes profile of Dilip Shanghvi (Organon acquisition — UNVERIFIED, founder to confirm)',
     '+ Sun Pharma-Organon joint press release, 26/27-Apr-2026 (US$14.00/share all-cash; EV US$11.75 bn; 103% premium; close expected early 2027) + Organon SEC Form 8-K, Apr-2026')
 WHERE ticker = 'SUNPHARMA'
   AND source_note LIKE '%UNVERIFIED, founder to confirm%';

-- B3 · INDIGO promoter_who: bracket scaffolding → honest house-style sentence.
UPDATE mgmt_profiles
   SET promoter_who = replace(promoter_who,
     '[VERIFY: this 40.48% total is DERIVED (35.7 + 4.78), not read from the Mar-2026 SHP — replace with the exact filed figure before pasting.]',
     'One honest caveat: the 40.48% headline is a derived figure — IGE''s ~35.7% plus the RG residual ~4.78% — pending the exact Mar-2026 SHP number, and it will drift lower each quarter until the RG Group reaches zero.')
 WHERE ticker = 'INDIGO'
   AND promoter_who LIKE '%[VERIFY:%';

-- B4 · INDIGO source_note: shouting caps → professional flag, same meaning.
UPDATE mgmt_profiles
   SET source_note = replace(source_note,
     '— HEADLINE % DERIVED, VERIFY AGAINST MAR-2026 SHP',
     '— headline % derived (35.7 + 4.78); exact Mar-2026 SHP figure pending founder verification')
 WHERE ticker = 'INDIGO'
   AND source_note LIKE '%HEADLINE % DERIVED, VERIFY AGAINST MAR-2026 SHP%';

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect 0. No text column anywhere in mgmt_profiles still carries
-- the word VERIFY. This is the flag-closure judge.
SELECT COUNT(*) AS still_flagged FROM mgmt_profiles
 WHERE promoter_who  LIKE '%VERIFY%'
    OR pledge_note   LIKE '%VERIFY%'
    OR capital_note  LIKE '%VERIFY%'
    OR source_note   LIKE '%VERIFY%';

-- Judge 2 — expect 107, unchanged. This file rewrites sentences; it never
-- inserts or deletes a row.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 3 — read the two repaired rows with your own eyes before closing the
-- session: SUNPHARMA's note should read "signed... 26 Apr 2026... US$11.75
-- billion"; INDIGO's should read "One honest caveat..." with no brackets.
SELECT ticker,
       right(capital_note, 120)  AS capital_tail,
       right(promoter_who, 120)  AS who_tail
  FROM mgmt_profiles
 WHERE ticker IN ('SUNPHARMA','INDIGO')
 ORDER BY ticker;

-- ── PART D · owed later, not now ────────────────────────────────────────────
-- When you have INDIGO's exact Mar-2026 SHP promoter total, uncomment, put
-- the real number in BOTH places, and run alone:
--
-- UPDATE mgmt_profiles
--    SET promoter_pct = 40.48,  -- ← replace with the filed figure
--        source_note  = source_note ||
--          ' + Mar-2026 SHP exact figure confirmed <date>'
--  WHERE ticker = 'INDIGO';
