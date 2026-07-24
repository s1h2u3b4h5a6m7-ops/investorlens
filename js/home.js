/* ============================================================================
   InvestorLens India — home.js
   App entry point + home screen: hero, tabs, ticker, sector grid, company cards,
   search. Also hosts the tiny shared helpers used across features (fmtCr, esc,
   byMarketCapDesc, animateCounts). init() runs after data.js has loaded the seed.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   Session Z (UI-1): this file now owns THE ROUTER. Page switching used to be
   hand-written in five places with three different lists of pages to switch
   off — forces.js forgot map-page, compare.js forgot both forces-page and
   map-page. They were safe only by accident of which buttons existed. showPage()
   below reads the page list from the DOM, so a page can never be forgotten
   again, and it is the single place a transition can be triggered from.
   ============================================================================ */

/* ---- app state (shared globals) ---- */
var SECTORS = {};
var activeSector = null;
var currentTicker = null;
var currentForce = null;
var currentSection = 0;
/* ============ INIT ============ */
function init(){
  Object.keys(SEED).forEach(function(k){
    SEED[k].market_cap_cr = MARKET_CAP_CR[k] || 0;
  });
  Object.values(SEED).forEach(function(c){
    (SECTORS[c.sector] = SECTORS[c.sector] || []).push(c);
  });
  document.getElementById('home-sub').textContent =
    Object.keys(SEED).length + ' NSE-listed companies · ' + Object.keys(SECTORS).length + ' sectors · business-first analysis';
  buildSectorGrid();
  buildForceGrid();
  buildCompareTab();
  setupHomeTabs();
  buildTicker();
  document.getElementById('browse-all-btn').textContent =
    'Browse all ' + Object.keys(SEED).length + ' companies';
  setupMenuChrome();
  // company cards render lazily — the first search / sector pick / browse tap builds them
  document.getElementById('search').addEventListener('input', onSearch);
  document.getElementById('back-btn').addEventListener('click', goHome);
  document.getElementById('cmp-back-btn').addEventListener('click', goHome);
  document.getElementById('frc-back-btn').addEventListener('click', goHome);
  document.getElementById('map-back-btn').addEventListener('click', goHome);
  document.getElementById('browse-all-btn').addEventListener('click', function(){
    revealCards();
    renderCards(activeSector ? SECTORS[activeSector] : Object.values(SEED));
    document.getElementById('cards-area').scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.getElementById('peer-compare-btn').addEventListener('click', function(){
    if(currentTicker && SEED[currentTicker]) openCompare(SEED[currentTicker].compare_group);
  });
  document.querySelectorAll('#cmp-toggle button').forEach(function(b){
    b.addEventListener('click', function(){ CMP.view = b.getAttribute('data-view'); renderCompare(); });
  });
  var st = runSelfTests();
  var chip = document.getElementById('selftest-chip');
  if(chip){
    chip.innerHTML = st.pass
      ? '<span class="ok">●</span> ' + chipText(st)
      : '<span class="bad">●</span> '+st.fails.length+' data check(s) failing — see console';
  }
}

/* THE ACID TEST, in one place (Session W).
   ---------------------------------------------------------------------------
   Before this session there were TWO strings in the codebase, both plausibly
   "the chip": this one (4 counts, ending "verified promoter records") and
   js/selftest.js's console line (6 counts, ending "verified management
   records"). Governance quoted one, the page rendered the other, and a session
   was run against a STOP condition the site could never satisfy.

   Now there is ONE. This function is the single source of the string; the
   console line in js/selftest.js carries the SAME six counts in the SAME order,
   and a harness asserts the two agree. Never edit one without the other.

   WHY ALL SIX. `forceLinks` and `mapChains` had no visible surface at all. A
   force that quietly stopped matching 19 of its 20 companies fails NOTHING
   (the test only requires >= 1 match), and CHAINMAP losing a story fails
   nothing either -- so both could rot while the chip still read "pass". They
   are on the chip now because a number nobody can see is a number nobody
   checks.

   WHY "management" AND NOT "promoter". The row behind this count is a
   mgmt_profiles record -- promoter holding AND pledge AND capital allocation.
   "Promoter records" undersold what is actually verified; §5 of the company
   page has always been titled "Management & Capital Allocation". */
function chipText(st){
  return 'data checks: '
    + st.companies    + ' companies · '
    + st.metricChecks + ' metric bindings · '
    + st.forces       + ' forces · '
    + st.forceLinks   + ' exposure links · '
    + st.mapChains    + ' value-chain maps · '
    + st.mgmt         + ' verified management records';
}

/* ---- home rendering + shared helpers ---- */
function byMarketCapDesc(list){
  return list.slice().sort(function(a,b){ return (b.market_cap_cr||0) - (a.market_cap_cr||0); });
}
function buildCompareTab(){
  var g = document.getElementById('compare-grid');
  g.innerHTML = groupsForCompare().map(function(x){
    return '<button class="force-btn" data-g="'+esc(x.g)+'">'+esc(x.g)+' <span class="fb-n">'+x.n+'</span></button>';
  }).join('');
  g.querySelectorAll('.force-btn').forEach(function(b){
    b.addEventListener('click', function(){ openCompare(b.getAttribute('data-g')); });
  });
}
function setupMenuChrome(){
  var body = document.body;
  var rail = document.getElementById('menu-rail');
  var toggle = document.getElementById('drawer-toggle');
  var scrim = document.getElementById('drawer-scrim');
  function closeDrawer(){ body.classList.remove('drawer-open'); }
  function syncChrome(){
    var onHome = document.getElementById('home-page').classList.contains('active');
    body.classList.toggle('on-home', onHome);
    if(onHome) closeDrawer();
  }
  if(toggle) toggle.addEventListener('click', function(){ body.classList.add('drawer-open'); });
  if(scrim)  scrim.addEventListener('click', closeDrawer);
  // A menu button tapped from the drawer (on an inner page) should first return
  // Home, THEN let its normal handler run. Capture phase runs before those handlers.
  if(rail) rail.addEventListener('click', function(e){
    if(!e.target.closest('.menu-btn')) return;
    if(!body.classList.contains('on-home')) goHome();
    closeDrawer();
  }, true);
  // Keep body.on-home in sync no matter which file switches pages.
  Array.prototype.forEach.call(document.querySelectorAll('.page'), function(p){
    new MutationObserver(syncChrome).observe(p, { attributes:true, attributeFilter:['class'] });
  });
  syncChrome();
}
function setupHomeTabs(){
  var tabs = document.querySelectorAll('#home-tabs .home-tab');
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      // full-page tabs (e.g. the value-chain map) open a page instead of a panel
      var page = tab.getAttribute('data-page');
      if(page === 'map'){ openMap(); return; }
      var panel = tab.getAttribute('data-panel');
      var wasActive = tab.classList.contains('active');
      tabs.forEach(function(t){ t.classList.remove('active'); });
      ['sectors','forces','compare'].forEach(function(p){
        document.getElementById('panel-'+p).hidden = true;
      });
      if(!wasActive){
        tab.classList.add('active');
        document.getElementById('panel-'+panel).hidden = false;
      }
    });
  });
}
function fmtCr(cr){
  if(!cr) return '—';
  if(cr >= 100000) return '₹' + (cr/100000).toFixed(2) + ' Lakh Cr';
  return '₹' + cr.toLocaleString('en-IN') + ' Cr';
}
function buildSectorGrid(){
  var g = document.getElementById('sector-grid');
  var btns = ['<button class="sector-btn active" data-sector="__all">All</button>'];
  Object.keys(SECTORS).sort().forEach(function(s){
    btns.push('<button class="sector-btn" data-sector="'+esc(s)+'">'+esc(s)+'</button>');
  });
  g.innerHTML = btns.join('');
  g.querySelectorAll('.sector-btn').forEach(function(b){
    b.addEventListener('click', function(){
      g.querySelectorAll('.sector-btn').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
      var s = b.getAttribute('data-sector');
      activeSector = (s === '__all') ? null : s;
      document.getElementById('search').value = '';
      revealCards();
      renderCards(activeSector ? SECTORS[activeSector] : Object.values(SEED));
      var area = document.getElementById('cards-area');
      if(area) area.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
}
function buildTicker(){
  var seen = {}, items = [];
  Object.values(SEED).forEach(function(c){
    (c.tech_geo_tags||[]).forEach(function(t){
      var key = c.ticker+'|'+t.type;
      if(!seen[key] && items.length < 18){
        seen[key]=1;
        var short = t.label.length > 70 ? t.label.slice(0,70)+'…' : t.label;
        items.push('<div class="ticker-item"><span class="ticker-dot '+t.type+'"></span><b>'+esc(c.ticker)+'</b> — '+esc(short)+'</div>');
      }
    });
  });
  var track = document.getElementById('ticker-track');
  // Newest first, oldest last — a plain scrollable list (no loop, no duplication),
  // so the feed scrolls cleanly and stops at the newest (top) and oldest (bottom).
  track.innerHTML = items.join('');
}
function renderCards(list){
  var sorted = byMarketCapDesc(list);
  document.getElementById('count-line').textContent =
    'Showing ' + sorted.length + (activeSector ? (' in ' + activeSector) : ' companies');
  document.getElementById('cards').innerHTML = sorted.map(function(c,i){
    // Stagger capped at 16 steps: 107 cards x 22ms would be a 2.4-second wait
    // for the last card. Capped, the whole grid has settled in ~0.4s.
    return '<div class="co-card card-in" style="animation-delay:'+(Math.min(i,15)*22)+'ms" data-ticker="'+esc(c.ticker)+'">'
      + '<div class="co-rank">#'+(i+1)+'</div>'
      + '<div class="co-card-name">'+esc(c.name)+'</div>'
      + '<div class="co-card-ticker mono">'+esc(c.ticker)+' · '+esc(c.exchange||'NSE')+'</div>'
      + '<div class="co-card-mcap">'+fmtCr(c.market_cap_cr)+'</div>'
      + '<div class="co-card-tags"><span class="chip">'+esc(c.compare_group)+'</span>'
      + (c.sub_sector ? '<span class="chip sub">'+esc(c.sub_sector)+'</span>' : '')
      + '</div></div>';
  }).join('');
  document.querySelectorAll('.co-card').forEach(function(card){
    card.addEventListener('click', function(){ openCompany(card.getAttribute('data-ticker')); });
  });
}
function revealCards(){
  var a = document.getElementById('cards-area');
  if(a && a.hidden){ a.hidden = false; }
}
function onSearch(e){
  var q = e.target.value.trim().toLowerCase();
  if(q) revealCards();
  if(!q){ renderCards(activeSector ? SECTORS[activeSector] : Object.values(SEED)); return; }
  var base = activeSector ? SECTORS[activeSector] : Object.values(SEED);
  var hits = base.filter(function(c){
    return (c.name+' '+c.ticker+' '+c.sector+' '+c.sub_sector+' '+(c.business_core||'')).toLowerCase().indexOf(q) !== -1;
  });
  renderCards(hits);
}
/* ============ THE ROUTER (Session Z) ============
   One place switches pages. The list of pages is READ FROM THE DOM, never
   typed out — add a <div class="page"> to index.html and it is handled.
   dir is 'fwd' (going deeper: home → company) or 'back' (returning). The
   incoming page animates in; nothing animates OUT. That is deliberate: an
   exit-then-enter transition needs a timer and a cleanup step, and a dropped
   cleanup leaves the site blank or doubled forever. Enter-only cannot strand
   the page — the worst case is that the animation simply doesn't play. */
var PAGE_ENTER_CLASSES = ['pg-enter-fwd', 'pg-enter-back'];
function reducedMotion(){
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function showPage(id, dir){
  var target = document.getElementById(id);
  if(!target || !target.classList.contains('page')) return null;
  Array.prototype.forEach.call(document.querySelectorAll('.page'), function(p){
    PAGE_ENTER_CLASSES.forEach(function(c){ p.classList.remove(c); });
    if(p !== target) p.classList.remove('active');
  });
  target.classList.add('active');
  if(!reducedMotion()){
    void target.offsetWidth;            // forces a reflow so the animation restarts
    target.classList.add(dir === 'back' ? 'pg-enter-back' : 'pg-enter-fwd');
  }
  return target;
}
function goHome(){ showPage('home-page', 'back'); }

/* ============ MOTION ============ */
function animateCounts(root){
  if(reducedMotion()) return;
  root.querySelectorAll('[data-cv]').forEach(function(td){
    var target = parseFloat(td.getAttribute('data-cv'));
    if(!isFinite(target)) return;
    var txt = td.firstChild;
    if(!txt || txt.nodeType !== 3) return;
    var dec = (String(td.getAttribute('data-cv')).split('.')[1]||'').length;
    var t0 = null, dur = 600;
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min(1,(ts-t0)/dur);
      var eased = 1 - Math.pow(1-p,3);
      txt.nodeValue = (target*eased).toFixed(dec);
      if(p<1) requestAnimationFrame(step); else txt.nodeValue = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  });
}

/* ============ HELPERS ============ */
function esc(s){ return String(s==null?'':s).replace(/&(?!#?\w+;)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function stripHtml(s){ var d=document.createElement('div'); d.innerHTML=s; return d.textContent||d.innerText||''; }
