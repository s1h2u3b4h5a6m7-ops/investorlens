"""Financial units, edition boundaries and safety gates, not visual acceptance."""
import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'etl'))
import sbi_macro as M
RAW_BYTES=(ROOT/'data/sbi_macro_inputs.json').read_bytes()
RAW=json.loads(RAW_BYTES)
HASH=M.input_digest(RAW)

def build(raw=None,when='2026-10-10'):
    data=raw or RAW
    return M.build(data,when,M.input_digest(data))

class MacroTests(unittest.TestCase):
    def test_published_output_reproduces(self):
        self.assertEqual(build(),json.loads((ROOT/'data/sbi_macro_brief.json').read_text(encoding='utf8')))

    def test_bp_units_and_antisymmetry(self):
        self.assertEqual(M.afs_value_change(100000,20,2,25),-100)
        self.assertEqual(M.afs_value_change(100000,20,2,-25),100)
        self.assertEqual(M.afs_value_change(100000,20,2,0),0)

    def test_latest_official_exposure_calculation(self):
        b=build()
        self.assertAlmostEqual(b['bond_method']['estimated_afs_book_crore'],251156.98,places=2)
        self.assertAlmostEqual(b['bond_scenarios'][0]['change_crore'],-1745.54,places=2)
        self.assertEqual([s['signal'] for s in b['bond_scenarios']],['Headwind','Tailwind'])
        self.assertIn('not realized loss or net profit',b['bond_method']['assumptions'])

    def test_spread_not_nim_or_policy_causation(self):
        b=build()
        self.assertEqual(b['observed']['spread_change_bp'],-22)
        self.assertEqual(b['observed']['domestic_nim_change_bp'],-1)
        self.assertEqual(b['cards'][0]['signal'],'Not established')
        self.assertEqual(b['cards'][0]['history_signal'],'Headwind')
        self.assertIn('before the October hike',b['cards'][0]['history_detail'])

    def test_small_sample_cannot_fit_gdp_coefficient(self):
        b=build()
        self.assertEqual(b['evidence']['gdp_comparisons'],2)
        self.assertIsNone(b['evidence']['gdp_coefficient'])
        self.assertFalse(b['evidence']['forecast_enabled'])
        self.assertAlmostEqual(b['observed']['growth_pairs'][-1]['domestic_loan_growth_percent'],18.1502,places=3)
        self.assertIn('context',b['cards'][1]['signal_scope'])

    def test_wider_spread_changes_signal_and_explanation(self):
        raw=copy.deepcopy(RAW);raw['bank']['q1_ratios']['loan_yield'][1]=10
        b=build(raw)
        self.assertEqual(b['cards'][0]['history_signal'],'Tailwind')
        self.assertIn('widened',b['cards'][0]['history_detail'])
        self.assertIn('wider',b['rate_heading'])

    def test_relationships_preserve_opposing_rate_channels(self):
        rows=[r for r in build()['relationships'] if r['factor_key']=='rates']
        self.assertEqual([r['signal'] for r in rows],['Potential tailwind','Potential headwind'])
        self.assertTrue(all(r['net_effect']=='Not established' for r in rows))

    def test_group_risk_not_standalone_or_signed(self):
        b=build()
        self.assertIn('Group',b['group_rate_risk']['scope'])
        self.assertIn('unsigned',b['group_rate_risk']['explanation'])
        self.assertIsNone(b['evidence']['repo_to_nii_coefficient'])

    def test_annual_conflict_stays_blocked(self):
        self.assertFalse(build()['evidence']['annual_nii_conflict_resolved'])

    def test_single_named_bond_quote_has_no_direction(self):
        b=build()
        self.assertIsNone(b['evidence']['current_bond_direction'])
        self.assertEqual(b['cards'][2]['signal'],'Scenario only')

    def test_changed_benchmark_rejected(self):
        raw=copy.deepcopy(RAW);raw['bond_readings']['instrument']='Generic 10 year monthly'
        with self.assertRaises(ValueError):build(raw)

    def test_expiry_not_reset_by_rebuilding_old_source(self):
        b=build(when='2026-10-20')
        self.assertEqual(b['valid_until'],'2026-10-12')
        self.assertFalse(b['current_signals_enabled'])

    def test_future_source_rejected(self):
        with self.assertRaises(ValueError):build(when='2026-10-06')

    def test_old_gdp_base_rejected(self):
        raw=copy.deepcopy(RAW);raw['economy']['base_year']='2011-12'
        with self.assertRaises(ValueError):build(raw)

    def test_mixed_scope_rejected(self):
        for path,value in [('scope','SBI consolidated'),('unit','INR million')]:
            raw=copy.deepcopy(RAW);raw['bank'][path]=value
            with self.assertRaises(ValueError):build(raw)

    def test_cumulative_period_not_quarter_rejected(self):
        raw=copy.deepcopy(RAW);raw['bank']['q1_ratios']['periods'][1]='2026-03-31'
        with self.assertRaises(ValueError):build(raw)

    def test_invalid_value_or_portfolio_total_rejected(self):
        for value in [float('nan'),float('inf'),True,-1]:
            with self.assertRaises(ValueError):M.afs_value_change(value,20,2,25)
        raw=copy.deepcopy(RAW);raw['bank']['treasury']['allocation_percent'][0][1]=99
        with self.assertRaises(ValueError):build(raw)

    def test_large_shock_not_extrapolated(self):
        with self.assertRaises(ValueError):M.afs_value_change(100000,20,2,200)

    def test_nonofficial_source_rejected(self):
        raw=copy.deepcopy(RAW);raw['sources']['rbi_policy']['url']='https://example.com'
        with self.assertRaises(ValueError):build(raw)

    def test_svg_bars_start_at_zero(self):
        for c in build()['charts']:
            if c['kind']=='bars':
                self.assertEqual(c['ticks'][0]['label'],'0')
                for bar in c['bars']:
                    self.assertAlmostEqual(bar['y']+bar['height'],170,places=1)

if __name__=='__main__':unittest.main()
