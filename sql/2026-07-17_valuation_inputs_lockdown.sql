-- ===========================================================================
-- InvestorLens India -- 2026-07-17_valuation_inputs_lockdown.sql (Session T, fix 2)
-- ===========================================================================
-- CONCERN (one breath): the judge grid from the previous migration reported
-- anon_can_write = 3, not 0. Investigation: Supabase ships a project-wide
-- DEFAULT PRIVILEGES rule that grants the anon and authenticated roles ALL
-- privileges on every new table in the public schema. So the moment
-- valuation_inputs was created it silently carried INSERT, UPDATE, DELETE,
-- TRUNCATE, REFERENCES and TRIGGER for the public browser key -- privileges
-- nobody asked for and nothing needs.
--
-- WAS ANYTHING ACTUALLY EXPOSED? No. Proven on PostgreSQL 16 by reproducing
-- the exact grant state and then attempting writes as the anon role:
--     UPDATE valuation_inputs SET ttm_eps = 999  ->  "UPDATE 0" (value stayed NULL)
--     INSERT INTO valuation_inputs ...           ->  ERROR: new row violates
--                                                    row-level security policy
-- Row Level Security is a SECOND, independent gate, it is enabled on this
-- table, and the only policy on it is FOR SELECT. With no write policy, every
-- write is refused even though the grant exists. The data was never alterable.
--
-- WHY FIX IT ANYWAY: defence in depth. Today the table is safe because ONE
-- gate is shut. If a future session ever adds a broad write policy (or enables
-- one by accident), the unnoticed grant underneath would instantly become a
-- real hole -- a public key that can rewrite the verified denominators behind
-- every valuation on the site. The correct posture is that the browser key is
-- physically incapable of writing, policy or no policy. This file makes the
-- grant match the intent: anon and authenticated may READ, full stop.
--
-- WHY REVOKE RATHER THAN RE-GRANT: GRANT SELECT (previous file) ADDS one
-- privilege; it does not remove the others. Only REVOKE takes them away.
--
-- SCOPE DISCIPLINE (one session, one concern): this file touches ONLY
-- valuation_inputs -- the table this session created. The same Supabase
-- default almost certainly left identical unused write grants on the eight
-- original tables. That is a REAL finding but a DIFFERENT concern; it is
-- flagged for its own session, with a read-only audit query supplied, and is
-- deliberately NOT fixed here.
--
-- CHIP INVARIANT BY DESIGN: no row added or removed anywhere. Expected chip,
-- unchanged, word for word:
--   ● data checks: 107 companies · 492 metric bindings · 14 forces · 107 verified promoter records
--
-- IDEMPOTENT: REVOKE states a desired end state; running it again is a no-op.
--
-- Generated: 2026-07-17
-- ===========================================================================

-- (1) Take back everything the browser key never needed. SELECT is NOT listed,
--     so the site's read keeps working exactly as it does now.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE valuation_inputs FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE valuation_inputs FROM authenticated;

-- (2) Re-assert the read grant, so this file is self-sufficient on a rebuild
--     even if replayed out of order.
GRANT SELECT ON TABLE valuation_inputs TO anon;
GRANT SELECT ON TABLE valuation_inputs TO authenticated;
GRANT SELECT ON TABLE valuation_inputs TO service_role;

-- (3) Refresh the API layer's cached view of the schema.
NOTIFY pgrst, 'reload schema';

-- (4) FINAL JUDGE -- one grid. Both gates now shut against writes.
SELECT
  (SELECT COUNT(*) FROM valuation_inputs)                                       AS vi_rows,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'anon'
       AND privilege_type = 'SELECT')                                           AS anon_can_read,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'anon'
       AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))           AS anon_write_MUST_BE_0,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'authenticated'
       AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE'))           AS auth_write_MUST_BE_0,
  (SELECT COUNT(*) FROM information_schema.role_table_grants
     WHERE table_name = 'valuation_inputs' AND grantee = 'service_role'
       AND privilege_type = 'SELECT')                                           AS robot_can_read,
  (SELECT COUNT(*) FROM pg_policies
     WHERE tablename = 'valuation_inputs')                                      AS policies_on_table,
  (SELECT COUNT(*) FROM pg_policies
     WHERE tablename = 'valuation_inputs' AND cmd <> 'SELECT')                  AS write_policies_MUST_BE_0,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'valuation_inputs')      AS rls_enabled,
  (SELECT COUNT(*) FROM companies)                                              AS companies_unchanged;
