-- ============================================================================
-- InvestorLens — sql/2026-07-11_mgmt_batch2_private_banks.sql
-- Session G · Mgmt gaps, Batch 2: the five private banks.
--   AUBANK · AXISBANK · BANDHANBNK · FEDERALBNK · IDFCFIRSTB
--
-- Machine-researched with named sources; EVERY number and sentence below must
-- be founder-verified against two independent sources (aggregator + exchange
-- filing) BEFORE this file is pasted. Machines refresh NUMBERS; only humans
-- write or verify SENTENCES.
--
-- Run in: Supabase SQL Editor (service_role).
-- IDEMPOTENT — safe to run twice: each row inserts only WHERE NOT EXISTS, so a
-- re-run inserts nothing and rewrites nothing. No unique constraint assumed.
-- Carries its own judges: pre-flight (expect 72 / 0), post-flight (expect 77 /
-- 5 / 0). Do not run the parts separately — paste the whole file.
--
-- verified_on is written ONCE, in one place (Part B, the SELECT list). If you
-- verify on a day other than 11 Jul 2026, change that single DATE literal.
-- ============================================================================

-- ── PART A · pre-flight (read-only) ─────────────────────────────────────────
-- Judge 0a — expect exactly 72 (64 at flip + 8 from Session E).
SELECT COUNT(*) AS mgmt_rows_before FROM mgmt_profiles;

-- Judge 0b — expect ZERO rows. If any of the five already exists, STOP:
-- this file only ever inserts; it will silently skip, and you will think it
-- worked. An empty result here is the green light.
SELECT ticker FROM mgmt_profiles
 WHERE ticker IN ('AUBANK','AXISBANK','BANDHANBNK','FEDERALBNK','IDFCFIRSTB');

-- Judge 0c — expect exactly 5. All five must exist in companies (FK + the
-- self-test's no-orphan-MGMT-ticker rule).
SELECT COUNT(*) AS companies_present FROM companies
 WHERE ticker IN ('AUBANK','AXISBANK','BANDHANBNK','FEDERALBNK','IDFCFIRSTB');

-- ── PART B · the five records ───────────────────────────────────────────────
INSERT INTO mgmt_profiles
       (ticker, promoter_pct, promoter_who, pledge_note, capital_note,
        as_of, source_note, verified_on)
SELECT v.ticker, v.promoter_pct, v.promoter_who, v.pledge_note, v.capital_note,
       v.as_of, v.source_note, DATE '2026-07-11'
  FROM (VALUES

  -- 1 ── AUBANK · the only founder-run bank in this batch ────────────────────
  ('AUBANK', 22.76,
   'Sanjay Agarwal — founder, MD & CEO — who alone holds 15.66%, with Jyoti Agarwal (3.16%) and Shakuntala Agarwal (2.49%), plus promoter-group company Mys Holdings Pvt Ltd (1.45%). Four holders, one family.',
   'None. The 31 Mar 2026 exchange shareholding pattern answers "No" to pledge, to non-disposal undertaking and to every other form of encumbrance — zero shares encumbered out of 17.03 crore held. The promoter group''s FY26 SEBI Reg 31(4) nil-encumbrance declaration (signed 2 Apr 2026) says the same thing independently.',
   'The rarest thing in this batch: the man who founded the business in 1996 still runs it, and still owns nearly a quarter of it. RBI gave AU an in-principle approval (7 Aug 2025) to become the first small finance bank to convert into a universal bank; in Mar 2026 the regulator dropped its earlier condition that the family park its stake in a holding company (NOFHC), so the stake stays held directly, and the bank filed its final licence application that same month. A ₹1/share FY26 dividend was proposed — this is a company that reinvests, not one that pays you out.',
   'Mar 2026',
   'AU SFB exchange SHP as on 31-Mar-2026 (au.bank.in) + FY26 SEBI Reg 31(4) declaration (2 Apr 2026) + Business Standard, 7 Mar 2026 (NOFHC condition removed)'),

  -- 2 ── AXISBANK · one promoter left, and it is an insurer ───────────────────
  ('AXISBANK', 8.15,
   'Life Insurance Corporation of India — and nobody else. The bank was promoted in 1993 by SUUTI, LIC and four public-sector general insurers; SUUTI exited entirely and the insurers were reclassified from promoter to public, so the bank''s own corporate-profile page now states that LIC is its only promoter.',
   'None reported in the shareholding trackers. The question barely applies: a state-owned life insurer does not borrow against its shares.',
   'A 8% "promoter" and an ~85% institutional register mean this bank is run by its board, not by an owner. That shows up in how it funds itself — the ₹12,325 cr Citi India consumer-business acquisition (2023) was paid for in cash from the balance sheet, not by issuing stock to a controlling shareholder. LIC''s slice drifts down a basis point or two a quarter (8.16% → 8.15%); nobody is accumulating control, and no one has to be asked for permission.',
   'Mar 2026',
   'Axis Bank corporate profile / promoters page (as on 31-Mar-2026) + Choice, Angel One and Tijori shareholding trackers'),

  -- 3 ── BANDHANBNK · the promoter is a forced seller, not a doubting one ─────
  ('BANDHANBNK', 39.0,
   'Bandhan Financial Holdings Ltd (BFHL) — the RBI-registered Non-Operative Financial Holding Company of the Bandhan group. A holding company, not a family name on the register.',
   'None disclosed. BFHL''s SEBI Reg 29(2) filing of 13 May 2026 confirms no shares pledged, encumbered or under any non-disposal undertaking; promoter-group entity Bandhan Life Insurance separately declared nil holding and nil encumbrance for FY26 (10 Apr 2026).',
   'Read the sell-down as regulation, not sentiment. RBI''s bank-licensing rules force the holding company to keep diluting, so BFHL sold 3,31,07,015 shares (~2.06%) in tranches between Sep 2025 and 12 May 2026, taking it from 40.00% to about 37.93% — its own filing calls this "disposal of excess shareholding". The promoter is not walking away; it is being walked down a staircase it agreed to when it took the licence. Expect the number to keep falling, and do not read each fall as a loss of faith.',
   'Mar 2026',
   'Kotak Neo + Share.Market trackers (promoter 39.0% as on Mar-2026) + BFHL SEBI Reg 29(2) disclosure dated 13-May-2026 (40.00% → 37.93%)'),

  -- 4 ── FEDERALBNK · no promoter, and none for decades ──────────────────────
  ('FEDERALBNK', 0,
   'No promoter at all. Federal Bank has been promoter-less for decades — professionally managed (KVS Manian is MD & CEO, effective 23 Sep 2024) and owned by mutual funds, insurers, foreign investors and an unusually large retail base.',
   'Not applicable — there is no promoter, so there is nothing to pledge. Worth knowing the mirror image: Federal Bank is itself a promoter elsewhere, holding 60.79% of listed Fedbank Financial Services, and declared that stake nil-encumbered in an 8 Apr 2026 SEBI filing.',
   'Board-driven and conservative. FY26 closed with a net profit of ₹4,117 cr and a capital adequacy ratio of 17.25%; on 29 Apr 2026 the board recommended a final dividend of ₹1.20 per ₹2 share (a 60% payout on face value, but a small slice of earnings). Capital here is retained and lent, not handed back. The live allocation question is what a promoter-less board eventually does with its two big holdings — 60.79% of Fedbank Financial Services and its associate stake in Ageas Federal Life.',
   'Mar 2026',
   'Choice tracker (promoter 0.00%) + Federal Bank FY26 audited results and dividend filing (29-Apr-2026) + bank press release on the MD & CEO appointment'),

  -- 5 ── IDFCFIRSTB · money yes, control no ──────────────────────────────────
  ('IDFCFIRSTB', 0,
   'No promoter. The reverse merger of IDFC Ltd into the bank (effective 1 Oct 2024) dissolved the holding-company structure that used to sit on top, leaving a widely held register. V. Vaidyanathan continues as MD & CEO, but he is not a promoter.',
   'Not applicable — there is no promoter, so there is nothing to pledge.',
   'With no owner to call, growth capital has to be bought from strangers. In Apr 2025 the board approved a ₹7,500 cr preferential issue of compulsorily convertible preference shares — ₹4,876 cr to Warburg Pincus''s Currant Sea Investments and ₹2,624 cr to ADIA''s Platinum Invictus (roughly 9.5% and 5.1% once converted) — lifting capital adequacy from about 16.4% towards ~19%. Then came the tell of a genuinely promoter-less bank: shareholders voted DOWN Warburg''s request for a board seat, 64.1% in favour against the 75% needed, with institutions leading the opposition. Money yes, control no.',
   'Mar 2026',
   'Choice tracker (promoter 0.00%) + IDFC FIRST Bank / Warburg Pincus preferential-issue release (17-Apr-2025) + Outlook Business on the rejected board seat')

  ) AS v(ticker, promoter_pct, promoter_who, pledge_note, capital_note,
         as_of, source_note)
 WHERE NOT EXISTS (SELECT 1 FROM mgmt_profiles m WHERE m.ticker = v.ticker);

-- ── PART C · the judges ─────────────────────────────────────────────────────
-- Judge 1 — expect exactly 77.
SELECT COUNT(*) AS mgmt_rows_after FROM mgmt_profiles;

-- Judge 2 — expect exactly 5 rows, all dated 2026-07-11, promoter_pct as drafted
-- (22.76 / 8.15 / 39.0 / 0 / 0).
SELECT ticker, promoter_pct, as_of, verified_on
  FROM mgmt_profiles
 WHERE ticker IN ('AUBANK','AXISBANK','BANDHANBNK','FEDERALBNK','IDFCFIRSTB')
 ORDER BY ticker;

-- Judge 3 — expect 0. Every record still carries its own verification date.
SELECT COUNT(*) AS still_null FROM mgmt_profiles WHERE verified_on IS NULL;

-- Judge 4 — expect 3 rows: 2026-07-02 → 64, 2026-07-09 → 8, 2026-07-11 → 5.
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
