"""Collect public business-factor observations. No AI, keys or database writes.

Run locally on codex/trigger-intelligence. Output is a dated static snapshot.
Nothing schedules this script or changes the default-branch production jobs.
"""
import argparse
import re
import json
import math
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor

SERIES = [
    ('brent', 'DCOILBRENTEU', 'Brent crude', 'USD/barrel', 'EIA', 0.01, 1000),
    ('jet', 'DJFUELUSGULF', 'US Gulf jet fuel', 'USD/gallon', 'EIA', 0.01, 30),
    ('inr', 'DEXINUS', 'USD/INR', 'INR per USD', 'Federal Reserve H.10', 1, 500),
    ('yield', 'DGS10', 'US 10-year Treasury yield', '%', 'Federal Reserve H.15 / US Treasury', -1, 30),
    ('yen', 'DEXJPUS', 'USD/JPY', 'JPY per USD', 'Federal Reserve H.10', 1, 1000),
]

def parse_observations(raw, sid, start, end, lo, hi):
    """FRED's public data page embeds the complete table as #date|value lines."""
    rows = []
    for day, value in re.findall(r'#(\d{4}-\d{2}-\d{2})\|\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)|\.)', raw):
        if value == '.':
            continue
        observed = date.fromisoformat(day)
        if not (start <= day <= end) or observed > date.today():
            continue
        number = float(value)
        if not math.isfinite(number) or not lo <= number <= hi:
            raise ValueError(f'{sid}: invalid observation on {day}')
        rows.append([day, number])
    rows.sort(key=lambda r: r[0])
    if len(rows) < 100:
        raise ValueError(f'{sid}: insufficient history ({len(rows)} observations)')
    if len({r[0] for r in rows}) != len(rows):
        raise ValueError(f'{sid}: duplicate dates')
    return rows

def collect(spec, start, end):
    key, sid, label, unit, source, lo, hi = spec
    url = f'https://fred.stlouisfed.org/data/{sid}'
    raw = urlopen(Request(url, headers={'User-Agent': 'InvestorLens business drivers research/1.0'}), timeout=45).read().decode('utf-8-sig')
    rows = parse_observations(raw, sid, start, end, lo, hi)
    return {'key': key, 'series_id': sid, 'label': label, 'unit': unit, 'source': source,
            'url': f'https://fred.stlouisfed.org/series/{sid}', 'download_url': url,
            'first': rows[0][0], 'latest': rows[-1][0], 'observations': rows}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', default='2018-01-01')
    parser.add_argument('--end', default=date.today().isoformat())
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'data/business_factors.json')
    args = parser.parse_args()
    date.fromisoformat(args.start)
    date.fromisoformat(args.end)
    with ThreadPoolExecutor(max_workers=5) as pool:
        observations = list(pool.map(lambda s: collect(s, args.start, args.end), SERIES))
    result = {'schema_version': 1, 'collected_at': datetime.now(timezone.utc).isoformat(),
              'method': 'Public FRED observation tables; observed values only; no gap filling; no AI',
              'vintage': 'Current downloaded history; may include revisions; not point-in-time backtest data',
              'series': observations}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    temporary.replace(args.output)
    print(json.dumps({'output': str(args.output), 'collected_at': result['collected_at'],
                      'series': [{k: s[k] for k in ['key','first','latest']} | {'rows': len(s['observations'])} for s in observations]}, indent=2))

if __name__ == '__main__':
    main()
