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
  if(document.body.classList.contains('story')) decorateCompareButtons();
}

/* ---- 2g: marks on the compare-group cards (story mode only) ----
   Same shape as the sector and force decorators: idempotent, guarded, and built
   with insertAdjacentHTML so the SVG lands in the SVG namespace (2e-fix). */
function decorateCompareButtons(){
  if(typeof groupIconId !== 'function') return;
  var btns=document.querySelectorAll('#compare-grid .force-btn');
  for(var i=0;i<btns.length;i++){
    var b=btns[i];
    if(b.querySelector('.il-btn-ic')) continue;
    b.insertAdjacentHTML('afterbegin','<svg class="il-btn-ic" aria-hidden="true"><use href="#'+groupIconId(b.getAttribute('data-g'))+'"/></svg>');
  }
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
  /* ---- Session 7: the chip row becomes a ledger ----
     Order is count-descending with an alphabetical tie-break, written as ONE
     compound comparator so it is deterministic. Auto, Financial Services and
     Power are all 7; a sort whose tie order falls out of insertion order is
     the `display_order` lesson waiting to happen a second time.

     Nothing here is typed in. Names, counts and the denominator all come out
     of SECTORS, which init() built from SEED a few lines above. Type a 23 or
     a 107 into this function and the page begins lying the day the 108th
     company lands.

     The rail is n / every company covered — NOT scaled to the largest sector.
     At 15/107 the longest fill in the ledger is about 14% of its rail, and
     that flatness is the true finding: coverage is spread, nothing dominates.
     Scaling to the max would draw a picture of dominance the data does not
     contain, and would quietly make the rail mean something other than what
     the row says beside it. The rail is drawn full-length behind the fill so
     the unfilled remainder is visible and the row reads as deliberate. */
  var total = Object.keys(SEED).length;
  var names = Object.keys(SECTORS).sort(function(a, b){
    return (SECTORS[b].length - SECTORS[a].length) || (a < b ? -1 : a > b ? 1 : 0);
  });
  var btns = ['<button class="sector-btn sec-all active" data-sector="__all">All sectors'
    + '<span class="sec-n">' + total + ' companies</span></button>'];
  names.forEach(function(s){
    var n = SECTORS[s].length;
    var pct = total ? (n * 100 / total) : 0;
    btns.push('<button class="sector-btn" data-sector="'+esc(s)+'">'
      + '<span class="sec-name">'+esc(s)+'</span>'
      + '<span class="sec-n">'+n+' of '+total+'</span>'
      + '<span class="sec-rail" aria-hidden="true"><i style="width:'+pct.toFixed(2)+'%"></i></span>'
      + '</button>');
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
  if(document.body.classList.contains('story')) decorateSectorButtons();
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
  /* 2e: the sector mark is added AFTER the cards exist, and ONLY in story mode.
     With the flag off this guard is false, decorateCompanyCards() never runs,
     and #cards innerHTML is byte-for-byte what it was before 2e. */
  if(document.body.classList.contains('story')) decorateCompanyCards();
}

/* ---- 2e: sector marks on company cards (story mode only) ----
   Reads SEED[ticker].sector — a company field, read here in home.js where it is
   allowed, never in story.js. Idempotent: a card already carrying a mark is
   skipped, so re-decoration on filter/search does not stack SVGs. */
function decorateCompanyCards(){
  if(typeof sectorIconId !== 'function') return;
  var cards = document.querySelectorAll('#cards .co-card');
  for(var i=0;i<cards.length;i++){
    var card=cards[i];
    if(card.querySelector('.il-cosec')) continue;
    var c=SEED[card.getAttribute('data-ticker')];
    if(!c) continue;
    var span=document.createElement('span');
    span.className='il-cosec';
    span.setAttribute('aria-hidden','true');
    span.title=c.sector||'';
    span.innerHTML='<svg><use href="#'+sectorIconId(c.sector)+'"/></svg>';
    card.insertBefore(span, card.firstChild);
  }
}

/* ---- 2e: sector marks on the filter buttons (story mode only) ----
   The "All" button (data-sector="__all") gets the grid mark; every other button
   gets its sector's mark. Reads only the data-sector attribute already on the
   button, so no company field is touched here at all. */
function decorateSectorButtons(){
  if(typeof sectorIconId !== 'function') return;
  var btns=document.querySelectorAll('#sector-grid .sector-btn');
  for(var i=0;i<btns.length;i++){
    var b=btns[i];
    if(b.querySelector('.il-btn-ic')) continue;
    var s=b.getAttribute('data-sector');
    var id=(s==='__all')?'il-s-services':sectorIconId(s);
    if(s==='__all') id='il-all-grid';
    /* insertAdjacentHTML, NOT document.createElement('svg'). createElement
       makes an element named "svg" in the XHTML namespace, which a browser
       will not render — only the HTML parser puts it in the SVG namespace.
       This is exactly why the company-card marks (built with innerHTML)
       appeared and these did not. querySelectorAll finds either, which is why
       the first harness passed them: presence is not renderability. */
    b.insertAdjacentHTML('afterbegin','<svg class="il-btn-ic" aria-hidden="true"><use href="#'+id+'"/></svg>');
  }
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
  /* Session AC: the router tells the UI-2 layer where it just went, so the
     layer can remember the path. With the flag off this is a no-op. The router
     still owns the switching; it is only reporting it. */
  if(typeof STORY !== 'undefined' && STORY.enabled) STORY.onNavigate(id, dir);
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

/* ============ THE FRESHNESS LEDGER (Session 2f) ============
   WHAT THIS TAB IS, AND WHAT IT DELIBERATELY IS NOT.

   The tab was called "What changed". It cannot be a change log, and this is a
   property of the schema rather than a gap in the build: metric_snapshots holds
   ONE verified row per metric per reporting period. There is no before/after to
   diff, so a literal change log would be either empty or invented. Session 2d
   had already written the honest version of this on the page itself — the
   platform records when a figure was written down, not when it started being
   true.

   What the platform CAN say, truthfully, is how current each company's figures
   are. Three dated fields reach the browser and none of them is derived:
     SEED[t].as_of        the reporting period the figures belong to
     SEED[t].fetched_at   when the figures were pulled
     MGMT[t].verified_on  when a human last checked the management record
   That is a freshness ledger, and it answers a question a reader of this
   platform genuinely has: how old is what I am reading?

   It matters right now. 27 of the 107 companies still sit on Q3 FY26 (quarter
   ended 31 Dec 2025) while 77 are current to 31 Mar 2026 — and nothing else on
   the site tells anyone that.

   PERIOD PARSING IS DELIBERATELY TIMID. as_of is free text written by a human
   ("Q4 FY26 (quarter ended 31 Mar 2026)", "CY25 (calendar year ended 31 Dec
   2025)", "FY26 (TTM basis, post-demerger)"). We extract a sortable date ONLY
   when the label plainly contains one. Anything unparseable sorts last and
   shows its raw label untouched — the label is what a human wrote, and it is
   never rewritten, guessed at, or normalised into a claim it did not make. */

function periodEndOf(asOf){
  var s = String(asOf == null ? '' : asOf);
  var MON = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
             jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  /* take the LAST plain date in the label: where a company writes
     "FY26 (year ended 31 Mar 2026); embedded value as of 9M FY26", the primary
     period is the one spelled out, and later clauses qualify it. */
  var re = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/g, m, hit = null;
  while((m = re.exec(s))){
    var mo = MON[m[2].toLowerCase()];
    if(mo) hit = m[3] + '-' + mo + '-' + (m[1].length === 1 ? '0' + m[1] : m[1]);
  }
  return hit;   // ISO string, or null when the label carries no plain date
}

/* One row per company. No value is computed, inferred or defaulted: every field
   is either a stored value or null, and null renders as an em-dash. */
function freshnessRows(){
  var out = [];
  Object.keys(SEED).forEach(function(t){
    var c = SEED[t], m = (typeof MGMT !== 'undefined' && MGMT) ? MGMT[t] : null;
    out.push({
      ticker: t,
      name: c.name,
      sector: c.sector || '',
      asOf: c.as_of || null,
      period: periodEndOf(c.as_of),
      fetched: c.fetched_at ? String(c.fetched_at).slice(0,10) : null,
      verified: (m && m.verified_on) ? String(m.verified_on).slice(0,10) : null
    });
  });
  /* OLDEST FIRST. The point of the page is to surface what is ageing, so the
     stalest company is the first thing a reader sees. Unparseable periods sort
     last rather than being guessed into an order. */
  out.sort(function(a,b){
    if(a.period && b.period) return a.period < b.period ? -1 : (a.period > b.period ? 1 : a.ticker.localeCompare(b.ticker));
    if(a.period && !b.period) return -1;
    if(!a.period && b.period) return 1;
    return a.ticker.localeCompare(b.ticker);
  });
  return out;
}

function buildFreshness(el){
  if(!el) return 0;
  var rows = freshnessRows();
  if(!rows.length) return 0;

  var byPeriod = {}, newest = null, oldest = null, vDates = [];
  rows.forEach(function(r){
    var k = r.period || 'unlabelled';
    byPeriod[k] = (byPeriod[k] || 0) + 1;
    if(r.period){
      if(newest === null || r.period > newest) newest = r.period;
      if(oldest === null || r.period < oldest) oldest = r.period;
    }
    if(r.verified) vDates.push(r.verified);
  });
  vDates.sort();

  var freshCount = rows.filter(function(r){ return r.period === newest; }).length;
  var behind = rows.length - freshCount;

  var head = '<div class="st-fh"><span class="st-ftally">'
    + rows.length + ' companies · ' + freshCount + ' current to ' + fmtISO(newest)
    + (behind ? ' · <b class="st-stale">' + behind + ' on an earlier period</b>' : '')
    + (vDates.length ? ' · last human verification ' + fmtISO(vDates[vDates.length-1]) : '')
    + '</span></div>'
    + '<p class="st-fnote">How current each company\u2019s figures are \u2014 not a change log. '
    + 'The platform stores one verified row per reporting period, so it can tell you '
    + '<em>when a figure was filed and checked</em>, but it holds no before-and-after to compare. '
    + 'Oldest first, so whatever is ageing is what you see. The period is the company\u2019s own '
    + 'wording, shown exactly as written. <b>\u201cChecked\u201d is when a human last verified that '
    + 'company\u2019s record; \u201cprice\u201d is the nightly robot\u2019s market-data stamp and says '
    + 'nothing about the age of the figures above it.</b></p>';

  var body = rows.map(function(r){
    var stale = (r.period && newest && r.period < newest);
    return '<button class="st-fr' + (stale ? ' is-stale' : '') + '" type="button" data-ticker="' + esc(r.ticker) + '">'
      + '<span class="st-fr-co"><b>' + esc(r.ticker) + '</b><em>' + esc(r.name) + '</em></span>'
      + '<span class="st-fr-p">' + (r.asOf ? esc(r.asOf) : '\u2014') + '</span>'
      /* ORDER AND WORDING BOTH MATTER HERE.
         `fetched_at` is stamped nightly by etl/refresh.py for every ticker whose
         MARKET-CAP pull succeeded — it says when the PRICE was last refreshed,
         not when these fundamentals were gathered. The first cut printed
         "pulled 25 Jul 2026" beside "Q3 FY26 (quarter ended 31 Dec 2025)", which
         invites precisely the wrong inference on a page whose whole purpose is
         to show how old a figure is. The human verification date leads, because
         it is the one that speaks to the fundamentals; the robot's stamp follows,
         labelled as price. */
      + '<span class="st-fr-d">checked ' + (r.verified ? esc(fmtISO(r.verified)) : '\u2014')
      + ' \u00b7 price ' + (r.fetched ? esc(fmtISO(r.fetched)) : '\u2014') + '</span>'
      + '</button>';
  }).join('');

  el.innerHTML = head + '<div class="st-flist">' + body + '</div>';
  Array.prototype.forEach.call(el.querySelectorAll('.st-fr'), function(b){
    b.addEventListener('click', function(){ openCompany(b.getAttribute('data-ticker')); });
  });
  return rows.length;
}

/* ISO -> "9 Jul 2026". Split by hand: new Date('2026-07-09') parses as UTC
   midnight and renders as the 8th west of Greenwich. */
function fmtISO(iso){
  if(!iso) return '\u2014';
  var p = String(iso).slice(0,10).split('-');
  if(p.length !== 3) return String(iso);
  var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var mi = parseInt(p[1],10) - 1;
  return parseInt(p[2],10) + ' ' + (M[mi] || p[1]) + ' ' + p[0];
}

/* ============ THE LIVE-FACTOR FEED + HERO DATA (Session 2d) ============
   These live HERE, not in story.js, and that is not an accident.

   CONTRACT (Session AB) forbids js/story.js from reading a company field
   directly — tech_geo_tags is named in that list — and the harness asserts the
   token never appears in that file. That rule is what makes a UI session
   structurally incapable of altering a verified sentence: the layer that could
   change wording is never handed the wording. Session 2d moved the live-factor
   feed off Home and into What changed, which needs the field read SOMEWHERE.
   It is read here, in the file that already owned buildTicker() and already
   reads company fields legitimately. story.js is handed finished HTML, exactly
   as company.js hands it finished chapter bodies.

   WHY ROUND-ROBIN. buildTicker() (untouched, still feeding the old rail) walks
   SEED in id order and takes the first 18 (ticker|type) pairs it meets. The
   result is that the SAME SIX BANKS filled the whole strip on every load and
   the other 100 companies never appeared once — a surface labelled "what is
   pushing on these businesses right now" was really showing "the first rows we
   ever wrote". Sorting by date does not fix it: 318 of the tags share one
   bulk-insert timestamp, so a date sort resolves to id and lands straight back
   on the same six. BREADTH fixes it. One factor per company, cycling, so the
   first screenful spans as many businesses as there are rows to span. */
function factorFeedRows(){
  var byCo = {}, order = [], rows = [];
  byMarketCapDesc(Object.keys(SEED).map(function(k){ return SEED[k]; })).forEach(function(c){
    var list = c.tech_geo_tags || [];
    if(!list.length) return;
    byCo[c.ticker] = list;
    order.push(c.ticker);
  });
  var depth = 0, more = true;
  while(more){
    more = false;
    for(var i = 0; i < order.length; i++){
      var t = order[i], list = byCo[t];
      if(depth < list.length){
        rows.push({ ticker: t, name: SEED[t].name, label: list[depth].label, type: list[depth].type });
        more = true;
      }
    }
    depth++;
  }
  return rows;
}

/* Writes the whole feed into `el` and wires each row to its company page.
   Returns the row count so a caller can assert on it without re-deriving it. */
/* ===========================================================================
   SESSION 8 · THE ALL-COMPANY HEADLINE RIVER  (Freshness tab 2)
   ---------------------------------------------------------------------------
   The §10 pocket, pooled across all 107 companies and shown newest-first.

   WHAT IS DELIBERATELY ABSENT: a cross-company tone tally. §10 prints
   "3 tailwind · 2 headwind · 7 neutral" safely because it describes ONE
   company a reader is already inside. Print the same three numbers for 107
   companies on one screen and they stop being a description and become a
   leaderboard — a robot's keyword count ranking businesses against each
   other, which is precisely the verdict this platform refuses to print
   anywhere else. The tally stays in §10. Only the headlines pool.

   WHY IT IS CAPPED: etl/news_refresh.py pulls all 107 companies nightly at
   MAX_PER_COMPANY = 12 with RETENTION_DAYS = 30, so the live table holds
   several hundred to well over a thousand rows. Rendering every one of them
   would put a four-figure list on an iPad. The cap is a display bound and the
   screen says so in words, with both numbers counted at render — never typed.
=========================================================================== */
var NEWS_FEED_MAX = 60;   /* display bound, not a claim about the data */

function newsFeedRows(){
  var pocket = (typeof NEWS !== 'undefined' && NEWS) ? NEWS : {};
  var all = [], cos = 0;
  Object.keys(pocket).forEach(function(t){
    if(!SEED[t]) return;                       // a headline for an unknown ticker is dropped
    var items = (pocket[t] && pocket[t].items) || [];
    if(!items.length) return;
    cos++;
    items.forEach(function(n){
      all.push({ ticker: t, name: SEED[t].name, headline: n.headline,
                 source: n.source || null, sentiment: n.sentiment || 'neutral',
                 published_at: n.published_at || null });
    });
  });
  /* NEWEST FIRST. published_at is an ISO timestamp, so a plain string compare
     orders it correctly and — unlike new Date() — cannot shift a day across a
     timezone. An undated headline sorts LAST rather than being guessed into a
     position; ticker breaks the tie so the order is identical on every reload. */
  all.sort(function(a, b){
    var x = a.published_at || '', y = b.published_at || '';
    if(x !== y) return x < y ? 1 : -1;
    return a.ticker < b.ticker ? -1 : (a.ticker > b.ticker ? 1 : 0);
  });
  return { rows: all.slice(0, NEWS_FEED_MAX), total: all.length, companies: cos };
}

function buildNewsFeed(el){
  if(!el) return 0;
  var f = newsFeedRows();
  var fence = '<p class="st-fnote st-nfence">Machine-collected and machine-tagged. '
    + '<b>This is the one screen on the platform that is not part of the verified record.</b> '
    + 'Every other figure the site prints was checked by a human against a filing; nothing here '
    + 'ever enters \u00a7\u00a7\u20091\u20139 of a company page. Tone is a fixed word list, '
    + 're-checkable, and never a judgement of worth \u2014 it is counted one company at a time and '
    + 'deliberately never pooled into a score, because a word count ranking one business against '
    + 'another is the kind of verdict this platform does not print. Tap a row to read the headline '
    + 'where it belongs: after that company\u2019s nine verified sections.</p>';

  if(!f.total){
    el.innerHTML = fence + '<div class="st-empty">No headlines are being held right now. '
      + 'The news robot runs nightly and writes what it finds; when it has, the most recent '
      + 'headlines across every company appear here.</div>';
    return 0;                                  // no data-filled: retry on the next visit
  }

  var head = '<div class="st-fh"><span class="st-ftally">showing the ' + f.rows.length
    + ' most recent of ' + f.total + ' headlines held \u00b7 across ' + f.companies
    + ' of ' + Object.keys(SEED).length + ' companies</span></div>';

  var body = f.rows.map(function(r){
    var src = r.source ? ' \u00b7 ' + esc(r.source) : '';
    return '<button class="st-nrow" type="button" data-ticker="' + esc(r.ticker) + '">'
      + '<span class="st-fdot ' + esc(r.sentiment) + '" aria-hidden="true"></span>'
      + '<span class="st-nco">' + esc(r.ticker) + '</span>'
      + '<span class="st-nbody"><span class="st-nhead">' + esc(r.headline) + '</span>'
      + '<span class="st-nmeta">' + esc(fmtISO(r.published_at)) + src
      + ' \u00b7 tone: ' + esc(r.sentiment) + '</span></span></button>';
  }).join('');

  el.innerHTML = fence + head + '<div class="st-nlist">' + body + '</div>';
  Array.prototype.forEach.call(el.querySelectorAll('.st-nrow'), function(b){
    b.addEventListener('click', function(){ openCompany(b.getAttribute('data-ticker')); });
  });
  return f.rows.length;
}

function buildFactorFeed(el){
  if(!el) return 0;
  var rows = factorFeedRows(), tally = { risk:0, tailwind:0, neutral:0 }, cos = {};
  rows.forEach(function(r){
    if(tally[r.type] == null) tally[r.type] = 0;
    tally[r.type]++; cos[r.ticker] = 1;
  });
  var nco = Object.keys(cos).length;
  var head = '<div class="st-fh"><span class="st-ftally">' + rows.length + ' live factors · '
    + tally.risk + ' risk · ' + tally.tailwind + ' tailwind · ' + tally.neutral + ' neutral · across '
    + nco + ' companies</span></div>'
    + '<p class="st-fnote">These are the same §3 factors each company page carries — what is pushing on '
    + 'that business right now. They are ordered for breadth, one company at a time, not by date: '
    + 'the platform records when a factor was written down, not when it started being true, '
    + 'so calling this a timeline would be a claim it cannot support. Tap any row to open the company.</p>';
  var body = rows.map(function(r){
    return '<button class="st-frow" type="button" data-ticker="' + esc(r.ticker) + '">'
      + '<span class="st-fdot ' + esc(r.type) + '" aria-hidden="true"></span>'
      + '<span class="st-fco">' + esc(r.ticker) + '</span>'
      + '<span class="st-flab">' + esc(r.label) + '</span></button>';
  }).join('');
  el.innerHTML = head + body;
  Array.prototype.forEach.call(el.querySelectorAll('.st-frow'), function(b){
    b.addEventListener('click', function(){ openCompany(b.getAttribute('data-ticker')); });
  });
  return rows.length;
}

/* The newest HUMAN verification on record. ISO date strings compare correctly
   as plain strings, so no Date object is built — new Date('2026-07-09') parses
   as UTC midnight and can render as the 8th west of Greenwich. */
function lastVerifiedLabel(){
  var best = null, m = (typeof MGMT !== 'undefined' && MGMT) ? MGMT : {};
  Object.keys(m).forEach(function(t){
    var d = m[t] && m[t].verified_on;
    if(d && (best === null || String(d) > String(best))) best = d;
  });
  if(!best) return '\u2014';
  return (typeof fmtVerifiedOn === 'function') ? fmtVerifiedOn(best) : String(best).slice(0,10);
}

/* One box, four kinds of answer. Returns finished HTML so story.js never holds
   a company field. Empty string means "no query"; a no-match still returns
   markup, because an empty dropdown looks broken. */
function searchResultsHtml(q){
  q = String(q == null ? '' : q).trim().toLowerCase();
  if(!q) return '';
  var out = [], LIM = 6;

  var co = Object.keys(SEED).map(function(k){ return SEED[k]; }).filter(function(c){
    return (c.name + ' ' + c.ticker + ' ' + (c.sector||'') + ' ' + (c.sub_sector||'')).toLowerCase().indexOf(q) !== -1;
  });
  co = byMarketCapDesc(co).slice(0, LIM);
  if(co.length) out.push('<div class="st-grp">Companies</div>' + co.map(function(c){
    return '<button class="st-hit" type="button" data-kind="company" data-key="' + esc(c.ticker) + '">'
      + esc(c.name) + '<em>' + esc(c.ticker) + ' · ' + esc(c.sector || '') + '</em></button>';
  }).join(''));

  var secs = Object.keys(SECTORS || {}).filter(function(s){ return s.toLowerCase().indexOf(q) !== -1; }).slice(0, LIM);
  if(secs.length) out.push('<div class="st-grp">Sectors</div>' + secs.map(function(s){
    return '<button class="st-hit" type="button" data-kind="sector" data-key="' + esc(s) + '">'
      + esc(s) + '<em>' + SECTORS[s].length + ' companies</em></button>';
  }).join(''));

  if(typeof FORCES !== 'undefined'){
    var fs = FORCES.filter(function(f){
      return ((f.label || '') + ' ' + (f.blurb || '')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, LIM);
    if(fs.length) out.push('<div class="st-grp">Forces</div>' + fs.map(function(f){
      return '<button class="st-hit" type="button" data-kind="force" data-key="' + esc(f.id) + '">'
        + esc(f.label) + '<em>live factor</em></button>';
    }).join(''));
  }

  if(typeof CHAINMAP !== 'undefined'){
    var ms = CHAINMAP.filter(function(m2){
      return ((m2.title || '') + ' ' + (m2.blurb || '')).toLowerCase().indexOf(q) !== -1;
    }).slice(0, LIM);
    if(ms.length) out.push('<div class="st-grp">Value chains</div>' + ms.map(function(m2){
      return '<button class="st-hit" type="button" data-kind="map" data-key="' + esc(m2.id) + '">'
        + esc(m2.title) + '<em>value chain</em></button>';
    }).join(''));
  }

  return out.length ? out.join('') : '<div class="st-grp">No match</div>';
}

/* ============ HELPERS ============ */
function esc(s){ return String(s==null?'':s).replace(/&(?!#?\w+;)/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function stripHtml(s){ var d=document.createElement('div'); d.innerHTML=s; return d.textContent||d.innerText||''; }
