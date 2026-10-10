"""Prepare dated, channel-specific pressures. Offline; no AI or DB writes."""
import argparse
import hashlib
import json
import math
from datetime import date, timedelta
from pathlib import Path

SPECS = {
    'brent': ('DCOILBRENTEU', 'USD/barrel', 'Oil', 'USD per barrel',
              [('Fuel buyers', -1, 'Fuel input costs', 'Purchase contracts, taxes, currency and hedges can change the cost actually paid.'),
               ('Oil producers', 1, 'Oil selling prices', 'Output volumes, contracts and operating costs can offset the price move.')]),
    'jet': ('DJFUELUSGULF', 'USD/gallon', 'Jet fuel proxy', 'USD per gallon',
            [('Airlines', -1, 'Fuel input costs', 'US Gulf spot fuel is a proxy, not Indian ATF or any airline’s invoice. Currency, taxes and contracts matter.')]),
    'inr': ('DEXINUS', 'INR per USD', 'Rupee / dollar', 'INR per USD',
            [('Dollar-paying businesses', -1, 'Dollar-linked costs', 'Only unhedged dollar payments are exposed; foreign-currency income can offset them.'),
             ('Dollar-earning businesses', 1, 'Dollar income in rupees', 'Only unchanged, unhedged dollar receipts gain from translation; other costs can offset this.')]),
    'yield': ('DGS10', '%', 'US 10-year yield', '%',
              [('Existing fixed-rate bond holders', -1, 'Bond market prices', 'Illustrates US interest-rate risk, not SBI’s portfolio or Indian bond yields. Duration and hedges matter.'),
               ('New fixed-rate bond buyers', 1, 'Income on new investment', 'Future purchases may lock in a different yield. Credit risk and investment term still matter.')]),
    'yen': ('DEXJPUS', 'JPY per USD', 'Yen / dollar', 'JPY per USD', [])
}


def build(raw, as_of, snapshot_hash):
    today = date.fromisoformat(as_of)
    if raw.get('schema_version') != 1 or not raw.get('collected_at'):
        raise ValueError('Unsupported or undated factor snapshot')
    if date.fromisoformat(raw['collected_at'][:10]) > today:
        raise ValueError('Snapshot was collected after the assessment date')
    series = {r['key']: r for r in raw['series']}
    if len(series) != len(raw['series']) or set(series) != set(SPECS):
        raise ValueError('Missing or duplicated factor')
    factors = []
    for key, (sid, unit, label, display_unit, rules) in SPECS.items():
        s = series[key]
        if s['series_id'] != sid or s['unit'] != unit or s['url'] != 'https://fred.stlouisfed.org/series/' + sid:
            raise ValueError('Wrong factor definition: ' + key)
        observations = s['observations']
        if len(observations) < 2:
            raise ValueError('Need two actual observations: ' + key)
        prior_date = None
        for d, v in observations:
            parsed = date.fromisoformat(d)
            if parsed > today or (prior_date and parsed <= prior_date) or isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
                raise ValueError('Invalid observation: ' + key)
            if key != 'yield' and v <= 0:
                raise ValueError('Nonpositive price or exchange rate')
            prior_date = parsed
        previous, latest = observations[-2:]
        if latest[0] != s['latest']:
            raise ValueError('Wrong latest date')
        age = (today-date.fromisoformat(latest[0])).days
        delta = (latest[1]-previous[1])*100 if key == 'yield' else (latest[1]/previous[1]-1)*100
        direction = 1 if delta > 0 else -1 if delta < 0 else 0
        fresh = age <= 2
        effects = []
        for audience, polarity, channel, limit in rules:
            historical = 'Tailwind' if direction*polarity > 0 else 'Headwind' if direction*polarity < 0 else 'Unchanged'
            effects.append({'audience': audience, 'channel': channel,
                            'signal': historical if fresh else 'Delayed',
                            'observed_signal': historical, 'limit': limit})
        text = 'Yield ' if key == 'yield' else 'Quoted price ' if key in ('brent', 'jet') else 'Rupees per dollar ' if key == 'inr' else 'Yen per dollar '
        text += ('rose' if direction > 0 else 'fell' if direction < 0 else 'was unchanged')
        delta_text = f'{delta:+.2f}' + (' basis points' if key == 'yield' else '%')
        factors.append({'key': key, 'classification': 'macro', 'label': label,
                        'value': f'{latest[1]:,.3f}' if key == 'jet' else f'{latest[1]:,.2f}', 'unit': display_unit,
                        'previous_date': previous[0], 'observation_date': latest[0],
                        'change': delta_text, 'reading': text, 'age_days': age,
                        'freshness': 'Within 2-day target' if fresh else f'Delayed · {age} calendar days old',
                        'valid_through': (date.fromisoformat(latest[0])+timedelta(days=2)).isoformat(),
                        'source': s['source'], 'source_url': s['url'], 'effects': effects,
                        'context': 'A stronger yen can pressure yen-funded leveraged trades. This quote alone establishes neither leveraged exposure nor an unwind.' if key == 'yen' else ''})
    return {'version': 1, 'as_of': as_of, 'collected_at': raw['collected_at'],
            'snapshot_sha256': snapshot_hash, 'factors': factors,
            'summary': 'Headwind means pressure on the named activity. Tailwind means relief or support. The same change can do both.',
            'boundary': 'Last two observed readings, not a trend or measured profit effect. This edition is manually refreshed; news events and company exposures are not automatically verified.',
            'mechanism_sources': [
                {'title': 'Interest-rate risk for fixed-rate bonds · SEC', 'url': 'https://www.sec.gov/files/investor/alerts/ib_interestraterisk.pdf'},
                {'title': 'Spot petroleum price definitions · EIA', 'url': 'https://www.eia.gov/dnav/pet/pet_pri_spt_s1_w.htm'}]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, default=Path('data/business_factors.json'))
    parser.add_argument('--output', type=Path, default=Path('data/factor_signals.json'))
    parser.add_argument('--as-of', required=True)
    args = parser.parse_args()
    content = args.input.read_bytes()
    result = build(json.loads(content), args.as_of, hashlib.sha256(content).hexdigest())
    temp = args.output.with_suffix('.tmp')
    temp.write_text(json.dumps(result, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    temp.replace(args.output)
    print(json.dumps({'as_of': result['as_of'], 'factors': len(result['factors']), 'delayed': sum(f['age_days'] > 2 for f in result['factors'])}))


if __name__ == '__main__':
    main()
