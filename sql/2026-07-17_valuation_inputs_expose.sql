-- ===========================================================================
-- InvestorLens India -- 2026-07-17_valuation_inputs_expose.sql  (Session T, fix)
-- ===========================================================================
-- CONCERN (one breath): the table valuation_inputs was created correctly, but
-- the website's read of it returned HTTP 404. The table is fine -- it simply
-- was not yet VISIBLE to the API layer. Two things make a table readable by
-- the public website, and creating a table does neither of them automatically:
--
--   1. GRANT SELECT to the 'anon' role. The website reads with the anon key.
--      A brand-new table starts with NO privileges for anon, so PostgREST
--      cannot see it at all. (Row Level Security is a SECOND, separate gate --
--      our public_read policy is already in place from the first migration.
--      A grant without a policy shows nothing; a policy without a grant is a
--      404. We need both, and this file supplies the missing half.)
--   2. NOTIFY pgrst -- PostgREST caches the list of tables it knows about at
--      start-up. A table created afterwards is absent from that cache until it
--      is told to re-read the schema, which is exactly this signal.
--
-- WHY THIS IS A SEPARATE, DATED FILE rather than an edit to the first one:
-- the landed migration is immutable history (the parachute replays files in
-- filename order). This file is additive and re-runnable, so a rebuild from
-- scratch gets a correctly exposed table by replaying both in order.
--
-- SAFETY: SELECT only. anon may look, never touch -- INSERT/UPDATE/DELETE are
-- deliberately NOT granted, so the browser key can never write a denominator.
-- Nothing is inserted, updated or deleted anywhere by this file.
--
-- CHIP INVARIANT BY DESIGN: no row is added or removed in any table. Expected
-- chip, unchanged, word for word:
--   ● data checks: 107 companies · 492 metric bindings · 14 forces · 107 verified promoter records
--
-- IDEMPOTENT: GRANT is "set to this state", not "add one more" -- re-running
-- changes nothing. NOTIFY is a fire-and-forget signal, harmless to repeat.
--
-- Generated: 2026-07-17
-- ===========================================================================

-- (1) Let the website's read-only roles SEE the table. SELECT and nothing else.
GRANT SELECT ON TABLE valuation_inputs TO anon;
GRANT SELECT ON TABLE valuation_inputs TO authenticated;

-- (2) The backend robot (service_role) must be able to READ the verified
--     denominators so it can compute tonight's ratios.
GRANT SELECT ON TABLE valuation_inputs TO service_role;

-- (3) Tell the API layer to re-read the schema, so the new table stops 404ing.
NOTIFY pgrst, 'reload schema';

-- (4) FINAL JUDGE -- one grid. Proves the read gate is open, the write gate is
--     shut, the RLS policy from the first migration is still attached, and the
--     seeded shape is untouched.
SELECT
  (SELECT COUNT(*) FROM valuation_inputs)                                       AS vi_rows,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'anon'
       AND privilege_type = 'SELECT')                                           AS anon_can_read,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'anon'
       AND privilege_type IN ('INSERT','UPDATE','DELETE'))                      AS anon_can_write_MUST_BE_0,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'service_role'
       AND privilege_type = 'SELECT')                                           AS robot_can_read,
  (SELECT COUNT(*) FROM pg_policies
     WHERE tablename = 'valuation_inputs'
       AND policyname = 'public_read_valuation_inputs')                         AS rls_policy_present,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'valuation_inputs')      AS rls_enabled,
  (SELECT COUNT(*) FROM valuation_inputs WHERE ev_ebitda_applicable = FALSE)    AS ev_off_financials,
  (SELECT COUNT(*) FROM companies)                                              AS companies_unchanged;
