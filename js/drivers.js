/* A self-contained IndiGo example. Independent of company metric bindings. */
(function(){
  'use strict';
  if(typeof STORY === 'undefined' || !STORY.enabled) return;
  var E = BUSINESS_ENGINE, esc = E.escape, ctx, target, vector, selected='jet', scenario=false;
  var root, cached, loadPromise;
  function el(id){return document.getElementById(id);}
  function fmt(n,unit,places){var dp=places===undefined?1:places,scale=Math.pow(10,dp),rounded=Math.round((Math.abs(n)+1e-10)*scale)/scale;return (n>0?'+':n<0 && rounded?'-':'')+rounded.toFixed(dp)+(unit==='bp'?' bp':'%');}
  function source(url,label){var safe=E.safeURL(url);return safe?'<a href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':esc(label);}
  function section(n,title,copy){return '<div class="bd-section-heading"><span>'+n+'</span><div><h2>'+title+'</h2><p>'+copy+'</p></div></div>';}
  function boot(){
    root = el('driver-root');
    if(!root) return;
    root.hidden = false;
    root.innerHTML = '<p class="bd-loading" role="status">Opening the business example…</p>';
    // Load only when this tab is visited, rather than adding to the home-page payload.
    var page = el('st-drivers');
    var observer = new MutationObserver(function(){if(page.classList.contains('active')) load();});
    observer.observe(page,{attributes:true,attributeFilter:['class']});
    var example=new URLSearchParams(window.location.search).get('example');
    if(example==='banking' || (example==='indigo' && CONFIG.clarityMode!==true)) STORY.goRoot('st-drivers');
    if(page.classList.contains('active')) load();
  }
  function load(){
    if(CONFIG.clarityMode === true && typeof BANKING !== 'undefined') { BANKING.open(); return; }
    if(cached || loadPromise) return;
    loadPromise = fetch('./data/business_factors.json').then(function(r){if(!r.ok) throw new Error('Factor snapshot unavailable.');return r.json();})
      .then(function(raw){cached=raw;build();}).catch(function(e){
        cached=null;root.innerHTML='<p role="alert">'+esc(e.message)+' No readings have been invented.</p><button type="button" id="bd-retry">Try again</button>';
        el('bd-retry').addEventListener('click',load);
      }).finally(function(){loadPromise=null;});
  }
  function build(){
    ctx=E.context(cached,new Date().toISOString().slice(0,10));target=E.changes(ctx,ctx.days.length-1);vector=Object.assign({},target.vector);
    var options=ctx.days.filter(function(d,i){return i>=20;}).reverse().map(function(d){return '<option value="'+d+'">'+d+'</option>';}).join('');
    root.innerHTML = '<div class="bd-intro"><div><div class="bd-eyebrow">A complete example · IndiGo / InterGlobe Aviation</div><h1>What makes a business move?</h1><p>Follow a change in the world into the parts of an airline it can affect. Read the evidence, test an assumption, then compare the setting with history.</p></div><div class="bd-stamp">Explicit rules<br><b>No AI service</b><br>No share-price forecast</div></div>'
      +'<div class="bd-ribbon"><b>Scope:</b> five measured factors, one business. Relationships are sourced explanations; they are not statistically proven company sensitivities. Company evidence is FY2023–24 and needs a current-report review.</div>'
      +section('01','Read the world','Dated observations, not a live market feed. Missing dates are never filled.')
      +'<div class="bd-controls"><label for="bd-date">View the world as of</label><select id="bd-date"><option value="latest">Latest snapshot</option>'+options+'</select><button type="button" id="bd-latest">Latest observations</button><span id="bd-window"></span></div>'
      +'<div id="bd-cards" class="bd-factors"></div><p id="bd-data-note" class="bd-note"></p>'
      +section('02','Follow the relationship','Choose a factor above. Each step shows how a global change could reach this business.')
      +'<div class="bd-route-panel"><div id="bd-route"></div></div><div id="bd-link-check" class="bd-link-check"></div>'
      +section('03','Test a business mechanism','Change the inputs yourself. These are assumptions, not measurements or predictions.')
      +'<div class="bd-lab"><div><div class="bd-presets"><button type="button" data-preset="observed">Use observed changes</button><button type="button" data-preset="shock">Try a fuel + currency shock</button><button type="button" data-preset="yen">Try yen + yield stress</button></div><form id="bd-form" class="bd-inputs">'
      +E.FACTORS.map(function(f){return '<label>'+esc(f.label)+' change ('+esc(f.unit)+')<input id="bd-input-'+f.key+'" name="'+f.key+'" type="number" step="any" min="'+(f.unit==='bp'?-500:-90)+'" max="'+(f.unit==='bp'?500:200)+'" required></label>';}).join('')
      +'<button type="submit" class="bd-primary">Apply my assumptions</button></form><p id="bd-input-error" role="alert"></p></div><div class="bd-result" id="bd-result" aria-live="polite"></div></div>'
      +section('04','Compare the setting with history','Similar inputs can have different outcomes. These are past factor patterns, not forecasts.')
      +'<div id="bd-history" class="bd-history"></div><details class="bd-details"><summary>How the historical comparison works</summary><p>Compare changes across 20 shared observation intervals (roughly a month). Each candidate ends before the displayed window begins. The three displayed candidate windows do not overlap each other. Distance is the square root of the mean squared difference after scaling each factor: Brent 10%, jet fuel 10%, USD/INR 3%, yield 50 basis points, yen strength 5%. These scales are hand-set, not fitted or calibrated probabilities. Smaller means a closer factor pattern; even the closest may be a poor match. The method ignores business results and unmeasured factors.</p><p>The downloaded history may include later revisions. A date replay hides later observations; it does not recreate exactly what was published that day.</p></details>'
      +'<div class="bd-lessons"><article><h3>A war headline is not an oil-price formula</h3><p>EIA’s Red Sea review described longer routes and more expensive shipping while Brent had not risen over the cited period. Measure the actual channel instead of assigning a fixed “war impact”.</p>'+source(E.EIA,'EIA · February 2024')+'</article><article><h3>A stronger yen is not proof of a carry unwind</h3><p>BIS linked the August 2024 turbulence to leveraged positions and an unwind, alongside economic news. Our currency series alone cannot identify those positions.</p>'+source(E.BIS,'BIS · August 2024')+'</article></div>'
      +section('05','Find relevant developments','Headlines are routed with visible keyword rules. A match is a reading lead, not a verified impact.')
      +'<div id="bd-news"></div><button id="bd-news-refresh" type="button">Check loaded headlines</button>'
      +section('06','See the coverage gaps','A broad factor map is useful only if it says which inputs are actually connected.')
      +'<details class="bd-details"><summary>'+E.CONNECTED.length+' connected series / '+E.REGISTRY.reduce(function(n,g){return n+g[1].length;},0)+' candidate factors — open the coverage map</summary><div class="bd-registry">'
      +E.REGISTRY.map(function(g){return '<div><h3>'+esc(g[0])+'</h3><ul>'+g[1].map(function(f){var connected=E.CONNECTED.indexOf(f)!==-1;return '<li><span>'+esc(f)+'</span><small class="'+(connected?'bd-connected':'')+'">'+(connected?'Connected':'Not connected')+'</small></li>';}).join('')+'</ul></div>';}).join('')+'</div></details>'
      +'<div class="bd-next"><h3>What would turn this into a stronger business explanation?</h3><p>Add dated Indian ATF prices, fuel consumption, fares, occupancy, lease terms and hedges. Then test the links against quarterly costs and revenue, using only information available at each date. Until then, the page explains mechanisms and factor history; it cannot calculate IndiGo’s profit impact.</p></div>';
    el('bd-date').addEventListener('change',function(){setDate(this.value);});
    el('bd-latest').addEventListener('click',function(){setDate('latest');});
    el('bd-cards').addEventListener('click',function(ev){var b=ev.target.closest('[data-factor]');if(b){selected=b.dataset.factor;renderRoute();renderCards();}});
    root.querySelectorAll('[data-preset]').forEach(function(button){button.addEventListener('click',function(){
      var p=this.dataset.preset;scenario=p!=='observed';vector=p==='shock'?{brent:20,jet:15,inr:3,yield:50,yen:0}:p==='yen'?{brent:0,jet:0,inr:0,yield:50,yen:10}:Object.assign({},target.vector);
      renderDerived();
    });});
    el('bd-form').addEventListener('submit',function(ev){
      ev.preventDefault();var next={};E.FACTORS.forEach(function(f){next[f.key]=Number(el('bd-input-'+f.key).value);});
      try{E.checkedVector(next);vector=next;scenario=true;el('bd-input-error').textContent='';renderDerived();}
      catch(e){el('bd-input-error').textContent=e.message;}
    });
    el('bd-form').addEventListener('input',function(){el('bd-input-error').textContent='Inputs changed. Apply your assumptions to update the calculation.';});
    el('bd-news-refresh').addEventListener('click',renderNews);
    renderAll();
  }
  function setDate(day){
    ctx=E.context(cached,day==='latest'?new Date().toISOString().slice(0,10):day);target=E.changes(ctx,ctx.days.length-1);vector=Object.assign({},target.vector);scenario=false;renderAll();
  }
  function renderAll(){
    el('bd-date').value=ctx.cutoff===new Date().toISOString().slice(0,10)?'latest':target.end;
    el('bd-window').textContent=target.start+' → '+target.end+' · 20 shared intervals';
    el('bd-data-note').textContent='Snapshot collected '+ctx.collectedAt.slice(0,10)+'. Shared comparison date: '+target.end+'. The cards show the newest individual readings available up to your selected cutoff. Source publication delays can exceed your 1–2 day goal. USD/INR means rupees per dollar; yen strength is calculated from the inverse of USD/JPY.';
    renderCards();renderRoute();renderDerived();renderNews();
    if(typeof CLARITY !== 'undefined' && CLARITY.enabled) CLARITY.drivers(ctx,target);
  }
  function renderCards(){
    var today=new Date().toISOString().slice(0,10);
    el('bd-cards').innerHTML=E.FACTORS.map(function(f){
      var s=ctx.series[f.key], rows=s.observations.filter(function(r){return r[0]<=ctx.cutoff && r[0]<=today;}), latest=rows[rows.length-1];
      var age=Math.round((Date.parse(today)-Date.parse(latest[0]))/86400000);
      var timing=ctx.cutoff===today?age+' days old':'Historical reading';
      return '<article class="bd-factor '+(selected===f.key?'bd-selected':'')+'"><button type="button" data-factor="'+f.key+'" aria-pressed="'+(selected===f.key)+'"><span>'+esc(f.label)+'</span><b>'+latest[1].toLocaleString('en-IN',{maximumFractionDigits:3})+' <small>'+esc(s.unit)+'</small></b><em>'+fmt(target.vector[f.key],f.unit)+' over shared window</em></button><div class="bd-card-foot"><span class="'+(ctx.cutoff===today && age>2?'bd-old':'')+'">'+esc(latest[0])+' · '+timing+'</span><br>'+source(s.url,s.source+' / '+s.series_id)+'</div></article>';
    }).join('');
  }
  function renderRoute(){
    var f=E.FACTORS.filter(function(x){return x.key===selected;})[0];
    el('bd-route').innerHTML='<div class="bd-route-head"><h3>'+esc(f.label)+' → IndiGo</h3><span class="bd-tag">'+esc(f.kind)+'</span></div><ol class="bd-chain">'+f.path.map(function(p){return '<li>'+esc(p)+'</li>';}).join('')+'</ol><p>'+esc(f.mechanism)+'</p><p class="bd-note"><b>Limit:</b> '+esc(f.limit)+'</p>'+source(f.source,f.sourceLabel);
    var check=E.historicalLink(ctx,target);
    el('bd-link-check').innerHTML='<h3>Check one link against history: crude → jet fuel</h3>'
      +(check.r===null?'<p class="bd-note">Not enough varied earlier data to measure this relationship.</p>':'<div class="bd-check-stats"><div><b>'+check.r.toFixed(2)+'</b><span>Correlation · −1 to +1</span></div><div><b>'+(check.same*100).toFixed(0)+'%</b><span>Same direction · '+check.directional+' non-zero periods</span></div><div><b>'+check.n+'</b><span>20-interval periods</span></div></div><p class="bd-note">'+check.first+' → '+check.last+'. Positive correlation means the two prices tended to move together. This tests contemporaneous co-movement, not causation, a lag, or IndiGo’s costs. Unmeasured factors can drive both. Other links remain sourced mechanisms without a fitted historical coefficient.</p>');
  }
  function renderDerived(){
    E.FACTORS.forEach(function(f){el('bd-input-'+f.key).value=Number(vector[f.key].toFixed(3));});
    var fuel=E.fuelProxy(vector), label=scenario?'Your assumption':'Observed factor changes';
    el('bd-result').innerHTML='<div class="bd-eyebrow">'+label+'</div><h3>Dollar-priced fuel input,<br>translated into rupees</h3><div class="bd-big">'+fmt(fuel,'%',2)+'</div><p>Jet fuel '+fmt(vector.jet,'%')+' × currency '+fmt(vector.inr,'%')+'</p><code>(1 + jet / 100) × (1 + INR / 100) − 1</code><p class="bd-note">This is input-price arithmetic. It is not IndiGo’s paid ATF price, total cost change or profit change. Brent is upstream and is not added again.</p><div class="bd-condition">'+(fuel>0.05?'Upward fuel-input pressure if consumption and purchasing terms stay the same.':fuel<-.05?'Lower fuel-input pressure if consumption and purchasing terms stay the same.':'No material change in this fuel-input calculation.')+' Fares, efficiency, hedging and demand can offset the effect.</div><p class="bd-note">Yield '+fmt(vector.yield,'bp')+' and yen strength '+fmt(vector.yen,'%')+' remain separate context. No numeric company effect is assigned.</p>';
    var matches=E.analogues(ctx,target,vector);
    el('bd-history').innerHTML=matches.length?matches.map(function(m,i){return '<article><div class="bd-eyebrow">Closest pattern '+(i+1)+'</div><h3>'+m.start+' → '+m.end+'</h3><div class="bd-distance">Distance '+m.distance.toFixed(2)+' <small>lower is closer</small></div><dl>'+E.FACTORS.map(function(f){return '<div><dt>'+esc(f.label)+'</dt><dd>'+fmt(m.vector[f.key],f.unit)+'</dd></div>';}).join('')+'</dl><p class="bd-note">No company outcome or causal conclusion attached.</p></article>';}).join(''):'<p class="bd-note">Not enough earlier history for independent comparison windows. Nothing has been invented.</p>';
  }
  function renderNews(){
    var pocket=typeof NEWS!=='undefined' && NEWS && NEWS.INDIGO;
    var rows=pocket && Array.isArray(pocket.items)?pocket.items.map(function(n){return {title:n.headline,date:n.published_at,url:n.url};}):[];
    var matches=E.matchNews(rows,ctx.cutoff);
    el('bd-news').innerHTML='<p class="bd-note">Uses the existing IndiGo headline collection. Keyword routing only: '+E.FACTORS.map(function(f){return esc(f.label);}).join(', ')+'. Later headlines are hidden in date replay. '+rows.length+' headlines loaded; '+matches.length+' relevant leads shown (maximum six).</p>'
      +(matches.length?matches.map(function(n){return '<article class="bd-news-item"><div><small>'+n.date+' · '+esc(n.hits.join(' / '))+'</small><p>'+(n.url?source(n.url,n.title):esc(n.title))+'</p></div><span class="bd-tag">Read & verify</span></article>';}).join(''):'<p>No matching headlines are available in the loaded data for this date. This does not mean no relevant event happened.</p>')
      +'<details class="bd-details"><summary>Inspect the headline routing rules</summary><ul>'+E.FACTORS.map(function(f){return '<li>'+esc(f.label)+': <code>'+esc(f.words.source)+'</code></li>';}).join('')+'</ul><p>Words cannot detect context, negation or an event’s size. Headlines do not alter the measured factor values or the scenario assumptions.</p></details>';
  }
  STORY.ready(boot);
})();
