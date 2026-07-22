/* ============================================================================
   InvestorLens India — company.js
   The company screen: the 10-section master-detail view (§1 Business DNA → §10
   News), left-rail nav, section pager, per-company value-chain diagram, metrics
   table, factor tags, bull/bear, and the §5 Management renderer.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   Session D: bull/bear re-housed into §9 per CONTRACT (§10 is an honest
   placeholder until the news pulse ships); §2 gained the position card.
   Session F: §5's verified-date is data-driven (mgmt_profiles.verified_on) —
   the hardcoded "02 Jul 2026" is gone; a missing date renders an honest "—".
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
    case 8: return valuationPanel(c) + bullBear(c);
    case 9: return newsPanel(c);
  }
  return '';
}
/* ===========================================================================
   § 9  PRICE & VALUATION  (Session T)
   ---------------------------------------------------------------------------
   MISSION LOCK: valuation is CONTEXT, read AFTER the business is understood.
   It sits second-to-last on purpose, above only News. Nothing here is a
   buy/sell signal, and no ratio is ever labelled "cheap" or "expensive" --
   the page shows the number, what it is measured against, and where the
   denominator came from. The judgement stays with the reader.

   WHERE THE NUMBERS COME FROM:
     price / market cap  -> VALUATION[ticker], written nightly by the robot
                            (a market OBSERVATION, refreshed every night)
     P/E, P/B, EV/EBITDA -> also nightly, but only ever computed as
                            today's price / a HUMAN-VERIFIED denominator
                            stored in valuation_inputs. No verified
                            denominator means NO ratio -- we say so plainly
                            instead of printing a guess.
     the lens            -> VAL_INPUTS[ticker], which ratios actually
                            describe THIS business (EV/EBITDA is off for
                            lenders: borrowing is their raw material).
   None of these keys is a business-quality metric, so none of them appears
   in metric_order and none of them can move the home page's 492.
=========================================================================== */

/* A ratio, printed the way a ratio should be printed: "18.3x" or "—". */
function fmtX(v){
  return (typeof v === 'number' && isFinite(v)) ? (v.toFixed(1) + 'x') : '—';
}

/* The middle value of a peer group -- deliberately the MEDIAN, not the mean,
   so one extreme company cannot drag the comparison. Returns null when fewer
   than three peers have the number, because a "typical" value drawn from one
   or two companies is not typical of anything. */
function peerMedian(key, group, selfTicker){
  var vals = [];
  Object.keys(SEED||{}).forEach(function(t){
    if(t === selfTicker) return;
    if((SEED[t]||{}).compare_group !== group) return;
    var pocket = (VALUATION||{})[t] || {};
    var cell = pocket[key + '_now'];
    if(cell && typeof cell.value === 'number' && isFinite(cell.value)) vals.push(cell.value);
  });
  if(vals.length < 3) return null;
  vals.sort(function(a,b){ return a-b; });
  var mid = Math.floor(vals.length/2);
  return { median: (vals.length % 2 ? vals[mid] : (vals[mid-1]+vals[mid])/2), n: vals.length };
}

/* "Against its own past": the oldest dated reading we hold for this key,
   so the reader can see whether today is high or low FOR THIS COMPANY.
   History starts thin and thickens night by night -- we say how many
   readings it rests on rather than implying a long record we do not have. */
function ownHistory(hist){
  if(!hist || hist.length < 2) return null;
  var vals = hist.map(function(r){ return r.v; }).filter(function(v){
    return typeof v === 'number' && isFinite(v);
  });
  if(vals.length < 2) return null;
  var sorted = vals.slice().sort(function(a,b){ return a-b; });
  var mid = Math.floor(sorted.length/2);
  return {
    now: vals[vals.length-1],
    median: (sorted.length % 2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2),
    lo: sorted[0], hi: sorted[sorted.length-1], n: vals.length,
    since: hist[0].d
  };
}

/* One ratio row. Every branch below is a deliberate refusal to bluff:
   the lens says no        -> explain WHY it does not describe this business
   no verified denominator -> say so, and say what it is waiting for
   we have a number        -> show it, plus its own range and its peer group */
function valRow(label, key, applicable, notApplicableNote, c, waitingFor){
  var pocket = (VALUATION||{})[c.ticker] || {};
  var cell = pocket[key + '_now'];
  var body;

  if(applicable === false){
    body = '<span class="m-note">Not applicable for this business — '
         + esc(notApplicableNote) + '</span>';
    return '<tr><td class="m-label">'+label+'</td><td class="m-value">—</td>'
         + '<td class="m-note">'+body+'</td></tr>';
  }

  if(!cell || typeof cell.value !== 'number' || !isFinite(cell.value)){
    body = '<span class="m-note">Awaiting verification — this ratio appears once '
         + esc(waitingFor) + ' is read from the company\'s own filed results '
         + 'and checked. We would rather show nothing than a number we cannot stand behind.</span>';
    return '<tr><td class="m-label">'+label+'</td><td class="m-value">—</td>'
         + '<td class="m-note">'+body+'</td></tr>';
  }

  var bits = [];
  var own = ownHistory(pocket[key]);
  if(own && own.n >= 5){
    bits.push('its own range since ' + fmtVerifiedOn(own.since) + ': '
      + fmtX(own.lo) + '–' + fmtX(own.hi) + ' (middle ' + fmtX(own.median)
      + ', ' + own.n + ' readings)');
  } else if(own){
    bits.push('own history still building — ' + own.n + ' readings so far');
  }
  var peers = peerMedian(key, c.compare_group, c.ticker);
  if(peers){
    bits.push('typical ' + esc(c.compare_group || 'peer') + ': '
      + fmtX(peers.median) + ' across ' + peers.n + ' peers');
  }
  if(!bits.length) bits.push('comparisons appear as history and peer coverage build');

  return '<tr><td class="m-label">'+label+'</td>'
       + '<td class="m-value" data-cv="'+cell.value+'">'+fmtX(cell.value)+'</td>'
       + '<td class="m-note">'+bits.join(' · ')+'</td></tr>';
}

function valuationPanel(c){
  var pocket = (VALUATION||{})[c.ticker] || {};
  var vin = (VAL_INPUTS||{})[c.ticker] || {};
  var priceCell = pocket.price_inr_now;

  /* ---- the two observed numbers: today's price and today's size ---- */
  var priceTxt = (priceCell && typeof priceCell.value === 'number')
    ? '₹' + priceCell.value.toLocaleString('en-IN')
    : '—';
  var asOf = (priceCell && priceCell.as_of) ? fmtVerifiedOn(priceCell.as_of) : '—';

  var head = '<p>Share price <b class="m-value">'+priceTxt+'</b>'
    + ' · Market capitalisation <b class="m-value">'+fmtCr(c.market_cap_cr)+'</b>'
    + '</p>'
    + '<p class="m-note">Price and market cap are refreshed nightly from a public '
    + 'market source (as of '+esc(asOf)+'). They are observations, not opinions.</p>';

  /* ---- has this company grown or shrunk against its own recent size? ---- */
  var capHist = ownHistory(pocket.market_cap_cr);
  if(capHist && capHist.n >= 5 && capHist.median){
    var pct = Math.round(((capHist.now - capHist.median) / capHist.median) * 100);
    var dir = pct > 0 ? 'above' : (pct < 0 ? 'below' : 'level with');
    head += '<p class="m-note">Against its own record since '+fmtVerifiedOn(capHist.since)
      + ' ('+capHist.n+' readings), today\'s size sits '
      + (pct === 0 ? '' : Math.abs(pct)+'% ') + dir + ' the middle of that range. '
      + 'Size moving is not the same as the business changing — read § 1 to § 7 first.</p>';
  }

  /* ---- the three ratios, each with its own lens ---- */
  var rows =
      valRow('P/E (TTM)', 'pe_ttm', vin.pe_ok !== false,
             'earnings are not the meaningful denominator here',
             c, 'earnings per share for the trailing twelve months')
    + valRow('P/B', 'pb', vin.pb_ok !== false,
             'book value is not the meaningful denominator here',
             c, 'book value per share')
    + valRow('EV / EBITDA', 'ev_ebitda', vin.ev_ok !== false,
             'for a lender, borrowing is raw material rather than leverage, so enterprise value does not describe the business',
             c, 'trailing twelve-month EBITDA and net debt');

  var table = '<table class="mtable"><thead><tr><th>Ratio</th><th>Today</th>'
    + '<th>What it is measured against</th></tr></thead><tbody>'+rows+'</tbody></table>';

  /* ---- the business-understanding note for this specific company ---- */
  var lens = vin.lens ? '<p class="m-note"><b>Reading this business:</b> '+esc(vin.lens)+'</p>' : '';

  /* ---- provenance: exactly where the denominators came from ---- */
  var prov = '';
  if(vin.basis || vin.verified_on || vin.src){
    prov = '<p class="m-note">Denominators: '+esc(vin.basis || 'basis not recorded')
      + (vin.verified_on ? ' · verified '+fmtVerifiedOn(vin.verified_on) : '')
      + (vin.src ? ' · '+esc(vin.src) : '') + '</p>';
  }

  var lock = '<p class="m-note">Valuation sits second-to-last on this page by design. '
    + 'A ratio is a question, not an answer: it tells you what the market is paying, '
    + 'never whether the business deserves it. That judgement belongs to §§ 1–7 above.</p>';

  return head + lens + table + prov + lock;
}

/* ===========================================================================
   § 10  NEWS & SENTIMENT PULSE  (Session U)
   ---------------------------------------------------------------------------
   The site's one openly NON-VERIFIED surface. A machine collects headlines for
   this company and tags each one's TONE (tailwind / headwind / neutral). The
   panel shows them newest-first with a PLAIN TALLY of tone -- never a verdict.
   The words cheap / expensive / undervalued / overvalued / buy / sell never
   appear here, and nothing on this page ever enters the verified record: it is
   a separate table behind its own RLS, walled off from every section 1-9.
   Read the business first; a headline is a prompt to look, not a conclusion.
   That promise is asserted in the panel's test harness, not merely intended.
=========================================================================== */
var NEWS_TONE = {
  tailwind: { word: 'tailwind', col: 'var(--up)' },
  headwind: { word: 'headwind', col: 'var(--down)' },
  neutral:  { word: 'neutral',  col: 'var(--neutral)' }
};
function newsToneChip(tone){
  var t = NEWS_TONE[tone] || NEWS_TONE.neutral;
  return '<span class="tag-type" style="color:'+t.col+';border-color:'+t.col+'">'+t.word+'</span>';
}
function newsPanel(c){
  var bucket = (typeof NEWS !== 'undefined' ? NEWS : {})[c.ticker];
  var intro = '<p class="m-note">Headlines here are collected by machine and tagged by tone. '
    + 'This is the only page on the site that is <b>not</b> part of the verified record — it never '
    + 'enters §§ 1–9, and the tone is a plain reading of the language, not a signal to act.</p>';

  if(!bucket || !bucket.items || !bucket.items.length){
    return intro + '<div class="soon">No headlines collected yet for '+esc(c.name)+'. '
      + 'The news robot writes to this page on its nightly run; once it has, the newest '
      + 'headlines and a tone tally appear here.</div>';
  }

  var ta = bucket.tally || { tailwind:0, headwind:0, neutral:0 };
  var total = bucket.items.length;
  var tally = '<p class="m-note">Across the <b>'+total+'</b> most recent '
    + (total===1?'headline':'headlines')+' held for this company: '
    + '<b style="color:var(--up)">'+ta.tailwind+' tailwind</b> · '
    + '<b style="color:var(--down)">'+ta.headwind+' headwind</b> · '
    + '<b style="color:var(--neutral)">'+ta.neutral+' neutral</b>. '
    + 'A tally counts the tone of coverage; it does not weigh the company.</p>';

  var list = bucket.items.map(function(n){
    var when = n.published_at ? fmtVerifiedOn(n.published_at) : '—';
    var src  = n.source ? ' · '+esc(n.source) : '';
    var head = n.url
      ? '<a href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">'+esc(n.headline)+'</a>'
      : esc(n.headline);
    return '<li class="news-item">'+newsToneChip(n.sentiment)+' <span class="news-head">'+head+'</span>'
      + '<div class="m-note">'+esc(when)+src+'</div></li>';
  }).join('');

  return intro + tally
    + '<ul class="news-list">'+list+'</ul>'
    + '<p class="m-note">Tone is assigned by a fixed word list, re-checkable and never a judgement of '
    + 'worth. Anything genuinely material belongs in the verified sections above, put there by a human.</p>';
}

var SEC_TITLES = ['What the Business Actually Does','Value Chain &amp; Strategic Position','Real-Time Factor Tracker','Business Quality Metrics','Management &amp; Capital Allocation','Moat &amp; Competitive Structure','Risks &amp; Red Flags','Growth &amp; Future View','Price &amp; Valuation','News &amp; Sentiment Pulse'];

/* "2026-07-09" (how the database writes a date) → "09 Jul 2026" (how the page
   speaks). Split by hand on purpose: new Date('2026-07-09') is parsed as UTC
   midnight and can print the PREVIOUS day on some devices, while a plain
   string split can never shift the date. Missing or malformed renders '—'. */
function fmtVerifiedOn(iso){
  var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var p = String(iso||'').slice(0,10).split('-');
  return (p.length===3 && M[+p[1]-1]) ? p[2]+' '+M[+p[1]-1]+' '+p[0] : '—';
}

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
    + '<p class="m-note">Verified '+fmtVerifiedOn(m.verified_on)+' against: '+esc(m.src)+'. Salary-vs-PAT, dilution history and concall tone remain queued for a later pass.</p>';
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
