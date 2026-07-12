-- ============================================================================
-- InvestorLens — sql/2026-07-11_mgmt_batch6_metals_cement_infra.sql
-- Session K · Mgmt gaps, Batch 6: the six metals + cement + infra names.
--   HINDALCO · JSWSTEEL · TATASTEEL · ULTRACEMCO · GRASIM · ADANIPORTS
--
-- ⚠ CHAINED FILE: Batches 5, 6 and 7 are designed to be pasted IN ORDER in one
-- sitting. This file's pre-flight expects Batch 5 to have already run (94
-- rows). If Judge 0a shows 89, STOP — paste Batch 5 first. The judges enforce
-- the order so you cannot silently skip a step.
--
-- Machine-researched with named sources; EVERY number and sentence below must
-- be founder-verified against two independent sources before pasting.
--
-- IDEMPOTENT — WHERE NOT EXISTS inserts; safe to run twice.
-- Pre-flight: expect 94 / 0 / 6. Post-flight: expect 100 / 6 / 0.
--
-- THE PLEDGE HEADLINE OF THE WHOLE BACKLOG IS IN THIS FILE:
--   JSWSTEEL    11.81% of the promoter block — 13,08,98,740 shares — by far
--               the largest pledge on this platform, spread across six named
--               entities, and FALLING (15.24% at Mar-24 → 11.81%).
--   ADANIPORTS  headline nil per trackers, but read the §4 wording: the FY26
--               Reg 31(4) declaration says no encumbrance was created
--               "excluding those already disclosed" — a different sentence
--               from Wipro's clean nil. History: 17.31% pledged in Jan-2023.
--   The other four (two Birla, one Tata, one Birla-parented) are clean nils.
--
-- verified_on is written ONCE (Part B). Change the single DATE literal if
-- pasting on a different day.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect exactly 94 (89 through Batch 4 + 5 from Batch 5).
-- If this shows 89: STOP, paste Batch 5 first. This file chains after it.
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- Judge 0b — expect ZERO rows.
SELECT ticker FROM mgmt_profiles
 WHERE ticker IN ('HINDALCO','JSWSTEEL','TATASTEEL','ULTRACEMCO','GRASIM','ADANIPORTS');

-- Judge 0c — expect exactly 6.
SELECT COUNT(*) AS companies_present FROM companies
 WHERE ticker IN ('HINDALCO','JSWSTEEL','TATASTEEL','ULTRACEMCO','GRASIM','ADANIPORTS');

-- ── PART B · the six records ────────────────────────────────────────────────
INSERT INTO mgmt_profiles
       (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
        as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct, v.promoter_who, v.pledge_note, v.capital_note,
       v.as_of, v.source_note, DATE '2026-07-11'
  FROM (VALUES

  -- 1 ── HINDALCO · a third of the company, and the crisis was operational ────
  ('HINDALCO', 34.64,
   'The Aditya Birla Group — Kumar Mangalam Birla''s family through group holding vehicles (Birla Group Holdings and related entities), a stake that has sat near 34.6% for years. One of the lower promoter holdings among Birla flagships: two-thirds of Hindalco belongs to the public and institutions.',
   'None flagged. The promoter block shows nil pledged on the shareholding trackers, quarter after quarter — consistent with the group''s practice across its flagships.',
   'The risk this year was not the register, it was a fire. Q3 FY26 net profit fell 45% year-on-year on a one-time loss from a fire at a Novelis plant — Novelis, the US rolled-products subsidiary, is ~59% of revenue, so what happens in a foreign factory IS the P&L. The ownership held completely still while it happened. FY26 dividend ₹5 a share (AGM 23 Jul 2026); in Feb 2026 Hindalco signed an MoU with Embraer to assess aerospace-grade aluminium manufacturing in India — a new leg, if it lands.',
   'Mar 2026',
   'Screener (promoter 34.6%) + Hindalco annual-report SHP history (34.64%) + Q3 FY26 results (Novelis fire, PAT -45% YoY) + AGM notice 30-Jun-2026 (₹5 dividend) + Embraer MoU disclosures, Feb-2026'),

  -- 2 ── JSWSTEEL · the biggest pledge on this platform, and it has six names ─
  ('JSWSTEEL', 45.32,
   'Sajjan Jindal''s branch of the Jindal family — but through a lattice of more than twenty entities, not a single holding company: JSW Techno Projects Management 10.82%, JSW Holdings 7.42%, Vividh Finvest 5.86%, Sahyog Holdings 4.58%, Siddeshwari Tradex 3.46%, JTPM Metal Traders 3.40%, JSW Energy 2.86% (a listed group company holding shares in another), plus Cyprus/Mauritius vehicles. Sajjan Jindal''s own name is against 31,000 shares. Separately, JFE Steel of Japan holds 15.00% as a strategic FDI partner — outside the promoter block but very much inside the story.',
   'THE LARGEST PLEDGE ON THIS PLATFORM: 11.81% of the promoter block — 13,08,98,740 shares — is pledged. It is structural, not personal: JSW Techno Projects has pledged 18.88% of its holding, Siddeshwari Tradex 42.38%, Virtuous Tradecorp 24.85%, and the offshore vehicles are pledged almost entirely — JSL Overseas 76.22%, Nacho Investments 100%, Mendeza Holdings 100%. The direction matters: 15.24% at Mar-2024, 13.36% at Mar-2025, 11.81% now — a steady unwind, but from a level no other company here approaches. This is how the group finances itself, and it has for years.',
   'The promoter bought while the pledge fell: the block went from 44.84% to 45.32% during FY26 (1,09,64,89,242 → 1,10,82,03,750 shares). Credit followed: CARE upgraded JSW Steel to AA+ Stable on 7 Jul 2026 and Fitch to BB+ positive the same week. Q1 FY27 crude steel production 6.59 MT with blast furnace BF3 back on line 23 Jun 2026. A leveraged-promoter, upgrade-cycle steel company is a very specific animal — the pledge line and the ratings line should be read together.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 45.32% / 1,10,82,03,750 shares; pledged 11.81% = 13,08,98,740; entity-level pledges: JSW Techno 18.88%, Siddeshwari 42.38%, Virtuous 24.85%, JSL Overseas 76.22%, Nacho 100%, Mendeza 100%; JFE Steel FDI 15.00%) + Choice/Angel One (45.31-45.32%) + CARE upgrade 7-Jul-2026 + Fitch upgrade 6-Jul-2026'),

  -- 3 ── TATASTEEL · one name, one third, no noise ────────────────────────────
  ('TATASTEEL', 33.19,
   'Tata Sons Pvt Ltd, essentially alone: 32.46% of the company in one name, with other Tata entities making up the balance of 33.19%. Notable exits are already history — the Sir Ratan Tata Trust and Sir Dorabji Tata Trust sold their entire direct holdings back in 2019; ownership now runs through Tata Sons, behind which sit the Tata Trusts.',
   'None flagged. Nil promoter pledge on the shareholding trackers — Tata Sons does not borrow against group holdings as a matter of practice.',
   'The register is the boring part of this company, deliberately. Promoter holding 33.19% this quarter, 33.19% last quarter. What moved instead is who holds the rest: domestic institutions now own more of Tata Steel than the promoter does — DII ~27%, LIC prominent among them — while FII sits near 17.5%. A one-third promoter with an institution-heavy register is the Tata pattern (compare TCS and TITAN rows), and it means the balance sheet story — UK/Netherlands restructuring, India capex — plays out under institutional watch, not family discretion.',
   'Mar 2026',
   'Choice / Angel One / Tijori Mar-2026 trackers (promoter 33.19%, unchanged QoQ; DII 27.16%, FII 17.96%) + Tata Steel exchange SHP (Tata Sons 32.46%; trusts'' 2019 exit noted in filing)'),

  -- 4 ── ULTRACEMCO · the promoter is a company on this platform ──────────────
  ('ULTRACEMCO', 59.33,
   'Grasim Industries Ltd — which holds 57.27% by itself — plus other Aditya Birla Group entities to 59.33%. Note the cross-link: the promoter of this company is itself a row on this platform (GRASIM), and Grasim''s own value is substantially this stake. Kumar Mangalam Birla chairs both.',
   'None. Nil promoter pledge on trackers, and the group''s FY26 Reg 31(4) declarations across its listed companies (filed 7 Apr 2026, covering 25 promoter entities) reported no encumbrances created.',
   'The promoter is creeping UP, not out: 59.29% to 59.33% over the quarter — small purchases, steady direction, in a company that has spent three years buying the industry (India Cements is now a subsidiary; shareholders approved related-party transactions with it by postal ballot on 30 May 2026, promoters abstaining as required). The capital story is consolidation toward a 200+ MTPA medium-term capacity ambition, funded without the promoter selling a share.',
   'Mar 2026',
   'Tijori Mar-2026 tracker (promoter 59.33%, was 59.29%) + Grasim disclosures (holds 57.27% of UltraTech) + India Cements RPT postal-ballot outcome 30-May-2026 + group Reg 31(4) FY26 filings, 7-Apr-2026'),

  -- 5 ── GRASIM · the holding company that promoters keep buying ──────────────
  ('GRASIM', 43.74,
   'The Aditya Birla Group: IGH Holdings, Birla Group Holdings, Pilani Investment (~3.75%) and family trusts, under Kumar Mangalam Birla as chairman. Grasim is the group''s apex listed vehicle — it in turn promotes ULTRACEMCO (57.27%) and Aditya Birla Capital (54.12%), so this row is the top of a pyramid that appears twice more on this platform.',
   'None. Nil pledged on trackers, and the promoter group''s FY26 Reg 31(4) declaration (7 Apr 2026, 25 entities named, including Hindalco and Pilani Investment as promoter-group holders in group companies) reported no encumbrance created.',
   'Watch the direction of promoter money at the top of the pyramid: 43.06% → 43.11% → 43.74% across recent quarters — buying, not selling, and the promoter group fully subscribed its share of the ₹4,000 cr rights issue in 2024 that funded the paints entry. Grasim is spending ₹10,000 cr building Birla Opus paints from scratch (a direct assault on ASIANPAINT — another row here), while its market value is largely a claim on UltraTech and ABC. FY26 dividend ₹10, AGM season Jul-2026.',
   'Mar 2026',
   'Choice / IIFL Mar-2026 trackers (promoter 43.74%) + Tijori quarterly series (43.06 → 43.11 → 43.74) + group Reg 31(4) FY26 declaration, 7-Apr-2026 + rights-issue and Birla Opus capex disclosures'),

  -- 6 ── ADANIPORTS · a nil with a history, and carefully chosen words ────────
  ('ADANIPORTS', 68.02,
   'The Adani family through the S.B. Adani Family Trust and a set of group vehicles — including offshore promoter entities such as Carmichael Rail and Port Singapore Holdings and Worldwide Emerging Market Holding — totalling 1,56,71,96,238 shares, 68.02%. Among the highest promoter concentrations of any large infrastructure company in India; Gautam Adani chairs.',
   'Nil today, but this cell has a history and the filing has careful wording. In January 2023, 17.31% of the promoter block was pledged; after the Hindenburg episode the group repaid and released pledges across companies. The FY26 Reg 31(4) declaration (filed 4 Apr 2026 by the S.B. Adani Family Trust for the whole group) states no encumbrance was created during the year — "excluding encumbrances for which disclosures were already made" during the period. That is a narrower sentence than Wipro''s or Eicher''s clean nil. Read the encumbrance table of the next SHP directly before treating this as zero.',
   'The promoter percentage has RISEN over the cycle (65.13% in early 2023 to 68.02% now) — the family bought back in after the crash. Meanwhile the company compounds by acquisition: FY26 cargo 325+ MMT (+11%), and in May 2026 a step-down subsidiary agreed to acquire 51% of Meridian Transportes Marítimos (Brazil), extending the ports network overseas. High promoter stake + serial acquisition + history in the pledge cell = a row where all three sentences must be read together.',
   'Mar 2026',
   'ADANIPORTS FY26 Reg 31(4) declaration, 4-Apr-2026 (S.B. Adani Family Trust; 1,56,71,96,238 promoter shares; note the "excluding already-disclosed" wording) + Business Today Jan-2023 (17.31% pledged then) + tracker consensus 68.02% + Meridian (Brazil) SPA disclosure 15-May-2026 + FY26 cargo updates')

  ) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
         as_of, source_note)
 WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker);

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect exactly 100.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 2 — expect exactly 6 rows, all 2026-07-11, all as_of 'Mar 2026':
-- 68.02 / 43.74 / 34.64 / 45.32 / 33.19 / 59.33.
SELECT ticker, promoter_pct, as_of, verified_on
  FROM mgmt_profiles
 WHERE ticker IN ('HINDALCO','JSWSTEEL','TATASTEEL','ULTRACEMCO','GRASIM','ADANIPORTS')
 ORDER BY ticker;

-- Judge 3 — expect 0.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;

-- Judge 4 — expect 3 rows: 2026-07-02 → 64 · 2026-07-09 → 8 · 2026-07-11 → 28.
SELECT verified_on, COUNT(*) AS records
  FROM mgmt_profiles GROUP BY verified_on ORDER BY verified_on;

-- Judge 5 — expect 0.
SELECT COUNT(*) AS malformed FROM mgmt_profiles
 WHERE promoter_who IS NULL OR promoter_who = ''
    OR pledge_note  IS NULL OR pledge_note  = ''
    OR capital_note IS NULL OR capital_note = ''
    OR as_of        IS NULL OR as_of        = ''
    OR source_note  IS NULL OR source_note  = ''
    OR promoter_pct IS NULL
    OR promoter_pct < 0 OR promoter_pct > 100;
