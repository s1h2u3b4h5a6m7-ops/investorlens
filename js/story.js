/* ============================================================================
   InvestorLens India — story.js
   THE UI-2 LAYER.

   Session AA laid the switch. Session AB added the company chapters. Session AC
   (24 Jul 2026) adds the navigation model: browsing moves out of the cramped
   panels inside the Home hero and onto real pages, reached from a floating
   bezel, with a stack that remembers the path you took.

   The new pages are CREATED AT RUNTIME by this file. They are not in
   index.html, because if they were they would exist in the old UI too and the
   rollback would stop being one word. The router in home.js reads its page list
   from document.querySelectorAll('.page'), so a page injected here is handled
   with no change to the router at all — that derived list is exactly why it was
   written that way in Session Z.

   The pages do not RENDER anything either. The existing panels are MOVED into
   them, element ids intact, so renderCards(), buildSectorTabs(), buildForceGrid()
   and buildCompareTab() keep writing into the same nodes and never know they
   were re-parented.

   The one rule this file exists to enforce:

     If CONFIG.storyMode is false, story.js MUST NOT touch the page.

   Not "touch it a little". Nothing. That is what makes the switch a real way
   back rather than a hopeful one, and the harness proves it by recording every
   call story.js makes into a fake page and asserting the log is EMPTY.

   IMPORTANT — this file renders NO content of its own. Every word inside a
   chapter still comes from company.js's sectionBody(), and every title still
   comes from its SEC_TITLES. story.js only decides the ARRANGEMENT. That is
   why 2b cannot change a single verified sentence: it never writes one.

   Load order: after home.js (the router) and company.js (the renderers),
   before selftest.js (the chip stays the last word).
   ============================================================================ */

var STORY = (function(){

  var on = !!(typeof CONFIG !== 'undefined' && CONFIG && CONFIG.storyMode === true);

  function reduced(){
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  var queue = [];
  function ready(fn){ if(typeof fn === 'function') queue.push(fn); }

  /* ---- the question each chapter answers -------------------------------
     UI copy, not data. Identical for all 107 companies, because the QUESTION
     is a property of the section, not of the business. Nothing here is a
     finding, a judgement, or a number. */
  var ASKS = [
    'What does this company actually do?',
    'Where does it sit between its suppliers and its customers?',
    'What is pushing on it right now?',
    'Is it any good at what it does?',
    'Who runs it, and how do they treat outside shareholders?',
    'What stops a competitor taking this business?',
    'What could actually break it?',
    'Is it getting bigger, and how?',
    'What is the market charging for all of the above?',
    'What just happened?'
  ];

  /* Ten chapter marks, drawn by hand. No icon library, no request. */
  var SPRITE = '<svg id="st-sprite" style="display:none" aria-hidden="true">'
  + '<symbol id="st-i0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2 6.3 6.3M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8 6.3 17.7M17.7 6.3l2.1-2.1"/></symbol>'
  + '<symbol id="st-i1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/><rect x="16.5" y="9.5" width="5" height="5" rx="1.2"/><path d="M7.5 12h2M14.5 12h2"/></symbol>'
  + '<symbol id="st-i2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 14.5h4l2.5-7 3.5 12 3-9 2 4h5"/></symbol>'
  + '<symbol id="st-i3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V11M10 19V5M16 19v-6M22 19H2"/></symbol>'
  + '<symbol id="st-i4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></symbol>'
  + '<symbol id="st-i5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.8 4.5 6v6.2c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 2.8Z"/></symbol>'
  + '<symbol id="st-i6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.5 1.8 20.5h20.4L12 3.5Z"/><path d="M12 10v4.4M12 17.6v.1"/></symbol>'
  + '<symbol id="st-i7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 17 9 11l4 3.6L21 6"/><path d="M15.4 6H21v5.4"/></symbol>'
  + '<symbol id="st-i8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.5v19"/><path d="M16.5 6.4c-1-1.1-2.7-1.7-4.5-1.7-2.6 0-4.4 1.2-4.4 3.1 0 4.6 9.3 2.5 9.3 7.2 0 2-2 3.3-4.9 3.3-2 0-3.8-.7-4.8-1.9"/></symbol>'
  + '<symbol id="st-i9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="4.5" width="15" height="15" rx="1.8"/><path d="M17.5 8.5h4v9a2 2 0 0 1-4 0Z"/><path d="M6 8.5h8M6 12h8M6 15.5h5"/></symbol>'
  + '</svg>';

  /* ---- the tabs ----------------------------------------------------------
     `moves` is the id of an element already in index.html that gets re-parented
     into the new page. Value chain has none: map-page already exists and
     already renders all four chains, so the tab points straight at it. */
  var TABS = [
    {id:'st-companies', label:'Companies',   icon:'t0', moves:'cards-area',
     title:'All companies', blurb:'Every company on the platform. Each one is read as a business first.'},
    {id:'st-sectors',   label:'Sectors',     icon:'t1', moves:'panel-sectors',
     title:'Browse by sector', blurb:'Groups of businesses that face the same customers and the same costs.'},
    {id:'st-forces',    label:'Forces',      icon:'t2', moves:'panel-forces',
     title:'Explore by force', blurb:'Real-world pressures. Pick one to see every business it touches.'},
    {id:'map-page',     label:'Value chain', icon:'t3', moves:null},
    {id:'st-compare',   label:'Compare',     icon:'t4', moves:'panel-compare',
     title:'Compare companies', blurb:'Comparison only means something inside a peer group that faces the same economics.'},
    {id:'st-changed',   label:'What changed',icon:'t5', moves:null,
     title:'What changed', blurb:'Everything here comes from a dated row the platform already holds.'}
  ];

  var TAB_SPRITE = '<svg id="st-tabsprite" style="display:none" aria-hidden="true">'
  + '<symbol id="st-t0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></symbol>'
  + '<symbol id="st-t1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></symbol>'
  + '<symbol id="st-t2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="2.4"/><path d="M12 3.2v3M12 17.8v3M3.2 12h3M17.8 12h3"/><circle cx="12" cy="12" r="8.6" opacity=".45"/></symbol>'
  + '<symbol id="st-t3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M6.8 7.4 10.6 16M17.2 7.4 13.4 16M7.2 6h9.6"/></symbol>'
  + '<symbol id="st-t4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 20V9M12 20V4M18 20v-7"/></symbol>'
  + '<symbol id="st-t5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/></symbol>'
  + '</svg>';

  var SPY = 0.62;          // a chapter is "current" only once its top passes 62%
  var CHAIN_STEP = 260;    // ms between value-chain nodes — deliberately unhurried
  var teardown = [];       // listeners/observers to unhook when leaving the page

  function off(){ while(teardown.length){ try{ teardown.pop()(); }catch(e){} } }

  /* ======================================================================
     chapters(c) — arrange the ten sections as one scroll.
     Called from company.js ONLY when the flag is on.
     ====================================================================== */
  function chapters(c){
    var canvas = document.getElementById('canvas'),
        nav    = document.getElementById('c-nav');
    if(!canvas || !nav || typeof NAV === 'undefined') return;

    off();
    if(!document.getElementById('st-sprite')) document.body.insertAdjacentHTML('beforeend', SPRITE);

    /* ---- the rail: raised pill for the chapter you are reading ---- */
    function railItem(i){
      return '<button class="st-ni" type="button" data-i="' + i + '">'
        + '<svg class="st-ic"><use href="#st-i' + i + '"/></svg>'
        + '<span>' + NAV[i].label.replace(/^\d+\s*·\s*/, '') + '</span>'
        + '<em>§' + (i + 1) + '</em></button>';
    }
    var A = '', B = '';
    for(var i = 0; i < NAV.length; i++){ (i < 4 ? A += railItem(i) : B += railItem(i)); }
    nav.innerHTML =
      '<div class="st-grp">The business</div><div class="st-list">' + A + '</div>'
    + '<div class="st-grp">The judgement</div><div class="st-list">' + B + '</div>';

    /* ---- the canvas: every chapter, one scroll ----
       §§1-4 and §§5-10 sit on different ground. That is the whole separation:
       no gate, no button, no interruption — just a change of surface you feel
       rather than read. */
    function chapter(i){
      var verified = (i === 4 && typeof MGMT !== 'undefined' && MGMT[c.ticker])
        ? '<span class="st-verified">● verified</span>' : '';
      return '<section class="section st-ch" id="' + NAV[i].id + '" data-i="' + i + '">'
        + '<div class="st-head">'
        +   '<span class="st-num" aria-hidden="true">' + (i < 9 ? '0' : '') + (i + 1) + '</span>'
        +   '<h2 class="st-title"><i>§' + (i + 1) + '</i>' + SEC_TITLES[i] + verified + '</h2>'
        +   '<p class="st-ask">' + ASKS[i] + '</p>'
        + '</div>'
        + '<div class="sec-body">' + sectionBody(c, i) + '</div>'
        + '</section>';
    }
    var one = '', two = '';
    for(var j = 0; j < NAV.length; j++){ (j < 4 ? one += chapter(j) : two += chapter(j)); }

    var strip = '<div class="st-strip"><div class="st-strip-row">';
    for(var k = 0; k < NAV.length; k++){
      strip += '<button class="st-sb" type="button" data-i="' + k + '">'
        + '<svg class="st-ic"><use href="#st-i' + k + '"/></svg>'
        + (k + 1) + ' · ' + NAV[k].label.replace(/^\d+\s*·\s*/, '') + '</button>';
    }
    strip += '</div></div>';

    canvas.innerHTML = strip
      + '<div class="st-group st-business">' + one + '</div>'
      + '<div class="st-group st-judgement">' + two + '</div>';
    canvas.scrollTop = 0;

    var chs   = [].slice.call(canvas.querySelectorAll('.st-ch')),
        heads = [].slice.call(canvas.querySelectorAll('.st-head')),
        navs  = [].slice.call(document.querySelectorAll('.st-ni,.st-sb')),
        stripEl = canvas.querySelector('.st-strip');

    navs.forEach(function(b){
      b.addEventListener('click', function(){
        var t = chs[+b.getAttribute('data-i')];
        if(t) t.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block: 'start'});
      });
    });

    /* ---- which chapter am I reading? ----
       The rail used to change the moment a section's top crossed the middle,
       so the NAME changed while the PREVIOUS section still filled the screen.
       A chapter is now current only once its top has passed 62% of the canvas,
       i.e. once it genuinely owns what you are looking at. */
    var current = -1, queued = false;

    function measure(){
      queued = false;
      var box = canvas.getBoundingClientRect(),
          line = box.top + canvas.clientHeight * SPY,
          top  = box.top + (stripEl && stripEl.offsetHeight ? stripEl.offsetHeight : 0),
          active = 0;

      for(var n = 0; n < chs.length; n++){
        if(chs[n].getBoundingClientRect().top <= line) active = n;
      }
      if(active !== current){
        current = active;
        navs.forEach(function(b){
          b.setAttribute('aria-current', +b.getAttribute('data-i') === active ? 'true' : 'false');
        });
        var sb = canvas.querySelector('.st-sb[aria-current="true"]');
        if(sb && sb.scrollIntoView) sb.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block:'nearest', inline:'center'});
      }

      /* Heading wipe. --p is recomputed every frame, so scrolling UP plays it
         backwards for free. Body copy is deliberately NOT reversible: a
         paragraph that fades out while you scroll back to re-read it is
         actively annoying, and re-reading is the normal case here. */
      for(var h = 0; h < heads.length; h++){
        var r = heads[h].getBoundingClientRect(),
            p = 1 - (r.top - (box.top + canvas.clientHeight * 0.18)) / (canvas.clientHeight * 0.60);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        heads[h].querySelector('.st-title').style.setProperty('--p', p.toFixed(3));
        heads[h].classList.toggle('stuck', r.top <= top + 1);
      }
    }
    function onScroll(){ if(!queued){ queued = true; requestAnimationFrame(measure); } }
    canvas.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    teardown.push(function(){ canvas.removeEventListener('scroll', onScroll); });
    teardown.push(function(){ window.removeEventListener('resize', onScroll); });

    /* ---- reveal on entry, ONCE, then stop watching ---- */
    /* Reveal targets, chosen precisely. A value-chain diagram and its nodes must
       not BOTH fade — the parent's opacity would swallow the stagger — so the
       diagram and the tag row are skipped in favour of their children. */
    var targets = [];
    [].slice.call(canvas.querySelectorAll('.sec-body')).forEach(function(b){
      [].slice.call(b.children).forEach(function(el){
        if(el.classList.contains('vc-diagram') || el.classList.contains('tag-row')) return;
        targets.push(el);
      });
    });
    [].slice.call(canvas.querySelectorAll('.vc-node, .vc-arrow, .tag')).forEach(function(el){ targets.push(el); });
    if(reduced() || !window.IntersectionObserver){
      targets.forEach(function(el){ el.classList.add('st-in'); });
      chs.forEach(function(s){ if(typeof animateCounts === 'function') animateCounts(s); });
    } else {
      targets.forEach(function(el){ el.classList.add('st-rv'); });
      var io = new IntersectionObserver(function(es, ob){
        es.forEach(function(e){
          if(!e.isIntersecting) return;
          e.target.classList.add('st-in');
          ob.unobserve(e.target);
        });
      }, {root: canvas, rootMargin: '0px 0px -10% 0px', threshold: 0.12});
      targets.forEach(function(el){ io.observe(el); });
      teardown.push(function(){ io.disconnect(); });

      /* counters fire when their chapter arrives, not all at once on load */
      var ioc = new IntersectionObserver(function(es, ob){
        es.forEach(function(e){
          if(!e.isIntersecting) return;
          if(typeof animateCounts === 'function') animateCounts(e.target);
          ob.unobserve(e.target);
        });
      }, {root: canvas, threshold: 0.15});
      chs.forEach(function(s){ ioc.observe(s); });
      teardown.push(function(){ ioc.disconnect(); });

      /* The value chain draws itself, left to right, unhurried. Document order
         inside .vc-diagram is already upstream -> arrow -> company -> arrow ->
         downstream, so DOM order IS reading order. */
      [].slice.call(canvas.querySelectorAll('.vc-diagram')).forEach(function(d){
        [].slice.call(d.querySelectorAll('.vc-node, .vc-arrow')).forEach(function(n, i){
          n.style.transitionDelay = (i * CHAIN_STEP) + 'ms';
        });
      });
      /* Factor tags keep a quicker rhythm — they are a list, not a diagram. */
      [].slice.call(canvas.querySelectorAll('.tag-row')).forEach(function(r){
        [].slice.call(r.querySelectorAll('.tag')).forEach(function(n, i){
          n.style.transitionDelay = (i * 70) + 'ms';
        });
      });
    }

    measure();
  }

  /* ======================================================================
     THE NAVIGATION STACK
     Back should retrace the path you actually took, not jump to Home. The
     router reports every switch here; this keeps the trail. Choosing a tab or
     the brand RESETS the trail, because those are deliberate fresh starts
     rather than steps in a journey.
     ====================================================================== */
  var trail = ['home-page'], quiet = false;

  function onNavigate(id){
    if(quiet || !id) return;
    var seen = trail.lastIndexOf(id);
    // returning to a page already behind you truncates rather than grows the
    // trail — otherwise A→B→A→B→A leaves five steps to walk back through
    if(seen >= 0) trail.length = seen + 1;
    else trail.push(id);
  }

  function go(id, dir){                       // navigate and record
    if(typeof showPage === 'function') showPage(id, dir || 'fwd');
  }

  function goRoot(id){                        // a tab or the brand: fresh start
    quiet = true;
    if(typeof showPage === 'function') showPage(id, id === 'home-page' ? 'back' : 'fwd');
    quiet = false;
    trail = (id === 'home-page') ? ['home-page'] : ['home-page', id];
    if(id === 'st-companies'){ fillCompanies(); syncCompaniesHead(); }
    syncTabs();
  }

  function back(){
    quiet = true;
    if(trail.length > 1){ trail.pop(); }
    else { trail = ['home-page']; }
    var to = trail[trail.length - 1];
    if(typeof showPage === 'function') showPage(to, 'back');
    quiet = false;
    syncTabs();
  }

  function syncTabs(){
    var here = trail[trail.length - 1];
    var els = document.querySelectorAll('.st-tab');
    for(var i = 0; i < els.length; i++){
      els[i].setAttribute('aria-current', els[i].getAttribute('data-id') === here ? 'true' : 'false');
    }
  }

  /* ---- the Sectors tab must not be a dead end ----
     Picking a sector calls home.js's own handler, which filters and renders into
     #cards-area. Before 2c that area sat directly below the sector chips on the
     same page, so the result was right there. 2c moved #cards-area onto the
     Companies page, so the work still happened but on a page you were not
     looking at, and picking a sector appeared to do nothing.

     We do not touch home.js's handler — it is already correct. We listen on the
     way up, AFTER it has filtered, and simply follow the result. Going forward
     (not goRoot) means Back returns you to the sectors, which is the natural way
     out. */
  function syncCompaniesHead(){
    var pg = document.getElementById('st-companies');
    if(!pg) return;
    var h = pg.querySelector('.st-page-head h1'), p = pg.querySelector('.st-page-head p'),
        s = (typeof activeSector !== 'undefined') ? activeSector : null;
    if(h) h.textContent = s || 'All companies';
    if(p) p.textContent = s
      ? 'Every company on the platform in ' + s + '. Pick another sector to change this.'
      : 'Every company on the platform. Each one is read as a business first.';
  }

  function wireSectorJump(){
    var g = document.getElementById('sector-grid');
    if(!g || g.getAttribute('data-st-wired')) return;
    g.setAttribute('data-st-wired', '1');
    g.addEventListener('click', function(e){
      var el = e.target, btn = null;
      while(el && el !== g){ if(el.className && String(el.className).indexOf('sector-btn') > -1){ btn = el; break; } el = el.parentNode; }
      if(!btn) return;
      syncCompaniesHead();
      go('st-companies', 'fwd');
    });
  }

  /* The 107 cards are built lazily — the old UI only built them when you tapped
     "Browse all companies". The Companies tab is that tap now. */
  function fillCompanies(){
    try{
      if(typeof revealCards === 'function') revealCards();
      if(typeof renderCards === 'function' && typeof SEED !== 'undefined'){
        renderCards(typeof activeSector !== 'undefined' && activeSector && typeof SECTORS !== 'undefined'
          ? SECTORS[activeSector] : Object.keys(SEED).map(function(k){ return SEED[k]; }));
      }
    }catch(e){ if(window.console && console.warn) console.warn('company list not ready:', e); }
  }

  /* ======================================================================
     buildTabs() — the bezel, and the pages behind it
     ====================================================================== */
  function buildTabs(){
    var app = document.getElementById('app');
    if(!app || document.querySelector('.st-bezel')) return;
    if(!document.getElementById('st-tabsprite')) document.body.insertAdjacentHTML('beforeend', TAB_SPRITE);

    var btns = '';
    for(var i = 0; i < TABS.length; i++){
      btns += '<button class="st-tab" type="button" data-id="' + TABS[i].id + '">'
        + '<svg class="st-tic"><use href="#st-' + TABS[i].icon + '"/></svg>'
        + '<span>' + TABS[i].label + '</span></button>';
    }
    var bezel = document.createElement('nav');
    bezel.className = 'st-bezel';
    bezel.setAttribute('aria-label', 'Main');
    bezel.innerHTML = '<div class="st-bezel-in">'
      + '<button class="st-brand" type="button"><span class="st-brand-mark">◈</span>InvestorLens</button>'
      + '<span class="st-bezel-sep" aria-hidden="true"></span>'
      + '<div class="st-tabrow">' + btns + '</div></div>';
    document.body.insertBefore(bezel, app);

    // the pages, created here so they exist ONLY in story mode
    for(var j = 0; j < TABS.length; j++){
      var tb = TABS[j];
      if(!tb.moves) continue;
      var pg = document.createElement('div');
      pg.className = 'page st-page';
      pg.id = tb.id;
      /* The injected pages had no way back — the original pages carry their own
         .topbar-back, these carried nothing. The button uses the same class on
         purpose: the capture-phase document listener already routes every
         .topbar-back click through back(), so this needs no extra wiring. */
      pg.innerHTML = '<div class="st-page-head">'
                   + '<button class="topbar-back st-page-back" type="button">← Back</button>'
                   + '<h1>' + tb.title + '</h1><p>' + tb.blurb + '</p></div>'
                   + '<div class="st-page-body"></div>';
      var moved = document.getElementById(tb.moves);
      if(moved){
        moved.removeAttribute('hidden');       // panels ship hidden inside the hero
        pg.querySelector('.st-page-body').appendChild(moved);
      }
      app.appendChild(pg);
    }
    // What changed: the shell only. Session 2f fills it from dated rows.
    var chg = document.createElement('div');
    chg.className = 'page st-page'; chg.id = 'st-changed';
    chg.innerHTML = '<div class="st-page-head">'
      + '<button class="topbar-back st-page-back" type="button">← Back</button>'
      + '<h1>What changed</h1>'
      + '<p>Everything here comes from a dated row the platform already holds.</p></div>'
      + '<div class="st-page-body"><p class="st-empty">This page is built in a later session. '
      + 'Nothing is shown yet because nothing here would be traceable to a dated row.</p></div>';
    app.appendChild(chg);

    wireSectorJump();
    bezel.querySelector('.st-brand').addEventListener('click', function(){ goRoot('home-page'); });
    var tabs = bezel.querySelectorAll('.st-tab');
    for(var k = 0; k < tabs.length; k++){
      (function(b){ b.addEventListener('click', function(){ goRoot(b.getAttribute('data-id')); }); })(tabs[k]);
    }

    /* Back buttons stop jumping to Home and start walking the trail.

       ORDER MATTERS AND IT BIT US. story.js boots on DOMContentLoaded, but
       init() in home.js runs later — it waits for loadData() to come back from
       the network. So detaching goHome here removed a listener that had not
       been attached yet (a silent no-op), and init() then attached it. Both ran:
       back() stepped once, goHome() jumped Home, and Back always landed Home.

       The fix does not depend on order at all. One capture-phase listener on the
       document sees the click BEFORE it reaches the button, so whatever is bound
       to the button — now or later — never runs. */
    document.addEventListener('click', function(e){
      var el = e.target, hit = null;
      while(el && el.nodeType === 1){
        if(el.classList && el.classList.contains('topbar-back')){ hit = el; break; }
        el = el.parentNode;
      }
      if(!hit) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      back();
    }, true);
    var backs = document.querySelectorAll('.topbar-back');
    for(var b2 = 0; b2 < backs.length; b2++) backs[b2].textContent = '← Back';
    syncTabs();
  }

  function boot(){
    if(!on) return;                       // <- the whole rollback, in one line
    document.body.classList.add('story'); // every UI-2 rule is scoped to this
    buildTabs();
    for(var i = 0; i < queue.length; i++){
      try { queue[i](); }
      catch(e){ if(window.console && console.warn) console.warn('story step failed:', e); }
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return { enabled: on, reduced: reduced, ready: ready, chapters: chapters, SPY: SPY,
           onNavigate: onNavigate, back: back, goRoot: goRoot, TABS: TABS,
           syncCompaniesHead: syncCompaniesHead,
           trail: function(){ return trail.slice(); } };
})();
