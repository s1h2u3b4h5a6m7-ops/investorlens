-- ============================================================================
-- InvestorLens — sql/2026-07-11_mgmt_batch5_pharma_health.sql
-- Session J · Mgmt gaps, Batch 5: the five pharma + healthcare names.
--   CIPLA · DRREDDY · SUNPHARMA · APOLLOHOSP · MAXHEALTH
--
-- Machine-researched with named sources; EVERY number and sentence below must
-- be founder-verified against two independent sources (aggregator + exchange
-- filing) BEFORE this file is pasted. Machines refresh NUMBERS; only humans
-- write or verify SENTENCES.
--
-- Run in: Supabase SQL Editor (service_role).
-- IDEMPOTENT — safe to run twice: each row inserts only WHERE NOT EXISTS, so a
-- re-run inserts nothing and rewrites nothing. No unique constraint assumed.
-- Carries its own judges: pre-flight (expect 89 / 0 / 5), post-flight (expect
-- 94 / 5 / 0). Do not run the parts separately — paste the whole file.
--
-- THIS IS THE PLEDGE BATCH. Three of the five are not zero, and unlike Batch 4
-- these are not rounding dust:
--   SUNPHARMA   1.42% of the promoter block — and RISING (0.97% → 1.42%)
--   APOLLOHOSP  2.49% — but FALLING hard (16.30% in Jun-2023 → 2.49% now)
--   MAXHEALTH   nil, proven by the company's own FY26 Reg 31(4) filing
--   CIPLA       0.00%, every quarter on record
--   DRREDDY     0.00%, plus an FY26 Reg 31(4)&(5) nil declaration
-- In both non-zero cases the pledge belongs to NAMED individuals, not to the
-- operating company, and the §5 sentences say exactly who. A tracker that
-- rounds these to "0%" is deleting the only information in the cell.
--
-- ONE LINE IS FLAGGED SOFT: SUNPHARMA's capital note cites the Organon
-- acquisition from a Forbes profile, not from an exchange filing. Verify the
-- deal's size and status against Sun Pharma's own disclosure before pasting,
-- or cut the clause. Everything else has a filing or a shareholding table.
--
-- verified_on is written ONCE, in one place (Part B, the SELECT list). If you
-- verify on a day other than 11 Jul 2026, change that single DATE literal.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect exactly 89 (64 flip + 8 Session E + 5 G + 5 H + 7 I).
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- Judge 0b — expect ZERO rows. If any of the five already exists, STOP:
-- this file only ever inserts; it will silently skip, and you will think it
-- worked. An empty result here is the green light.
SELECT ticker FROM mgmt_profiles
 WHERE ticker IN ('CIPLA','DRREDDY','SUNPHARMA','APOLLOHOSP','MAXHEALTH');

-- Judge 0c — expect exactly 5. All five must exist in companies (FK + the
-- self-test's no-orphan-MGMT-ticker rule).
SELECT COUNT(*) AS companies_present FROM companies
 WHERE ticker IN ('CIPLA','DRREDDY','SUNPHARMA','APOLLOHOSP','MAXHEALTH');

-- ── PART B · the five records ───────────────────────────────────────────────
INSERT INTO mgmt_profiles
       (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
        as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct, v.promoter_who, v.pledge_note, v.capital_note,
       v.as_of, v.source_note, DATE '2026-07-11'
  FROM (VALUES

  -- 1 ── CIPLA · a family that owns it in its own name ────────────────────────
  ('CIPLA', 29.21,
   'The Hamied family, and — unusually — in their own names. There is no holding company and no trust: Yusuf Khwaja Hamied holds 18.69% directly (as a foreign national), Sophie Ahmed 5.71%, M K Hamied 3.46% and Kamil Hamied 1.36%. Five names on the register, and that is the entire promoter block. Cipla''s single largest owner is a British citizen in his late eighties.',
   'None. The promoter block shows 0.00% pledged and 0.00% locked in for every quarter on record.',
   'The story is in the history, not the quarter. The family sold: 33.5% in Mar-2024, 30.9% by Sep-2024, 29.2% by Dec-2024 — roughly four points of a company they built, dropped into the market in nine months. Then they stopped dead. The promoter block has held exactly 23,52,87,003 shares for five straight quarters, unchanged. A family that sells and then stops is telling you something different from a family that keeps selling, and the flat line since Dec-2024 is the fact worth watching. Cash still comes back: ₹13 a share, paid 5 Jun 2026.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 29.21% / 23,52,87,003 shares, unchanged since Mar-2025; pledged 0.00%; Yusuf Khwaja Hamied 18.69%, Sophie Ahmed 5.71%, M K Hamied 3.46%, Kamil Hamied 1.36%) + Choice / Upstox trackers (29.21%) + Trendlyne quarterly history 33.5% → 29.2% across 2024'),

  -- 2 ── DRREDDY · two trusts, an American bank, and a frozen register ────────
  ('DRREDDY', 26.63,
   'The Reddy and Prasad families, four-fifths of it through two trusts: the GVP Family Trust holds 11.51% and the VSD Family Trust 9.06%. The rest sits in HUFs and personal names — Kallam Satish Reddy HUF 3.31%, G V Prasad HUF 1.52%, Satish Reddy Kallam 1.21%. K Satish Reddy is Executive Chairman; G V Prasad is Co-Chairman and MD.',
   'None. Zero pledged and zero locked in for every quarter on record, and the promoters filed a SEBI Reg 31(4) & (5) declaration for FY26 confirming that no encumbrance was created during the year — signed by Kallam Satish Reddy and G V Prasad themselves.',
   'Nobody has moved a share. The promoter block held 22,23,05,640 shares at Mar-2025, at Dec-2025 and at Mar-2026 — identical to the unit — and the stake only slipped 26.64% to 26.63% because ESOPs grew the denominator. Two things are worth knowing beyond the family. Institutions own 63.80%, more than twice the promoter. And the single largest name on the register after the trusts is J P Morgan Chase Bank NA at 11.94% — that is not a fund, it is the depositary bank holding the shares behind Dr Reddy''s New York listing. A tenth of this company is owned through Wall Street plumbing. Dividend ₹8 a share, due 10 Jul 2026.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 26.63% / 22,23,05,640 shares; pledged 0.00%; GVP Family Trust 11.51%, VSD Family Trust 9.06%; J P Morgan Chase Bank NA 11.94%; institutions 63.80%) + Dr Reddy''s FY26 Reg 31(4)&(5) nil-encumbrance declaration + Screener (26.6%)'),

  -- 3 ── SUNPHARMA · the founder pledges nothing; his relatives pledge a lot ──
  ('SUNPHARMA', 54.48,
   'Dilip Shanghvi and family — 54.48%, one of the most concentrated large-cap promoter blocks in India. Shanghvi Finance Pvt Ltd is the workhorse at 40.30% (96,70,51,732 shares); Dilip Shanghvi holds 9.60% in his own name; Aditya Medisales 1.67%; Raksha Sudhir Valia 1.20%; the children Aalok and Vidhi about 0.12% each. Institutions hold 37.05% and get no say worth the name.',
   'THE ONLY RISING PLEDGE ON THIS PLATFORM. 1.42% of the promoter block — 1,85,25,000 shares — is pledged, up from 0.97% a quarter earlier, a fresh 0.45-point pledge created in the March quarter. It is not the founder: Dilip Shanghvi''s 23,03,85,155 shares are 0.00% pledged, and so is every share Shanghvi Finance holds. It is two women. Raksha Sudhir Valia has pledged 1,84,40,000 of her 2,88,30,352 shares — 63.96% of everything she owns. Kumud Shantilal Shanghvi has pledged all 85,000 of hers — 100%. The block-level pledge fell from 2.44% in late 2023 to 0.69% by Dec-2024, and is now climbing again. Small in the aggregate; not small for the two people carrying it.',
   'This is a company that buys rather than pays. Sun has grown by acquisition for thirty years — Caraco, Taro, Ranbaxy, Concert, Checkpoint — and Forbes reports it has agreed to buy Organon & Co., a deal that would more than double annual revenue to roughly $12.4 billion and put Sun among the world''s top 25 drugmakers. [VERIFY THIS CLAUSE AGAINST SUN''S OWN DISCLOSURE BEFORE PASTING.] Meanwhile the promoter has neither bought nor sold: 1,30,71,19,535 shares at Dec-2025 and the same at Mar-2026. The register is still; the balance sheet is not.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 54.48% / 1,30,71,19,535 shares; pledged 1.42% = 1,85,25,000 shares, up from 0.97% at Dec-2025; Raksha Sudhir Valia 1,84,40,000 pledged of 2,88,30,352 = 63.96%; Kumud Shantilal Shanghvi 85,000 = 100%; Dilip Shanghvi 9.60% pledged 0.00%; Shanghvi Finance 40.30% pledged 0.00%) + IIFL (54.47-54.48%) + Forbes profile of Dilip Shanghvi (Organon acquisition — UNVERIFIED, founder to confirm)'),

  -- 4 ── APOLLOHOSP · a pledge being dismantled in public ─────────────────────
  ('APOLLOHOSP', 28.02,
   'The Reddy family of Chennai, mostly through one vehicle: PCR Investments Ltd holds 18.93% of the 28.02%. The founder himself, Dr Prathap C Reddy, holds just 0.17% in his own name — 2,45,464 shares. His four daughters hold the rest personally: Suneeta 2.04%, Sangita 1.69%, Shobana Kamineni 1.56%, Preetha 0.73%. Foreign institutions alone own 42.62% — more than one and a half times the family.',
   'Falling fast, and it has two names on it. 2.49% of the promoter block — 10,05,054 shares — remains pledged. Three years ago it was 16.30%; it fell to 13.11% by Jun-2025, then collapsed to 8.58% in September and 2.49% by December, where it has held. Of what is left, K Vishweshwar Reddy has pledged 6,65,054 of his 15,77,350 shares — 42.16% of his personal holding — and Suneeta Reddy 3,40,000 of hers, 11.58%. Dr Prathap C Reddy, PCR Investments and everyone else: zero. A promoter family that spends three years unwinding a pledge is doing something deliberate, and it is visible in the filings.',
   'They sold, and they are splitting the company in two. Promoter holding fell from 29.34% to 28.02% between March and September 2025 — 18,95,911 shares gone — and the bulk-deal record shows Suneeta Reddy placing 18.97 lakh shares at ₹7,850 apiece, roughly ₹1,489 cr. Separately, a composite scheme of arrangement will hive the pharmacy and digital-health businesses (Apollo HealthCo / Apollo 24|7) out of the hospital company and list them on their own; the NCLT-convened creditor and shareholder meetings on 24 Jun 2026 approved it with the requisite majority, with listing guided at 18-21 months. Read every future comparison for this ticker with that split in mind. Dividend: 200% on the ₹5 face value, ex-date 16 Feb 2026.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 28.02% / 4,02,87,130 shares; pledged 2.49% = 10,05,054 shares, vs 16.30% at Jun-2023; K Vishweshwar Reddy 6,65,054 of 15,77,350 = 42.16%; Suneeta Reddy 3,40,000 of 29,37,066 = 11.58%; PCR Investments 18.93%; FII 42.62%) + IIFL (28.02%) + Screener corporate-actions feed (NCLT meetings 24-Jun-2026, composite scheme approved) + IIFL bulk-deal record (Suneeta Reddy, 18.97 lakh shares at ₹7,850)'),

  -- 5 ── MAXHEALTH · the founder was reclassified out of his own company ──────
  ('MAXHEALTH', 23.74,
   'Abhay Soi — and essentially only Abhay Soi, with Aditya Soi in the promoter group. This is the odd one. Max Healthcare was Analjit Singh''s company; Abhay Soi arrived by reverse-merging his Radiant Life Care into it in 2020, and the Singh family was subsequently RECLASSIFIED OUT of the promoter group into the public category. KKR''s Kayak Investments, once a co-promoter, has exited. The man who built the brand no longer promotes it; the man who bought his way in does, on 23.74%.',
   'None. Abhay Soi (promoter) and Aditya Soi (promoter group) filed a SEBI Reg 31(4) declaration on 6 Apr 2026 confirming that no encumbrance was created on their shares, directly or indirectly, at any point during FY26.',
   'Every rupee goes back into beds. FY26 network gross revenue ₹10,538 cr (+16%), operating EBITDA ₹2,638 cr at a 26.2% margin, PAT ₹1,631 cr (+22%) — the 22nd consecutive quarter of year-on-year growth, with occupancy above 75% even as capacity opened. Against that, management guided on 22 May 2026 to roughly 3,500 new beds over three years. That is the whole capital-allocation policy in one line: a hospital company at 75% occupancy compounds by pouring cash into concrete, not into dividends, and the risk sits in whether the new beds fill as fast as the old ones did.',
   'Mar 2026',
   'Angel One Mar-2026 tracker (promoter 23.74%) + Kotak Neo (23.7%) + Max Healthcare FY26 Reg 31(4) nil-encumbrance declaration filed with NSE and BSE, 6-Apr-2026 (Abhay Soi, Aditya Soi) + Max Healthcare FY26 results and 22-May-2026 earnings call (revenue ₹10,538 cr, PAT ₹1,631 cr, 3,500-bed expansion)')

  ) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
         as_of, source_note)
 WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker);

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect exactly 94.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 2 — expect exactly 5 rows, all dated 2026-07-11, all as_of 'Mar 2026',
-- promoter_pct as drafted: 28.02 / 29.21 / 26.63 / 23.74 / 54.48.
SELECT ticker, promoter_pct, as_of, verified_on
  FROM mgmt_profiles
 WHERE ticker IN ('CIPLA','DRREDDY','SUNPHARMA','APOLLOHOSP','MAXHEALTH')
 ORDER BY ticker;

-- Judge 3 — expect 0. Every record still carries its own verification date.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;

-- Judge 4 — Batches 2, 3, 4 and 5 were all verified on 11 Jul 2026, so they
-- share a bucket. Expect 3 rows:
--   2026-07-02 → 64 · 2026-07-09 → 8 · 2026-07-11 → 22
-- If you changed the DATE literal in Part B, expect a 4th bucket of 5 instead.
SELECT verified_on, COUNT(*) AS records
  FROM mgmt_profiles
 GROUP BY verified_on
 ORDER BY verified_on;

-- Judge 5 — expect 0. No row may be missing a sentence the self-test demands
-- (who / pledge / capital / as_of / src all non-empty; promoter_pct 0-100).
SELECT COUNT(*) AS malformed FROM mgmt_profiles
 WHERE promoter_who IS NULL OR promoter_who = ''
    OR pledge_note  IS NULL OR pledge_note  = ''
    OR capital_note IS NULL OR capital_note = ''
    OR as_of        IS NULL OR as_of        = ''
    OR source_note  IS NULL OR source_note  = ''
    OR promoter_pct IS NULL
    OR promoter_pct < 0 OR promoter_pct > 100;
