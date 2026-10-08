"""Prepared explanation must stay honest when source data changes."""
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'etl'))
import banking_analysis as A
import banking_brief as B

D = json.loads((ROOT/'data/banking_history.json').read_text(encoding='utf-8'))


def brief(data):
    return B.build(data, A.build(data))


class BriefTests(unittest.TestCase):
    def test_published_brief_is_reproducible(self):
        self.assertEqual(json.loads((ROOT/'data/banking_brief.json').read_text(encoding='utf-8')), brief(D))

    def test_stale_edition_rejected(self):
        analysis = A.build(D)
        analysis['history_collected_at'] = '2000-01-01'
        with self.assertRaises(ValueError):
            B.build(D, analysis)

    def test_tampered_analysis_rejected(self):
        analysis = A.build(D)
        analysis['bank']['changes']['nim']['change'] = 18
        with self.assertRaises(ValueError):
            B.build(D, analysis)

    def test_mixed_overview_periods_rejected(self):
        data = copy.deepcopy(D)
        data['bank']['series']['nim']['observations'].pop()
        with self.assertRaises(ValueError):
            brief(data)

    def test_wrong_money_unit_rejected(self):
        data = copy.deepcopy(D)
        data['bank']['series']['net_advances']['unit'] = 'USD million'
        with self.assertRaises(ValueError):
            brief(data)

    def test_conflicted_overview_has_no_direction(self):
        data = copy.deepcopy(D)
        data['bank']['conflicts'].append({'key': 'nim', 'period': '2025-03-31'})
        result = brief(data)
        self.assertEqual(result['bank']['insights'][1]['state'], 'unavailable')
        self.assertNotIn('kept less', result['bank']['insights'][1]['title'])
        self.assertNotIn('use separate figures', result['bank']['quality_notice'])

    def test_merger_break_blocks_explanations(self):
        data = copy.deepcopy(D)
        data['bank']['breaks'].append({'date': '2025-06-01', 'reason': 'test'})
        self.assertTrue(all(i['state'] == 'unavailable' for i in brief(data)['bank']['insights']))

    def test_zero_base_does_not_invent_growth(self):
        data = copy.deepcopy(D)
        data['bank']['series']['deposits']['observations'][-2][1] = 0
        self.assertEqual(brief(data)['bank']['insights'][0]['state'], 'unavailable')

    def test_reversed_growth_changes_explanation(self):
        data = copy.deepcopy(D)
        data['bank']['series']['deposits']['observations'][-1][1] = 7000000
        self.assertIn('Deposits grew faster', brief(data)['bank']['insights'][0]['title'])

    def test_rising_margin_not_described_as_falling(self):
        data = copy.deepcopy(D)
        data['bank']['series']['nim']['observations'][-1][1] = 4
        self.assertIn('kept more', brief(data)['bank']['insights'][1]['title'])

    def test_bad_loan_share_is_not_absolute_loan_count(self):
        result = brief(D)['bank']['insights'][2]
        self.assertIn('share', result['title'])
        self.assertIn('relative to loans', result['meaning'])

    def test_margin_uses_earning_assets_not_loan_principal(self):
        result = brief(D)['bank']['insights'][1]
        self.assertIn('assets that earn interest', result['meaning'])
        self.assertIn('before other costs and losses', result['meaning'])

    def test_backend_selects_only_reviewed_sector_connections(self):
        channels = A.indian_market_channels()
        for scenario in brief(D)['market']['scenarios']:
            expected = [B.SECTOR_COPY[c['sector']][0] for c in channels if scenario['key'] in c['macro']]
            self.assertEqual([s['name'] for s in scenario['sectors']], expected)

    def test_no_forecast_or_current_news_claim(self):
        result = brief(D)
        self.assertIn('not today', result['bank']['limitation'])
        self.assertIn('not a measured effect', result['market']['limitation'])
        self.assertEqual(result['source_checks']['conflicts'], 1)

    def test_unknown_version_rejected(self):
        data = copy.deepcopy(D)
        data['version'] = 99
        with self.assertRaises(ValueError):
            brief(data)


if __name__ == '__main__':
    unittest.main(verbosity=2)
