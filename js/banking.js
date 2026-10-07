/* Read a generated, dated research snapshot. No AI service or hidden forecasts. */
var BANKING=(function(){
  'use strict';
  var E=BUSINESS_ENGINE,esc=E.escape,history,analysis,world,pending,view='bank';
  function id(x){return document.getElementById(x);}
  function fmt(n,places){return typeof n==='number' && isFinite(n)?n.toLocaleString('en-IN',{maximumFractionDigits:places===undefined?2:places}):'Not available';}
  function signed(n,unit){return n===null?'Not comparable':(n>0?'+':'')+fmt(n)+(unit==='basis points'?' bp':'%');}
  function source(s){return '<a href="'+esc(E.safeURL(s.url)||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a>';}
  function panel(title,body,classes){return '<section class="cl-panel '+(classes||'')+'"><h2>'+title+'</h2><div class="cl-panel-body">'+body+'</div></section>';}
  function metric(key,title,explanation){var c=analysis.bank.changes[key],money=c.unit==='INR crore',value=money?'₹'+fmt(c.value/100000):fmt(c.value);return '<article class="bk-metric"><span>'+title+'</span><b>'+value+' <small>'+(money?'lakh crore':esc(c.unit))+'</small></b><em>'+signed(c.change,c.change_unit)+' vs FY2025</em><p>'+explanation+'</p></article>';}
  function macroCard(key,title,why){var s=history.macro[key],row=s.observations[s.observations.length-1],src=history.sources[s.source_id];return '<article class="bk-factor"><span class="cl-eyebrow">MACRO / HISTORICAL READING</span><h3>'+title+'</h3><b>'+fmt(row[1],4)+' <small>'+esc(s.unit)+'</small></b><p>'+why+'</p><small>'+(s.frequency==='effective_date'?'Last recorded change: ':'Observation: ')+row[0]+'<br>Source edition: '+src.available_at.slice(0,10)+'</small></article>';}
  function prepare(){
    if(history) return Promise.resolve();if(pending) return pending;
    pending=Promise.all(['banking_history','banking_analysis','business_factors'].map(function(file){return fetch('./data/'+file+'.json').then(function(r){if(!r.ok) throw Error('Research snapshot could not be loaded.');return r.json();});}))
      .then(function(rows){history=rows[0];analysis=rows[1];world=rows[2];if(history.version!==1||analysis.version!==1||history.collected_at!==analysis.history_collected_at) throw Error('Research versions do not match.');})
      .catch(function(e){history=null;throw e;}).finally(function(){pending=null;});return pending;
  }
  function open(){
    if(history){render();return;}
    id('driver-root').innerHTML='<p role="status" class="bd-loading">Reading the official-source banking snapshot…</p>';
    prepare().then(render).catch(function(e){id('driver-root').innerHTML='<p role="alert">'+esc(e.message)+' No data has been invented.</p><button id="bk-retry" type="button">Retry research</button>';id('bk-retry').onclick=open;});
  }
  function render(){
    var root=id('driver-root');
    root.innerHTML='<div class="cl-driver-head"><div class="cl-eyebrow">RESEARCH PHASE 01 / BANKING + INDIA</div><h1>How banks work. What changes them.</h1><p>See what changed inside a bank, what changed outside it, and the paths connecting them.</p></div>'
      +'<div class="bk-status"><span class="bk-status-dot"></span><b>Historical research preview</b><span>No AI service · No share-price forecast · Not a live alert feed</span></div>'
      +'<div class="cl-tabs bk-tabs" role="tablist" aria-label="Research view"><button type="button" role="tab" id="bk-bank" data-bk-view="bank" aria-controls="bk-content">SBI & banking</button><button type="button" role="tab" id="bk-market" data-bk-view="market" aria-controls="bk-content">Indian market</button></div><div id="bk-content" role="tabpanel"></div>'
      +'<details class="cl-evidence bk-sources"><summary>Sources, historical checks & missing data</summary><div id="bk-evidence" class="cl-expert"></div></details>';
    root.querySelectorAll('[data-bk-view]').forEach(function(b){b.onclick=function(){view=this.dataset.bkView;renderView();};b.onkeydown=function(e){if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)<0) return;e.preventDefault();view=e.key==='Home'?'bank':e.key==='End'?'market':view==='bank'?'market':'bank';renderView();id('bk-'+view).focus();};});
    renderView();renderEvidence();
  }
  function renderView(){
    ['bank','market'].forEach(function(v){var b=id('bk-'+v);b.setAttribute('aria-selected',String(view===v));b.tabIndex=view===v?0:-1;});id('bk-content').setAttribute('aria-labelledby','bk-'+view);
    id('bk-content').innerHTML=view==='bank'?bankView():marketView();
    var scroller=id('driver-root').closest('.st-page-body');if(scroller) scroller.scrollTop=0;
    if(view==='bank') id('bk-profile').onclick=function(){if(typeof SEED!=='undefined' && SEED.SBIN) openCompany('SBIN');};
  }
  function bankView(){
    var c=analysis.bank.changes;
    return '<div class="bk-section-title"><div><div class="cl-eyebrow">MICRO / INSIDE THE BUSINESS</div><h2>State Bank of India</h2><p>FY2026 versus FY2025 · Standalone accounts · March year-end</p></div><button type="button" id="bk-profile" '+(typeof SEED==='undefined'||!SEED.SBIN?'disabled':'')+'>Open company overview →</button></div>'
      +'<div class="bk-metrics">'+metric('net_advances','Loans after provisions','Loans after deducting reserves for loan losses.')+metric('deposits','Customer deposits','A major source of funding for loans.')+metric('nim','Interest margin','Interest kept after funding costs, as a share of assets that earn interest.')+metric('net_npa','Remaining bad-loan share','Problem loans after deducting reserves, relative to net loans.')+'</div>'
      +'<p class="cl-note">1 basis point (bp) = 0.01 percentage point. A fall from 3.09% to 2.91% is 18 bp. Money cards are rounded; exact figures are in the source checks.</p>'
      +(c.nii.source_conflict?'<p class="bk-conflict"><b>Source conflict caught:</b> two official sources disagree on FY2025 net interest income. That growth comparison is blocked; inspect the source checks below.</p>':'')
      +'<div class="cl-driver-grid bk-reading">'+panel('The funding question','<div class="cl-signal-number">'+fmt(analysis.bank.funding_gap_pp)+' pp</div><p>Net-loan growth minus deposit growth.</p><div class="cl-mini-path"><span>Deposits</span><i>→</i><span>Loan funding</span><i>→</i><span>Funding costs</span></div><p>'+esc(analysis.bank.explanation)+'</p><p class="cl-note">Other borrowing, capital and liquid assets can bridge the gap. The algorithm cannot judge funding pressure without their cost and timing.</p>')
      +panel('The margin question','<div class="cl-signal-number">'+signed(c.nim.change,'basis points')+'</div><p>Whole-bank interest margin changed from '+fmt(c.nim.previous)+'% to '+fmt(c.nim.value)+'%.</p><p>In the domestic business, loan yield fell '+fmt(-c.loan_yield.change)+' bp; deposit cost fell '+fmt(-c.deposit_cost.change)+' bp. Income per rupee lent and funding cost changed at different speeds.</p><p class="cl-note">Domestic yields and whole-bank margin have different coverage; these changes cannot be directly equated. They do not prove that an RBI decision caused the margin change.</p>')+'</div>'
      +macroView()+'<div class="cl-driver-limit"><b>What the algorithm can explain today</b><p>Reported annual changes and conditional business paths. It cannot yet quantify the effect of a new RBI decision on SBI’s profit. There are only ten annual reporting points; quarterly operating history, rate-reset timing and deposit mix are still needed. Newer quarterly results are not in this dataset.</p></div>';
  }
  function macroView(){
    return '<div class="bk-section-title"><div><div class="cl-eyebrow">MACRO / OUTSIDE THE BUSINESS</div><h2>Rates, reserves and the wider world</h2><p>Different sources have different dates. These readings are not all current.</p></div></div><div class="bk-macro-grid">'
      +macroCard('repo','RBI policy rate','Loan income and deposit costs can react at different speeds.')
      +macroCard('crr','Cash reserve requirement','Money set aside with RBI affects funds available for lending.')
      +macroCard('india_yield','Indian 10-year bond yield','Securities prices and income from reinvestment can react in opposite directions.')+'</div>'
      +'<div class="bk-world-grid">'+['brent','inr','yield','yen'].map(function(key){var s=world.series.find(function(x){return x.key===key;});if(!s) return '';var row=s.observations[s.observations.length-1];return '<article class="bk-world"><h3>'+({brent:'Oil prices',inr:'Rupee / dollar',yield:'US 10-year yield',yen:'Dollar / yen'})[key]+'</h3><b>'+fmt(row[1])+' <small>'+esc(s.unit)+'</small></b><p>'+row[0]+' · Global context<br>'+source({url:s.url,title:s.source+' / FRED'})+'</p></article>';}).join('')+'</div>'
      +'<p class="cl-note">Global observations: official EIA and Federal Reserve series distributed by FRED; collected '+esc(world.collected_at.slice(0,10))+'. A dollar/yen reading alone does not establish carry-trade stress. No direct yen exposure is assigned to SBI.</p>'
      +'<div class="bk-two-paths">'+panel('One rate change, two paths','<div class="cl-mini-path"><span>RBI rate</span><i>→</i><span>Loan rates</span><i>→</i><span>Interest earned</span></div><div class="cl-mini-path"><span>RBI rate</span><i>→</i><span>Funding rates</span><i>→</i><span>Interest paid</span></div><p>The net effect depends on which side resets first, and by how much. The algorithm leaves the answer open when exposures are missing.</p><p class="cl-note">'+source({url:analysis.paths[0].source,title:'RBI evidence on rate transmission'})+'</p>')+'</div>';
  }
  function marketView(){
    var study=analysis.market.history_study;
    return '<div class="bk-section-title"><div><div class="cl-eyebrow">INDIAN MARKET / DIFFERENT BUSINESSES, DIFFERENT EFFECTS</div><h2>There is no single reaction.</h2><p>A change reaches each sector through its own costs, demand and funding.</p></div></div>'
      +'<div class="bk-market-grid">'+analysis.market.channels.map(function(s){return '<article class="cl-panel bk-sector"><h3>'+esc(s.sector)+'</h3><div class="bk-factor-tags">'+s.macro.map(function(k){var f=analysis.factors.macro.find(function(x){return x.key===k;});return '<span>'+esc(f.label)+'</span>';}).join('')+'</div><p>'+esc(s.through)+'.</p><small>Net business effect: depends on exposures</small></article>';}).join('')+'</div>'
      +panel('What one historical check found','<p>Indian 10-year yield changes versus changes in the Nifty 50 monthly average.</p><div class="bk-study-stats"><div><b>'+study.n+'</b><span>Monthly comparisons</span></div><div><b>'+fmt(study.correlation)+'</b><span>Correlation · −1 to +1</span></div><div><b>'+fmt(study.earlier.r)+' / '+fmt(study.later.r)+'</b><span>Earlier / later half</span></div></div><p>'+study.first+' → '+study.last+'. The negative relationship differs across the two halves. It is not a reliable rule that a yield move will cause an opposite market move.</p><p class="cl-note">'+esc(study.method)+' '+esc(study.verdict)+'</p>','bk-market-study')
      +'<div class="cl-driver-limit"><b>Coverage still has limits</b><p>'+esc(analysis.market.coverage)+' Inflation, growth, flows, liquidity and current sector exposures still need verified datasets. There is no “market will rise/fall” score.</p></div>';
  }
  function renderEvidence(){
    var b=analysis.bank.history_study,keys=['deposits','net_advances','nii','net_npa'];
    id('bk-evidence').innerHTML='<h3>Extraction verified against official sources</h3><p>'+esc(history.verification_scope)+'</p><ul class="bk-source-list">'+Object.values(history.sources).map(function(s){return '<li>'+source(s)+'<small>'+esc(s.locator)+' · Available in this edition: '+s.available_at.slice(0,10)+'</small></li>';}).join('')+'</ul>'
      +'<p class="cl-note">Collected '+history.collected_at.slice(0,10)+'. SBI’s original publication timestamp is not established; the conservative availability date is the collection date. Raw document hashes are saved in the dataset. The source edition is not the original information available in past years.</p>'
      +'<h3>The banking history</h3><div class="bk-table-wrap"><table class="bk-table"><caption>Four of ten collected SBI annual series. Money values in INR crore; bad-loan share in percent.</caption><thead><tr><th scope="col">FY</th><th scope="col">Deposits</th><th scope="col">Net loans</th><th scope="col">Net interest income</th><th scope="col">Net NPA %</th></tr></thead><tbody>'+history.bank.series.deposits.observations.map(function(r,i){return '<tr><th scope="row">'+r[0].slice(0,4)+'</th>'+keys.map(function(k){return '<td>'+fmt(history.bank.series[k].observations[i][1])+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>'
      +'<h3>We checked a possible banking relationship</h3><p>'+esc(b.question)+': '+b.n+' potential annual comparisons after excluding the merger. '+esc(b.verdict)+'</p>'+history.bank.conflicts.map(function(c){return '<p class="bk-conflict">'+esc(c.key)+' / '+c.period+': annual-report table '+fmt(c.pdf_value)+' INR crore; highlights table '+fmt(c.html_value)+' INR crore. Both sources are retained. The exact reason for the disagreement has not been established. The affected growth comparison is blocked.</p>';}).join('')+'<p class="cl-note">The displayed history is explicitly the PDF edition; prior NII periods are regrouped in that source. FY2017 → FY2018 is excluded because of the SBI merger. Of '+history.bank.cross_check.cells+' cross-check cells, '+history.bank.cross_check.matched+' agree and '+history.bank.cross_check.conflicts+' conflict. No sensitivity is fitted.</p>'
      +'<h3>Macro and micro factor coverage</h3><p>Connected means historical data exists. It does not mean a live feed or a proven sensitivity.</p><div class="bk-registry">'+['macro','micro'].map(function(group){return '<div><h4>'+group.toUpperCase()+'</h4>'+analysis.factors[group].map(function(f){return '<div class="bk-registry-row"><span>'+esc(f.label)+'</span><small class="bk-'+f.status+'">'+({connected:'Historical data',context:'Global context',not_connected:'Not connected'})[f.status]+'</small><p>'+esc(f.meaning)+'</p></div>';}).join('')+'</div>';}).join('')+'</div>'
      +'<h3>The next gate</h3><p>Collect original quarterly bank releases and their publication dates, add macro vintages, test earlier periods before later periods, compare with a simple baseline, and measure stability across different conditions. No automatic news-to-impact engine or as-of backtest is enabled yet.</p>';
  }
  function companyNumbers(){
    if(!history) return '<p class="cl-note">Loading the official SBI research snapshot…</p>';
    return '<div class="cl-numbers">'+['net_advances','deposits','nim','net_npa'].map(function(key){var c=analysis.bank.changes[key],money=c.unit==='INR crore';return '<div><span>'+({net_advances:'Loans after provisions',deposits:'Customer deposits',nim:'Interest margin',net_npa:'Remaining bad-loan share'})[key]+'</span><b>'+(money?'₹'+fmt(c.value/100000):fmt(c.value))+' <small>'+(money?'lakh crore':esc(c.unit))+'</small></b></div>';}).join('')+'</div><p class="cl-note">Official SBI FY2026 standalone history. Sources checked.'+(analysis.bank.changes.nii.source_conflict?' The separate NII growth comparison is blocked because two official sources disagree.':'')+' Other tabs retain the older profile snapshot.</p>';
  }
  return {open:open,prepare:prepare,companyNumbers:companyNumbers};
})();
