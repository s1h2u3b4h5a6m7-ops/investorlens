"""Directions belong to channels; delayed observations never get current signals."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'etl'))
import factor_signals as F

CONTENT=(ROOT/'data/business_factors.json').read_bytes()
RAW=json.loads(CONTENT)
HASH=hashlib.sha256(CONTENT).hexdigest()


class SignalsTests(unittest.TestCase):
    def make(self,key='brent',a=100,b=110,latest='2026-10-10'):
        data=copy.deepcopy(RAW)
        for s in data['series']:
            if s['key']==key:
                s['observations']=[['2026-10-08',a],[latest,b]]
                s['latest']=latest
        return data

    def factor(self,data,key):
        return next(f for f in F.build(data,'2026-10-10',HASH)['factors'] if f['key']==key)

    def test_reproducible_edition(self):
        self.assertEqual(json.loads((ROOT/'data/factor_signals.json').read_text(encoding='utf-8')), F.build(RAW,'2026-10-10',HASH))

    def test_rising_oil_is_opposite_for_buyer_and_producer(self):
        effects=self.factor(self.make(),'brent')['effects']
        self.assertEqual([e['signal'] for e in effects],['Headwind','Tailwind'])

    def test_falling_oil_reverses_channels(self):
        self.assertEqual([e['signal'] for e in self.factor(self.make(a=110,b=100),'brent')['effects']],['Tailwind','Headwind'])

    def test_weaker_rupee_is_not_export_cost_headwind(self):
        f=self.factor(self.make('inr',90,91),'inr')
        self.assertEqual([e['signal'] for e in f['effects']],['Headwind','Tailwind'])
        self.assertEqual(f['unit'],'INR per USD')

    def test_yield_uses_basis_points_and_bond_price_inverse(self):
        f=self.factor(self.make('yield',5,5.25),'yield')
        self.assertEqual(f['change'],'+25.00 basis points')
        self.assertEqual(f['effects'][0]['signal'],'Headwind')

    def test_no_change_is_not_a_positive_signal(self):
        self.assertEqual(self.factor(self.make(a=100,b=100),'brent')['effects'][0]['signal'],'Unchanged')

    def test_delayed_observation_has_no_current_direction(self):
        f=self.factor(RAW,'brent')
        self.assertEqual(f['age_days'],4)
        self.assertTrue(all(e['signal']=='Delayed' for e in f['effects']))
        self.assertEqual(f['observation_date'],'2026-10-06')

    def test_two_calendar_day_boundary(self):
        self.assertEqual(self.factor(RAW,'yield')['age_days'],2)
        self.assertNotEqual(self.factor(RAW,'yield')['effects'][0]['signal'],'Delayed')

    def test_gaps_are_not_filled_or_called_daily_changes(self):
        f=self.factor(self.make(latest='2026-10-10'),'brent')
        self.assertEqual(f['previous_date'],'2026-10-08')
        self.assertEqual(f['change'],'+10.00%')

    def test_yen_quote_does_not_prove_carry_trade_unwind(self):
        f=self.factor(self.make('yen',150,140),'yen')
        self.assertEqual(f['effects'],[])
        self.assertIn('neither',f['context'])

    def test_future_duplicate_nonfinite_and_wrong_units_fail(self):
        cases=[]
        d=self.make(latest='2026-10-11');cases.append(d)
        d=self.make();d['series'][0]['observations'][1][0]='2026-10-08';cases.append(d)
        d=self.make();d['series'][0]['observations'][1][1]=float('nan');cases.append(d)
        d=self.make();d['series'][0]['unit']='INR crore';cases.append(d)
        d=self.make();d['collected_at']='2026-10-11T00:00:00Z';cases.append(d)
        for data in cases:
            with self.subTest(data=data['series'][0]['unit']):
                with self.assertRaises(ValueError):F.build(data,'2026-10-10',HASH)

    def test_missing_series_and_wrong_source_fail(self):
        d=self.make();d['series'].pop()
        with self.assertRaises(ValueError):F.build(d,'2026-10-10',HASH)
        d=self.make();d['series'][0]['url']='https://example.com'
        with self.assertRaises(ValueError):F.build(d,'2026-10-10',HASH)


if __name__=='__main__':unittest.main()
