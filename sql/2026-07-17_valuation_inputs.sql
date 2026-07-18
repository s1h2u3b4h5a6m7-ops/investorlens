-- ===========================================================================
-- InvestorLens India -- 2026-07-17_valuation_inputs.sql   (Session T, data model)
-- ===========================================================================
-- CONCERN (one breath): the VALUATION panel (company-page section 9) needs a
-- home for the VERIFIED, human-checked denominators that turn a live price into
-- a ratio -- and for the per-company "lens" that says WHICH ratios describe
-- each business. This migration creates that home (table valuation_inputs) and
-- seeds one row per company with the lens set, but every denominator left NULL.
--
-- WHY A NEW TABLE (not metric_snapshots): a denominator (TTM EPS, book value,
-- EBITDA, net debt) is a CURATED, primary-sourced fundamental refreshed a few
-- times a year from filed results -- not a nightly market observation. It fails
-- the OPERATING_MANUAL section-3 bar unless a human verifies it, so it must sit
-- apart from the robot's nightly diary. The nightly ROBOT (next delivery) will
-- read a price and a verified denominator and write the RATIO as a display-only
-- snapshot key (price / pe_ttm / pb / ev_ebitda) -- exactly the market_cap_cr
-- treatment, so the ratios never enter metric_order and never move the 492.
--
-- THE LENS (business-understanding, seeded now, editable in the Table Editor):
--   * ev_ebitda_applicable = FALSE for the 26 financials (banks, NBFCs, PSU
--     infra lenders, insurers, financial holdcos): for a lender borrowing is
--     RAW MATERIAL, not leverage, so EV/EBITDA does not describe the business.
--   * pe_applicable / pb_applicable = TRUE for all 107 (both are broadly read).
--   * lens_note carries the per-business nuance (P/EV for life insurers,
--     EV/EBITDA(R) for telecom/aviation, SOTP for conglomerates, inventory
--     accounting for developers). Any cell is a Table-Editor edit, never a ship.
--
-- DENOMINATORS: all NULL on seed. They fill, name by name, in the results-season
-- data lane to the section-3 standard (read from the filed result, cross-checked
-- vs >= 3 quarter-labelled aggregators, arithmetic reconciled: EPS = PAT/shares,
-- BVPS = net worth/shares). A ratio only appears once its denominator is filled;
-- until then the panel shows an honest "awaiting FY26 results verification".
--
-- CHIP INVARIANT BY DESIGN: this migration writes NOTHING into metric_snapshots,
-- adds NO company, NO force, NO promoter record. valuation_inputs is a separate
-- table the chip never counts. Expected chip, unchanged, word for word:
--   ● data checks: 107 companies · 492 metric bindings · 14 forces · 107 verified promoter records
--
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS; policy is drop-then-create; the seed
-- is INSERT ... ON CONFLICT (ticker) DO NOTHING, so a re-run inserts 0 and never
-- clobbers a denominator a human has since filled. Safe on a fresh parachute
-- rebuild and safe to re-run any time.
--
-- Generated: 2026-07-17
-- ===========================================================================

-- (0) BEFORE-capture: prove the chip-bearing tables do not move. One temp row.
DROP TABLE IF EXISTS _vi_before;
CREATE TEMP TABLE _vi_before AS
SELECT
  (SELECT COUNT(*) FROM companies)                                        AS companies_before,
  (SELECT COUNT(*) FROM metric_snapshots)                                 AS snap_rows_before,
  (SELECT COUNT(*) FROM metric_snapshots WHERE metric_key <> 'market_cap_cr') AS biz_snap_before,
  (SELECT COUNT(*) FROM mgmt_profiles)                                    AS mgmt_before;

-- (1) The table: one row per company; lens booleans + verified denominators.
CREATE TABLE IF NOT EXISTS valuation_inputs (
  ticker                TEXT PRIMARY KEY REFERENCES companies(ticker),
  -- the lens: which ratios describe THIS business (editable in Table Editor)
  pe_applicable         BOOLEAN NOT NULL DEFAULT TRUE,
  pb_applicable         BOOLEAN NOT NULL DEFAULT TRUE,
  ev_ebitda_applicable  BOOLEAN NOT NULL DEFAULT TRUE,
  -- verified denominators (NULL until the results-season lane fills them)
  ttm_eps               NUMERIC,   -- INR per share, TTM   -> P/E       = price / ttm_eps
  book_value_per_share  NUMERIC,   -- INR per share        -> P/B       = price / bvps
  ebitda_ttm_cr         NUMERIC,   -- INR crore, TTM       -> EV/EBITDA = (mcap + net_debt) / ebitda
  net_debt_cr           NUMERIC,   -- INR crore (debt-cash)-> feeds EV
  -- provenance / freshness (section-3 honesty)
  basis                 TEXT,      -- e.g. 'TTM to Q4 FY26'
  source_note           TEXT,      -- exactly what was done to verify
  lens_note             TEXT,      -- business-understanding note shown in panel
  verified_on           DATE,      -- when a human last verified the denominators
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- (2) RLS: public may READ (like companies); only service_role writes.
ALTER TABLE valuation_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_valuation_inputs" ON valuation_inputs;
CREATE POLICY "public_read_valuation_inputs" ON valuation_inputs
  FOR SELECT USING (TRUE);

-- (3) Seed: 107 rows, lens set, denominators NULL. Re-run inserts 0.
INSERT INTO valuation_inputs (ticker, pe_applicable, pb_applicable, ev_ebitda_applicable, lens_note) VALUES
  ('HDFCBANK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('ICICIBANK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('SBIN', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('KOTAKBANK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('AXISBANK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('BAJFINANCE', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('CHOLAFIN', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('SHRIRAMFIN', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('BANKBARODA', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('PNB', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('FEDERALBNK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('IDFCFIRSTB', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('BANDHANBNK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('AUBANK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('CANBK', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('HINDUNILVR', TRUE, TRUE, TRUE, NULL),
  ('ITC', TRUE, TRUE, TRUE, NULL),
  ('TCS', TRUE, TRUE, TRUE, NULL),
  ('INFY', TRUE, TRUE, TRUE, NULL),
  ('SUNPHARMA', TRUE, TRUE, TRUE, NULL),
  ('DRREDDY', TRUE, TRUE, TRUE, NULL),
  ('MARUTI', TRUE, TRUE, TRUE, NULL),
  ('TMPV', TRUE, TRUE, TRUE, NULL),
  ('M&M', TRUE, TRUE, TRUE, NULL),
  ('BAJAJ-AUTO', TRUE, TRUE, TRUE, NULL),
  ('EICHERMOT', TRUE, TRUE, TRUE, NULL),
  ('BHARTIARTL', TRUE, TRUE, TRUE, 'EV/EBITDA is the primary lens for telecom — heavy fixed assets and volatile reported profit make P/E misleading.'),
  ('RELIANCE', TRUE, TRUE, TRUE, 'A conglomerate is best read sum-of-the-parts; a single blended ratio is only a rough guide.'),
  ('ONGC', TRUE, TRUE, TRUE, NULL),
  ('COALINDIA', TRUE, TRUE, TRUE, NULL),
  ('TATASTEEL', TRUE, TRUE, TRUE, NULL),
  ('JSWSTEEL', TRUE, TRUE, TRUE, NULL),
  ('HINDALCO', TRUE, TRUE, TRUE, NULL),
  ('NTPC', TRUE, TRUE, TRUE, NULL),
  ('POWERGRID', TRUE, TRUE, TRUE, NULL),
  ('ULTRACEMCO', TRUE, TRUE, TRUE, NULL),
  ('GRASIM', TRUE, TRUE, TRUE, NULL),
  ('ASIANPAINT', TRUE, TRUE, TRUE, NULL),
  ('TITAN', TRUE, TRUE, TRUE, NULL),
  ('SBILIFE', TRUE, TRUE, FALSE, 'P/EV (price-to-embedded-value) is the truer lens for a life insurer; P/B is a rough proxy and EV/EBITDA does not apply.'),
  ('HDFCLIFE', TRUE, TRUE, FALSE, 'P/EV (price-to-embedded-value) is the truer lens for a life insurer; P/B is a rough proxy and EV/EBITDA does not apply.'),
  ('HCLTECH', TRUE, TRUE, TRUE, NULL),
  ('TECHM', TRUE, TRUE, TRUE, NULL),
  ('WIPRO', TRUE, TRUE, TRUE, NULL),
  ('NESTLEIND', TRUE, TRUE, TRUE, NULL),
  ('TATACONSUM', TRUE, TRUE, TRUE, NULL),
  ('CIPLA', TRUE, TRUE, TRUE, NULL),
  ('APOLLOHOSP', TRUE, TRUE, TRUE, NULL),
  ('MAXHEALTH', TRUE, TRUE, TRUE, NULL),
  ('LT', TRUE, TRUE, TRUE, NULL),
  ('BEL', TRUE, TRUE, TRUE, NULL),
  ('ADANIPORTS', TRUE, TRUE, TRUE, NULL),
  ('ADANIENT', TRUE, TRUE, TRUE, 'A conglomerate is best read sum-of-the-parts; a single blended ratio is only a rough guide.'),
  ('INDIGO', TRUE, TRUE, TRUE, 'EV/EBITDAR — adding aircraft rentals back — is the airline-specific lens; plain EV/EBITDA understates a lease-heavy carrier.'),
  ('BAJAJFINSV', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('JIOFIN', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('ETERNAL', TRUE, TRUE, TRUE, NULL),
  ('TRENT', TRUE, TRUE, TRUE, NULL),
  ('ADANIGREEN', TRUE, TRUE, TRUE, NULL),
  ('SUZLON', TRUE, TRUE, TRUE, NULL),
  ('WAAREEENER', TRUE, TRUE, TRUE, NULL),
  ('NTPCGREEN', TRUE, TRUE, TRUE, NULL),
  ('DLF', TRUE, TRUE, TRUE, 'For a developer, EV/EBITDA is distorted by project-inventory accounting; read alongside P/B and pre-sales.'),
  ('LICI', TRUE, TRUE, FALSE, 'P/EV (price-to-embedded-value) is the truer lens for a life insurer; P/B is a rough proxy and EV/EBITDA does not apply.'),
  ('PIDILITIND', TRUE, TRUE, TRUE, NULL),
  ('BPCL', TRUE, TRUE, TRUE, NULL),
  ('ABB', TRUE, TRUE, TRUE, NULL),
  ('SIEMENS', TRUE, TRUE, TRUE, NULL),
  ('HAL', TRUE, TRUE, TRUE, NULL),
  ('MAZDOCK', TRUE, TRUE, TRUE, NULL),
  ('TATAPOWER', TRUE, TRUE, TRUE, NULL),
  ('ADANIENSOL', TRUE, TRUE, TRUE, NULL),
  ('JSWENERGY', TRUE, TRUE, TRUE, NULL),
  ('ADANIPOWER', TRUE, TRUE, TRUE, NULL),
  ('HYUNDAI', TRUE, TRUE, TRUE, NULL),
  ('TVSMOTOR', TRUE, TRUE, TRUE, NULL),
  ('BOSCHLTD', TRUE, TRUE, TRUE, NULL),
  ('MOTHERSON', TRUE, TRUE, TRUE, NULL),
  ('BAJAJHLDNG', TRUE, TRUE, FALSE, 'A holding company is best read at a discount to the net asset value of what it owns; P/B approximates that. EV/EBITDA does not apply.'),
  ('BAJAJHFL', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('ICICIGI', TRUE, TRUE, FALSE, 'For a general insurer, read P/B alongside the combined ratio; EV/EBITDA does not apply.'),
  ('IRFC', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('PFC', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('RECLTD', TRUE, TRUE, FALSE, 'For a lender, borrowing is raw material, not leverage — so EV/EBITDA does not describe the business. Read price-to-book (vs the loan book''s net worth) and P/E.'),
  ('BRITANNIA', TRUE, TRUE, TRUE, NULL),
  ('GODREJCP', TRUE, TRUE, TRUE, NULL),
  ('UNITDSPR', TRUE, TRUE, TRUE, NULL),
  ('VBL', TRUE, TRUE, TRUE, NULL),
  ('DIVISLAB', TRUE, TRUE, TRUE, NULL),
  ('TORNTPHARM', TRUE, TRUE, TRUE, NULL),
  ('ZYDUSLIFE', TRUE, TRUE, TRUE, NULL),
  ('DMART', TRUE, TRUE, TRUE, NULL),
  ('INDHOTEL', TRUE, TRUE, TRUE, NULL),
  ('NAUKRI', TRUE, TRUE, TRUE, NULL),
  ('HINDZINC', TRUE, TRUE, TRUE, NULL),
  ('JINDALSTEL', TRUE, TRUE, TRUE, NULL),
  ('VEDL', TRUE, TRUE, TRUE, NULL),
  ('AMBUJACEM', TRUE, TRUE, TRUE, NULL),
  ('SHREECEM', TRUE, TRUE, TRUE, NULL),
  ('SOLARINDS', TRUE, TRUE, TRUE, NULL),
  ('GAIL', TRUE, TRUE, TRUE, NULL),
  ('IOC', TRUE, TRUE, TRUE, NULL),
  ('HAVELLS', TRUE, TRUE, TRUE, NULL),
  ('CGPOWER', TRUE, TRUE, TRUE, NULL),
  ('LTIM', TRUE, TRUE, TRUE, NULL),
  ('ENRIN', TRUE, TRUE, TRUE, NULL),
  ('LODHA', TRUE, TRUE, TRUE, 'For a developer, EV/EBITDA is distorted by project-inventory accounting; read alongside P/B and pre-sales.')
ON CONFLICT (ticker) DO NOTHING;

-- (4) FINAL JUDGE -- one grid: seed shape + lens split + chip-tables unchanged.
SELECT
  (SELECT COUNT(*) FROM valuation_inputs)                                          AS vi_rows,
  (SELECT COUNT(*) FROM valuation_inputs WHERE ev_ebitda_applicable = FALSE)       AS ev_off_financials,
  (SELECT COUNT(*) FROM valuation_inputs WHERE ev_ebitda_applicable = TRUE)        AS ev_on_nonfin,
  (SELECT COUNT(*) FROM valuation_inputs
     WHERE ttm_eps IS NULL AND book_value_per_share IS NULL
       AND ebitda_ttm_cr IS NULL AND net_debt_cr IS NULL)                          AS denominators_all_null,
  (SELECT COUNT(*) FROM valuation_inputs vi
     LEFT JOIN companies c ON c.ticker = vi.ticker WHERE c.ticker IS NULL)         AS orphan_rows,
  b.companies_before  AS companies_now_unchanged,
  b.biz_snap_before   AS biz_snapshots_unchanged,
  (b.companies_before = (SELECT COUNT(*) FROM companies))                          AS companies_ok,
  (b.biz_snap_before  = (SELECT COUNT(*) FROM metric_snapshots WHERE metric_key <> 'market_cap_cr')) AS biz_snapshots_ok,
  (b.mgmt_before      = (SELECT COUNT(*) FROM mgmt_profiles))                       AS mgmt_ok
FROM _vi_before b;
