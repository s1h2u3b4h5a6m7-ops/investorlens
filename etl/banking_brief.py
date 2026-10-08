"""Publish a small, plain-language banking brief. No network, AI or DB writes.

This offline preparation step owns calculations and explanation rules. The
browser renders the resulting text; it never estimates a business impact.
"""
import argparse
import json
from pathlib import Path
import banking_analysis as engine


def rounded(value, places=2):
    return f'{value:,.{places}f}'.rstrip('0').rstrip('.')


def unavailable(key, title, sources):
    return {'key': key, 'state': 'unavailable', 'title': title,
            'reading': 'Comparison unavailable',
            'meaning': 'The two reporting periods cannot be compared reliably.',
            'watch': 'Check the reporting dates, changes to the business and source disagreements before drawing a conclusion.',
            'source_ids': sources}


def funding(changes):
    loan, deposit = changes['net_advances'], changes['deposits']
    sources = sorted({loan['source_id'], deposit['source_id']})
    if any(c['change'] is None or not c['comparable'] for c in [loan, deposit]):
        return unavailable('funding', 'Loans and deposits need a clearer comparison', sources)
    a, b = loan['change'], deposit['change']
    if abs(a-b) < 1e-9:
        title = 'Loans and deposits grew at the same pace' if a >= 0 else 'Loans and deposits fell at the same pace'
        meaning = 'Their percentage changes matched. That alone does not tell us how easy or costly funding was.'
    elif a > b:
        title = 'Loans grew faster than deposits' if a > 0 and b >= 0 else 'Loans and deposits moved at different speeds'
        meaning = 'Lending growth outpaced deposit growth. It raises a question about how the bank funded the difference; it does not prove a cash shortage.'
    else:
        title = 'Deposits grew faster than loans' if b > 0 and a >= 0 else 'Loans and deposits moved at different speeds'
        meaning = 'Deposit growth outpaced lending growth. More deposits do not automatically mean cheaper funding or higher profit.'
    return {'key': 'funding', 'state': 'observed', 'title': title,
            'reading': f'Loans {rounded(a)}% · Deposits {rounded(b)}%',
            'meaning': meaning,
            'watch': 'The cost of new deposits, other borrowing and cash available for lending.',
            'source_ids': sources}


def margin(changes):
    c = changes['nim']
    if c['change'] is None or not c['comparable']:
        return unavailable('margin', 'The interest margin needs a clearer comparison', [c['source_id']])
    direction = 'less' if c['change'] < 0 else 'more' if c['change'] > 0 else 'the same amount of'
    return {'key': 'margin', 'state': 'observed',
            'title': f'The bank kept {direction} interest per rupee',
            'reading': f'₹{rounded(c["previous"])} → ₹{rounded(c["value"])} per ₹100',
            'meaning': f'For every ₹100 of assets that earn interest, the bank kept about ₹{rounded(c["value"])} in interest after funding costs. This is before other costs and losses.',
            'watch': 'Whether interest earned on loans and interest paid for funding change at different speeds.',
            'source_ids': [c['source_id']]}


def loan_health(changes):
    c = changes['net_npa']
    if c['change'] is None or not c['comparable']:
        return unavailable('loan_health', 'Loan health needs a clearer comparison', [c['source_id']])
    title = 'A smaller remaining problem-loan share' if c['change'] < 0 else 'A larger remaining problem-loan share' if c['change'] > 0 else 'The remaining problem-loan share was unchanged'
    return {'key': 'loan_health', 'state': 'observed', 'title': title,
            'reading': f'{rounded(c["previous"])}% → {rounded(c["value"])}%',
            'meaning': 'This measures problem loans after deducting reserves, relative to loans after reserves. A lower share does not prove that every borrower is safer.',
            'watch': 'New missed repayments, loans written off and reserves set aside for possible losses.',
            'source_ids': [c['source_id']]}


SCENARIOS = [
    ('repo', 'Interest rates', 'How interest rates reach businesses',
     'Rates affect both income and costs. The result depends on borrowing, lending and how quickly contracts change.'),
    ('brent', 'Oil prices', 'How oil prices reach businesses',
     'Oil can be an input cost for one business and a selling price for another. The same change can travel through different paths.'),
    ('inr', 'The rupee', 'How the rupee reaches businesses',
     'Currency changes affect foreign sales and foreign payments differently. The balance depends on the company’s actual exposure.'),
    ('gdp', 'The economy', 'How economic activity reaches businesses',
     'Demand and customers’ ability to pay can change together. A sector label alone cannot tell us the size of the effect.')]

SECTOR_COPY = {
    'Banks & lenders': ('Banks and lenders', 'Money earned on loans, funding costs and borrowers’ ability to repay.'),
    'IT & exporters': ('IT and exporters', 'Sales earned abroad, overseas demand and competition.'),
    'Oil & energy': ('Oil and energy', 'Selling prices, imported oil costs and supply availability.'),
    'Transport & aviation': ('Airlines and transport', 'Fuel bills, payments in dollars, available routes and travel demand.'),
    'Consumer businesses': ('Consumer businesses', 'The cost of making products, household budgets and how much people buy.'),
    'Manufacturing & capital goods': ('Manufacturing', 'Borrowing costs, orders, imported materials and access to export markets.'),
    'Real estate & construction': ('Property and construction', 'Home-loan costs, builders’ funding and demand for new projects.'),
    'Metals & materials': ('Metals and materials', 'World demand, material prices, energy bills and transport costs.'),
    'Healthcare & pharma': ('Healthcare and pharma', 'Export income, rules, imported materials and new products.'),
    'Telecom & utilities': ('Telecom and utilities', 'Debt costs, regulated prices and investment in infrastructure.')}


def build(history, analysis):
    if history['version'] != 1 or analysis['version'] != 1:
        raise ValueError('Unsupported research snapshot version')
    if history['collected_at'] != analysis['history_collected_at']:
        raise ValueError('History and analysis editions do not match')
    if analysis != engine.build(history):
        raise ValueError('Analysis is stale or does not match the calculation rules')
    changes = analysis['bank']['changes']
    keys = ['net_advances', 'deposits', 'nim', 'net_npa']
    period = changes['net_advances']['period']
    previous = changes['net_advances']['previous_period']
    if any((changes[k]['period'], changes[k]['previous_period']) != (period, previous) for k in keys):
        raise ValueError('Overview metrics use different reporting periods')
    if any(history['bank']['series'][k]['unit'] != ('INR crore' if k in keys[:2] else '%') for k in keys):
        raise ValueError('Overview metric units do not match their definitions')
    insights = [funding(changes), margin(changes), loan_health(changes)]
    blocked = bool(history['bank'].get('conflicts'))
    numbers = []
    for key, label in zip(keys, ['Loans after reserves', 'Customer deposits', 'Interest kept', 'Remaining problem loans']):
        value = changes[key]['value']
        numbers.append({'key': key, 'label': label,
                        'value': '₹'+rounded(value/100000) if key in keys[:2] else rounded(value),
                        'unit': 'lakh crore' if key in keys[:2] else '%',
                        'source_id': changes[key]['source_id']})
    scenarios = []
    for key, label, title, description in SCENARIOS:
        sectors = []
        for channel in analysis['market']['channels']:
            if key in channel['macro']:
                name, through = SECTOR_COPY[channel['sector']]
                sectors.append({'name': name, 'through': through, 'result': 'The overall effect depends on the business.'})
        scenarios.append({'key': key, 'label': label, 'title': title, 'description': description, 'sectors': sectors})
    if blocked:
        notice = ('One historical income comparison is paused because two official SBI sources disagree. The three explanations above use separate figures.'
                  if all(i['state'] == 'observed' for i in insights) and all(c['key'] == 'nii' for c in history['bank']['conflicts'])
                  else 'Some comparisons are paused because official sources disagree. Unreliable comparisons are marked unavailable; inspect the source checks before drawing a conclusion.')
    else:
        notice = 'No source disagreement is recorded in this snapshot. Source agreement alone does not prove a business relationship.'
    return {
        'version': 1, 'history_collected_at': history['collected_at'],
        'publication_mode': 'Offline Python preparation; not a live monitoring feed.',
        'bank': {
            'name': history['bank']['name'], 'ticker': history['bank']['ticker'],
            'period': f'Year ended 31 March {period[:4]} · Compared with the previous financial year',
            'summary': 'Three changes worth understanding. Each tells us something different about the bank.',
            'insights': insights, 'company_numbers': numbers,
            'company_note': f'Official SBI FY{period[:4]} standalone figures. Other company tabs retain the older profile snapshot.',
            'flow': [{'title': 'People deposit money', 'text': 'Customer deposits are one source of funding.'},
                     {'title': 'The bank lends money', 'text': 'Loans earn interest. Deposits and borrowing have a cost.'},
                     {'title': 'The difference helps fund the business', 'text': 'The bank still pays operating costs and allows for loan losses.'}],
            'context': [{'title': 'Interest rates', 'text': 'They can change what the bank earns on loans and what it pays for funding. These sides may change at different speeds.', 'kind': 'macro', 'source_ids': ['rbi_23865']},
                        {'title': 'The economy', 'text': 'Customers’ demand for loans and ability to repay can change. We have not connected a verified economic-activity dataset yet.', 'kind': 'macro', 'source_ids': []},
                        {'title': 'Bond yields', 'text': 'Changes can affect securities the bank already holds and the income it earns from new investments. We do not yet know SBI’s full exposure.', 'kind': 'macro', 'source_ids': ['rbi_24003']}],
            'quality_notice': notice,
            'limitation': 'This is annual history, not today’s news. We can explain possible paths; we cannot yet measure a new event’s effect on SBI.'},
        'market': {'summary': 'One change can affect businesses differently. Choose a factor to see how it can reach them.',
                   'scenarios': scenarios,
                   'limitation': 'These are possible business connections, not a measured effect or a market forecast. Current company exposures and wider market data are still needed.'},
        'source_checks': {'status': 'comparison_paused' if blocked else 'no_conflict_recorded',
                          'notice': notice, 'compared': history['bank']['cross_check']['cells'],
                          'matched': history['bank']['cross_check']['matched'],
                          'conflicts': history['bank']['cross_check']['conflicts']}}


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument('--history', type=Path, default=root/'data/banking_history.json')
    parser.add_argument('--analysis', type=Path, default=root/'data/banking_analysis.json')
    parser.add_argument('--output', type=Path, default=root/'data/banking_brief.json')
    args = parser.parse_args()
    result = build(json.loads(args.history.read_text(encoding='utf-8')),
                   json.loads(args.analysis.read_text(encoding='utf-8')))
    temp = args.output.with_suffix('.tmp')
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    temp.replace(args.output)
    print(json.dumps({'brief': str(args.output), 'insights': len(result['bank']['insights']),
                      'factors': len(result['market']['scenarios']), 'source_status': result['source_checks']['status']}))


if __name__ == '__main__':
    main()
