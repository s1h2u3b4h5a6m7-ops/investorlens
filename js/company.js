/* ============================================================================
   InvestorLens India — company.js
   The company screen: the 10-section master-detail view (§1 Business DNA → §10
   News), left-rail nav, section pager, per-company value-chain diagram, metrics
   table, factor tags, bull/bear, and the §5 Management renderer.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   Session D: bull/bear re-housed into §9 per CONTRACT (§10 is an honest
   placeholder until the news pulse ships); §2 gained the position card.
   ============================================================================ */

/* ============ COMPANY VIEW ============ */
var NAV = [
  {id:'s1',label:'1 · Business DNA'},
  {id:'s2',label:'2 · Value Chain'},
  {id:'s3',label:'3 · Real-Time Factors'},
  {id:'s4',label:'4 · Quality Metrics'},
  {id:'s5',label:'5 · Management'},
  {id:'s6',label:'6 · Moat'},
  {id:'s7',label:'7 · Risks & Red Flags'},
  {id:'s8',label:'8 · Growth'},
  {id:'s9',label:'9 · Valuation'},
  {id:'s10',label:'10 · News'}
];

function openCompany(ticker){
  var c = SEED[ticker];
  if(!c) return;
  currentTicker = ticker;
  currentSection = 0;
  var pcb = document.getElementById('peer-compare-btn');
  if(pcb) pcb.style.display = groupsForCompare().some(function(x){return x.g===c.compare_group}) ? '' : 'none';
  document.getElementById('c-ticker').textContent = c.ticker + ' · ' + (c.exchange||'NSE');
  document.getElementById('c-name').textContent = c.name;
  document.getElementById('c-sector').textContent = c.sector + (c.sub_sector ? ' — ' + c.sub_sector : '');
  document.getElementById('crumb-name').textContent = c.name;
  document.getElementById('topbar-mcap').textContent = fmtCr(c.market_cap_cr);

  var nav = document.getElementById('c-nav');
  nav.innerHTML = NAV.map(function(n,i){
    var check = (i===4 && MGMT[ticker]) ? '<span class="nav-check">● verified</span>' : '';
    return '<div class="nav-item" data-idx="'+i+'">'+n.label+check+'</div>';
  }).join('');
  nav.querySelectorAll('.nav-item').forEach(function(it){
    it.addEventListener('click', function(){ showSection(parseInt(it.getAttribute('data-idx'),10)); });
  });

  showSection(0);
  ['home-page','compare-page','forces-page','map-page'].forEach(function(id){ document.getElementById(id).classList.remove('active'); });
  document.getElementById('company-page').classList.add('active');
}

/* Build one section's content — same verified data, served one window at a time */
function sectionBody(c, i){
  var vc = c.value_chain || {};
  switch(i){
    case 0: return '<p>'+(c.business_core||'')+'</p>'
      + '<p class="m-note">As of '+esc(c.as_of||'—')+' · Market cap '+fmtCr(c.market_cap_cr)+' · source: '+esc(c.source_note||'—')+'</p>';
    case 1: return '<div class="vc-pos">'
      + '<div class="vc-pos-label">Where it sits &amp; why that matters</div>'
      + '<div class="vc-pos-text">'+(vc.position||'No value-chain note recorded.')+'</div>'
      + (vc.note ? '<div class="vc-pos-note">'+vc.note+'</div>' : '')
      + '</div>'
      + vcDiagram(c);
    case 2: return factorsInline(c);
    case 3: return metricsTable(c);
    case 4: return mgmtSection(c);
    case 5: return '<p>'+(c.moat_note||'')+'</p>';
    case 6: return bearList(c);
    case 7: return '<div class="soon">Revenue/PAT CAGR, guidance, order book and analyst consensus — planned for a later data pass.</div>';
    case 8: return '<p>Market capitalisation: <b class="m-value">'+fmtCr(c.market_cap_cr)+'</b></p>'
      + bullBear(c)
      + '<div class="soon">Live price, P/E, P/B, EV/EBITDA vs history and sector — deliberately placed second-to-last, to be read with full business context.</div>';
    case 9: return '<div class="soon">News &amp; sentiment pulse — a later phase. When it lands it will read headlines against § 3\'s live factors; nothing here is ever auto-written into the verified record.</div>';
  }
  return '';
}
var SEC_TITLES = ['What the Business Actually Does','Value Chain &amp; Strategic Position','Real-Time Factor Tracker','Business Quality Metrics','Management &amp; Capital Allocation','Moat &amp; Competitive Structure','Risks &amp; Red Flags','Growth &amp; Future View','Price &amp; Valuation','News &amp; Sentiment Pulse'];

function mgmtSection(c){
  var m = MGMT[c.ticker];
  if(!m){
    var done = Object.keys(MGMT||{}).length, total = Object.keys(SEED||{}).length;
    return '<div class="soon">Promoter holding &amp; pledge for this company are queued for a coming verification pass — '+done+' of '+total+' companies are done so far, and each record is checked against filings before it ships. No guesses.</div>';
  }
  var pctCell = (typeof m.promoter_pct === 'number')
    ? '<td class="m-value" data-cv="'+m.promoter_pct+'">'+m.promoter_pct+'<span style="color:var(--text-3)"> %</span></td>'
    : '<td class="m-value">—</td>';
  return ''
    + '<p class="mg-intro">Promoter holding is <b>skin in the game</b> — how much of the company its controlling owners actually keep. A <b>pledge</b> means the promoter has borrowed money against those shares: if trouble hits, lenders can seize and dump them, so pledge is one of the quietest but deadliest red flags in Indian markets.</p>'
    + '<table class="mtable mg-table"><tbody>'
    + '<tr><td class="m-label">Promoter holding ('+esc(m.as_of)+')</td>'+pctCell+'</tr>'
    + '<tr><td class="m-label">Who the promoter is</td><td class="mg-text">'+esc(m.who)+'</td></tr>'
    + '<tr><td class="m-label">Pledge / encumbrance</td><td class="mg-text">'+esc(m.pledge)+'</td></tr>'
    + '</tbody></table>'
    + '<div class="mg-cap"><div class="mg-cap-label">Capital allocation — what the owners actually did with the money</div>'+esc(m.capital)+'</div>'
    + '<p class="m-note">Verified 02 Jul 2026 against: '+esc(m.src)+'. Salary-vs-PAT, dilution history and concall tone remain queued for a later pass.</p>';
}

function showSection(i){
  var c = SEED[currentTicker];
  if(!c) return;
  currentSection = Math.max(0, Math.min(NAV.length-1, i));
  var nav = document.getElementById('c-nav');
  nav.querySelectorAll('.nav-item').forEach(function(x,k){ x.classList.toggle('active', k===currentSection); });

  var pager = '<div class="sec-pager">'
    + (currentSection>0 ? '<button class="btn-ghost" id="sec-prev">← '+NAV[currentSection-1].label+'</button>' : '<span></span>')
    + (currentSection<NAV.length-1 ? '<button class="btn-ghost" id="sec-next">'+NAV[currentSection+1].label+' →</button>' : '<span></span>')
    + '</div>';

  document.getElementById('canvas').innerHTML =
    '<div class="section pane-in" id="'+NAV[currentSection].id+'">'
    + '<div class="sec-num">§ '+(currentSection+1)+' of 10</div>'
    + '<div class="sec-title">'+SEC_TITLES[currentSection]+'</div>'
    + '<div class="sec-body">'+sectionBody(c, currentSection)+'</div>'
    + pager + '</div>';

  var prev = document.getElementById('sec-prev'), next = document.getElementById('sec-next');
  if(prev) prev.addEventListener('click', function(){ showSection(currentSection-1); });
  if(next) next.addEventListener('click', function(){ showSection(currentSection+1); });
  document.getElementById('canvas').scrollTop = 0;
  animateCounts(document.getElementById('canvas'));
}

function vcDiagram(c){
  var ch = CHAINS[c.ticker];
  if(!ch || !(ch.up||[]).length || !(ch.down||[]).length) return vcDiagramGeneric(c);
  var anyTag = ch.up.concat(ch.down).some(function(n){return n.t});
  return '<div class="vc-diagram"><div class="vc-flow">'
    + '<div class="vc-stack">' + ch.up.map(function(n,i){return chainNode('Upstream',n,i)}).join('') + '</div>'
    + arrow()
    + '<div class="vc-stack" style="flex:0 1 200px">' + node('The company', c.name, true) + '</div>'
    + arrow()
    + '<div class="vc-stack">' + ch.down.map(function(n,i){return chainNode('Downstream',n,i)}).join('') + '</div>'
    + '</div>'
    + (anyTag ? vcLegend() : '')
    + '</div>';
}
function chainNode(role,n,i){
  return '<div class="vc-node fade-item'+(n.t?' '+n.t:'')+'" style="animation-delay:'+(i*70)+'ms">'
    + '<div class="vc-role">'+esc(role)+(n.t?'<span class="vc-chip">'+esc(n.t)+'</span>':'')+'</div>'
    + esc(n.l)
    + (n.n ? '<div class="vc-nnote">'+esc(n.n)+'</div>' : '')
    + '</div>';
}
function vcLegend(){
  return '<div class="vc-legend">'
    + '<span><i class="vc-ldot" style="background:var(--down)"></i>link under live pressure</span>'
    + '<span><i class="vc-ldot" style="background:var(--up)"></i>link with a live tailwind</span>'
    + '<span><i class="vc-ldot" style="background:var(--neutral)"></i>context worth watching</span>'
    + '<span>tags mirror this company\'s Real-Time Factor Tracker (§ 3)</span>'
    + '</div>';
}
function vcDiagramGeneric(c){
  var up = 'Suppliers / Inputs', down = 'Customers / Channel';
  var g = c.compare_group;
  if(g === 'Banks' || g === 'NBFCs' || g === 'Financial Services' || g === 'Insurance'){
    up = 'Depositors / Funding markets'; down = 'Borrowers / Policyholders';
  } else if(g === 'IT'){
    up = 'Talent / Delivery centres'; down = 'Global enterprise clients';
  } else if(g === 'FMCG' || g === 'Consumer Durables'){
    up = 'Raw materials / Vendors'; down = 'Distributors → Retail → Consumer';
  } else if(g === 'Pharma' || g === 'Healthcare'){
    up = 'APIs / R&D pipeline'; down = 'Patients / Regulators / Hospitals';
  } else if(g === 'Oil & Gas' || g === 'Metals & Mining' || g === 'Cement' || g === 'Power'){
    up = 'Raw materials / Energy'; down = 'Industrial & retail buyers';
  } else if(g === 'Auto'){
    up = 'Components / Suppliers'; down = 'Dealers → Buyers';
  } else if(g === 'Telecom'){
    up = 'Spectrum / Network gear'; down = 'Subscribers / Enterprises';
  } else if(g === 'Infra & Capital Goods'){
    up = 'Materials / Labour'; down = 'Govt & private projects';
  } else if(g === 'Aviation'){
    up = 'Aircraft / Fuel / Crew'; down = 'Passengers / Cargo';
  }
  return '<div class="vc-diagram"><div class="vc-flow">'
    + node('Upstream', up)
    + arrow()
    + node('The company', c.name, true)
    + arrow()
    + node('Downstream', down)
    + '</div></div>';
}
function node(role,label,isCo){
  return '<div class="vc-node'+(isCo?' company':'')+'"><div class="vc-role">'+esc(role)+'</div>'+esc(label)+'</div>';
}
function arrow(){ return '<div class="vc-arrow">→</div>'; }

function metricsTable(c){
  var order = c.metric_order && c.metric_order.length ? c.metric_order : Object.keys(c.metrics||{});
  if(!order.length) return '<div class="soon">No metrics recorded.</div>';
  var rows = order.map(function(k){
    var m = (c.metrics||{})[k];
    if(!m) return '';
    var val = (m.value === null || m.value === undefined) ? '—' : m.value;
    var isNum = (typeof m.value === 'number' && isFinite(m.value));
    return '<tr><td class="m-label">'+esc(m.label||k)+'</td>'
      + '<td class="m-value"'+(isNum?(' data-cv="'+m.value+'"'):'')+'>'+val+(m.unit&&val!=='—'?('<span style="color:var(--text-3)"> '+esc(m.unit)+'</span>'):'')+'</td>'
      + '<td class="m-note">'+(m.note||'')+'</td></tr>';
  }).join('');
  return '<table class="mtable"><thead><tr><th>Metric</th><th>Value</th><th>What it means</th></tr></thead><tbody>'+rows+'</tbody></table>';
}

function factorsInline(c){
  var tags = c.tech_geo_tags||[];
  if(!tags.length) return '<div class="soon">No real-time factors recorded.</div>';
  return '<div class="tag-row">'+tags.map(function(t,i){
    return '<div class="tag '+t.type+' fade-item" style="animation-delay:'+(i*70)+'ms"><span class="tag-type">'+t.type+'</span>'+t.label+'</div>';
  }).join('')+'</div>';
}

function bearList(c){
  var b = c.bear||[];
  if(!b.length) return '<div class="soon">No red flags recorded.</div>';
  return '<div class="bb-col bear"><div class="bb-head">Watch-outs</div><ul>'
    + b.map(function(x){return '<li>'+x+'</li>';}).join('') + '</ul></div>';
}

function bullBear(c){
  var bull = c.bull||[], bear = c.bear||[];
  if(!bull.length && !bear.length) return '<div class="soon">No bull/bear cases recorded.</div>';
  function n(k){ return k.length + ' argument' + (k.length===1?'':'s'); }
  return '<div class="bb-intro">The debate — the strongest honest arguments each way, from the verified record. Read both sides before the price.</div>'
    + '<div class="bb-grid">'
    + '<div class="bb-col bull"><div class="bb-head">Bull case<span class="bb-count">'+n(bull)+'</span></div><ul>'
    + bull.map(function(x){return '<li>'+x+'</li>';}).join('') + '</ul></div>'
    + '<div class="bb-vs"><span class="bb-vs-chip mono">vs</span></div>'
    + '<div class="bb-col bear"><div class="bb-head">Bear case<span class="bb-count">'+n(bear)+'</span></div><ul>'
    + bear.map(function(x){return '<li>'+x+'</li>';}).join('') + '</ul></div>'
    + '</div>';
}
