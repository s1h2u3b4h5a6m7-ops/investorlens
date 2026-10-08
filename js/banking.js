/* Render a Python-prepared brief; calculate no business signals in the browser. */
var BANKING=(function(){
  'use strict';
  var E=BUSINESS_ENGINE,esc=E.escape,brief,history,analysis,pending,evidencePending,view='bank',factor='repo';
  function id(x){return document.getElementById(x);}
  function fmt(n,places){return typeof n==='number' && isFinite(n)?n.toLocaleString('en-IN',{maximumFractionDigits:places===undefined?2:places}):'Not available';}
  function source(s){var url=E.safeURL(s.url);return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a>':esc(s.title);}
  function json(file){return fetch('./data/'+file+'.json').then(function(r){if(!r.ok) throw Error('The prepared explanation could not be loaded.');return r.json();});}
  function prepare(){
    if(brief) return Promise.resolve();if(pending) return pending;
    pending=json('banking_brief').then(function(row){
      if(row.version!==1||!row.bank||!Array.isArray(row.bank.insights)||!row.market||!Array.isArray(row.market.scenarios)||!row.history_collected_at) throw Error('The prepared explanation has an unsupported format.');
      brief=row;
    }).finally(function(){pending=null;});return pending;
  }
  function open(){
    if(brief){render();return;}
    id('driver-root').innerHTML='<p role="status" class="bd-loading">Loading the banking explanation…</p>';
    prepare().then(render).catch(function(e){id('driver-root').innerHTML='<p role="alert">'+esc(e.message)+' Please try again.</p><button id="bk-retry" type="button">Try again</button>';id('bk-retry').onclick=open;});
  }
  function render(){
    var root=id('driver-root');
    root.innerHTML='<div class="bk-simple-head"><div><div class="cl-eyebrow">BANKING & INDIA</div><h1>Understand the business.<br>See what can change it.</h1></div><span class="bk-history-label">Historical example</span></div>'
      +'<div class="cl-tabs bk-tabs" role="tablist" aria-label="Research view"><button type="button" role="tab" id="bk-bank" data-bk-view="bank" aria-controls="bk-content">SBI explained</button><button type="button" role="tab" id="bk-market" data-bk-view="market" aria-controls="bk-content">Across India</button></div><div id="bk-content" role="tabpanel"></div>'
      +'<details class="cl-evidence bk-sources" id="bk-sources"><summary>Sources & how we checked this</summary><div id="bk-evidence" class="cl-expert"></div></details>';
    root.querySelectorAll('[data-bk-view]').forEach(function(b){b.onclick=function(){view=this.dataset.bkView;renderView();};b.onkeydown=function(e){if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)<0) return;e.preventDefault();view=e.key==='Home'?'bank':e.key==='End'?'market':view==='bank'?'market':'bank';renderView();id('bk-'+view).focus();};});
    id('bk-sources').addEventListener('toggle',function(){if(this.open) loadEvidence();});
    renderView();
  }
  function renderView(){
    ['bank','market'].forEach(function(v){var b=id('bk-'+v);b.setAttribute('aria-selected',String(view===v));b.tabIndex=view===v?0:-1;});id('bk-content').setAttribute('aria-labelledby','bk-'+view);
    id('bk-content').innerHTML=view==='bank'?bankView():marketView();
    var scroller=id('driver-root').closest('.st-page-body');if(scroller) scroller.scrollTop=0;
    if(view==='bank'){
      id('bk-profile').onclick=function(){if(typeof SEED!=='undefined' && SEED.SBIN) openCompany('SBIN');};
      id('bk-checks-link').onclick=function(){id('bk-sources').open=true;id('bk-sources').scrollIntoView({block:'start',behavior:'instant'});id('bk-sources').querySelector('summary').focus();};
    }else{
      id('bk-factor-options').querySelectorAll('[data-factor]').forEach(function(b){b.onclick=function(){factor=this.dataset.factor;renderMarketScenario();};});
      renderMarketScenario();
    }
  }
  function bankView(){
    var b=brief.bank;
    return '<div class="bk-simple-title"><div><h2>'+esc(b.name)+'</h2><p>'+esc(b.period)+'</p></div><button type="button" id="bk-profile" '+(typeof SEED==='undefined'||!SEED.SBIN?'disabled':'')+'>Company overview →</button></div>'
      +'<p class="bk-intro">'+esc(b.summary)+'</p><div class="bk-insights">'+b.insights.map(function(i,index){return '<article class="bk-insight"><span class="bk-insight-index">0'+(index+1)+'</span><h3>'+esc(i.title)+'</h3><strong>'+esc(i.reading)+'</strong><p>'+esc(i.meaning)+'</p><div class="bk-watch"><span>What to watch</span><p>'+esc(i.watch)+'</p></div></article>';}).join('')+'</div>'
      +'<section class="bk-how"><h3>How a bank works</h3><ol>'+b.flow.map(function(step){return '<li><b>'+esc(step.title)+'</b><p>'+esc(step.text)+'</p></li>';}).join('')+'</ol></section>'
      +'<section class="bk-outside"><div class="bk-row-title"><h3>What can change the picture?</h3><span>Outside the bank · Macro factors</span></div><div class="bk-outside-grid">'+b.context.map(function(c){return '<article><h4>'+esc(c.title)+'</h4><p>'+esc(c.text)+'</p></article>';}).join('')+'</div></section>'
      +'<div class="bk-quality"><p>'+esc(b.quality_notice)+'</p><button type="button" id="bk-checks-link">See the source checks →</button></div><p class="bk-boundary">'+esc(b.limitation)+'</p>';
  }
  function marketView(){
    return '<div class="bk-simple-title"><div><h2>One factor. Different business effects.</h2><p>'+esc(brief.market.summary)+'</p></div></div>'
      +'<div id="bk-factor-options" class="bk-factor-options" role="group" aria-label="Explore a factor">'+brief.market.scenarios.map(function(s){return '<button type="button" data-factor="'+esc(s.key)+'" aria-pressed="false" aria-controls="bk-scenario">'+esc(s.label)+'</button>';}).join('')+'</div><section id="bk-scenario" aria-live="polite" aria-atomic="true"></section><p class="bk-boundary">'+esc(brief.market.limitation)+'</p>';
  }
  function renderMarketScenario(){
    var scenario=brief.market.scenarios.find(function(s){return s.key===factor;});if(!scenario){factor=brief.market.scenarios[0].key;scenario=brief.market.scenarios[0];}
    id('bk-factor-options').querySelectorAll('[data-factor]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.factor===factor));});
    id('bk-scenario').innerHTML='<div class="bk-scenario-head"><h3>'+esc(scenario.title)+'</h3><p>'+esc(scenario.description)+'</p></div><div class="bk-sector-briefs">'+scenario.sectors.map(function(s){return '<article><h4>'+esc(s.name)+'</h4><p>'+esc(s.through)+'</p><small>'+esc(s.result)+'</small></article>';}).join('')+'</div>';
  }
  function loadEvidence(){
    if(history){renderEvidence();renderMarketCheck();return;}
    id('bk-evidence').innerHTML='<p role="status">Loading source checks…</p>';
    if(!evidencePending) evidencePending=Promise.all(['banking_history','banking_analysis'].map(json)).then(function(rows){
      if(rows[0].version!==1||rows[1].version!==1||rows[0].collected_at!==rows[1].history_collected_at||rows[0].collected_at!==brief.history_collected_at) throw Error('These source checks belong to a different edition. Reload the page to get matching data.');
      history=rows[0];analysis=rows[1];
    }).finally(function(){evidencePending=null;});
    evidencePending.then(function(){if(id('bk-evidence')){renderEvidence();renderMarketCheck();}}).catch(function(e){if(id('bk-evidence')){id('bk-evidence').innerHTML='<p role="alert">'+esc(e.message)+'</p><button type="button" id="bk-source-retry">Try source checks again</button>';id('bk-source-retry').onclick=loadEvidence;}});
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

  function renderMarketCheck(){
    var s=analysis.market.history_study;
    id('bk-evidence').insertAdjacentHTML('beforeend','<h3>The Indian-market historical check</h3><p>Indian 10-year yield changes versus changes in the monthly-average Nifty 50: '+esc(String(s.n))+' comparisons, '+esc(s.first||'unavailable')+' to '+esc(s.last||'unavailable')+'. Correlation: '+fmt(s.correlation)+'. Earlier half: '+fmt(s.earlier.r)+'; later half: '+fmt(s.later.r)+'.</p><p>'+esc(s.method)+' '+esc(s.verdict)+'</p><p>'+esc(analysis.market.coverage)+'</p>');
  }
  function companyNumbers(){
    if(!brief) return '<p class="cl-note">Loading the official SBI research snapshot…</p>';
    return '<div class="cl-numbers">'+brief.bank.company_numbers.map(function(n){return '<div><span>'+esc(n.label)+'</span><b>'+esc(n.value)+' <small>'+esc(n.unit)+'</small></b></div>';}).join('')+'</div><p class="cl-note">'+esc(brief.bank.company_note)+'</p>';
  }
  return {open:open,prepare:prepare,companyNumbers:companyNumbers};
})();
