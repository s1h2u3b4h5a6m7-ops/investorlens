"""Meaningful ingestion, interpretation and historical-study failure checks."""
import copy, importlib.util, json, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def module(name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'etl'/f'{name}.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
C=module('banking_refresh');A=module('banking_analysis')
D=json.loads((ROOT/'data/banking_history.json').read_text(encoding='utf-8'))

class BankingTests(unittest.TestCase):
 def test_negative_profit_preserved(self): self.assertEqual(D['bank']['series']['net_profit']['observations'][1][1],-6547)
 def test_official_source_disagreement_retained(self):
  self.assertEqual(D['bank']['cross_check'],{'cells':25,'matched':24,'conflicts':1})
  self.assertEqual(D['bank']['conflicts'][0]['pdf_value'],166340);self.assertEqual(D['bank']['conflicts'][0]['html_value'],166965)
 def test_source_conflict_blocks_growth(self): self.assertIsNone(A.bank_changes(D['bank'])['nii']['change'])
 def test_source_conflict_blocks_bank_coefficient(self):
  self.assertIsNone(A.bank_study(D)['correlation']);self.assertIsNone(A.bank_study(D)['fitted_sensitivity'])
 def test_bps_not_percent_change(self): self.assertAlmostEqual(A.bank_changes(D['bank'])['nim']['change'],-18)
 def test_funding_difference_not_ratio(self):
  result=A.build(D)['bank'];self.assertAlmostEqual(result['funding_gap_pp'],100*(4877895/4163312-5975642/5382190),places=9)
 def test_no_growth_from_negative_or_zero_base(self):
  self.assertIsNone(A.pct(-2,3));self.assertIsNone(A.pct(0,3));self.assertIsNone(A.pct(None,3))
 def test_fiscal_month_calendar(self):
  self.assertEqual(C.month_end(2023,0),'2023-04-30');self.assertEqual(C.month_end(2023,10),'2024-02-29');self.assertEqual(C.month_end(2023,11),'2024-03-31')
 def test_policy_dashes_mean_unchanged(self):
  rows=[['01-01-2020','-','4.00','-','-','-','4.0','18.0']]+[[f'{i:02d}-02-2020','-','4.25','-','-','-','4.0','18.0'] for i in range(1,11)]+[['01-03-2020','-','-','-','-','-','-','-']]
  out=C.policy(rows);self.assertEqual(out['repo'][-1],['2020-02-10',4.25]);self.assertEqual(A.rate_at(out['repo'],'2020-03-31'),4.25)
 def test_policy_no_future_effective_rate(self): self.assertIsNone(A.rate_at([['2020-01-01',4]],'2019-12-31'))
 def test_policy_wrong_columns_fail(self):
  with self.assertRaises(ValueError): C.policy([['01-01-2020','5','4']])
 def test_monthly_missing_stays_missing(self):
  rows=[['2020-21','1','2','-','4','5','6','7','8','9','10','11','12','7']]
  self.assertEqual(len(C.monthly(rows)),11);self.assertNotIn('2020-06-30',[x[0] for x in C.monthly(rows)])
 def test_monthly_columns_fail(self):
  with self.assertRaises(ValueError): C.monthly([['2020-21','1']])
 def test_duplicate_dates_fail(self):
  with self.assertRaises(ValueError): C.validate_series({'x':{'observations':[['2020-01-01',1],['2020-01-01',2]]}})
 def test_nonfinite_fail(self):
  with self.assertRaises(ValueError): C.validate_series({'x':{'observations':[['2020-01-01',float('nan')]]}})
 def test_wrong_date_fail(self):
  with self.assertRaises(ValueError): C.validate_series({'x':{'observations':[['2020-02-31',1]]}})
 def test_future_actual_fail(self):
  with self.assertRaises(ValueError): C.validate_series({'x':{'observations':[['2099-01-01',1]]}})
 def test_merger_excluded(self): self.assertEqual(A.bank_study(D)['excluded_end_dates'],['2018-03-31'])
 def test_merger_blocks_yoy(self):
  bank=copy.deepcopy(D['bank']);bank['breaks'].append({'date':'2025-06-01','reason':'test acquisition'})
  self.assertIsNone(A.bank_changes(bank)['deposits']['change'])
 def test_quarterly_cannot_mix_with_annual(self):
  bank=copy.deepcopy(D['bank']);bank['series']['deposits']['frequency']='quarterly'
  with self.assertRaises(ValueError): A.bank_changes(bank)
 def test_consolidated_cannot_mix_with_standalone(self):
  bank=copy.deepcopy(D['bank']);bank['series']['deposits']['scope']='consolidated'
  with self.assertRaises(ValueError): A.bank_changes(bank)
 def test_gap_not_treated_as_one_month(self):
  data=copy.deepcopy(D); data['macro']['nifty']['observations']=[r for r in data['macro']['nifty']['observations'] if r[0]!='2023-06-30']
  self.assertEqual(A.market_study(data)['n'],36)
 def test_constant_correlation_unknown(self): self.assertIsNone(A.correlation([(1,2),(1,3),(1,4)]))
 def test_correlation_known_signs(self):
  self.assertAlmostEqual(A.correlation([(1,1),(2,2),(3,3)]),1);self.assertAlmostEqual(A.correlation([(1,3),(2,2),(3,1)]),-1)
 def test_halves_account_for_all_months(self):
  study=A.market_study(D);self.assertEqual(study['earlier']['n']+study['later']['n'],study['n']);self.assertEqual(study['n'],38)
 def test_current_edition_ineligible_asof(self): self.assertFalse(A.eligible_asof(D['sources']['rbi_24007'],'2026-08-01'))
 def test_original_publication_required(self):
  self.assertFalse(A.eligible_asof({'original_published_at':'2020-02-01','vintage_verified':True},'2020-01-01'))
  self.assertTrue(A.eligible_asof({'original_published_at':'2020-02-01','vintage_verified':True},'2020-03-01'))
 def test_rate_increase_has_both_paths(self):
  path=A.path('repo',25);self.assertEqual(path['net_direction'],'unknown');self.assertIsNone(path['quantified_impact']);self.assertIn('Deposit and borrowing costs',path['bank_channels'])
 def test_yen_does_not_prove_carry_unwind(self): self.assertFalse(A.path('yen',5)['carry_unwind_confirmed'])
 def test_registry_no_duplicates_or_missing_sector_factors(self):
  registry=A.registry();keys=[f['key'] for f in registry['macro']];self.assertEqual(len(keys),len(set(keys)))
  for sector in A.indian_market_channels(): self.assertTrue(set(sector['macro'])<=set(keys))
 def test_no_predictions_or_unverified_news(self):
  result=A.build(D);self.assertFalse(result['asof_backtest']['enabled']);self.assertFalse(result['news_automation']['enabled']);self.assertFalse(result['market']['history_study']['prediction_enabled'])
 def test_checked_in_analysis_matches_engine(self):
  saved=json.loads((ROOT/'data/banking_analysis.json').read_text(encoding='utf-8'));self.assertEqual(saved,A.build(D))
 def test_source_hash_and_official_origins(self):
  for s in D['sources'].values():
   self.assertEqual(len(s['sha256']),64);self.assertTrue(s['url'].startswith(('https://www.rbi.org.in/','https://sbi.bank.in/')))
 def test_source_conflict_removed_unblocks_only_growth(self):
  data=copy.deepcopy(D);data['bank']['conflicts']=[]
  self.assertIsNotNone(A.bank_changes(data['bank'])['nii']['change']);self.assertIsNone(A.bank_study(data)['fitted_sensitivity'])
 def test_wrong_table_rejected(self):
  with self.assertRaises(ValueError): C.rbi_table(b'<p>Date : Jul 31, 2026</p><table>Table 182</table>','Table 40')
 def test_publication_date_required(self):
  with self.assertRaises(ValueError): C.rbi_table(b'<p>Table 40</p>','Table 40')
 def test_percent_never_silently_numeric(self):
  with self.assertRaises(ValueError): C.number('5.00%')
 def test_html_parser_preserves_cells(self):
  p=C.TableRows();p.feed('<table><tr><td><b>2025-26</b></td><td>1,234</td><td>-</td></tr></table>');self.assertEqual(p.rows,[['2025-26','1,234','-']])

if __name__=='__main__': unittest.main(verbosity=2)
