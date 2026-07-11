-- ============================================================================
-- InvestorLens — sql/2026-07-11_mgmt_batch4_it_auto.sql
-- Session I · Mgmt gaps, Batch 4: the seven IT + auto names.
--   HCLTECH · TECHM · WIPRO · BAJAJ-AUTO · EICHERMOT · M&M · TMPV
--
-- Machine-researched with named sources; EVERY number and sentence below must
-- be founder-verified against two independent sources (aggregator + exchange
-- filing) BEFORE this file is pasted. Machines refresh NUMBERS; only humans
-- write or verify SENTENCES.
--
-- Run in: Supabase SQL Editor (service_role).
-- IDEMPOTENT — safe to run twice: each row inserts only WHERE NOT EXISTS, so a
-- re-run inserts nothing and rewrites nothing. No unique constraint assumed.
-- Carries its own judges: pre-flight (expect 82 / 0 / 7), post-flight (expect
-- 89 / 7 / 0). Do not run the parts separately — paste the whole file.
--
-- NOTE ON as_of: WIPRO carries "Jun 2026", not "Mar 2026". Its ₹15,000 cr
-- buyback extinguished 60 crore shares on 25 Jun 2026 and the company filed the
-- post-buyback holding itself — 72.52% became 72.59%. The March figure is a
-- number Wipro has already superseded. The other six sit on the 31-Mar-2026
-- quarterly SHP.
--
-- TWO PLEDGE LINES ARE NOT ZERO. Read them before pasting:
--   M&M         0.02% of the promoter block (40,000 shares, one named individual)
--   BAJAJ-AUTO  ~0.01% per trackers — CONFIRM against the SHP encumbrance table
-- Every other row in this batch is a clean nil, two of them proven by the
-- company's own SEBI Reg 31(4) filing.
--
-- verified_on is written ONCE, in one place (Part B, the SELECT list). If you
-- verify on a day other than 11 Jul 2026, change that single DATE literal.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect exactly 82 (64 flip + 8 Session E + 5 Session G + 5 Session H).
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- Judge 0b — expect ZERO rows. If any of the seven already exists, STOP:
-- this file only ever inserts; it will silently skip, and you will think it
-- worked. An empty result here is the green light.
SELECT ticker FROM mgmt_profiles
 WHERE ticker IN ('HCLTECH','TECHM','WIPRO','BAJAJ-AUTO','EICHERMOT','M&M','TMPV');

-- Judge 0c — expect exactly 7. All seven must exist in companies (FK + the
-- self-test's no-orphan-MGMT-ticker rule). Note the two awkward tickers:
-- 'BAJAJ-AUTO' has a hyphen, 'M&M' has an ampersand. Both are plain text here.
SELECT COUNT(*) AS companies_present FROM companies
 WHERE ticker IN ('HCLTECH','TECHM','WIPRO','BAJAJ-AUTO','EICHERMOT','M&M','TMPV');

-- ── PART B · the seven records ──────────────────────────────────────────────
INSERT INTO mgmt_profiles
       (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
        as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct, v.promoter_who, v.pledge_note, v.capital_note,
       v.as_of, v.source_note, DATE '2026-07-11'
  FROM (VALUES

  -- 1 ── HCLTECH · the founder owns nothing; the holding companies own it all ─
  ('HCLTECH', 60.86,
   'The Nadar family — but almost none of it is held in their own names. Vama Sundari Investments (Delhi) Pvt Ltd holds 44.21% and HCL Holdings Pvt Ltd (a foreign entity) another 16.46%. Shiv Nadar personally holds 736 shares; Roshni Nadar Malhotra, 696. Control runs through the holding companies, not the register.',
   'None. The promoter block shows 0.00% pledged and 0.00% locked in every quarter on record.',
   'The promoter bought. The block went from 1,65,03,01,111 shares at Dec-2025 to 1,65,14,16,520 at Mar-2026 — about 11.15 lakh shares added, and the stake ticked up 60.81% to 60.86%. Two philanthropic vehicles sit INSIDE the promoter group and hold roughly 0.16% between them: the Shiv Nadar Foundation and the Kiran Nadar Museum of Art. That is unusual and worth knowing — the giving is not parked outside the control structure, it is part of it.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 60.86% / 1,65,14,16,520 shares; pledged 0.00%; Vama Sundari 44.21%, HCL Holdings 16.46%) + Choice tracker 60.81% at Dec-2025'),

  -- 2 ── TECHM · a quarter of the "promoter" is not the parent ────────────────
  ('TECHM', 34.97,
   'Mahindra & Mahindra Ltd — but only for 25.31% of it. The other 9.62% sits in the TML Benefit Trust, a trust inside the promoter group, with Mahindra Holdings (0.02%) and a Mauritius entity (0.02%) making up the rest. The parent''s own grip on its IT arm is a quarter of the company, not a third.',
   'None. The 31-Mar-2026 shareholding pattern answers "No" to pledge, to non-disposal undertaking and to every other form of encumbrance — zero promoter shares encumbered, zero locked in, out of 34,26,99,332 held.',
   'Nothing moved, and that is the point. The promoter held 34,26,99,332 shares at Dec-2025 and the same 34,26,99,332 at Mar-2026; the stake slid from 34.98% to 34.97% purely because ESOPs grew the share count. Institutions hold 55.9% — more than the promoter and the trust combined — with LIC alone at 11.44%. This is a company its parent influences rather than commands. Note the cross-link: the promoter, M&M, is itself a company on this platform.',
   'Mar 2026',
   'Tech Mahindra''s own exchange SHP as on 31-Mar-2026 (insights.techmahindra.com, Q4 25-26) — promoter 34.97% / 34,26,99,332 of 97,98,41,252 shares, encumbrance rows all "No" + Choice and Upstox trackers'),

  -- 3 ── WIPRO · they sold shares and their stake went UP ─────────────────────
  ('WIPRO', 72.59,
   'The Premji family — Azim Premji through the Zash Traders, Prazim Traders and Hasham Traders partnerships, plus the Azim Premji Trust, Azim Premji Philanthropic Initiatives and Rishad Premji (Executive Chairman). Post-buyback the block holds 7,18,87,95,772 of 9,90,35,49,797 shares. One of the largest promoter stakes in Indian large-cap.',
   'None. Wipro''s own FY26 SEBI Reg 31(4) declaration, filed 6 Apr 2026, confirms that every share held by the promoter and promoter group was free of encumbrance as on 31 Mar 2026.',
   'Understand this and you understand buybacks. Wipro spent ₹15,000 cr buying back 60 crore shares at ₹250 — 5.72% of the company — tendered 11-17 Jun 2026, subscribed 13.74 times, extinguished 25 Jun. The promoters DID tender: they sold 42,80,45,126 shares (7,61,68,40,898 down to 7,18,87,95,772) and took cash out. And their stake still ROSE, 72.52% to 72.59% — because the company cancelled shares faster than the family sold them. Selling and rising are not a contradiction in a proportionate tender; the denominator did the work.',
   'Jun 2026',
   'Wipro exchange filing on completion of extinguishment, 30-Jun-2026 (60,00,00,000 shares cancelled; promoter 7,61,68,40,898 → 7,18,87,95,772; 72.52% → 72.59%) + Wipro FY26 Reg 31(4) nil-encumbrance filing, 6-Apr-2026 + buyback completion disclosure (₹250, 13.74x subscribed)'),

  -- 4 ── BAJAJ-AUTO · a buyback in flight, and a pledge that is not quite zero ─
  ('BAJAJ-AUTO', 55.01,
   'The Bajaj family, held through the group''s own listed and unlisted vehicles: Bajaj Holdings & Investment Ltd (~34.2%), Jamnalal Sons Pvt Ltd (~9.3%), Maharashtra Scooters (~2.5%), Bajaj Sevashram (~1.6%) and Bachhraj & Company (~1.3%), plus family members directly. Niraj Bajaj is Chairman; Rajiv Bajaj is Managing Director.',
   'Effectively nil, but not a clean zero: shareholding trackers show about 0.01% of the promoter block encumbered. It is small enough to be a legacy line rather than a leverage story — but "small" is not "none", and this is the only Bajaj row on this platform where the pledge cell is not blank.',
   'A ₹5,633 cr buyback at ₹12,000 a share is in flight as this record is written — record date 24 Jun 2026, tender offer opened 1 Jul 2026 — sized at 16.93% of standalone equity plus free reserves. Whether the promoter group tenders is the live question: if it abstains, its 55.01% rises mechanically; if it participates proportionately, the stake barely moves. The answer will land in a post-buyback shareholding pattern, and this row should be revisited when it does.',
   'Mar 2026',
   'Angel One Mar-2026 tracker (promoter 55.01%) + MarketsMojo promoter breakdown (Bajaj Holdings 34.21%, Jamnalal Sons 9.30%; ~0.01% pledged) + buyback disclosures (₹12,000/share, record date 24-Jun-2026, offer opened 1-Jul-2026)'),

  -- 5 ── EICHERMOT · one family, held through a lattice of trusts ─────────────
  ('EICHERMOT', 49.07,
   'The Lal family, and almost entirely through trusts. The Simran Siddhartha Tara Benefit Trust alone is the registered owner of 43.86% of the company; Vikram Lal, Siddhartha Lal, Simran Lal and Tara Lal are among its trustees, and a dozen smaller family trusts hold the rest. Siddhartha Lal has been Executive Chairman since Feb 2025.',
   'None. The promoters and promoter-group entities filed SEBI Reg 31(4) & (5) declarations on 8 Apr 2026 confirming that no encumbrance had been created on any of their shares — nine entities, covering the position as on 1 Apr 2026.',
   'Royal Enfield throws off more cash than it can spend on itself, and the owners take it out: the board recommended a dividend of ₹82 per share for FY26 on a face value of ₹1 (record date 31 Jul 2026, AGM 20 Aug 2026). A promoter block that owns just under half the company therefore collects just under half of that. The other half of the business — trucks and buses — is not owned outright at all but run through VECV, the 50:50 joint venture with AB Volvo.',
   'Mar 2026',
   'Eicher Motors'' own exchange SHP as on 31-Mar-2026 (eicher.in) — Simran Siddhartha Tara Benefit Trust 43.86% + promoter-group Reg 31(4)&(5) nil-encumbrance filings, 8-Apr-2026 + Angel One / Upstox trackers (49.07% / 49.06%) + dividend record-date filing'),

  -- 6 ── M&M · 18% is not control; it is consent ──────────────────────────────
  ('M&M', 18.45,
   'Not the family, directly. Prudential Management & Services Pvt Ltd holds 10.82% and the M&M Benefit Trust (Anand Mahindra and Ranjan Pant, trustees) another 6.91%; Anand Mahindra''s own name is against just 0.12% — about 14.3 lakh shares. Add every relative and trust and the promoter block is 18.45%, among the lowest of any large founder-led company in India.',
   'Almost nil — and the exception has a name. 40,000 shares are pledged: 0.02% of the promoter block, all of them belonging to one promoter-group individual, Sanjay Mohan Labroo, and amounting to 13.82% of his own 2,89,440 shares. It is a personal arrangement, not company leverage, and it has been shrinking (0.06% before Sep-2024). Everyone else in the block: zero.',
   'Nobody bought and nobody sold: 22,55,77,648 promoter shares at Dec-2025 and the identical 22,55,77,648 at Mar-2026. What matters here is not the promoter at all — it is the 67.81% held by institutions, 36.23% of it foreign. A board that owns 18% governs by the consent of a register it does not control, which is a genuinely different governance animal from a 60% family firm. Cash still comes back: ₹33 a share, due 3 Jul 2026.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 18.45% / 22,55,77,648 shares; pledged 0.02% = 40,000 shares, Sanjay Mohan Labroo; Prudential Management 10.82%, M&M Benefit Trust 6.91%) + Choice tracker 18.45%'),

  -- 7 ── TMPV · the original Tata Motors, wearing a new name ──────────────────
  ('TMPV', 42.56,
   'Tata Sons Pvt Ltd — roughly 40.16% on its own, with other Tata group entities making up the balance of the 42.56% promoter block. Behind Tata Sons sit the Tata Trusts, so the ultimate owner of India''s second-largest carmaker is a set of philanthropies.',
   'No promoter pledge is flagged in the shareholding trackers. Tata Sons does not borrow against its group holdings as a matter of practice — but this line is a tracker reading, not a filing, and should be re-verified against the encumbrance table of the next shareholding pattern.',
   'Read the ticker before you read the numbers. TMPV IS the original Tata Motors Limited — same company, same BSE code 500570 — renamed on 13 Oct 2025 when the commercial-vehicle business was demerged out into a separate listed entity. What stayed behind is the domestic passenger-car business, Tata Passenger Electric Mobility and Jaguar Land Rover. That means TMPV''s reported FY26 profit contains demerger accounting, not just trading performance, and any year-on-year comparison drawn from before Oct 2025 is comparing two different companies. Q4 FY26 itself was a record on the operating line: net sales of ₹1,05,447 cr and PAT of ₹5,783 cr.',
   'Mar 2026',
   'Upstox Mar-2026 tracker (promoter 42.56%) + Screener (42.6%) + MarketsMojo (Tata Sons 40.16%) + TMPV exchange filings confirming the name change from Tata Motors Limited w.e.f. 13-Oct-2025 + Q4 FY26 results (board 14-May-2026)')

  ) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
         as_of, source_note)
 WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker);

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect exactly 89.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 2 — expect exactly 7 rows, all dated 2026-07-11, promoter_pct as
-- drafted (55.01 / 49.07 / 60.86 / 18.45 / 34.97 / 42.56 / 72.59) and WIPRO
-- alone carrying as_of = 'Jun 2026'.
SELECT ticker, promoter_pct, as_of, verified_on
  FROM mgmt_profiles
 WHERE ticker IN ('HCLTECH','TECHM','WIPRO','BAJAJ-AUTO','EICHERMOT','M&M','TMPV')
 ORDER BY ticker;

-- Judge 3 — expect 0. Every record still carries its own verification date.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;

-- Judge 4 — Batches 2, 3 and 4 were all verified on 11 Jul 2026, so they share
-- a bucket. Expect 3 rows:
--   2026-07-02 → 64 · 2026-07-09 → 8 · 2026-07-11 → 17
-- If you changed the DATE literal in Part B, expect a 4th bucket of 7 instead.
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
