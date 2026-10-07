"""Read-only official-source banking research collector. No AI or DB writes.

Requires pypdf for SBI's PDF. Use --cache-dir to reuse downloaded originals.
The table editions are pinned: discovering a new edition requires review.
Missing entries stay missing; RBI rate-table dashes mean NO CHANGE, not zero.
"""
import argparse, calendar, hashlib, json, math, re
from datetime import datetime, timezone
from pathlib import Path
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor

SBI_URL='https://sbi.bank.in/documents/17836/58092042/Annual%2BReport%2BFY2026.pdf/0f165880-8752-4d67-6d87-422984f5cc3f?t=1778164340579'
RBI_IDS={'policy':23865,'nifty':24007,'india_yield':24003,'system_banking':23866}
SBI_HTML='https://sbi.bank.in/web/investor-relations/sbi-financial-%20highlights-past-5'
BANK_FIELDS=[
 ('deposits','Deposits (₹ in crore)','INR crore','stock'),
 ('net_advances','Net Advances (₹ in crore)','INR crore','stock'),
 ('nii','Net Interest Income (₹ in crore)#','INR crore','flow'),
 ('npa_provisions','Provisions for NPA (₹ in crore)','INR crore','flow'),
 ('net_profit','Net Profit (₹ in crore)','INR crore','flow'),
 ('roa','Return on Average Assets (%)','%','ratio'),
 ('cost_income','Expenses to Income (%) (operating','%','ratio'),
 ('net_npa','Net NPA to Net Advances (%)','%','ratio'),
 ('borrowings','Borrowings (₹ in crore)','INR crore','stock'),
 ('investments','Investments (₹ in crore)','INR crore','stock')]

class TableRows(HTMLParser):
 def __init__(self):
  super().__init__(); self.rows=[]; self.row=None; self.cell=None; self.text=[]
 def handle_starttag(self,tag,attrs):
  if tag=='tr': self.row=[]
  if tag in ('td','th') and self.row is not None: self.cell=[]
 def handle_data(self,s):
  self.text.append(s)
  if self.cell is not None: self.cell.append(s)
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.cell is not None:
   self.row.append(' '.join(''.join(self.cell).split())); self.cell=None
  if tag=='tr' and self.row is not None: self.rows.append(self.row); self.row=None

def number(s):
 s=s.strip()
 if s in ('','-','NA','N.A.'): return None
 if not re.fullmatch(r'-?[\d,]+(?:\.\d+)?',s): raise ValueError('Unexpected numeric cell: '+s)
 n=float(s.replace(',',''))
 if not math.isfinite(n): raise ValueError('Non-finite number')
 return n

def month_end(start,offset):
 month=(offset+3)%12+1; year=start+(offset>=9)
 return f'{year}-{month:02d}-{calendar.monthrange(year,month)[1]:02d}'

def source(raw,url,title,available_at,locator):
 return {'url':url,'title':title,'sha256':hashlib.sha256(raw).hexdigest(),
         'available_at':available_at,'locator':locator,
         'verification':'Numeric cells checked against the official source table; not an independent audit of the bank.'}

def sbi_history(raw,collected):
 from pypdf import PdfReader
 from io import BytesIO
 if not raw.startswith(b'%PDF'): raise ValueError('SBI response is not a PDF')
 t=PdfReader(BytesIO(raw)).pages[9].extract_text() or ''
 if '2016-17 2017-18 2018-19' not in t or '2025-26' not in t or 'Previous period figures have been regrouped/reclassified' not in t:
  raise ValueError('SBI financial-history table layout changed')
 series={}
 for key,label,unit,kind in BANK_FIELDS:
  if t.count(label)!=1: raise ValueError('SBI row missing/ambiguous: '+label)
  tail=t.split(label,1)[1]
  if key=='cost_income': tail=tail.split('Expenses to total Net Income)',1)[1]
  cells=tail.strip().splitlines()[0].split()
  if len(cells)!=10: raise ValueError('SBI expected ten annual cells: '+key)
  vals=[number(x) for x in cells]
  if any(v is None for v in vals): raise ValueError('Missing SBI cell: '+key)
  if kind=='stock' and any(v<=0 for v in vals): raise ValueError('Invalid SBI stock')
  if kind=='ratio' and any(not -1<=v<=100 for v in vals): raise ValueError('Invalid SBI ratio')
  series[key]={'label':label.split(' (')[0],'unit':unit,'kind':kind,
    'frequency':'annual','scope':'SBI standalone','source_id':'sbi_fy2026',
    'observations':[[f'{y}-03-31',v] for y,v in zip(range(2017,2027),vals)]}
 # Independently transcribed anchors checked in the rendered official table.
 expected={'deposits':5975642,'net_advances':4877895,'nii':173120,'net_profit':80032,'net_npa':.39}
 for key,value in expected.items():
  if series[key]['observations'][-1][1]!=value: raise ValueError('SBI anchor mismatch: '+key)
 if series['net_profit']['observations'][1][1]!=-6547: raise ValueError('SBI negative profit lost')
 if series['nii']['observations'][-2][1]!=166340: raise ValueError('SBI revised NII lost')
 return {'ticker':'SBIN','name':'State Bank of India','series':series,
         'breaks':[{'date':'2017-04-01','reason':'Merger of associate banks and Bharatiya Mahila Bank: FY2017 to FY2018 growth is not comparable.'}],
         'notes':['FY2026 report restates/regroups previous NII periods. This edition is not the original historical information set.',
                  'Annual history ends March 2026; newer quarterly releases have not been collected.',
                  'Net advances differ from gross advances; this dataset never substitutes one for the other.']}

def rbi_table(raw,expected):
 p=TableRows();p.feed(raw.decode('utf-8-sig')); text=' '.join(p.text)
 if expected not in text: raise ValueError('Wrong RBI table: '+expected)
 match=re.search(r'Date\s*:\s*([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})',text)
 if not match: raise ValueError('RBI publication date not found')
 published=datetime.strptime(match[1],'%b %d, %Y').date().isoformat()
 return p.rows,published

def supplement_bank(bank,raw):
 p=TableRows();p.feed(raw.decode('utf-8-sig'))
 headers=[r for r in p.rows if r and r[0]=='Key Financial Indicators']
 if len(headers)!=1 or headers[0][1:]!=['FY 2022','FY 2023','FY 2024','FY 2025','FY 2026']: raise ValueError('SBI highlights edition changed')
 fields=[('nim','Net Interest Margin','whole bank'),('capital','Capital Adequacy Ratio (Basel 3)','whole bank'),
         ('deposit_cost','Cost of Deposits (Dom.)','domestic'),('loan_yield','Yield on Advances (Dom.)','domestic'),('gross_npa','Gross NPA Ratio','whole bank')]
 for key,label,coverage in fields:
  matched=[r for r in p.rows if r and r[0]==label]
  if len(matched)!=1 or len(matched[0])!=6: raise ValueError('SBI indicator columns changed: '+label)
  vals=[number(s.removesuffix('%')) for s in matched[0][1:]]
  if any(v is None or not 0<=v<=100 for v in vals): raise ValueError('Invalid SBI indicator')
  bank['series'][key]={'label':label,'unit':'%','kind':'ratio','frequency':'annual','scope':'SBI standalone','coverage':coverage,
    'source_id':'sbi_highlights','observations':[[f'{y}-03-31',v] for y,v in zip(range(2022,2027),vals)]}
 if bank['series']['nim']['observations'][-2:]!=[['2025-03-31',3.09],['2026-03-31',2.91]]: raise ValueError('SBI NIM anchors failed')
 # First financial highlights table only: never confuse INR with USD tables.
 first=[]; inside=False
 for r in p.rows:
  if r and r[0]=='Rs. In Crore' and r[1:]==['FY 2022','FY 2023','FY 2024','FY 2025','FY 2026']:
   if inside: break
   if not first: inside=True; continue
  if inside and r and r[0]=='US $ In Million': break
  if inside: first.append(r)
 bank['conflicts']=[]; checks=0
 for key,label in [('deposits','Deposits'),('net_advances','Advances'),('investments','Investments'),('net_profit','Net Profit'),('nii','Net Interest Income')]:
  matched=[r for r in first if r and r[0]==label]
  if len(matched)!=1 or len(matched[0])!=6: raise ValueError('SBI cross-check row ambiguous: '+label)
  for (day,pdf),cell in zip(bank['series'][key]['observations'][-5:],matched[0][1:]):
   html=number(cell);checks+=1
   if html!=pdf: bank['conflicts'].append({'key':key,'period':day,'pdf_value':pdf,'html_value':html,'source_ids':['sbi_fy2026','sbi_highlights'],'status':'unresolved'})
 bank['cross_check']={'cells':checks,'matched':checks-len(bank['conflicts']),'conflicts':len(bank['conflicts'])}
 return bank

def policy(rows):
 out={key:[] for key in ('repo','crr','slr')}
 for r in rows:
  if not r or not re.fullmatch(r'\d{2}-\d{2}-\d{4}',r[0]): continue
  if len(r)!=8: raise ValueError('RBI policy columns changed')
  day=datetime.strptime(r[0],'%d-%m-%Y').date().isoformat()
  for key,col in [('repo',2),('crr',6),('slr',7)]:
   val=number(r[col])
   if val is not None:
    if not 0<=val<=50: raise ValueError('Invalid policy rate')
    out[key].append([day,val])
 if any(len(v)<10 for v in out.values()): raise ValueError('Policy history incomplete')
 return out

def monthly(rows,maturity=None):
 out=[]; fiscal=None
 for r in rows:
  if not r: continue
  if re.fullmatch(r'\d{4}-\d{2}',r[0]):
   fiscal=int(r[0][:4])
   if maturity is not None: continue
  elif maturity is None or r[0]!=str(maturity): continue
  if fiscal is None: raise ValueError('Fiscal year context missing')
  if len(r)!=(14 if maturity is None else 13): raise ValueError('Monthly columns changed')
  for offset,cell in enumerate(r[1:13]):
   v=number(cell)
   if v is not None:
    if not v>0: raise ValueError('Nonpositive monthly observation')
    out.append([month_end(fiscal,offset),v])
 return out

def system_banking(rows):
 out={'system_deposits':[],'system_credit':[]}; section=None
 for r in rows:
  if r and r[0]=='Year':
   section='system_deposits' if 'Aggregate Deposits (2+3)' in r else 'system_credit' if 'Bank Credit (11+12)' in r else None
  if not r or not section or not re.fullmatch(r'\d{4}-\d{2}',r[0]): continue
  if int(r[0][:4])<2016: continue
  if len(r)!=(7 if section=='system_deposits' else 10): raise ValueError('SCB columns changed')
  # Bracketed merger-adjusted comparator values are not silently merged.
  cell=r[3 if section=='system_deposits' else 6].split('(')[0].strip()
  out[section].append([f'{int(r[0][:4])+1}-03-31',number(cell)])
 return out

def validate_series(series):
 for key,s in series.items():
  obs=s['observations']; days=[r[0] for r in obs]
  if not obs or days!=sorted(set(days)): raise ValueError('Duplicate/unordered history: '+key)
  for day,val in obs:
   observed=datetime.strptime(day,'%Y-%m-%d').date()
   if observed>datetime.now(timezone.utc).date(): raise ValueError('Future actual observation: '+key)
   if not isinstance(val,(int,float)) or not math.isfinite(val): raise ValueError('Invalid value: '+key)

def build(raws,collected):
 bank=supplement_bank(sbi_history(raws['sbi'],collected),raws['sbi_highlights']); sources={'sbi_fy2026':source(raws['sbi'],SBI_URL,'SBI Annual Report FY2026',collected,'Financial Legacy: printed page 8 / PDF page 10'),
  'sbi_highlights':source(raws['sbi_highlights'],SBI_HTML,'SBI Financial Highlights FY2022–FY2026',collected,'Table I (INR) and Table III (key financial indicators)')}
 series={}
 for key,sid in RBI_IDS.items():
  titles={'policy':'Table 40 : Major Monetary Policy Rates','nifty':'Table 182 : Monthly and Annual Averages of Nifty 50','india_yield':'Table 178 : Month-end Yield of SGL Transactions','system_banking':'Table 41 : Scheduled Commercial Banks'}
  rows,published=rbi_table(raws[key],titles[key]); src='rbi_'+str(sid)
  sources[src]=source(raws[key],f'https://www.rbi.org.in/Scripts/PublicationsView.aspx?id={sid}',titles[key],published,'HTML table, edition published '+published)
  result=policy(rows) if key=='policy' else {'nifty':monthly(rows)} if key=='nifty' else {'india_yield':monthly(rows,10)} if key=='india_yield' else system_banking(rows)
  for k,obs in result.items():
   series[k]={'unit':'index points' if k=='nifty' else 'INR crore' if k.startswith('system_') else '%',
             'frequency':'effective_date' if key=='policy' else 'annual' if key=='system_banking' else 'monthly',
             'source_id':src,'observations':obs}
 validate_series(series);validate_series(bank['series'])
 if series['nifty']['observations'][0]!=['2018-04-30',10472.93] or series['nifty']['observations'][-1]!=['2026-06-30',23683.15]: raise ValueError('Nifty official anchors failed')
 if series['india_yield']['observations'][0]!=['2023-04-30',7.1776]: raise ValueError('Yield official anchor failed')
 return {'version':1,'collected_at':collected,'sources':sources,'bank':bank,'macro':series,
  'availability_policy':'Source-edition dates are saved. Original release timestamps/vintages are not known; this data is excluded from an as-of historical prediction test.',
  'verification_scope':f"100 SBI numeric cells checked in the rendered official PDF; 25 added indicator cells checked against SBI official HTML; {bank['cross_check']['cells']} overlapping cells cross-checked ({bank['cross_check']['matched']} agree, {bank['cross_check']['conflicts']} conflicts remain unresolved). RBI extraction checks columns, dates, ranges and independent anchors. This does not certify the accounts or the existing 107 company records.",
  'limitations':['Annual bank data is too sparse to estimate many sensitivities.','Macro editions are historical and delayed, not a live feed.',
                 'Nifty 50 is a large-company market proxy, not all Indian listed shares.','RBI system banking annual dates label fiscal years; observations use the last reporting Friday through FY2025 and March 31 thereafter.',
                 'System banking merger-adjusted bracketed values are excluded; FY2024 onward changes need a merger comparability review.']}

def download(item,cache,use_cache=False):
 key,url=item; path=cache/('sbi_fy2026.pdf' if key=='sbi' else 'sbi_highlights.html' if key=='sbi_highlights' else f'rbi_{RBI_IDS[key]}.html')
 if use_cache and path.exists(): return key,path.read_bytes()
 with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 InvestorLens official-source research'}),timeout=90) as r:
  raw=r.read(25000000)
 path.write_bytes(raw);return key,raw

def main():
 p=argparse.ArgumentParser();p.add_argument('--cache-dir',type=Path,required=True);p.add_argument('--use-cache',action='store_true',help='Offline reprocessing of the downloaded source files, not a fresh retrieval');p.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'data/banking_history.json');args=p.parse_args()
 args.cache_dir.mkdir(parents=True,exist_ok=True)
 items=[('sbi',SBI_URL),('sbi_highlights',SBI_HTML)]+[(k,f'https://www.rbi.org.in/Scripts/PublicationsView.aspx?id={sid}') for k,sid in RBI_IDS.items()]
 with ThreadPoolExecutor(max_workers=4) as ex: raws=dict(ex.map(lambda item:download(item,args.cache_dir,args.use_cache),items))
 stamp=datetime.now(timezone.utc).isoformat(timespec='seconds')
 result=build(raws,stamp);args.output.parent.mkdir(parents=True,exist_ok=True)
 tmp=args.output.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(args.output)
 print(json.dumps({'bank_cells':sum(len(s['observations']) for s in result['bank']['series'].values()),'macro_counts':{k:len(s['observations']) for k,s in result['macro'].items()},'output':str(args.output)},ensure_ascii=True))

if __name__=='__main__': main()
