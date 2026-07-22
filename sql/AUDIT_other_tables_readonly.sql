-- READ-ONLY AUDIT. Changes nothing. Safe to run any time.
-- Purpose: does the same unused-write-grant condition exist on the 8 original
-- tables? RLS is presumed to be holding them exactly as it held
-- valuation_inputs -- this only tells us whether a second gate is missing.
-- Queued as its OWN session; do not fix here.
SELECT
  c.relname                                   AS table_name,
  c.relrowsecurity                            AS rls_enabled,
  COUNT(*) FILTER (WHERE p.cmd = 'SELECT')    AS read_policies,
  COUNT(*) FILTER (WHERE p.cmd <> 'SELECT')   AS write_policies,
  (SELECT COUNT(*) FROM information_schema.role_table_grants g
     WHERE g.table_name = c.relname AND g.grantee = 'anon'
       AND g.privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')) AS anon_write_grants
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies p ON p.tablename = c.relname
WHERE c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;
