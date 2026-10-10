/* Draw prepared Python output. No financial calculation or signal rules here. */
var SBI_MACRO=(function(){
  'use strict';
  var E=BUSINESS_ENGINE,esc=E.escape,brief,pending;
  var tones={'Headwind':'headwind','Tailwind':'tailwind','Mixed':'mixed','Not established':'unavailable','Scenario only':'unavailable'};
  function attr(n){return typeof n==='number'&&isFinite(n)?String(n):'0';}
  function badge(signal){return '<span class="signal-badge '+(tones[signal]||'unavailable')+'">'+esc(signal)+'</span>';}
  function source(s){var url=E.safeURL(s.url);return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a>':esc(s.title);}
  function prepare(){
    if(brief)return Promise.resolve(brief);if(pending)return pending;
    pending=fetch('./data/sbi_macro_brief.json').then(function(r){if(!r.ok)throw Error('SBI macro data could not be loaded.');return r.json();}).then(function(row){
      if(row.version!==1||row.ticker!=='SBIN'||!/^\d{4}-\d{2}-\d{2}$/.test(row.as_of)||!/^\d{4}-\d{2}-\d{2}$/.test(row.valid_until)||!row.evidence||!row.sources||!Array.isArray(row.cards)||row.cards.length!==3||!Array.isArray(row.charts)||!Array.isArray(row.bond_scenarios))throw Error('SBI macro data has an unsupported format.');
      brief=row;return row;
    }).finally(function(){pending=null;});return pending;
  }
  function chart(key){
    var c=brief.charts.find(function(row){return row.key===key;});if(!c)return '';
    var svg='',legend='';
    if(c.kind==='bars'){
      svg=c.ticks.map(function(t){return '<line x1="54" x2="506" y1="'+attr(t.y)+'" y2="'+attr(t.y)+'" class="sm-grid-line"/><text x="43" y="'+attr(t.y)+'" text-anchor="end" dominant-baseline="middle" class="sm-axis">'+esc(t.label)+'</text>';}).join('');
      svg+=c.bars.map(function(b){return '<g><title>'+esc(b.description)+'</title><rect x="'+attr(b.x)+'" y="'+attr(b.y)+'" width="'+attr(b.width)+'" height="'+attr(b.height)+'" rx="5" fill="'+esc(b.color)+'"/><text x="'+attr(b.label_x)+'" y="'+attr(b.label_y)+'" text-anchor="middle" class="sm-bar-value">'+esc(b.label)+'</text></g>';}).join('');
      svg+=c.labels.map(function(l){return '<text x="'+attr(l.x)+'" y="'+attr(l.y)+'" text-anchor="middle" class="sm-axis">'+esc(l.text)+'</text>';}).join('');
      legend='<ul class="sm-legend sm-legend-inline">'+c.legend.map(function(l){return '<li><i style="background:'+esc(l.color)+'" aria-hidden="true"></i>'+esc(l.label)+'</li>';}).join('')+'</ul>';
    }else if(c.kind==='donut'){
      svg='<circle cx="110" cy="110" r="76" fill="none" stroke="#243047" stroke-width="24"/>';
      svg+=c.segments.map(function(s){return '<circle cx="110" cy="110" r="76" fill="none" stroke="'+esc(s.color)+'" stroke-width="24" stroke-dasharray="'+esc(s.dash)+'" stroke-dashoffset="'+attr(s.offset)+'" transform="rotate(-90 110 110)"><title>'+esc(s.label+' '+s.value)+'</title></circle>';}).join('');
      svg+='<text x="110" y="106" text-anchor="middle" class="sm-donut-value">'+esc(c.center_top)+'</text><text x="110" y="129" text-anchor="middle" class="sm-donut-date">'+esc(c.center_bottom)+'</text>';
      legend='<ul class="sm-legend">'+c.segments.map(function(s){return '<li><i style="background:'+esc(s.color)+'" aria-hidden="true"></i><span>'+esc(s.label)+'</span><b>'+esc(s.value)+'</b></li>';}).join('')+'</ul>';
    }
    return '<figure class="sm-chart sm-'+esc(c.kind)+'" id="sbi-chart-'+esc(c.key)+'"><h3>'+esc(c.title)+'</h3><div class="sm-chart-body"><svg viewBox="'+esc(c.view_box)+'" role="img" aria-label="'+esc(c.title)+'"><title>'+esc(c.title)+'</title>'+svg+'</svg>'+legend+'</div><figcaption>'+esc(c.note)+'</figcaption></figure>';
  }
  function cards(expired){
    return '<div class="sm-factor-grid">'+brief.cards.map(function(c){
      var reading=expired?'Current reading withheld':c.reading, signal=expired?'Refresh needed':c.signal;
      return '<article class="sm-factor"><div class="sm-factor-top"><span class="cl-eyebrow">MACRO</span>'+badge(signal)+'</div><h3>'+esc(c.title)+'</h3><strong class="sm-reading">'+esc(reading)+'</strong><p class="sm-scope">'+esc(expired?'Prepared snapshot has expired':c.signal_scope)+'</p><p class="sm-change">'+esc(expired?'Last preparation: '+brief.as_of:c.change)+'</p><ol class="sm-path">'+c.path.map(function(p){return '<li>'+esc(p)+'</li>';}).join('')+'</ol><p class="sm-takeaway">'+esc(c.takeaway)+'</p></article>';
    }).join('')+'</div>';
  }
  function scenarios(){
    return '<section class="sm-bond-scenarios"><div class="sm-section-title"><span class="cl-eyebrow">CONDITIONAL · NOT AN OBSERVED LOSS</span><h3>If bond yields move by 0.25 percentage points</h3><p>On SBI’s disclosed June AFS portfolio. This estimates market value, not net profit.</p></div><div class="sm-scenario-grid">'+brief.bond_scenarios.map(function(s){return '<article class="sm-scenario '+(tones[s.signal]||'unavailable')+'">'+badge(s.signal)+'<h4>'+esc(s.headline)+'</h4><div class="sm-scenario-value">'+esc(s.value)+'</div><div class="sm-scenario-track" aria-hidden="true"><span style="width:'+attr(s.bar_width_percent)+'%"></span></div><p>'+esc(s.channel)+'</p></article>';}).join('')+'</div><p class="sm-short-note">No actual yield direction is established from the single current bond quote. The full bank result also depends on funding, reinvestment and hedges.</p></section>';
  }
  function relationship(){
    var rows=brief.relationships.filter(function(r){return r.factor_key==='rates';});
    return '<figure class="sm-relationship"><figcaption>One factor. Two sides of SBI’s lending business.</figcaption><div class="sm-relation-event">'+esc(rows[0].event)+'</div><div class="sm-relation-channels">'+rows.map(function(r){return '<article><span class="sm-relation-arrow" aria-hidden="true">↓</span><span class="signal-badge '+(r.signal==='Potential tailwind'?'tailwind':'headwind')+'">'+esc(r.signal)+'</span><h4>'+esc(r.channel)+'</h4><p>'+esc(r.effect)+'</p></article>';}).join('')+'</div><div class="sm-relation-net"><span aria-hidden="true">↓</span><b>SBI · net effect not established</b><small>Which side reprices first, by how much, and on which balances?</small></div></figure>';
  }
  function checks(){
    return '<details class="cl-evidence sm-evidence"><summary>Sources, calculations & limits</summary><div class="sm-evidence-content"><h4>Bond calculation</h4><p>'+esc(brief.bond_method.formula)+'</p><p>'+esc(brief.bond_method.assumptions)+'</p><h4>Interest-rate risk reported by State Bank Group</h4><p>'+esc(brief.group_rate_risk.explanation)+'</p><ul>'+brief.group_rate_risk.benchmarks.map(function(b){return '<li>'+esc(b.shock)+' → '+esc(b.magnitude)+' NII-risk magnitude</li>';}).join('')+'</ul><p>Group disclosure dated '+esc(brief.group_rate_risk.period)+'. It is kept separate from SBI standalone exposures.</p><h4>What the historical rates show</h4><p>'+esc(brief.margin_note)+'</p><h4>Economic relationship</h4><p>'+esc(String(brief.evidence.gdp_comparisons))+' matched Q1 growth comparisons. No GDP elasticity, causal estimate or forecast is enabled. GDP figures all use the August 2026 edition and base 2022-23; older-base figures are excluded.</p><ul class="sm-source-list">'+Object.values(brief.sources).map(function(s){return '<li>'+source(s)+'<small>'+esc(s.locator)+'</small></li>';}).join('')+'</ul></div></details>';
  }
  function html(mode,expired){
    var stamp='<div class="sm-stamp"><span class="cl-eyebrow">SBI / MACRO FACTORS</span><span>Prepared '+esc(brief.as_of)+'</span></div>';
    var warning=expired?'<p role="status" class="sm-expired">Refresh needed. Current factor readings are withheld; the dated charts and hypothetical scenarios below remain historical.</p>':'';
    if(mode==='summary')return stamp+warning+cards(expired)+'<p class="sm-short-note">Quarterly business data and context, not a live earnings forecast.</p><button type="button" class="sm-retry" data-sbi-view="2">See the relationship charts →</button>';
    if(mode==='relationship')return '<div class="sm-section-title"><span class="cl-eyebrow">OFFICIAL SBI EXAMPLE / CONDITIONAL RELATIONSHIP</span><h2>How interest rates reach SBI</h2></div>'+relationship()+'<p class="sm-short-note">These potential paths do not assign a current net SBI signal.</p><button type="button" class="sm-retry" data-sbi-view="2">Open SBI’s measured charts →</button>';
    if(mode==='treasury')return '<div class="sm-section-title"><span class="cl-eyebrow">TREASURY / 30 JUNE 2026</span><h2>SBI’s investment book, at a glance</h2><p>Official standalone domestic portfolio. These numbers are separate from the annual FY2026 study below.</p></div><div class="sm-treasury-grid">'+chart('portfolio')+chart('afs_mix')+chart('investment_yield')+'</div><p class="sm-short-note">'+esc(brief.freshness_note)+'</p>'+checks();
    var rates=brief.cards[0];
    return stamp+warning+cards(expired)+relationship()+'<div class="sm-section-title"><span class="cl-eyebrow">MEASURED CHANGE / APR–JUN 2025 → APR–JUN 2026</span><h2>'+esc(brief.rate_heading)+'</h2></div><div class="sm-rate-grid">'+chart('rates')+'<article class="sm-result">'+badge(rates.history_signal)+'<strong>'+esc(rates.history_reading)+'</strong><p>'+esc(rates.history_detail)+'</p><div class="sm-result-pair">'+brief.rate_result_pair.map(function(r){return '<div><b>'+esc(r.value)+'</b><span>'+esc(r.label)+'</span></div>';}).join('')+'</div><small>100 basis points = 1 percentage point. The gap is not NIM; no loss in rupees or repo attribution is inferred.</small></article></div><div class="sm-economy-panel">'+chart('economy')+'<p class="sm-short-note">'+esc(brief.cards[1].history_detail)+'</p></div>'+scenarios()+'<p class="sm-short-note">'+esc(brief.freshness_note)+'</p>'+checks();
  }
  function mount(target,mode){
    if(!target)return;target.innerHTML='<p role="status" class="cl-note">Loading checked SBI macro charts…</p>';
    function render(){prepare().then(function(){if(target.isConnected===false)return;
      var now=new Date().toISOString().slice(0,10), expired=!brief.current_signals_enabled||now>brief.valid_until||now<brief.as_of;
      target.innerHTML=html(mode||'full',expired);
      target.querySelectorAll('[data-sbi-view]').forEach(function(button){button.onclick=function(){if(typeof openCompany==='function')openCompany('SBIN',Number(button.dataset.sbiView));};});
    }).catch(function(){if(target.isConnected===false)return;target.innerHTML='<p role="alert">SBI macro data could not be verified or loaded. No signal has been substituted.</p><button type="button" class="sm-retry">Try again</button>';target.querySelector('button').onclick=render;});}
    render();
  }
  return {mount:mount};
})();
