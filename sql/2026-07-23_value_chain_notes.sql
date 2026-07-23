-- 2026-07-23_value_chain_notes.sql  (v2 — judge corrected before commit)
-- Session Y: close the last §2 content gap — 14 missing value_chain_note entries
-- 13 lenders (deposits are the raw material, credit is the product) + ITC (conglomerate).
--
-- IDEMPOTENT: every UPDATE is guarded on ticker AND value_chain_note IS NULL.
--   First run: 14 x UPDATE 1.   Any re-run: 14 x UPDATE 0.   Never clobbers an edited note.
--
-- CORRECTION HISTORY (why this is v2, before anything was committed):
--   v1 shipped FOUR separate judge SELECTs. The Supabase editor shows only the LAST
--   statement's grid, so Judges 0-3 were invisible on the first live paste — exactly
--   the failure the UNION'd-judge rule exists to prevent. v1's Judge 4 also expected
--   "95+" companies with gnpa_pct; gnpa_pct is a LENDER-ONLY metric carried by exactly
--   15 tickers, so the live grid's "15" was the database being RIGHT and the judge
--   being wrong. The UPDATE statements below are byte-identical to v1 (which is what
--   ran on live on 23 Jul 2026); only the judge changed.
--
-- Pre-flight expectation (not a separate SELECT — it would be invisible anyway):
--   first run finds 14 NULL value_chain_note rows; a re-run finds 0.

-- ===== PART A: Thirteen lender value-chain notes =====

-- 1. SBIN (State Bank of India) — government retail bank
UPDATE companies
SET value_chain_note = 'For a retail lender, deposits are the raw material; credit evaluation, risk pricing, and portfolio management are the core processing steps; credit products and related fees are the output. This bank''s position is therefore measured not by supply-chain leverage but by deposit franchising, credit quality (NPA %), and net interest margins. See §4 (asset quality) and §3 (live factors on deposit demand and rate pressure) for the business drivers.'
WHERE ticker = 'SBIN' AND value_chain_note IS NULL;

-- 2. KOTAKBANK (Kotak Mahindra Bank) — private sector bank
UPDATE companies
SET value_chain_note = 'As a private sector lender, this bank''s value chain flows deposits → underwriting/risk pricing → credit portfolio. Unlike a manufacturing business, competitive advantage here derives from deposit franchise depth, credit underwriting strength, and cost of funds — not supply-chain dominance. Compare this bank against peer metrics in §4: cost-to-income, NPA %, GNPA %, and NIM capture its operating discipline.'
WHERE ticker = 'KOTAKBANK' AND value_chain_note IS NULL;

-- 3. AUBANK (AU Small Finance Bank)
UPDATE companies
SET value_chain_note = 'As a small finance bank, this lender''s value chain is deposits/borrowings → credit underwriting for underbanked segments → retail credit portfolio. Competitive position turns on deposit-raising ability, credit risk management (NPA %), and net interest margins. Cost-to-income and operating leverage on deposit growth are the key competitive metrics — see §4 for asset quality and margins.'
WHERE ticker = 'AUBANK' AND value_chain_note IS NULL;

-- 4. AXISBANK (Axis Bank) — private sector bank
UPDATE companies
SET value_chain_note = 'For a private-sector lender, the value chain is sourcing deposits and term borrowings → credit assessment and risk pricing → portfolio management. Competitive moat lies not in supply networks but in deposit franchise stickiness, underwriting quality, and cost discipline. §4''s metrics — NPA %, cost-to-income, NIM — directly measure this bank''s competitive position.'
WHERE ticker = 'AXISBANK' AND value_chain_note IS NULL;

-- 5. BAJFINANCE (Bajaj Finance Limited) — NBFC
UPDATE companies
SET value_chain_note = 'As a non-bank financial company (NBFC), this lender''s value chain bypasses deposits entirely: it sources capital from borrowings and securitization → underwrites retail and commercial credit → earns net interest margins and fees. Competitive advantage flows from access to capital, underwriting sophistication, and portfolio diversification — measured directly by cost of funds, credit costs (portfolio impairment %), and yield on assets.'
WHERE ticker = 'BAJFINANCE' AND value_chain_note IS NULL;

-- 6. BANDHANBNK (Bandhan Bank)
UPDATE companies
SET value_chain_note = 'Bandhan''s value chain as a lender is deposits from low-income savers → underwriting for the underbanked → retail and SME credit portfolio. Deposit franchise quality and credit risk management are the core competitive edges. §4''s metrics — particularly NPA %, cost-to-income, and deposit-to-credit ratio — capture this bank''s operating model.'
WHERE ticker = 'BANDHANBNK' AND value_chain_note IS NULL;

-- 7. BANKBARODA (Bank of Baroda) — government bank
UPDATE companies
SET value_chain_note = 'As a state-owned universal lender, BoB''s value chain is building retail and bulk deposits → credit risk assessment → credit portfolio management. Unlike a manufacturing business, competitive position is anchored in deposit franchise scale, credit quality (NPA %), and net interest margins. Live factors affecting this bank''s performance are deposit competition and government-influenced lending mandates — see §3.'
WHERE ticker = 'BANKBARODA' AND value_chain_note IS NULL;

-- 8. CANBK (Canara Bank) — government bank
UPDATE companies
SET value_chain_note = 'For a government-owned lender, the value chain flows deposits → credit underwriting (including priority sector lending mandates) → portfolio management. Competitive advantage turns on deposit franchise, credit risk discipline (NPA %), and cost control. §4''s metrics on asset quality, spreads, and operating efficiency directly reflect this bank''s position.'
WHERE ticker = 'CANBK' AND value_chain_note IS NULL;

-- 9. CHOLAFIN (Chola Mandalam Finance) — NBFC, commercial vehicle financing
UPDATE companies
SET value_chain_note = 'As an NBFC focused on commercial vehicle and two-wheeler financing, Chola''s value chain is capital sourcing (term borrowings, securitization, equity) → credit underwriting for the transportation segment → portfolio management. Competitive position depends on access to low-cost funding, credit risk management in the CVF segment, and portfolio growth. Cost of funds, credit costs, and yield on assets directly measure this company''s operating leverage.'
WHERE ticker = 'CHOLAFIN' AND value_chain_note IS NULL;

-- 10. FEDERALBNK (Federal Bank) — private sector bank
UPDATE companies
SET value_chain_note = 'As a private-sector lender, Federal''s value chain is customer deposits and term borrowings → credit risk assessment → credit portfolio. Competitive moat is built on deposit franchise depth (particularly in South India), credit underwriting quality, and net interest margin management. §4''s NPA %, cost-to-income, and NIM metrics capture the bank''s operating leverage.'
WHERE ticker = 'FEDERALBNK' AND value_chain_note IS NULL;

-- 11. IDFCFIRSTB (IDFC First Bank)
UPDATE companies
SET value_chain_note = 'IDFC First Bank''s value chain is deposits and term borrowings → credit underwriting → portfolio management. As a merged entity and younger franchise, competitive position depends on building deposit franchise scale, maintaining credit quality (NPA %), and achieving cost-to-income improvement. See §4 for profitability and asset-quality metrics.'
WHERE ticker = 'IDFCFIRSTB' AND value_chain_note IS NULL;

-- 12. PNB (Punjab National Bank) — government bank
UPDATE companies
SET value_chain_note = 'As a state-owned lender, PNB''s value chain is deposits (including government and bulk deposits) → credit risk assessment → credit portfolio. Position is measured by deposit franchise stickiness, credit quality (NPA %), and net interest margins — not supply-chain metrics. Regulatory lending mandates and competition for deposits are the live factors shaping this bank''s performance — see §3.'
WHERE ticker = 'PNB' AND value_chain_note IS NULL;

-- 13. SHRIRAMFIN (Shriram Finance) — NBFC, retail credit
UPDATE companies
SET value_chain_note = 'As an NBFC specializing in retail credit (auto, gold), Shriram''s value chain is capital sourcing (term loans, securitization, equity) → credit underwriting → portfolio management. The company''s competitive position depends entirely on access to capital and cost of funds, underwriting capability across different retail segments, and portfolio diversification. Portfolio impairment rate and cost-to-income ratios directly measure operating leverage.'
WHERE ticker = 'SHRIRAMFIN' AND value_chain_note IS NULL;

-- ===== PART B: ITC conglomerate =====

-- 14. ITC (multi-business conglomerate)
UPDATE companies
SET value_chain_note = 'ITC is a diversified holding company with four primary businesses: cigarettes (core, ~87% of operating profit from Leaf & Agri segment), hotels, IT services, and agri-commerce. The value-chain lens in §2 traces the cigarette business''s chain: leaf sourcing and processing → brand portfolio management → distribution and regulatory navigation. The conglomerate structure creates a holding-company discount relative to sum-of-parts, visible in peer comparisons but not a primary business driver — see §1 for each business unit''s distinct dynamics.'
WHERE ticker = 'ITC' AND value_chain_note IS NULL;

-- ===== THE JUDGE (one statement -> one grid; every check visible) =====
-- Expected grid — IDENTICAL on first run and on any re-run:
--   1 | NULL value_chain_note remaining (expect 0)        | 0
--   2 | The 14 target tickers holding a note (expect 14)  | 14
--   3 | Total companies (expect 107)                      | 107
--   4 | SBIN note, first 40 chars                         | For a retail lender, deposits are the r
SELECT 1 AS ord, 'NULL value_chain_note remaining (expect 0)' AS check_step, COUNT(*)::text AS result
  FROM companies WHERE value_chain_note IS NULL
UNION ALL
SELECT 2, 'The 14 target tickers holding a note (expect 14)', COUNT(*)::text
  FROM companies
 WHERE ticker IN ('SBIN','KOTAKBANK','AUBANK','AXISBANK','BAJFINANCE','BANDHANBNK','BANKBARODA',
                  'CANBK','CHOLAFIN','FEDERALBNK','IDFCFIRSTB','PNB','SHRIRAMFIN','ITC')
   AND value_chain_note IS NOT NULL
UNION ALL
SELECT 3, 'Total companies (expect 107)', COUNT(*)::text FROM companies
UNION ALL
SELECT 4, 'SBIN note, first 40 chars', LEFT(value_chain_note, 40)
  FROM companies WHERE ticker = 'SBIN'
ORDER BY ord;
