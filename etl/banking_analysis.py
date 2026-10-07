"""Deterministic banking + Indian-market explanations, not a price predictor.

Run after banking_refresh.py. No network, AI, secrets or external writes.
Historical associations use the downloaded latest edition, NOT as-of vintages.
"""
import argparse, json, math
from datetime import date
from pathlib import Path

RBI_TRANSMISSION='https://www.rbi.org.in/scripts/BS_ViewBulletin.aspx?Id=22120'
BIS='https://www.bis.org/publ/bisbull90.htm'
REGISTRY={
 'macro':[
  ('repo','RBI policy rate','connected','Loan rates and deposit costs can reset at different speeds.'),
  ('crr','Cash reserve requirement','connected','The share of deposits held with RBI affects deployable funds.'),
  ('slr','Required liquid assets','connected','The required liquid-asset share constrains the asset mix.'),
  ('india_yield','Indian government bond yield','connected','Bond prices, reinvestment income and financing conditions.'),
  ('inr','Rupee versus dollar','context','Import costs, export receipts and foreign-currency exposures.'),
  ('brent','Oil prices','context','Energy and transport costs, inflation and borrower cash flows.'),
  ('yield','US bond yields','context','Global financing and investment conditions.'),
  ('yen','Yen and carry trades','context','A funding-stress clue; currency alone cannot prove a carry unwind.'),
  ('inflation','Inflation','not_connected','Household purchasing power, input costs and policy response.'),
  ('gdp','Economic activity','not_connected','Loan demand, sales and borrower repayment capacity.'),
  ('liquidity','Banking liquidity','not_connected','Funding availability and short-term money-market rates.'),
  ('fpi','Foreign investment flows','not_connected','Cross-border flows and market liquidity.'),
  ('fiscal','Government spending and taxes','not_connected','Sector demand, public borrowing and after-tax cash flows.'),
  ('trade','Trade policy and tariffs','not_connected','Import/export access and costs.'),
  ('geopolitics','Wars and geopolitics','not_connected','Supply routes, energy supply and uncertainty.'),
  ('weather','Weather and climate','not_connected','Agriculture, supply chains and exposed borrowers.'),
  ('technology','Technology and AI adoption','not_connected','Productivity, competition and changing sector demand.')],
 'micro':[
  ('deposits','Customer deposits','connected','A major funding source; total deposits do not reveal their price.'),
  ('net_advances','Loans after provisions','connected','Money lent; net and gross loan balances differ.'),
  ('nii','Net interest income','connected','Interest earned minus interest paid, before other costs.'),
  ('net_profit','Net profit','connected','The final annual profit, including many other influences.'),
  ('net_npa','Remaining bad-loan share','connected','Problem loans after provisions relative to net loans.'),
  ('npa_provisions','Bad-loan provisions','connected','Charges reserved against problem loans.'),
  ('roa','Return on assets','connected','Annual profit relative to average assets.'),
  ('cost_income','Operating cost share','connected','Operating expenses relative to net income.'),
  ('borrowings','Other borrowing','connected','Funding beyond customer deposits.'),
  ('investments','Investment book','connected','Includes securities; book size does not measure duration risk.'),
  ('nim','Interest margin','connected','Interest income relative to earning assets, not NII growth.'),
  ('deposit_cost','Domestic deposit cost','connected','Interest cost relative to average domestic deposits.'),
  ('loan_yield','Domestic loan yield','connected','Interest income relative to average domestic loans.'),
  ('gross_npa','Gross bad-loan share','connected','Problem loans before deducting provisions.'),
  ('casa','Low-cost deposit mix','not_connected','Current and savings deposits relative to total deposits.'),
  ('capital','Capital buffers','connected','Loss-absorption capacity and growth constraints.'),
  ('repricing','Rate-reset timing','not_connected','When loans and deposits change their rates.'),
  ('concentration','Borrower and sector concentration','not_connected','Exposure to a particular borrower, sector or region.'),
  ('governance','Governance and outages','not_connected','Conduct, fraud, cyber incidents and service reliability.')]
}

def registry():
 return {group:[{'key':key,'label':label,'status':status,'meaning':meaning} for key,label,status,meaning in rows] for group,rows in REGISTRY.items()}

def pct(previous,current):
 if previous is None or current is None or previous<=0: return None
 return (current/previous-1)*100

def bank_changes(bank):
 out={}
 for key,s in bank['series'].items():
  if s.get('frequency')!='annual' or s.get('scope')!='SBI standalone': raise ValueError('Mixed bank frequency or scope')
  a,b=s['observations'][-2:]
  if int(b[0][:4])-int(a[0][:4])!=1: raise ValueError('Nonconsecutive bank annual periods')
  broken=any(a[0]<x['date']<=b[0] for x in bank.get('breaks',[]))
  conflict=any(x['key']==key and x['period'] in (a[0],b[0]) for x in bank.get('conflicts',[]))
  change=None if broken or conflict else (b[1]-a[1])*100 if s['unit']=='%' else pct(a[1],b[1])
  out[key]={'label':s['label'],'value':b[1],'previous':a[1],'period':b[0],'previous_period':a[0],
            'unit':s['unit'],'change':change,'change_unit':'basis points' if s['unit']=='%' else '%',
            'source_id':s['source_id'],'comparable':not broken and not conflict,'source_conflict':conflict,
            'coverage':s.get('coverage','whole bank')}
 return out

def rate_at(observations,day):
 previous=[r for r in observations if r[0]<=day]
 return previous[-1][1] if previous else None

def correlation(pairs):
 if len(pairs)<3: return None
 xs,ys=zip(*pairs); ax=sum(xs)/len(xs); ay=sum(ys)/len(ys)
 vx=sum((x-ax)**2 for x in xs); vy=sum((y-ay)**2 for y in ys)
 if vx<1e-12 or vy<1e-12: return None
 return max(-1,min(1,sum((x-ax)*(y-ay) for x,y in pairs)/math.sqrt(vx*vy)))

def month_index(day):
 return int(day[:4])*12+int(day[5:7])

def market_study(data):
 yields=dict(data['macro']['india_yield']['observations']); nifty=dict(data['macro']['nifty']['observations'])
 days=sorted(set(yields)&set(nifty)); pairs=[]; periods=[]
 for a,b in zip(days,days[1:]):
  if month_index(b)-month_index(a)!=1: continue
  pairs.append(((yields[b]-yields[a])*100,pct(nifty[a],nifty[b])));periods.append([a,b])
 midpoint=len(pairs)//2
 return {'question':'Did changes in Indian 10-year government yields move with changes in the Nifty 50 monthly average?',
         'n':len(pairs),'first':periods[0][0] if periods else None,'last':periods[-1][1] if periods else None,
         'correlation':correlation(pairs),'earlier':{'n':midpoint,'r':correlation(pairs[:midpoint])},
         'later':{'n':len(pairs)-midpoint,'r':correlation(pairs[midpoint:])},
         'method':'Consecutive monthly yield changes in basis points versus percentage changes in monthly average Nifty 50, not month-end total returns. Descriptive contemporaneous correlation; chronological half-sample stability check.',
         'verdict':'Exploratory evidence only. Shared events, autocorrelation, revisions and the short sample prevent a causal or predictive claim.',
         'prediction_enabled':False,'source_ids':['rbi_24003','rbi_24007']}

def bank_study(data):
 obs=data['bank']['series']['nii']['observations']; pairs=[]; excluded=[]
 for a,b in zip(obs,obs[1:]):
  if any(a[0]<x['date']<=b[0] for x in data['bank'].get('breaks',[])):
   excluded.append(b[0]);continue
  r0=rate_at(data['macro']['repo']['observations'],a[0]);r1=rate_at(data['macro']['repo']['observations'],b[0])
  if r0 is not None and r1 is not None: pairs.append(((r1-r0)*100,pct(a[1],b[1])))
 conflict=any(x['key']=='nii' for x in data['bank'].get('conflicts',[]))
 return {'question':'Year-end repo-rate change and annual net interest income growth',
         'n':len(pairs),'correlation':None if conflict else correlation(pairs),'excluded_end_dates':excluded,
         'verdict':('Blocked: official sources disagree on FY2025 NII. ' if conflict else '')+'Only '+str(len(pairs))+' comparable annual changes are available. This is too few to estimate SBI’s sensitivity, and year-end rates miss the path within each year.',
         'fitted_sensitivity':None,'prediction_enabled':False}

def path(key,change):
 if key=='repo':
  direction='rise' if change>0 else 'fall' if change<0 else 'stay unchanged'
  return {'factor':key,'summary':'Loan rates and funding costs may '+direction+' at different speeds.',
   'bank_channels':['Floating-rate loan income','Deposit and borrowing costs','Borrower repayment capacity'],
   'market_channels':['Credit demand','Financing costs','Discount rates'],
   'net_direction':'unknown','quantified_impact':None,'source':RBI_TRANSMISSION,
   'condition':'The effect depends on rate resets, deposit mix, loan mix and demand. No SBI coefficient is fitted.'}
 if key=='india_yield':
  return {'factor':key,'summary':'Higher yields can reduce existing fixed-rate bond prices; lower yields can lift them.',
   'bank_channels':['Securities valuation','Income when proceeds are reinvested'],
   'market_channels':['Borrowing and valuation conditions'], 'net_direction':'mixed','quantified_impact':None,
   'condition':'Mark-to-market effect depends on duration, accounting classification and hedges; the model lacks those exposures.'}
 if key=='yen':
  return {'factor':key,'summary':'Yen strength can pressure yen-funded leveraged positions.',
   'bank_channels':['Indirect global market and liquidity exposure'],'market_channels':['Leveraged positions','Cross-border flows'],
   'net_direction':'unknown','quantified_impact':None,'carry_unwind_confirmed':False,'source':BIS,
   'condition':'A yen move does not establish the size, leverage, timing or existence of a carry unwind.'}
 raise ValueError('Unknown mechanism')

def indian_market_channels():
 # A reviewed starting taxonomy, not a fitted all-market exposure graph.
 return [
  {'sector':'Banks & lenders','macro':['repo','india_yield','liquidity','gdp'],'through':'Loan income, funding costs, securities and borrower health','net_direction':'mixed'},
  {'sector':'IT & exporters','macro':['inr','gdp','technology','trade'],'through':'Foreign sales translated into rupees, overseas demand and competition','net_direction':'mixed'},
  {'sector':'Oil & energy','macro':['brent','geopolitics','trade'],'through':'Selling prices, import costs, refining spreads and supply','net_direction':'mixed'},
  {'sector':'Transport & aviation','macro':['brent','inr','geopolitics'],'through':'Fuel costs, dollar-linked payments, routes and travel demand','net_direction':'mixed'},
  {'sector':'Consumer businesses','macro':['inflation','gdp','weather'],'through':'Input costs, household budgets and sales volume','net_direction':'mixed'},
  {'sector':'Manufacturing & capital goods','macro':['repo','fiscal','trade','inr'],'through':'Finance, orders, imported inputs and export access','net_direction':'mixed'},
  {'sector':'Real estate & construction','macro':['repo','liquidity','fiscal'],'through':'Buyer financing, developer funding, demand and infrastructure orders','net_direction':'mixed'},
  {'sector':'Metals & materials','macro':['gdp','trade','geopolitics','brent'],'through':'Global demand, commodity prices, energy and transport costs','net_direction':'mixed'},
  {'sector':'Healthcare & pharma','macro':['inr','trade','technology'],'through':'Export revenue, regulation, imported inputs and innovation','net_direction':'mixed'},
  {'sector':'Telecom & utilities','macro':['repo','fiscal','technology'],'through':'Debt costs, regulated prices and investment demand','net_direction':'mixed'}]

def eligible_asof(source,cutoff):
 # Require actual original release/vintage, not a report-year guess.
 return bool(source.get('original_published_at') and source.get('vintage_verified') is True and source['original_published_at'][:10]<=cutoff)

def build(data):
 changes=bank_changes(data['bank']);loan=changes['net_advances']['change'];deposit=changes['deposits']['change']
 return {'version':1,'history_collected_at':data['collected_at'],'bank':{'name':data['bank']['name'],'ticker':'SBIN','changes':changes,
  'funding_gap_pp':loan-deposit if loan is not None and deposit is not None else None,
  'explanation':'Net loans grew faster than deposits. That raises a funding question; it does not prove a liquidity shortage.' if loan is not None and deposit is not None and loan>deposit else 'Deposits kept pace with net loans in this comparison; their cost and mix still matter.',
  'history_study':bank_study(data)},'factors':registry(),'market':{'channels':indian_market_channels(),'history_study':market_study(data),
  'coverage':'Ten sector groups are a starting map. Nifty 50 is used only for a historical large-company comparison. There is no fitted model covering all Indian stocks or all macro factors.'},
  'paths':[path('repo',-25),path('india_yield',1),path('yen',1)],
  'asof_backtest':{'enabled':False,'reason':'The downloaded editions contain revisions. Original publication timestamps and vintages must be collected before a valid as-of test.'},
  'news_automation':{'enabled':False,'reason':'General headlines are not verified events. Primary-source structured announcements and a reviewed event taxonomy are still needed.'}}

def main():
 p=argparse.ArgumentParser();p.add_argument('--history',type=Path,default=Path(__file__).resolve().parents[1]/'data/banking_history.json');p.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data/banking_analysis.json');a=p.parse_args()
 result=build(json.loads(a.history.read_text(encoding='utf-8')))
 tmp=a.output.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(a.output)
 print(json.dumps({'bank_study':result['bank']['history_study'],'market_study':result['market']['history_study']},ensure_ascii=True))
if __name__=='__main__': main()
