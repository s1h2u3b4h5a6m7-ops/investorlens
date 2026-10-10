"""SBI-specific mechanisms, evidence gates and chart geometry. Offline, no AI.

Never infer a signed standalone profit effect from unsigned group stress figures.
Never turn two growth observations into a fitted economic elasticity.
"""
import argparse
import hashlib
import json
import math
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlparse

COLORS = ['#a6a2ff', '#82e6d3', '#ffb2bd', '#81bfff', '#eec785']
DOMESTIC = 'SBI standalone domestic business'


def input_digest(raw):
    """JSON edition hash independent of Git's platform-specific line endings."""
    return hashlib.sha256(json.dumps(raw,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode('utf8')).hexdigest()


def number(value, low=None, high=None):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Non-finite or nonnumeric value')
    if low is not None and value < low or high is not None and value > high:
        raise ValueError('Value outside supported range')
    return value


def indian(value, places=0):
    sign = '-' if value < 0 else ''
    parts = f'{abs(value):.{places}f}'.split('.')
    integer = parts[0]
    if len(integer) > 3:
        prefix, suffix = integer[:-3], integer[-3:]
        groups = []
        while prefix:
            groups.insert(0, prefix[-2:]); prefix = prefix[:-2]
        integer = ','.join(groups+[suffix])
    return sign+integer+('.'+parts[1] if len(parts)>1 else '')


def series(rows, as_of, source_ids=None):
    last = None
    for row in rows:
        if len(row) != (3 if source_ids else 2):
            raise ValueError('Malformed observation')
        parsed = date.fromisoformat(row[0])
        if parsed > as_of or last and parsed <= last:
            raise ValueError('Future, duplicate or unsorted observation')
        number(row[1], 0.000001)
        if source_ids and row[2] not in source_ids:
            raise ValueError('Unknown observation source')
        last = parsed


def growth(rows):
    return {after[0]: (after[1]/before[1]-1)*100
            for before, after in zip(rows, rows[1:])
            if after[0][5:] == before[0][5:] and int(after[0][:4])-int(before[0][:4]) == 1}


def afs_value_change(book_crore, share_percent, modified_duration, shock_bp):
    """Small parallel shift, unchanged portfolio; ignores convexity and hedges."""
    number(book_crore, 0.000001)
    number(share_percent, 0, 100)
    number(modified_duration, 0, 30)
    number(shock_bp, -100, 100)
    return -book_crore*(share_percent/100)*modified_duration*(shock_bp/10000)


def paired_bars(key, title, groups, legend, unit, ceiling, note):
    """All coordinates prepared here; browser only draws primitives."""
    bars, labels = [], []
    plot_left, plot_right, baseline, plot_height = 54, 506, 170, 134
    cell = (plot_right-plot_left)/len(groups)
    bar_width = min(62, cell/(len(legend)+.5))
    for index, (label, values) in enumerate(groups):
        center = plot_left + cell*(index+.5)
        labels.append({'x': round(center,2), 'y': 197, 'text': label})
        for j, value in enumerate(values):
            number(value, 0, ceiling)
            height = plot_height*value/ceiling
            x = center+(j-(len(values)-1)/2)*bar_width-bar_width*.42
            precision=1 if len(values)>2 else 2
            bars.append({'x':round(x,2),'y':round(baseline-height,2),'width':round(bar_width*.84,2),'height':round(height,2),
                         'color':COLORS[j],'label':f'{value:.{precision}f}{unit}', 'label_x':round(x+bar_width*.42,2),'label_y':round(baseline-height-10,2),
                         'description':f'{label}, {legend[j]}: {value:.2f}{unit}'})
    ticks=[{'y':round(baseline-plot_height*n/4,2),'label':f'{ceiling*n/4:g}'} for n in range(5)]
    return {'key':key,'kind':'bars','title':title,'unit':unit,'view_box':'0 0 520 216','bars':bars,'ticks':ticks,'labels':labels,
            'legend':[{'label':label,'color':COLORS[i]} for i,label in enumerate(legend)],'note':note}


def donut(key, title, shares, center_top, center_bottom, note):
    total=sum(value for _,value in shares)
    if abs(total-100)>0.02 or any(value<=0 for _,value in shares):
        raise ValueError('Portfolio shares do not total 100%')
    circumference=2*math.pi*76
    offset=0; segments=[]
    for i,(label,value) in enumerate(shares):
        length=circumference*value/total
        segments.append({'label':label,'value':f'{value:g}%','color':COLORS[i],
                         'dash':f'{length:.5f} {circumference-length:.5f}','offset':round(-offset,5)})
        offset+=length
    return {'key':key,'kind':'donut','title':title,'view_box':'0 0 220 220','segments':segments,
            'center_top':center_top,'center_bottom':center_bottom,'note':note}


def validate(raw, today):
    if raw.get('version')!=1 or date.fromisoformat(raw['collected_on'])>today:
        raise ValueError('Unsupported or future source edition')
    for source in raw['sources'].values():
        if urlparse(source['url']).hostname not in {'sbi.bank.in','www.rbi.org.in','static.pib.gov.in'}:
            raise ValueError('Source must be the verified official host')
        if len(source['sha256'])!=64 or any(c not in '0123456789abcdef' for c in source['sha256']):
            raise ValueError('Missing raw source hash')
        if source.get('published_on') and date.fromisoformat(source['published_on'])>today:
            raise ValueError('Source not yet published')
        if source['checked_on']!=raw['collected_on']:
            raise ValueError('Source checks belong to a different edition')
    bank,economy=raw['bank'],raw['economy']
    if bank['ticker']!='SBIN' or bank['scope']!=DOMESTIC or bank['unit']!='INR crore':
        raise ValueError('Incompatible SBI scope')
    if economy['base_year']!='2022-23' or economy['edition_on']!=raw['sources']['mospi_gdp']['published_on'] or economy['scope']!='India' or economy['unit']!='INR crore':
        raise ValueError('Incompatible GDP base or edition')
    if bank['published_on']!=raw['sources'][bank['source_id']]['published_on'] or date.fromisoformat(bank['observed_on'])>date.fromisoformat(bank['published_on']):
        raise ValueError('Bank exposure not available at publication')
    series(bank['domestic_loan_stocks'],today,raw['sources'])
    for key in ['real_gdp','nominal_gdp']:
        series(economy[key],today)
    series(bank['domestic_deposit_stocks'],today)
    ratio=bank['q1_ratios']
    if ratio['scope']!='SBI standalone domestic' or ratio['unit']!='percent' or ratio['frequency']!='Q1 fiscal-year-to-date; comparable three-month periods':
        raise ValueError('Ratio period or scope is not comparable')
    periods=ratio['periods']
    if len(periods)!=2 or periods[-1]!=bank['observed_on'] or any(p[5:]!='06-30' for p in periods) or int(periods[1][:4])-int(periods[0][:4])!=1:
        raise ValueError('Need comparable Q1 periods')
    for key in ['loan_yield','deposit_cost','nim','investment_yield']:
        if len(ratio[key])!=2: raise ValueError('Missing ratio')
        for value in ratio[key]: number(value,0,20)
    portfolio=bank['treasury']
    if portfolio['unit']!='INR crore': raise ValueError('Wrong treasury units')
    number(portfolio['domestic_investments'],1)
    number(portfolio['afs_modified_duration_years'],0,30)
    for shares in [portfolio['allocation_percent'],portfolio['afs_mix_percent']]:
        if len(shares)!=5: raise ValueError('Missing portfolio bucket')
        for _,value in shares: number(value,0,100)
        if abs(sum(value for _,value in shares)-100)>.02: raise ValueError('Wrong portfolio total')
    risk=raw['group_rate_risk']
    if risk['scope']!='State Bank Group consolidated' or risk['sign_disclosed'] is not False or risk['source_id']!='sbi_group_risk':
        raise ValueError('Do not infer a signed SBI effect')
    if date.fromisoformat(risk['observed_on'])>today: raise ValueError('Future group disclosure')
    if [row[0] for row in risk['nii_magnitude_crore']] != [100,200]: raise ValueError('Unsupported shock benchmark')
    for _,value in risk['nii_magnitude_crore']: number(value,0)
    policy=raw['policy']
    for key in ['previous_percent','current_percent']: number(policy[key],0,30)
    if abs((policy['current_percent']-policy['previous_percent'])*100-policy['change_bp'])>.000001:
        raise ValueError('Policy delta mismatch')
    if date.fromisoformat(policy['event_on'])>today: raise ValueError('Future policy decision')
    if policy['event_on']!=raw['sources'][policy['source_id']]['published_on']:
        raise ValueError('Policy publication mismatch')
    if raw['bond_readings']['instrument']!='6.94% GS 2036' or raw['bond_readings']['unit']!='percent yield' or raw['bond_readings']['source_id']!='rbi_rates':
        raise ValueError('Incompatible current bond instrument')
    series(raw['bond_readings']['observations'],today)


def build(raw, as_of, input_hash):
    today=date.fromisoformat(as_of); validate(raw,today)
    if input_hash!=input_digest(raw):
        raise ValueError('Input edition hash does not match')
    bank,eco,policy=raw['bank'],raw['economy'],raw['policy']
    ratio,treasury=bank['q1_ratios'],bank['treasury']
    before,after=ratio['periods']
    spread=[ratio['loan_yield'][i]-ratio['deposit_cost'][i] for i in range(2)]
    spread_delta=(spread[1]-spread[0])*100
    spreads_signal='Headwind' if spread_delta<0 else 'Tailwind' if spread_delta>0 else 'Unchanged'
    spread_word='narrowed' if spread_delta<0 else 'widened' if spread_delta>0 else 'was unchanged'
    rate_heading='The lending gap got smaller' if spread_delta<0 else 'The lending gap got wider' if spread_delta>0 else 'The lending gap was unchanged'
    afs_share=treasury['allocation_percent'][1][1]
    if treasury['allocation_percent'][1][0]!='Available for sale (AFS)': raise ValueError('Wrong AFS bucket')
    scenarios=[]
    for shock in [25,-25]:
        change=afs_value_change(treasury['domestic_investments'],afs_share,treasury['afs_modified_duration_years'],shock)
        scenarios.append({'shock_bp':shock,'change_crore':round(change,2),
                          'headline':('Yields rise' if shock>0 else 'Yields fall')+' 0.25 percentage points',
                          'signal':'Headwind' if change<0 else 'Tailwind',
                          'value':('−' if change<0 else '+')+'₹'+indian(abs(change))+' crore',
                          'channel':'Estimated AFS market value', 'bar_width_percent':100})
    gdp=growth(eco['real_gdp']); nominal=growth(eco['nominal_gdp']); loans=growth(bank['domestic_loan_stocks'])
    common=sorted(set(gdp)&set(nominal)&set(loans))
    if len(common)<2: raise ValueError('Need two matched Q1 growth comparisons')
    last=common[-1]
    if last!=bank['observed_on']: raise ValueError('Bank/economy comparison is not the latest common quarter')
    # Deliberately no fitted coefficient or correlation from two annual Q1 samples.
    pairs=[{'period':d,'real_gdp_growth_percent':round(gdp[d],4),'nominal_gdp_growth_percent':round(nominal[d],4),'domestic_loan_growth_percent':round(loans[d],4)} for d in common]
    economy_signal='Tailwind' if gdp[last]>0 and loans[last]>0 else 'Headwind' if gdp[last]<0 and loans[last]<0 else 'Mixed'
    charts=[
      paired_bars('rates','What SBI earns vs what it pays', [('Apr–Jun 2025',[ratio['loan_yield'][0],ratio['deposit_cost'][0]]),('Apr–Jun 2026',[ratio['loan_yield'][1],ratio['deposit_cost'][1]])],['Loan yield','Deposit cost'],'%',10,'Comparable Q1 periods, SBI domestic business. These two rates use different balance denominators; their gap is a spread proxy, not net interest margin.'),
      paired_bars('economy','Economic growth and SBI loan growth', [(f'Apr–Jun {d[:4]}',[gdp[d],nominal[d],loans[d]]) for d in common],['Real GDP','Nominal GDP','SBI domestic loans'],'%',25,'Year-on-year growth. GDP is activity during the quarter; loans are balances at quarter-end. Side-by-side observations, not a causal model.'),
      donut('portfolio','Where SBI holds its domestic investments',treasury['allocation_percent'],'₹'+f'{treasury["domestic_investments"]/100000:.2f}'+' lakh cr','30 June 2026','AFS is the disclosed category used for the bond-price scenario. HTM holdings are kept separate; they still have economic interest-rate risk.'),
      donut('afs_mix','Inside the AFS portfolio',treasury['afs_mix_percent'],'AFS','30 June 2026','Government securities are only part of this portfolio. Corporate spreads and different maturities can change the actual response.'),
      paired_bars('investment_yield','Income yield on domestic investments', [('Apr–Jun 2025',[ratio['investment_yield'][0]]),('Apr–Jun 2026',[ratio['investment_yield'][1]])],['Investment yield'],'%',10,'Observed income yield, not the current government-bond market yield. Comparable Q1 periods; not attributed to one macro event.')]
    age=(today-date.fromisoformat(bank['observed_on'])).days
    cards=[
      {'key':'rates','classification':'macro','title':'Interest rates','signal':'Not established','signal_scope':'Net effect of the new RBI hike',
       'reading':f'Repo {policy["current_percent"]:.2f}%','change':f'+{policy["change_bp"]} basis points · {policy["event_on"]}',
       'path':['RBI raises rates','Loan income & funding cost reprice','Net effect needs both sides'],
       'takeaway':'A hike can raise loan income and funding costs at different speeds. We cannot determine SBI’s net benefit from the policy rate alone.',
       'history_signal':spreads_signal,'history_reading':f'{spread[0]:.2f}% → {spread[1]:.2f}% lending spread',
       'history_detail':f'The gap {spread_word} by {abs(spread_delta):.0f} basis points in Apr–Jun 2026 versus Apr–Jun 2025. This happened before the October hike.',
       'source_ids':['rbi_policy','rbi_rates','sbi_q1fy27'],'evidence_type':'Reported rates and observed bank ratios; no causal coefficient'},
      {'key':'economy','classification':'macro','title':'The economy','signal':economy_signal,'signal_scope':'Loan-demand context · Apr–Jun 2026',
       'reading':f'{gdp[last]:.1f}% real GDP growth','change':f'{loans[last]:.2f}% SBI domestic loan growth · year on year',
       'path':['Economy expands','Customers borrow & invest','More lending opportunity'],
       'takeaway':'Growth supports the lending opportunity. The data does not show how much of SBI’s growth GDP caused, or whether profit will rise.',
       'history_signal':economy_signal,'history_reading':f'{len(common)} matched growth comparisons',
       'history_detail':'Too few comparisons to fit or validate a GDP-to-SBI sensitivity. This is a dated context signal, not a current earnings signal.',
       'source_ids':['mospi_gdp','sbi_q1fy26','sbi_q1fy27'],'evidence_type':'Descriptive growth comparison; coefficient withheld'},
      {'key':'bonds','classification':'macro','title':'Bond yields','signal':'Scenario only','signal_scope':'Existing AFS investment values',
       'reading':f'{raw["bond_readings"]["observations"][-1][1]:.4f}% government-bond yield',
       'change':f'{raw["bond_readings"]["instrument"]} · {raw["bond_readings"]["observations"][-1][0]}',
       'path':['Bond yields move','Existing bond prices move oppositely','AFS market value changes'],
       'takeaway':'Higher yields pressure existing bond prices; lower yields support them. New purchases can earn different income. SBI’s overall result may differ.',
       'history_signal':'Scenario only','history_reading':'±0.25 percentage-point yield scenarios',
       'history_detail':'Only one comparable current bond reading is collected. No actual yield rise or fall, or current SBI direction, is asserted.',
       'source_ids':['rbi_rates','sbi_q1fy27'],'evidence_type':'Duration-based conditional valuation approximation'}]
    risk=raw['group_rate_risk']
    loan_delta=(ratio['loan_yield'][1]-ratio['loan_yield'][0])*100
    cost_delta=(ratio['deposit_cost'][1]-ratio['deposit_cost'][0])*100
    nim_delta=(ratio['nim'][1]-ratio['nim'][0])*100
    fresh=today <= date.fromisoformat(raw['collected_on'])+timedelta(days=2)
    return {'version':1,'ticker':'SBIN','as_of':as_of,'valid_until':str(date.fromisoformat(raw['collected_on'])+timedelta(days=2)),
            'current_signals_enabled':fresh,'observation_status':'Checked snapshot' if fresh else 'Refresh needed',
            'input_sha256':input_hash,'publication_mode':'Offline, manually verified source edition; no scheduled refresh',
            'exposure_date':bank['observed_on'],'exposure_age_days':age,'exposure_published_on':bank['published_on'],
            'summary':'Three macro factors. Three different business paths.','cards':cards,'charts':charts,'bond_scenarios':scenarios,
            'bond_method':{'estimated_afs_book_crore':round(treasury['domestic_investments']*afs_share/100,2),'modified_duration_years':treasury['afs_modified_duration_years'],
              'formula':'Approximate value change = −AFS book × modified duration × (yield change in basis points / 10,000)',
              'assumptions':'Unchanged June portfolio; parallel shift across AFS yields; duration approximation ignores convexity, hedges, spread movements and accounting adjustments. Market value, not realized loss or net profit.'},
            'rate_result_pair':[{'label':'Loan yield','value':f'{loan_delta:+.0f} bp'},{'label':'Deposit cost','value':f'{cost_delta:+.0f} bp'}],
            'rate_heading':rate_heading,
            'relationships':[
              {'factor_key':'rates','company':'SBIN','event':'If interest rates rise','channel':'Loan income','signal':'Potential tailwind','effect':'Repricing loans can earn more interest.','evidence_level':'Mechanism; SBI repricing fraction and timing not measured','net_effect':'Not established','source_ids':['sbi_q1fy27','sbi_group_risk']},
              {'factor_key':'rates','company':'SBIN','event':'If interest rates rise','channel':'Funding cost','signal':'Potential headwind','effect':'Repricing deposits and borrowing can cost more.','evidence_level':'Mechanism; SBI repricing fraction and timing not measured','net_effect':'Not established','source_ids':['sbi_q1fy27','sbi_group_risk']},
              {'factor_key':'economy','company':'SBIN','event':'Economic activity expands','channel':'Loan demand','signal':economy_signal+' context','effect':f'Real GDP +{gdp[last]:.1f}%; SBI domestic loans +{loans[last]:.2f}%, Apr–Jun 2026 year on year.','evidence_level':'Two descriptive growth comparisons; no causal estimate','net_effect':'Not established','source_ids':['mospi_gdp','sbi_q1fy27']},
              {'factor_key':'bonds','company':'SBIN','event':'If AFS yields rise 25 bp','channel':'Existing bond market value','signal':'Conditional headwind','effect':scenarios[0]['value']+' estimated value change.','evidence_level':'Duration approximation, unchanged June exposure','net_effect':'Not established','source_ids':['sbi_q1fy27']},
              {'factor_key':'bonds','company':'SBIN','event':'If AFS yields fall 25 bp','channel':'Existing bond market value','signal':'Conditional tailwind','effect':scenarios[1]['value']+' estimated value change.','evidence_level':'Duration approximation, unchanged June exposure','net_effect':'Not established','source_ids':['sbi_q1fy27']}],
            'margin_note':f'Domestic net interest margin changed by {nim_delta:+.0f} basis point. The loan-yield / deposit-cost gap changed by {spread_delta:+.0f} basis points. Different denominators and investment income mean these are not the same measure.',
            'observed':{'spread_before_percent':round(spread[0],4),'spread_after_percent':round(spread[1],4),'spread_change_bp':round(spread_delta,4),
                        'loan_yield_change_bp':round((ratio['loan_yield'][1]-ratio['loan_yield'][0])*100,4),
                        'deposit_cost_change_bp':round((ratio['deposit_cost'][1]-ratio['deposit_cost'][0])*100,4),
                        'domestic_nim_change_bp':round((ratio['nim'][1]-ratio['nim'][0])*100,4),
                        'investment_yield_change_bp':round((ratio['investment_yield'][1]-ratio['investment_yield'][0])*100,4),
                        'growth_pairs':pairs},
            'group_rate_risk':{'scope':risk['scope'],'period':risk['observed_on'],'source_id':risk['source_id'],
               'benchmarks':[{'shock':f'{bp/100:g} percentage-point parallel rate shift','magnitude':'₹'+indian(value,2)+' crore'} for bp,value in risk['nii_magnitude_crore']],
               'explanation':'SBI reports these unsigned one-year NII-risk magnitudes for State Bank Group. They do not specify the signed response to a hike versus a cut and are not standalone SBI profit predictions. June’s disclosure contains no updated DF-9 shock table.'},
            'evidence':{'causal_effect_established':False,'gdp_coefficient':None,'gdp_comparisons':len(common),'repo_to_nii_coefficient':None,'current_bond_direction':None,
                        'forecast_enabled':False,'point_in_time_backtest_enabled':False,'annual_nii_conflict_resolved':False},
            'sources':raw['sources'],'limitations':raw['limitations'],
            'freshness_note':f'Prepared {as_of}. Bank exposures: {bank["observed_on"]} ({age} days before preparation), published {bank["published_on"]}. GDP quarter: Apr–Jun 2026, released {eco["edition_on"]}. RBI policy: {policy["event_on"]}; bond quote: {raw["bond_readings"]["observations"][-1][0]}. Source checking does not make quarterly figures live.'}


def main():
    root=Path(__file__).resolve().parents[1]
    parser=argparse.ArgumentParser()
    parser.add_argument('--inputs',type=Path,default=root/'data/sbi_macro_inputs.json')
    parser.add_argument('--output',type=Path,default=root/'data/sbi_macro_brief.json')
    parser.add_argument('--as-of',default=str(date.today()))
    args=parser.parse_args(); original=args.inputs.read_bytes()
    raw=json.loads(original)
    result=build(raw,args.as_of,input_digest(raw))
    temp=args.output.with_suffix('.tmp'); temp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8'); temp.replace(args.output)
    print(json.dumps({'cards':len(result['cards']),'charts':len(result['charts']),'bond_scenarios':result['bond_scenarios'],'gdp_comparisons':result['evidence']['gdp_comparisons']}))


if __name__=='__main__': main()
