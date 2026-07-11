-- ============================================================================
-- InvestorLens — sql/2026-07-11_mgmt_batch3_nbfc_insurance.sql
-- Session H · Mgmt gaps, Batch 3: the five NBFC / insurance names.
--   CHOLAFIN · SHRIRAMFIN · JIOFIN · HDFCLIFE · SBILIFE
--
-- Machine-researched with named sources; EVERY number and sentence below must
-- be founder-verified against two independent sources (aggregator + exchange
-- filing) BEFORE this file is pasted. Machines refresh NUMBERS; only humans
-- write or verify SENTENCES.
--
-- Run in: Supabase SQL Editor (service_role).
-- IDEMPOTENT — safe to run twice: each row inserts only WHERE NOT EXISTS, so a
-- re-run inserts nothing and rewrites nothing. No unique constraint assumed.
-- Carries its own judges: pre-flight (expect 77 / 0 / 5), post-flight (expect
-- 82 / 5 / 0). Do not run the parts separately — paste the whole file.
--
-- NOTE ON as_of: three of these five filed an EVENT-BASED shareholding pattern
-- after 31 Mar 2026 (a capital-structure change forces a re-file). Where the
-- company's own later SHP exists, this file uses it and says so in as_of —
-- recording the stale March figure would be a lie-in-waiting (see Flag 5).
--   CHOLAFIN  Mar 2026 (quarterly SHP)
--   SHRIRAMFIN Apr 2026 (event SHP, 08-Apr-2026, post-MUFG)
--   JIOFIN     Apr 2026 (event SHP, 21-Apr-2026, post-warrant conversion)
--   HDFCLIFE  Mar 2026 (quarterly SHP — see its capital_note; a post-16-Jun
--             event SHP may now exist. If it does, use it and update.)
--   SBILIFE   Mar 2026 (quarterly SHP)
--
-- verified_on is written ONCE, in one place (Part B, the SELECT list). If you
-- verify on a day other than 11 Jul 2026, change that single DATE literal.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect exactly 77 (64 at flip + 8 Session E + 5 Session G).
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- Judge 0b — expect ZERO rows. If any of the five already exists, STOP:
-- this file only ever inserts; it will silently skip, and you will think it
-- worked. An empty result here is the green light.
SELECT ticker FROM mgmt_profiles
 WHERE ticker IN ('CHOLAFIN','SHRIRAMFIN','JIOFIN','HDFCLIFE','SBILIFE');

-- Judge 0c — expect exactly 5. All five must exist in companies (FK + the
-- self-test's no-orphan-MGMT-ticker rule).
SELECT COUNT(*) AS companies_present FROM companies
 WHERE ticker IN ('CHOLAFIN','SHRIRAMFIN','JIOFIN','HDFCLIFE','SBILIFE');

-- ── PART B · the five records ───────────────────────────────────────────────
INSERT INTO mgmt_profiles
       (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
        as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct, v.promoter_who, v.pledge_note, v.capital_note,
       v.as_of, v.source_note, DATE '2026-07-11'
  FROM (VALUES

  -- 1 ── CHOLAFIN · a family that stopped being a majority without selling ───
  ('CHOLAFIN', 49.25,
   'The Murugappa group, through Cholamandalam Financial Holdings Ltd (43.76%) and Ambadi Investments Ltd (3.96%), plus a long tail of family members and family trusts. A 100-year-old Chennai house, holding through a listed intermediate holding company rather than directly.',
   'None. The promoter block shows 0.00% pledged and 0.00% locked in every quarter on record. Worth knowing the mirror image: Chola is one of India''s busiest *takers* of promoter pledges — other companies'' promoters pledge shares TO Chola for loans. It lends against the risk; it does not run it.',
   'The promoter''s share count did not move: 41,96,40,045 shares at both Dec-2025 and Mar-2026. The percentage still fell, 49.72% to 49.25%, because the company issued roughly 0.8 crore new shares in the quarter — so the family slipped below half the company without selling a single share (they were at 50.4% in Mar-2024). Chola funds its loan book with debt, not equity — a ₹2,000 cr 7-year NCD at 8.88% is the house style — and pays a token dividend (₹0.70/share, due 21 Jul 2026). Growth is retained, not returned.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 49.25% / 41,96,40,045 shares; pledged 0.00%) + Angel One 49.25% + Screener/Kotak Neo 49.2% + IIFL 49.24%'),

  -- 2 ── SHRIRAMFIN · a promoter diluted to a fifth, by choice ───────────────
  ('SHRIRAMFIN', 20.30,
   'Shriram Capital Pvt Ltd (14.27%) and Shriram Value Services Ltd (5.69%), with the Shriram Ownership Trust and Sanlam Life holding slivers. Unusual for India: there is no founding family on the register — the group''s ownership sits in a trust structure rather than in a surname.',
   'None. The promoter block shows 0.00% pledged in every quarter on record, including the 08-Apr-2026 event SHP.',
   'The promoter did not sell one share — it held 47,76,30,880 shares before and after — yet its stake fell from 25.38% to 20.30%. The reason is the biggest cheque in the batch: on 8 Apr 2026 Japan''s MUFG Bank subscribed to a preferential allotment of 47.11 crore new shares at ₹840.93, paying about ₹39,618 crore (~$4.3bn) for 20% — one of the largest foreign investments ever made in Indian financial services. MUFG''s entire block is locked in, and it gets two board seats. Read the dilution as the price of capital, not as a loss of nerve: FY26 closed with PAT of ₹9,998 cr, AUM of ₹3.02 lakh cr (+14.9%) and a 20.4% capital adequacy ratio — and the promoter chose to shrink its slice of a much better-funded pie.',
   'Apr 2026',
   'Trendlyne 08-Apr-2026 event SHP (promoter 20.30% / 47,76,30,880 shares; pledged 0.00%; MUFG 20.02% 100% locked) + Business Standard, 9 Apr 2026 (₹39,618 cr at ₹840.93) + Shriram Finance FY26 results release'),

  -- 3 ── JIOFIN · the promoter is buying, with real money ────────────────────
  ('JIOFIN', 49.13,
   'The Ambani family and the Reliance promoter group — through family LLPs (Srichakra Commercials 11.20%, Karuna / Tattvam / Devarshi 8.26% each) and group companies (Jamnagar Utilities & Power 3.84%, Sikka Ports & Terminals 2.93%, Reliance Industries Holding 2.89%). Note what is NOT here: Reliance Industries Ltd itself owns nothing. The July-2023 demerger handed JFS shares 1:1 to RIL''s own shareholders, so JFS is a sibling of RIL, not a subsidiary.',
   'None. 0.00% pledged in every quarter since listing. The 25 crore shares showing as "locked" are the statutory lock-in on a preferential allotment — a rule, not a loan. Do not confuse the two: a lock-in means the promoter cannot sell; a pledge means a lender can.',
   'This is the rare case of a promoter writing cheques INTO the company. In Sep 2025 Sikka Ports and Jamnagar Utilities were issued 50 crore warrants at ₹316.50 each — a ₹15,825 cr commitment, 25% paid upfront. On 21 Apr 2026 the first 25 crore converted into equity (₹10 face value + ₹306.50 premium), roughly ₹7,912 cr in, lifting the promoter from 47.12% to 49.13% and the share count from 635.3 crore to 660.3 crore. Twenty-five crore warrants remain: full conversion takes the family past 51%. The money is going somewhere — an Allianz reinsurance JV (IRDAI-registered Mar 2026), a 50:50 general-insurance JV signed 22 Apr 2026, and the Jio BlackRock asset-management venture.',
   'Apr 2026',
   'Trendlyne 21-Apr-2026 event SHP (promoter 49.13% / 3,24,38,87,366 shares; pledged 0.00%) + Business Today, 21 Apr 2026 (25 cr shares at ₹306.50 premium; 47.12% → 49.13%) + BSE SAST filing, 22 Apr 2026'),

  -- 4 ── HDFCLIFE · the parent had to put money in ───────────────────────────
  ('HDFCLIFE', 50.21,
   'HDFC Bank Ltd — the sole promoter, holding 1,08,33,42,272 shares as on 31 Mar 2026. The original JV partner abrdn (Standard Life) is gone entirely: there is no foreign promoter left on the register.',
   'None. HDFC Bank''s own FY26 SEBI Reg 31(4) declaration (filed 3 Apr 2026) states that no encumbrance was created, directly or indirectly, on those 1,08,33,42,272 shares by the Bank or by anyone acting in concert with it during the year.',
   'Solvency is the story. HDFC Life closed FY26 at a 177% solvency ratio — thin for the sector, and thinning ahead of IRDAI''s move to a risk-based capital regime. So the parent paid. On 16 Apr 2026 the board approved a ₹1,000 cr preferential issue of 1,45,23,906 shares at ₹688.52 to HDFC Bank; management told the FY26 call it adds about 900 basis points of solvency. Shareholders approved it on 16 May (99.9981% in favour) and the shares were allotted on 16 Jun 2026, nudging the Bank''s stake just above 50%. Everything else was ordinary: FY26 PAT ₹1,910 cr (+6%), final dividend ₹2.10/share (₹456 cr paid out). A promoter that funds a subsidiary''s regulatory capital is a promoter with skin in the game — but it is also a subsidiary that could not fund itself.',
   'Mar 2026',
   'HDFC Bank Q4 FY26 earnings presentation (50.21% as on 31-Mar-2026; solvency 177%) + HDFC Bank SEBI Reg 31(4) FY26 nil-encumbrance filing, 3 Apr 2026 + HDFC Life FY26 earnings-call transcript (₹1,000 cr preferential issue, ~900 bps solvency) + Business Standard, 16 Jun 2026 (allotment completed)'),

  -- 5 ── SBILIFE · the promoter that has never sold a share ──────────────────
  ('SBILIFE', 55.33,
   'State Bank of India — the only promoter, holding exactly 55,50,00,000 shares. BNP Paribas Cardif, the French JV partner that co-founded the company in 2000, is no longer in the promoter block; Temasek''s MacRitchie Investments sits at 1.51% as an ordinary public shareholder.',
   'None. 0.00% pledged and 0.00% locked in every quarter on record. The promoter is a state-owned bank; it does not borrow against its subsidiary.',
   'SBI''s share count has not changed: 55.5 crore shares, quarter after quarter. The percentage drifts down a hundredth at a time (55.38% → 55.34% → 55.33%) purely because ESOP issuance keeps growing the denominator — that is arithmetic, not a decision. SBI Life has not raised equity since its 2017 IPO and did not need to in FY26: solvency 1.90x against a 1.50x floor, net worth up 12% to ₹19,080 cr, PAT ₹2,470 cr on gross written premium of ₹1,01,290 cr (+19%), AUM ₹4.87 lakh cr, and a ₹2.70 interim dividend. Hold this next to HDFCLIFE in the same batch: two bank-owned life insurers, and only one of them had to ask its parent for capital.',
   'Mar 2026',
   'Trendlyne Mar-2026 SHP (promoter 55.33% / 55,50,00,000 shares, State Bank of India sole promoter; pledged 0.00%) + SBI Life FY26 results release, 22 Apr 2026 (solvency 1.90; PAT ₹2,470 cr; GWP ₹1,01,290 cr) + Angel One / Upstox / Groww trackers 55.33%')

  ) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
         as_of, source_note)
 WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker);

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect exactly 82.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 2 — expect exactly 5 rows, all dated 2026-07-11, promoter_pct as
-- drafted (49.25 / 20.30 / 49.13 / 50.21 / 55.33) and as_of as drafted.
SELECT ticker, promoter_pct, as_of, verified_on
  FROM mgmt_profiles
 WHERE ticker IN ('CHOLAFIN','SHRIRAMFIN','JIOFIN','HDFCLIFE','SBILIFE')
 ORDER BY ticker;

-- Judge 3 — expect 0. Every record still carries its own verification date.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;

-- Judge 4 — Batch 2 (Session G) was also verified on 11 Jul 2026, so the two
-- batches share a bucket. Expect 3 rows:
--   2026-07-02 → 64 · 2026-07-09 → 8 · 2026-07-11 → 10
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
