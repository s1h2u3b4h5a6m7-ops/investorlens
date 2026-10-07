"""Fail closed if the public table changes; protect the existing snapshot."""
import importlib.util
import unittest
from datetime import date, timedelta
from pathlib import Path

spec = importlib.util.spec_from_file_location('driver_refresh', Path(__file__).parents[1] / 'etl/driver_refresh.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)

class CollectorTests(unittest.TestCase):
    def raw(self):
        return '\n'.join(f'#{(date(2024,1,1)+timedelta(days=i)).isoformat()}| {10+i/100}' for i in range(120))

    def parse(self, raw):
        return collector.parse_observations(raw,'TEST','2024-01-01','2024-12-31',0,100)

    def test_missing_and_future_excluded(self):
        rows=self.parse(self.raw()+'\n#2024-05-01| .\n#2099-01-01| 12')
        self.assertEqual(len(rows),120)
        self.assertEqual(rows[0],['2024-01-01',10.0])

    def test_changed_page_fails(self):
        with self.assertRaises(ValueError): self.parse('<h1>Maintenance</h1>')

    def test_duplicate_fails(self):
        with self.assertRaises(ValueError): self.parse(self.raw()+'\n#2024-01-01| 11')

    def test_out_of_range_fails(self):
        with self.assertRaises(ValueError): self.parse(self.raw()+'\n#2024-05-01| 10000')

if __name__=='__main__': unittest.main()
