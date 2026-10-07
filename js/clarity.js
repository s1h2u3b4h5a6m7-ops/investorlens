/* Clear business-first reading. All underlying records and renderers stay intact. */
var CLARITY = (function(){
  'use strict';
  var enabled=typeof CONFIG!=='undefined' && CONFIG.storyMode===true && CONFIG.clarityMode===true;
  if(!enabled) return {enabled:false};
  var E=BUSINESS_ENGINE, escape=E.escape, ready=false, loaded=false;
  var LABELS=['Overview','Numbers & growth','Dependencies','People & risks','News'];
  function byId(id){return document.getElementById(id);}
  function button(text,attrs){return '<button type="button" '+(attrs||'')+'>'+text+'</button>';}
  function link(url,label){var safe=E.safeURL(url);return safe?'<a href="'+escape(safe)+'" target="_blank" rel="noopener noreferrer">'+escape(label)+' ↗</a>':escape(label);}
  function boot(){
    document.body.classList.add('clarity');ready=true;
    var home=byId('home-page'),dashboard=document.createElement('div');dashboard.id='cl-dashboard';dashboard.className='cl-dashboard';home.appendChild(dashboard);
    dashboard.innerHTML='<div class="cl-home-head"><div><div class="cl-eyebrow">THE BUSINESS, EXPLAINED</div><h1>See the business.<br><span>Understand its world.</span></h1><p>What it does. What it depends on. What deserves your attention.</p></div><div class="cl-home-note"><span class="cl-dot"></span>Research in progress<p>Profiles carry their reporting dates.<br>Historical business relationships are not tested yet.</p></div></div>'
      +'<div class="cl-search-row"><label class="cl-search-label" for="cl-search">Find a business<input id="cl-search" type="search" placeholder="Search a company or sector…" autocomplete="off"></label><label for="cl-sector">Sector<select id="cl-sector"><option value="">All sectors</option></select></label></div>'
      +'<div class="cl-home-grid"><main><div class="cl-row-heading"><div><h2>Explore businesses</h2><p id="cl-result-count" role="status">Loading company data…</p></div>'+button('View all →','id="cl-all"')+'</div><div class="cl-company-grid" id="cl-company-grid"></div></main><aside><div class="cl-panel cl-feature"><div class="cl-eyebrow">START WITH ONE EXAMPLE</div><h2>What makes<br>a bank work?</h2><p>Start with SBI. Read the numbers, follow the funding, then see the wider Indian market.</p><div class="cl-mini-path"><span>Deposits</span><i>→</i><span>Loans</span><i>→</i><span>Income</span></div>'+button('Explore banking & India →','id="cl-example" class="cl-primary"')+'</div><div class="cl-panel cl-updates"><div class="cl-row-heading"><h2>Latest headlines</h2><span class="cl-tag">Reading leads</span></div><p class="cl-note">Collected headlines, not verified business effects.</p><div id="cl-latest-news"><p class="cl-note">Waiting for the headline collection…</p></div></div><div class="cl-trust"><h3>Know the limits</h3><p>Some sources arrive late. Company exposures can be undisclosed. The site should say when an answer is unknown.</p>'+button('Check sources & dates →','id="cl-dates"')+'</div></aside></div>';
    byId('cl-search').addEventListener('input',renderCompanies);byId('cl-sector').addEventListener('change',renderCompanies);
    byId('cl-all').addEventListener('click',function(){STORY.goRoot('st-companies');});
    byId('cl-example').addEventListener('click',function(){STORY.goRoot('st-drivers');});
    byId('cl-dates').addEventListener('click',function(){STORY.goRoot('st-changed');});
    byId('cl-company-grid').addEventListener('click',function(e){var b=e.target.closest('[data-company]');if(b) openCompany(b.dataset.company);});
    var renamed={'st-companies':'Companies','st-sectors':'Sectors','forces-page':'World factors','st-drivers':'Banking & India','map-page':'Connections','st-compare':'Compare','st-changed':'Sources & dates'};
    document.querySelectorAll('.st-tab').forEach(function(b){var text=renamed[b.dataset.id];if(text){b.querySelector('span').textContent=text;b.setAttribute('aria-label',text);b.title=text;}});
    if(loaded) refresh();
  }
  function failed(){
    if(!ready) return;
    byId('cl-result-count').textContent='Company data could not be loaded. No figures are available.';
    byId('cl-company-grid').innerHTML=button('Reload data','id="cl-reload"');
    byId('cl-reload').addEventListener('click',function(){location.reload();});
  }
  function refresh(){
    loaded=true;if(!ready) return;
    var sectors=Array.from(new Set(Object.values(SEED).map(function(c){return c.sector;}))).sort();
    byId('cl-sector').innerHTML='<option value="">All '+sectors.length+' sectors</option>'+sectors.map(function(s){return '<option value="'+escape(s)+'">'+escape(s)+'</option>';}).join('');
    renderCompanies();renderHeadlines();
    if(typeof BANKING!=='undefined' && byId('st-drivers').classList.contains('active')) BANKING.open();
  }
  function renderCompanies(){
    if(!loaded) return;
    var q=byId('cl-search').value.trim().toLowerCase(),sector=byId('cl-sector').value;
    var rows=byMarketCapDesc(Object.values(SEED)).filter(function(c){return (!sector || c.sector===sector) && (!q || (c.name+' '+c.ticker+' '+c.sector).toLowerCase().indexOf(q)!==-1);});
    var visible=rows.slice(0,12);
    byId('cl-result-count').textContent=q||sector?rows.length+' matching companies · '+visible.length+' shown':Object.keys(SEED).length+' companies · largest 12 by latest market cap shown';
    byId('cl-company-grid').innerHTML=visible.length?visible.map(function(c,i){return '<button type="button" class="cl-company-card" data-company="'+escape(c.ticker)+'"><div class="cl-card-top"><span class="cl-company-mark">'+escape(c.ticker.slice(0,2))+'</span><span class="cl-arrow">↗</span></div><h3>'+escape(c.name)+'</h3><div class="cl-card-sector">'+escape(c.sector)+'</div><div class="cl-card-bottom"><span>'+escape(c.ticker)+'</span><span>Read business →</span></div></button>';}).join(''):'<div class="cl-empty">No business matches. Try a company name or a different sector.</div>';
  }
  function readingLead(n){
    var title=n.headline||n.title||'';
    return !/real madrid|football|premier league|champions league|cricket|birthday|turns \d+ years old/i.test(title) && /\b(bank|banking|finance|financial|insurance|business|company|companies|shares?|stocks?|markets?|nifty|sensex|profit|profits|revenue|revenues|earnings|loans?|deposits?|investment|investments|invest|invests|deal|deals|acquisition|acquires|merger|orders?|sales|retail|stores?|factory|factories|manufacturing|production|exports?|imports?|tariffs?|regulator|regulatory|rbi|sebi|quarter|q[1-4]|fy\d{2,4})\b/i.test(title);
  }
  function renderHeadlines(){
    var rows=[];Object.keys(NEWS||{}).forEach(function(t){if(!SEED[t]) return;(NEWS[t].items||[]).forEach(function(n){if(n.published_at) rows.push({company:SEED[t].name,ticker:t,title:n.headline,date:n.published_at.slice(0,10),url:n.url});});});
    var today=new Date().toISOString().slice(0,10),seen=new Set();
    rows=rows.filter(function(n){var id=n.url||n.title;if(n.date>today||seen.has(id)||!readingLead(n)||/price.?target|12.month target|upside potential|buy or sell/i.test(n.title)) return false;seen.add(id);return true;}).sort(function(a,b){return b.date.localeCompare(a.date);});var companiesSeen=new Set();rows=rows.filter(function(n){if(companiesSeen.has(n.ticker)) return false;companiesSeen.add(n.ticker);return true;}).slice(0,3);
    byId('cl-latest-news').innerHTML=rows.length?rows.map(function(n){return '<article><small>'+escape(n.company)+' · '+escape(n.date)+'</small><p>'+link(n.url,n.title)+'</p></article>';}).join(''):'<p class="cl-note">No dated headlines are available in the loaded collection.</p>';
  }
  function panel(title,html,extra){return '<section class="cl-panel '+(extra||'')+'"><h2>'+title+'</h2><div class="cl-panel-body">'+html+'</div></section>';}
  function companyNews(c){
    var bucket=(NEWS||{})[c.ticker],today=new Date().toISOString().slice(0,10);
    var items=(bucket&&bucket.items||[]).filter(function(n){return n.published_at && n.published_at.slice(0,10)<=today && readingLead(n);}).slice(0,6);
    return '<p class="cl-note">Collected reading leads, not verified events or calculated business effects.</p>'+(items.length?'<div class="cl-recent-news">'+items.map(function(n){return '<article><small>'+escape(n.published_at.slice(0,10))+' · '+escape(n.source||'Source not recorded')+'</small><p>'+link(n.url,n.headline)+'</p></article>';}).join('')+'</div>':'<p>No dated headlines are available.</p>')+'<details class="cl-evidence"><summary>Full headline collection & original tone labels</summary><div class="cl-expert">'+sectionBody(c,9)+'</div></details>';
  }
  function numberCards(c){
    if(c.ticker==='SBIN' && typeof BANKING!=='undefined') return '<div id="cl-sbi-numbers">'+BANKING.companyNumbers()+'</div>';
    return '<div class="cl-numbers">'+(c.metric_order||Object.keys(c.metrics||{})).slice(0,4).map(function(k){var m=c.metrics[k];if(!m) return '';var v=m.value===null||m.value===undefined?'—':escape(m.value);return '<div><span>'+escape(m.label||k)+'</span><b>'+v+' <small>'+escape(v==='—'?'':m.unit||'')+'</small></b></div>';}).join('')+'</div><p class="cl-note">'+escape(c.as_of||'Reporting period not recorded')+'. Full definitions and notes are under Numbers & growth.</p>';
  }
  function company(c){
    var canvas=byId('canvas'),current=0;
    canvas.innerHTML='<div class="cl-company-head"><div><div class="cl-eyebrow">'+escape(c.ticker)+' / '+escape(c.sector)+'</div><h1>'+escape(c.name)+'</h1><p>'+escape(c.as_of||'Reporting period not recorded')+'</p><p class="cl-note">'+(c.ticker==='SBIN'?'Profile text and other tabs use the older record. Overview numbers use the separately checked FY2026 dataset.':'Existing profile snapshot. Original filings have not been independently rechecked in this research phase.')+'</p></div><label for="cl-switch">Switch business<select id="cl-switch">'+Object.values(SEED).sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(x){return '<option value="'+escape(x.ticker)+'" '+(x.ticker===c.ticker?'selected':'')+'>'+escape(x.name)+'</option>';}).join('')+'</select></label></div>'
      +'<div class="cl-tabs" role="tablist" aria-label="Company information">'+LABELS.map(function(l,i){return button(l,'role="tab" id="cl-tab-'+i+'" data-view="'+i+'" aria-selected="'+(i===0)+'" aria-controls="cl-company-content" tabindex="'+(i===0?'0':'-1')+'"');}).join('')+'</div><div id="cl-company-content" role="tabpanel" aria-labelledby="cl-tab-0"></div>';
    byId('cl-switch').addEventListener('change',function(){openCompany(this.value);});
    canvas.querySelector('.cl-tabs').addEventListener('click',function(e){var b=e.target.closest('[data-view]');if(b) render(Number(b.dataset.view));});
    canvas.querySelector('.cl-tabs').addEventListener('keydown',function(e){if(['ArrowLeft','ArrowRight','Home','End'].indexOf(e.key)===-1) return;e.preventDefault();var n=e.key==='Home'?0:e.key==='End'?LABELS.length-1:(current+(e.key==='ArrowRight'?1:-1)+LABELS.length)%LABELS.length;render(n);byId('cl-tab-'+n).focus();});
    function render(view){
      current=view;canvas.querySelectorAll('[data-view]').forEach(function(b){var active=Number(b.dataset.view)===view;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});
      var content=byId('cl-company-content');content.setAttribute('aria-labelledby','cl-tab-'+view);
      if(view===0){
        var tags=c.tech_geo_tags||[];
        content.innerHTML='<div class="cl-overview-grid">'+panel('What the business does',sectionBody(c,0),'cl-business')+panel('The key numbers',numberCards(c),'cl-keynumbers')
          +panel('What it depends on','<p class="cl-note">Recorded business exposures. These are not measurements of today’s effect.</p>'+(tags.length?'<ul class="cl-dependencies">'+tags.slice(0,3).map(function(t){return '<li>'+t.label+'</li>';}).join('')+'</ul>':'<p>No dependencies recorded.</p>')+button('See dependencies & connections →','data-open="2" class="cl-inline-link"'))
          +panel('Where it fits',(c.value_chain&&c.value_chain.position?'<p>'+c.value_chain.position+'</p>':'<p>No value-chain position recorded.</p>')+button('View suppliers & customers →','data-open="2" class="cl-inline-link"'))+'</div><div class="cl-bottom-note">Historical operating relationships are not tested yet. Source notes are part of the company record; a data check is not an independent audit of the original filing.</div>';
      }else if(view===1) content.innerHTML='<div class="cl-detail-grid">'+panel('Reported numbers',sectionBody(c,3),'cl-wide')+panel('Growth in the record',sectionBody(c,7))+panel('Share price & valuation',sectionBody(c,8))+'</div>';
      else if(view===2) content.innerHTML='<div class="cl-detail-grid">'+panel('Suppliers, customers & connections',sectionBody(c,1),'cl-wide')+panel('Recorded factors',sectionBody(c,2),'cl-wide')+'</div>';
      else if(view===3) content.innerHTML='<div class="cl-detail-grid">'+panel('Leadership & ownership',sectionBody(c,4))+panel('Competitive strengths',sectionBody(c,5))+panel('Risks to watch',sectionBody(c,6),'cl-wide')+'</div>';
      else content.innerHTML=panel('Recent company headlines',companyNews(c));
      content.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(){render(Number(this.dataset.open));});});
      canvas.scrollTop=0;
    }
    render(0);
    if(c.ticker==='SBIN' && typeof BANKING!=='undefined') BANKING.prepare().then(function(){var target=byId('cl-sbi-numbers');if(target) target.innerHTML=BANKING.companyNumbers();}).catch(function(){var target=byId('cl-sbi-numbers');if(target) target.textContent='Official SBI research could not be loaded. No figures have been substituted.';});
  }
  function drivers(ctx,target){
    var root=byId('driver-root'),summary=byId('cl-driver-summary');
    if(!summary){
      var detail=document.createElement('details');detail.className='cl-evidence';detail.innerHTML='<summary>Evidence, historical comparisons & advanced controls</summary>';
      var expert=document.createElement('div');expert.className='cl-expert';while(root.firstChild) expert.appendChild(root.firstChild);detail.appendChild(expert);
      summary=document.createElement('div');summary.id='cl-driver-summary';root.appendChild(summary);root.appendChild(detail);
    }
    var v=target.vector,fuel=E.fuelProxy(v),age=Math.round((Date.parse(new Date().toISOString().slice(0,10))-Date.parse(target.end))/86400000);
    function change(n,unit){return (n>0?'+':'')+n.toFixed(1)+(unit||'%');}
    summary.innerHTML='<div class="cl-driver-head"><div class="cl-eyebrow">THE BUSINESS EXAMPLE / INDIGO</div><h1>From a world change<br>to a business pressure.</h1><p>The rules connect observed changes to known business mechanisms. No AI service. No share-price forecast.</p></div>'
      +'<div class="cl-period"><span>Observed window <b>'+target.start+' → '+target.end+'</b></span><span>'+age+' days since the shared observation date</span></div>'
      +'<div class="cl-driver-grid">'+panel('Fuel & flying costs','<div class="cl-signal-number">'+change(fuel)+'</div><p>Change in the dollar-priced fuel input translated into rupees.</p><div class="cl-mini-path"><span>Jet fuel</span><i>→</i><span>Rupee price</span><i>→</i><span>Flying costs</span></div><p>'+ (fuel>0?'Fuel became costlier in rupees. That can raise flying costs if consumption and purchase terms stay the same.':'Fuel became cheaper in rupees. That can offer cost relief if consumption and purchase terms stay the same.')+'</p><p class="cl-note">A proxy, not IndiGo’s paid fuel price or profit change. Fares, efficiency and hedges can change the outcome.</p>')
      +panel('Currency & dollar payments','<div class="cl-signal-number">'+change(v.inr)+'</div><p>Change in rupees needed to buy one dollar.</p><p>'+(v.inr>0?'A weaker rupee can make dollar-linked payments costlier.':'A stronger rupee can make dollar-linked payments cheaper.')+' Foreign-currency income and hedges can offset the effect.</p><p class="cl-note">The current amount of company exposure is not connected.</p>')
      +panel('Bond yields & financing','<div class="cl-signal-number">'+change(v.yield,' bp')+'</div><p>Change in the US 10-year yield.</p><p>Global financing conditions changed. Borrowing costs and interest income can react differently.</p><p class="cl-note">This yield is not IndiGo’s borrowing rate. No numeric company effect is assigned.</p>')
      +panel('Yen & global stress','<div class="cl-signal-number">'+change(v.yen)+'</div><p>Change in yen strength.</p><p>A stronger yen can pressure yen-funded leveraged trades. A currency move alone does not prove they are unwinding.</p><p class="cl-note">No direct yen exposure is established for IndiGo.</p>')+'</div>'
      +'<div class="cl-driver-limit"><b>What we cannot answer yet</b><p>How much IndiGo’s actual revenue, costs or profits changed because of these factors. We need historical operating data and current exposure information. Some factor readings are delayed, and the company-mechanism sources are FY2023–24.</p></div>';
  }
  STORY.ready(boot);
  return {enabled:true,refresh:refresh,failed:failed,company:company,drivers:drivers};
})();
