-- ============================================================================
-- InvestorLens India — Session P addendum (15 Jul 2026)
-- Concern: one sentence of production is mislabelled. The INDIGO source_note
-- says "founder-verified 15-Jul-2026", but under the new division of labour
-- (Claude verifies; founder executes) no human opened the exchange PDF. The
-- FIGURE (41.57%) is unchanged and stands on four independent quarter-labelled
-- sources + an entity-level reconciliation; only the ATTRIBUTION is corrected.
-- The database must describe exactly what was done — no more, no less.
--
-- One paste. Value-guarded; re-run is UPDATE 0.
-- Expect: UPDATE 1, then a judge row: mislabel_gone = t, relabel_in = t.
-- ============================================================================

UPDATE mgmt_profiles
   SET source_note = replace(source_note,
     '— 41.57% read from the Mar-2026 SHP filing (NSE/BSE), founder-verified 15-Jul-2026',
     '— 41.57% per the Mar-2026 SHP as carried by four independent quarter-labelled sources (Trendlyne entity-level, reconciled to the share; IIFL; Kotak; Equitymaster), cross-verified 15-Jul-2026; primary PDF at BSE scrip 539448')
 WHERE ticker = 'INDIGO'
   AND source_note LIKE '%founder-verified 15-Jul-2026%';

SELECT ticker,
       source_note NOT LIKE '%founder-verified%'       AS mislabel_gone,
       source_note LIKE '%cross-verified 15-Jul-2026%' AS relabel_in,
       right(source_note, 110)                         AS note_tail
  FROM mgmt_profiles
 WHERE ticker = 'INDIGO';
