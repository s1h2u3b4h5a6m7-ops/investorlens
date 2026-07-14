-- ============================================================================
-- InvestorLens India — Session O (14 Jul 2026)
-- Concern: LTIM sits alone in the "IT Services" compare_group while
--          TCS / INFY / WIPRO / HCLTECH / TECHM sit in "IT". (STATE flag 2.)
--
-- WHY IT IS INVISIBLE, exactly (read from js/compare.js:46 on main):
--   groupsForCompare() only returns groups with >= 2 members.
--   So a solo group does not render a BROKEN chip — it renders NO chip, and
--   js/company.js:33 then hides LTIM's "compare with peers" button entirely.
--   LTIM is not mislabelled so much as un-comparable.
--
-- This is a DATA fix. No code ships. Do NOT touch js/compare.js:
--   js/selftest.js:30 asserts every company's compare_group exists in
--   GROUP_LABELS. Deleting the "IT Services" label while ANY company still
--   points at it turns the home-page chip RED. The label is harmless once
--   empty (the >= 2 filter hides it), so it stays.
--
-- Two pastes. The editor only shows the last statement's grid.
-- ============================================================================


-- ============================================================================
-- PASTE 1 of 2 — PRE-FLIGHT JUDGE (reads only, changes nothing)
--
-- This is the whole point of a pre-flight: I can read the CODE from the repo,
-- but WHO IS IN EACH BUCKET is a fact that only the database holds. Run this
-- before deciding anything.
--
-- Expect: "IT" = 5 members (TCS, INFY, WIPRO, HCLTECH, TECHM),
--         "IT Services" = 1 member (LTIM).
--
-- ⚠️ STOP AND READ THE GRID. If "IT Services" holds MORE than just LTIM,
--    do NOT run Paste 2 — that is a different decision (a real second IT
--    bucket vs. a stray one) and it gets its own session.
-- ============================================================================

SELECT
  c.compare_group,
  COUNT(*) OVER (PARTITION BY c.compare_group) AS members_in_group,
  c.ticker,
  c.name,
  c.sector
FROM companies c
WHERE c.compare_group IN ('IT', 'IT Services')
ORDER BY c.compare_group ASC, c.ticker ASC;


-- ============================================================================
-- PASTE 2 of 2 — THE MOVE
--
-- One row, one word. Guarded on the ticker AND the current value, so:
--   • it can only ever touch LTIM;
--   • re-running it is a no-op (UPDATE 0) — it cannot "move" a row twice;
--   • if someone already moved LTIM by hand, this reports 0 and changes
--     nothing rather than pretending it did work.
--
-- Expect after Paste 2:
--   IT = 6 members, LTIM among them.
--   it_services_left = 0.
-- ============================================================================

UPDATE companies
   SET compare_group = 'IT'
 WHERE ticker = 'LTIM'
   AND compare_group = 'IT Services';

-- Judge — the peer group as the site will now build it
SELECT
  c.compare_group,
  COUNT(*) OVER (PARTITION BY c.compare_group) AS members_in_group,
  c.ticker,
  c.name,
  (SELECT COUNT(*) FROM companies WHERE compare_group = 'IT Services') AS it_services_left,
  (SELECT COUNT(*) FROM companies) AS total_companies
FROM companies c
WHERE c.compare_group IN ('IT', 'IT Services')
ORDER BY c.compare_group ASC, c.ticker ASC;


-- ============================================================================
-- NOT PART OF THIS MIGRATION — recorded so it is not re-litigated later:
--
-- "IT Services" stays in GROUP_LABELS (js/compare.js:37) as an empty, unused
-- label. It costs nothing: groupsForCompare()'s >= 2 filter never surfaces it,
-- and leaving it means a future IT-services name can be assigned to it without
-- a code ship. Removing it is a cosmetic code change with a live tripwire
-- (selftest.js:30) attached — not worth spending a deploy on.
--
-- Also worth knowing before you look at the site: js/home.js:148 prints
-- compare_group as the chip on each company card. LTIM's card chip will read
-- "IT" after this, where it read "IT Services" before. That is the ONLY other
-- pixel this migration moves.
-- ============================================================================
