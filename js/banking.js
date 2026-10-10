/* Render a Python-prepared brief; calculate no business signals in the browser. */
var BANKING=(function(){
  'use strict';
  var E=BUSINESS_ENGINE,esc=E.escape,brief,history,analysis,pending,evidencePending,factor='repo';
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
    id('driver-root').innerHTML='<p role="status" class="bd-loading">Loading Indian Markets…</p>';
    prepare().then(render).catch(function(e){id('driver-root').innerHTML='<p role="alert">'+esc(e.message)+' Please try again.</p><button id="bk-retry" type="button">Try again</button>';id('bk-retry').onclick=open;});
  }
  function render(){
    var root=id('driver-root');
    root.innerHTML='<div class="bk-simple-head"><div><div class="cl-eyebrow">INDIAN MARKETS</div><h1>One change.<br>Different business effects.</h1><p>Follow rates, currency and input costs into the businesses they can affect.</p></div><span class="bk-history-label">Dated research</span></div><div id="market-signal-root" class="signal-section"></div><section class="market-paths"><div class="cl-eyebrow">UNDERSTAND THE CONNECTION</div><h2>Choose a factor. Follow its path.</h2><div id="bk-content">'+marketView()+'</div></section><details class="cl-evidence bk-sources" id="bk-sources"><summary>Indian-market history & sources</summary><div id="bk-evidence" class="cl-expert"></div></details>';
    id('bk-factor-options').querySelectorAll('[data-factor]').forEach(function(b){b.onclick=function(){factor=this.dataset.factor;renderMarketScenario();};});
    bindEvidence(root,'market');renderMarketScenario();
    if(typeof FACTOR_SIGNALS!=='undefined') FACTOR_SIGNALS.mount(id('market-signal-root'));
  }
  function insightHTML(i){return '<article class="bk-insight"><span class="signal-badge '+esc((i.signal||'unavailable').toLowerCase())+'">'+esc(i.signal||'Unavailable')+' · Historical</span><h3>'+esc(i.title)+'</h3><strong>'+esc(i.reading)+'</strong><p>'+esc(i.meaning)+'</p><div class="bk-watch"><span>What to watch</span><p>'+esc(i.watch)+'</p></div></article>';}
  function companyStudy(v){
    if(!brief) return '<p>Loading SBI research…</p>';
    var b=brief.bank,stamp='<div class="study-stamp"><span class="cl-eyebrow">SBI / OFFICIAL ANNUAL STUDY</span><span>'+esc(b.period)+'</span></div>';
    if(v===0) return stamp+'<p class="bk-intro">'+esc(b.summary)+'</p><div class="bk-insights">'+b.insights.map(insightHTML).join('')+'</div><p class="bk-boundary">'+esc(b.limitation)+'</p>';
    if(v===1) return stamp+'<section class="cl-panel"><h2>The checked FY2026 numbers</h2>'+companyNumbers()+'</section><div class="bk-quality"><p>'+esc(b.quality_notice)+'</p></div><details id="sbi-sources" class="cl-evidence"><summary>Official SBI history & source checks</summary><div id="sbi-evidence" class="cl-expert"></div></details>';
    if(v===2) return stamp+'<section class="bk-how"><h2>How SBI earns from lending</h2><ol>'+b.flow.map(function(step){return '<li><b>'+esc(step.title)+'</b><p>'+esc(step.text)+'</p></li>';}).join('')+'</ol></section><section class="bk-outside"><h2>Macro · Outside the bank</h2><div class="bk-outside-grid">'+b.context.map(function(c){return '<article><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>';}).join('')+'</div></section><section class="micro-study"><h2>Micro · Inside SBI</h2><p class="cl-note">Annual changes, not current signals.</p><div class="bk-insights">'+b.insights.map(insightHTML).join('')+'</div></section><p class="bk-boundary">Current RBI rates and SBI’s full rate, currency and bond exposures are not connected. A US yield reading is not SBI’s borrowing rate.</p>';
    if(v===3) return '<section class="cl-panel"><h2>What this research cannot establish yet</h2><p>'+esc(b.quality_notice)+'</p><p>'+esc(b.limitation)+'</p><p>No event-to-profit estimate is enabled. Annual observations are too few to establish how a new event will affect SBI. The unresolved net-interest-income comparison stays blocked.</p></section>';
    return '';
  }
  function bindEvidence(root,which){
    var details=root.querySelector(which==='bank'?'#sbi-sources':'#bk-sources');if(!details) return;
    details.addEventListener('toggle',function(){if(this.open) loadEvidence(which);});
  }
  function evidenceTarget(scope){return id(scope==='bank'?'sbi-evidence':'bk-evidence');}
  function marketView(){
    return '<div class="bk-simple-title"><div><p>'+esc(brief.market.summary)+'</p></div></div>'
      +'<div id="bk-factor-options" class="bk-factor-options" role="group" aria-label="Explore a factor">'+brief.market.scenarios.map(function(s){return '<button type="button" data-factor="'+esc(s.key)+'" aria-pressed="false" aria-controls="bk-scenario">'+esc(s.label)+'</button>';}).join('')+'</div><section id="bk-scenario" aria-live="polite" aria-atomic="true"></section><p class="bk-boundary">'+esc(brief.market.limitation)+'</p>';
  }
  function renderMarketScenario(){
    var scenario=brief.market.scenarios.find(function(s){return s.key===factor;});if(!scenario){factor=brief.market.scenarios[0].key;scenario=brief.market.scenarios[0];}
    id('bk-factor-options').querySelectorAll('[data-factor]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.factor===factor));});
    id('bk-scenario').innerHTML='<div class="bk-scenario-head"><span class="cl-tag">Possible paths · not today’s measured effect</span><h3>'+esc(scenario.title)+'</h3><p>'+esc(scenario.description)+'</p></div><div class="bk-sector-briefs">'+scenario.sectors.map(function(s){return '<article><h4>'+esc(s.name)+'</h4><p>'+esc(s.through)+'</p><small>'+esc(s.result)+'</small></article>';}).join('')+'</div>';
  }
  function loadEvidence(which){
    var target=evidenceTarget(which);if(!target) return;
    if(history){renderSelectedEvidence(target,which);return;}
    target.innerHTML='<p role="status">Loading source checks…</p>';
    if(!evidencePending) evidencePending=Promise.all(['banking_history','banking_analysis'].map(json)).then(function(rows){
      if(rows[0].version!==1||rows[1].version!==1||rows[0].collected_at!==rows[1].history_collected_at||rows[0].collected_at!==brief.history_collected_at) throw Error('These source checks belong to a different edition. Reload the page to get matching data.');
      history=rows[0];analysis=rows[1];
    }).finally(function(){evidencePending=null;});
    evidencePending.then(function(){if(target.isConnected!==false){renderSelectedEvidence(target,which);}}).catch(function(e){if(target.isConnected!==false){target.innerHTML='<p role="alert">'+esc(e.message)+'</p><button type="button" id="bk-source-retry">Try source checks again</button>';target.querySelector('button').onclick=function(){loadEvidence(which);};}});
  }
  function renderSelectedEvidence(target,scope){
    if(scope==='bank'){renderEvidence(target,scope);return;}
    var ids=['sbi_fy2026','sbi_highlights'];
    target.innerHTML='<h3>Official Indian-market sources</h3><ul class="bk-source-list">'+Object.entries(history.sources).filter(function(p){return ids.indexOf(p[0])<0;}).map(function(p){return '<li>'+source(p[1])+'<small>'+esc(p[1].locator)+'</small></li>';}).join('')+'</ul><p>Collected '+esc(history.collected_at.slice(0,10))+'. Revised history, not original publication vintages.</p>';
    renderMarketCheck(target);
    target.insertAdjacentHTML('beforeend','<h3>Macro factor coverage</h3><div class="bk-registry">'+analysis.factors.macro.map(function(f){return '<div class="bk-registry-row"><span>'+esc(f.label)+'</span><small>'+esc(f.status.replace(/_/g,' '))+'</small><p>'+esc(f.meaning)+'</p></div>';}).join('')+'</div>');
  }
  function renderEvidence(target,scope){
    var b=analysis.bank.history_study,keys=['deposits','net_advances','nii','net_npa'];
    target.innerHTML='<h3>Extraction verified against official sources</h3><p>'+esc(history.verification_scope)+'</p><ul class="bk-source-list">'+Object.entries(history.sources).filter(function(p){var ids=['sbi_fy2026','sbi_highlights'];return scope==='bank'?ids.indexOf(p[0])>=0:ids.indexOf(p[0])<0;}).map(function(p){return p[1];}).map(function(s){return '<li>'+source(s)+'<small>'+esc(s.locator)+' · Available in this edition: '+s.available_at.slice(0,10)+'</small></li>';}).join('')+'</ul>'
      +'<p class="cl-note">Collected '+history.collected_at.slice(0,10)+'. SBI’s original publication timestamp is not established; the conservative availability date is the collection date. Raw document hashes are saved in the dataset. The source edition is not the original information available in past years.</p>'
      +'<h3>The banking history</h3><div class="bk-table-wrap"><table class="bk-table"><caption>Four of ten collected SBI annual series. Money values in INR crore; bad-loan share in percent.</caption><thead><tr><th scope="col">FY</th><th scope="col">Deposits</th><th scope="col">Net loans</th><th scope="col">Net interest income</th><th scope="col">Net NPA %</th></tr></thead><tbody>'+history.bank.series.deposits.observations.map(function(r,i){return '<tr><th scope="row">'+r[0].slice(0,4)+'</th>'+keys.map(function(k){return '<td>'+fmt(history.bank.series[k].observations[i][1])+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>'
      +'<h3>All collected SBI series</h3>'+Object.values(history.bank.series).map(function(series){return '<details class="cl-evidence"><summary>'+esc(series.label)+' · '+esc(series.unit)+'</summary><div class="bk-table-wrap"><table class="bk-table"><caption>'+esc(series.scope)+' · '+esc(series.frequency)+'</caption><thead><tr><th scope="col">Period ended</th><th scope="col">'+esc(series.unit)+'</th></tr></thead><tbody>'+series.observations.map(function(row){return '<tr><th scope="row">'+esc(row[0])+'</th><td>'+fmt(row[1])+'</td></tr>';}).join('')+'</tbody></table></div></details>';}).join('')
      +'<h3>We checked a possible banking relationship</h3><p>'+esc(b.question)+': '+b.n+' potential annual comparisons after excluding the merger. '+esc(b.verdict)+'</p>'+history.bank.conflicts.map(function(c){return '<p class="bk-conflict">'+esc(c.key)+' / '+c.period+': annual-report table '+fmt(c.pdf_value)+' INR crore; highlights table '+fmt(c.html_value)+' INR crore. Both sources are retained. The exact reason for the disagreement has not been established. The affected growth comparison is blocked.</p>';}).join('')+'<p class="cl-note">The displayed history is explicitly the PDF edition; prior NII periods are regrouped in that source. FY2017 → FY2018 is excluded because of the SBI merger. Of '+history.bank.cross_check.cells+' cross-check cells, '+history.bank.cross_check.matched+' agree and '+history.bank.cross_check.conflicts+' conflict. No sensitivity is fitted.</p>'
      +'<h3>Micro factor coverage · SBI</h3><p>Connected means historical data exists. It does not mean a live feed or a proven sensitivity.</p><div class="bk-registry">'+['micro'].map(function(group){return '<div><h4>'+group.toUpperCase()+'</h4>'+analysis.factors[group].map(function(f){return '<div class="bk-registry-row"><span>'+esc(f.label)+'</span><small class="bk-'+f.status+'">'+({connected:'Historical data',context:'Global context',not_connected:'Not connected'})[f.status]+'</small><p>'+esc(f.meaning)+'</p></div>';}).join('')+'</div>';}).join('')+'</div>'
      +'<h3>The next gate</h3><p>Collect original quarterly bank releases and their publication dates, add macro vintages, test earlier periods before later periods, compare with a simple baseline, and measure stability across different conditions. No automatic news-to-impact engine or as-of backtest is enabled yet.</p>';
  }

  function renderMarketCheck(target){
    var s=analysis.market.history_study;
    target.insertAdjacentHTML('beforeend','<h3>The Indian-market historical check</h3><p>Indian 10-year yield changes versus changes in the monthly-average Nifty 50: '+esc(String(s.n))+' comparisons, '+esc(s.first||'unavailable')+' to '+esc(s.last||'unavailable')+'. Correlation: '+fmt(s.correlation)+'. Earlier half: '+fmt(s.earlier.r)+'; later half: '+fmt(s.later.r)+'.</p><p>'+esc(s.method)+' '+esc(s.verdict)+'</p><p>'+esc(analysis.market.coverage)+'</p>');
  }
  function companyNumbers(){
    if(!brief) return '<p class="cl-note">Loading the official SBI research snapshot…</p>';
    return '<div class="cl-numbers">'+brief.bank.company_numbers.map(function(n){return '<div><span>'+esc(n.label)+'</span><b>'+esc(n.value)+' <small>'+esc(n.unit)+'</small></b></div>';}).join('')+'</div><p class="cl-note">'+esc(brief.bank.company_note)+'</p>';
  }
  return {open:open,prepare:prepare,companyNumbers:companyNumbers,companyStudy:companyStudy,bindEvidence:bindEvidence};
})();
