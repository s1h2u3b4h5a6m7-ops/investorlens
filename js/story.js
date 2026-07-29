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
    {id:'map-page',     label:'Value chain', icon:'t3', moves:null,
     title:'Value-chain maps', blurb:'These companies are not islands. Each chain is a real relationship named in the companies\' own profiles.'},
    {id:'st-compare',   label:'Compare',     icon:'t4', moves:'panel-compare',
     title:'Compare companies', blurb:'Comparison only means something inside a peer group that faces the same economics.'},
    {id:'st-changed',   label:'Freshness',   icon:'t5', moves:null,
     title:'Data freshness', blurb:'How current each company\u2019s figures are. Every date here is a stored value, never a guess.'}
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

  /* ---- the right-hand column (Session 3) ------------------------------------
     RULE, and the reason this panel is allowed to exist at all: it may never
     state a figure its section does not. §4 answers "what does this company
     report". This answers "how does that sit against its peers" — the same
     number as the axis, a different question. Where §4 gives a reading, this
     gives the reading's rank inside its compare group and nothing else.

     Same discipline for forces. §3 carries each factor with its full stored
     evidence; this carries the bare map — which forces touch this company at
     all, and in which direction. Nothing here is computed that §3 and §4 do not
     already contain: peers come from compare_group, direction from the stored
     HIGHER_IS_BETTER flag, and a force counts as touching the company only if
     the force's own pattern matches a factor the company actually has. */
  function peerRows(c){
    if(typeof SEED === 'undefined' || !c.compare_group) return [];
    var peers = [];
    Object.keys(SEED).forEach(function(t){
      var p = SEED[t];
      if(p && p.compare_group === c.compare_group && p.ticker !== c.ticker) peers.push(p);
    });
    if(!peers.length) return [];
    var order = (c.metric_order && c.metric_order.length) ? c.metric_order : Object.keys(c.metrics || {});
    var out = [];
    order.forEach(function(k){
      var m = (c.metrics || {})[k];
      if(!m || typeof m.value !== 'number' || !isFinite(m.value)) return;
      var vals = [];
      peers.forEach(function(p){
        var pm = (p.metrics || {})[k];
        if(pm && typeof pm.value === 'number' && isFinite(pm.value)) vals.push({v:pm.value, t:p.ticker});
      });
      if(!vals.length){ out.push({k:k, label:m.label||k, value:m.value, unit:m.unit||'', alone:true}); return; }
      var dir = (typeof HIGHER_IS_BETTER !== 'undefined') ? HIGHER_IS_BETTER[k] : null;
      var all = vals.concat([{v:m.value, t:c.ticker}]);
      all.sort(function(a,b){ return dir === false ? a.v - b.v : b.v - a.v; });
      var rank = 0;
      for(var i = 0; i < all.length; i++){ if(all[i].t === c.ticker){ rank = i + 1; break; } }
      out.push({k:k, label:m.label||k, value:m.value, unit:m.unit||'',
                rank:rank, of:all.length, best:all[0], ranked:(dir === true || dir === false)});
    });
    return out;
  }

  function forceRows(c){
    if(typeof FORCES === 'undefined') return [];
    var tags = c.tech_geo_tags || [];
    if(!tags.length) return [];
    var out = [];
    FORCES.forEach(function(f){
      var hits = tags.filter(function(t){ return f.re.test(t.label); });
      if(!hits.length) return;
      var t = {risk:0, tailwind:0, neutral:0};
      hits.forEach(function(h){ if(t[h.type] != null) t[h.type]++; });
      var tone = t.tailwind > t.risk ? 'tailwind' : (t.risk > t.tailwind ? 'risk' : 'neutral');
      out.push({id:f.id, label:f.label, n:hits.length, tone:tone});
    });
    return out;
  }

  /* The header counts the peer GROUP; a row counts only those that report that
     metric. Those two numbers differ constantly — five peers, three reporting —
     so the row says "reporting" out loud rather than leaving a bare "3 of 4"
     to be read as a smaller peer group. */
  function ordinal(n){
    var s = ['th','st','nd','rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function aside(c){
    var pr = peerRows(c), fr = forceRows(c), html = '';
    var groupCount = 0;
    if(typeof SEED !== 'undefined' && c.compare_group){
      Object.keys(SEED).forEach(function(t){
        if(SEED[t] && SEED[t].compare_group === c.compare_group) groupCount++;
      });
    }
    if(pr.length){
      html += '<section class="co-as"><h3>Readings<em>vs ' + (groupCount - 1) + ' peer'
            + (groupCount - 1 === 1 ? '' : 's') + ' in ' + esc(c.compare_group) + '</em></h3>';
      pr.forEach(function(r){
        var val = r.value + (r.unit ? ' ' + r.unit : '');
        var right;
        if(r.alone)        right = '<span class="co-as-nil">only one reporting</span>';
        else if(!r.ranked) right = '<span class="co-as-nil">context \u2014 not ranked</span>';
        else if(r.rank === 1) right = '<span class="co-as-top">best of ' + r.of + ' reporting</span>';
        else right = '<span class="co-as-rank">' + ordinal(r.rank) + ' of ' + r.of + ' reporting</span>'
                   + '<span class="co-as-best">best ' + r.best.v + ' \u00b7 ' + esc(r.best.t) + '</span>';
        html += '<button class="co-as-row" type="button" data-jump="3">'
              + '<span class="co-as-k">' + esc(r.label) + '</span>'
              + '<span class="co-as-v">' + esc(String(val)) + '</span>'
              + right + '</button>';
      });
      html += '</section>';
    }
    if(fr.length){
      html += '<section class="co-as"><h3>Force exposure<em>' + fr.length + ' of 14 touch this business</em></h3>';
      fr.forEach(function(f){
        html += '<button class="co-as-force tone-' + f.tone + '" type="button" data-jump="2">'
              + '<i></i><span>' + esc(f.label) + '</span>'
              + (f.n > 1 ? '<b>' + f.n + '</b>' : '') + '</button>';
      });
      html += '<p class="co-as-foot">A force is listed only where this company\u2019s own '
            + 'recorded factors mention it. Direction is the tone stored on those factors, '
            + 'not a reading taken here.</p></section>';
    }
    return html ? '<aside class="co-aside">' + html + '</aside>' : '';
  }

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

    /* ---- the strip: two rows, four then six ----
       Session 2. This used to be one scrollable row shown only on narrow
       screens, with a left rail doing the work on desktop. It is now the only
       section navigation at every width, and it carries the 4 + 6 split in its
       shape rather than in a pair of headings.

       The active tab takes the ground colour of the chapter it points at and
       drops its bottom border, so it reads as joined to the reading below —
       a hole punched through the bar rather than a highlighted pill. Because
       §§1-4 and §§5-10 sit on different ground, the bar itself changes tone
       when you cross into the judgement. The tab tells you which half you are
       in without printing a word. */
    function stripBtn(k){
      return '<button class="st-sb" type="button" data-i="' + k + '">'
        + '<svg class="st-ic"><use href="#st-i' + k + '"/></svg>'
        + '<span>' + NAV[k].label.replace(/^\d+\s*·\s*/, '') + '</span>'
        + '<em>§' + (k + 1) + '</em></button>';
    }
    var rowA = '', rowB = '';
    for(var k = 0; k < NAV.length; k++){ (k < 4 ? rowA += stripBtn(k) : rowB += stripBtn(k)); }
    var sub = c.sector + (c.sub_sector ? ' — ' + c.sub_sector : '');
    var strip = '<div class="st-strip">'
      + '<div class="st-strip-id"><b>' + esc(c.name) + '</b><span>' + esc(sub) + '</span></div>'
      + '<div class="st-strip-row st-row-a">' + rowA + '</div>'
      + '<div class="st-strip-row st-row-b">' + rowB + '</div>'
      + '</div>';

    canvas.innerHTML = strip
      + '<div class="st-group st-business">' + one + '</div>'
      + '<div class="st-group st-judgement">' + two + '</div>'
      + aside(c);
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

    /* Every aside row is a way back into the section it summarises: the digest
       is never the last word, only the shortest one. */
    [].slice.call(canvas.querySelectorAll('[data-jump]')).forEach(function(b){
      b.addEventListener('click', function(){
        var t = chs[+b.getAttribute('data-jump')];
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
        /* The bar takes the ground of the half you are reading. */
        if(stripEl) stripEl.classList.toggle('in-judgement', active >= 4);
        /* Only chase the active tab when the row can actually scroll. On a
           two-row desktop bar every tab is already visible, and calling
           scrollIntoView there can nudge the whole canvas. */
        var sb = canvas.querySelector('.st-sb[aria-current="true"]'),
            row = sb && sb.parentNode;
        if(sb && sb.scrollIntoView && row && row.scrollWidth > row.clientWidth + 2)
          sb.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block:'nearest', inline:'center'});
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
    /* ---- publish the bar's true height ----
       --st-strip positions the sticky chapter headings and sets each chapter's
       scroll-margin. Its correct value depends on font metrics, on whether the
       identity line is showing and on how many rows the breakpoint gives us, so
       it is measured from the rendered bar rather than hardcoded. The CSS value
       is a fallback for the frame before this runs. */
    function syncStrip(){
      if(!stripEl) return;
      var h = stripEl.offsetHeight;
      if(h > 0) document.body.style.setProperty('--st-strip', h + 'px');
    }
    syncStrip();
    if(window.requestAnimationFrame) requestAnimationFrame(syncStrip);
    teardown.push(function(){ document.body.style.removeProperty('--st-strip'); });

    function onScroll(){ if(!queued){ queued = true; requestAnimationFrame(measure); } }
    function onResize(){ syncStrip(); onScroll(); }
    canvas.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onResize);
    teardown.push(function(){ canvas.removeEventListener('scroll', onScroll); });
    teardown.push(function(){ window.removeEventListener('resize', onResize); });

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
    if(id === 'st-companies'){
      try{ if(typeof activeSector !== 'undefined') activeSector = null; }catch(e){}
      fillCompanies(); syncCompaniesHead();
    }
    /* map-page has no moved panel: its content is built by renderMap(), which
       only openMap() ever called. The bezel tab went straight to showPage, so
       the page opened permanently empty — not invisible, ABSENT. Every
       lazily-rendered page a tab points at must have its renderer invoked
       here. */
    /* Same lesson as map-page, one tab along: a page whose content is built
       lazily must have its builder invoked AT THE DESTINATION, never on the
       route. Trigger rendering where you land. */
    /* Same exposure, two tabs along: What changed reads SEED and the value-chain
       maps read CHAINMAP, so both are empty if opened before the fetch returns. */
    if(id === 'st-changed') whenDataReady(fillChanged);
    if(id === 'map-page' && typeof renderMap === 'function'){
      whenDataReady(function(){
        try{ renderMap(); }
        catch(e){ if(window.console && console.warn) console.warn('map render failed:', e); }
      });
    }
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

  /* ======================================================================
     DATA MAY NOT BE HERE YET.

     index.html runs loadData().then(init), so a tab can be tapped while that
     request is still in flight — which is exactly what a first paint on a real
     connection looks like. Opening Companies then rendered "Showing 0 companies"
     and NOTHING re-rendered when the data landed: the tab stayed empty until
     some other surface happened to call renderCards().

     Both the 2d and 2e harnesses missed this because both awaited loadData()
     before navigating. They only ever tested the state where data is already
     present, so "open the tab too early" was never a case that existed.

     The signal is the one the hero counts already use: init() writes
     #selftest-chip only after the data resolves, so an observer on that node
     means "data is here" no matter which arrives first. `ready()` at the top of
     this file is NOT that signal — its queue drains at boot.
     ====================================================================== */
  function dataHere(){
    return typeof SEED !== 'undefined' && SEED && Object.keys(SEED).length > 0;
  }
  function whenDataReady(fn){
    if(dataHere()){ fn(); return; }
    var chip = document.getElementById('selftest-chip');
    if(!(chip && window.MutationObserver)) return;
    var mo = new MutationObserver(function(){
      if(!dataHere()) return;
      mo.disconnect();
      fn();
    });
    mo.observe(chip, {childList:true, characterData:true, subtree:true});
    teardown.push(function(){ mo.disconnect(); });
  }

  /* The 107 cards are built lazily — the old UI only built them when you tapped
     "Browse all companies". The Companies tab is that tap now. */
  function fillCompanies(){
    try{
      if(typeof revealCards === 'function') revealCards();
      if(!dataHere()){
        /* Say what is true. "Showing 0 companies" is a factual claim about the
           platform and it was false; this is a claim about the request. */
        var cl = document.getElementById('count-line');
        if(cl) cl.textContent = 'Loading companies\u2026';
        whenDataReady(fillCompanies);
        return;
      }
      if(typeof renderCards === 'function' && typeof SEED !== 'undefined'){
        /* 2e-fix: the Companies TAB is always the full list. It used to inherit
           activeSector from the Sectors tab, so a sector picked once silently
           filtered Companies forever after, with no way back and nothing on
           screen saying why. Sector -> Companies jumps still filter (they call
           renderCards themselves and navigate with go(), not goRoot). */
        renderCards(Object.keys(SEED).map(function(k){ return SEED[k]; }));
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
      + '<h1>Data freshness</h1>'
      + '<p>Everything here comes from a dated row the platform already holds.</p></div>'
      + '<div class="st-page-body" id="st-changed-body"><p class="st-empty">Loading\u2026</p></div>';
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


  /* ======================================================================
     THE HOME HERO (2d)

     The six cards ARE the acid-test chip. They are not a second copy of the
     numbers: fillCounts() reads the six integers out of #selftest-chip's
     RENDERED text, which chipText() in home.js wrote. So the hero cannot
     disagree with the chip, and if the chip goes red the hero says so instead
     of printing counts. Calling runSelfTests() a second time would have been
     simpler and wrong — it would print the acid-test console line twice, and
     that line is one half of the Session W pair.

     WHY A MutationObserver AND NOT A HOOK. story.js boots on DOMContentLoaded;
     init() lands later, after loadData() returns from the network. Session AC
     lost a day to exactly that ordering. An observer does not care which
     arrives first: if the chip already has text we read it now, and if it does
     not we read it the moment it does.
     ====================================================================== */
  var HERO_CARDS = [
    {k:'Companies',         l:'Each one read as a business first',        go:'st-companies', at:'Browse all'},
    {k:'Metric bindings',   l:'Verified numbers, each carrying its date', go:'st-companies', at:'Inside every \u00a74'},
    {k:'Forces',            l:'Live pressures, never forecasts',          go:'st-forces',    at:'Explore forces'},
    {k:'Exposure links',    l:'Which businesses each force touches',      go:'st-forces',    at:'Explore forces'},
    {k:'Value-chain maps',  l:'Who supplies whom, and who owns whom',     go:'map-page',     at:'Open the maps'},
    {k:'Management records',l:'Holding, pledge, capital allocation',      go:'st-companies', at:'Inside every \u00a75'}
  ];

  function countTo(el, target){
    if(!el) return;
    if(reduced() || typeof requestAnimationFrame !== 'function'){ el.textContent = target; return; }
    var t0 = null, D = 900;
    requestAnimationFrame(function step(ts){
      if(t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / D, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if(p < 1) requestAnimationFrame(step);
    });
  }

  /* Read the chip. Six integers, in chipText()'s order, or nothing. */
  function chipCounts(){
    var chip = document.getElementById('selftest-chip');
    if(!chip) return null;
    var txt = chip.textContent || '';
    if(!txt.trim()) return null;
    if(/failing/i.test(txt)) return 'FAIL';
    var nums = txt.match(/\d+/g);
    return (nums && nums.length === 6) ? nums.map(Number) : null;
  }

  function fillCounts(){
    var hero = document.getElementById('st-hero');
    if(!hero) return false;
    var got = chipCounts();
    if(got === null) return false;
    var cards = hero.querySelectorAll('.st-card');
    if(got === 'FAIL'){
      for(var f = 0; f < cards.length; f++){
        var nf = cards[f].querySelector('.st-card-n');
        if(nf) nf.textContent = '\u2014';
      }
      setReadout('failing');
      return true;
    }
    for(var i = 0; i < cards.length && i < got.length; i++){
      countTo(cards[i].querySelector('.st-card-n'), got[i]);
    }
    setReadout('ok');
    return true;
  }

  /* ======================================================================
     FOUR STATES, AND THE DIFFERENCE IS THE WHOLE POINT OF THE PRODUCT.

     Until this fix the hero rendered `0` in all six cards under a GREEN dot
     reading "self-checked on load". When loadData() had failed, that asserted
     two things and both were false: that the self-check had passed, and that
     the platform holds nothing. A visitor could not tell "this database is
     empty" from "I could not reach the database" — on a platform whose entire
     promise is that every number traces to a verified row, that is the most
     damaging thing it can say.

     'loading'  data not back yet        -> dim dot, honest wait, cards at em-dash
     'ok'       chip written, 6 counts   -> green dot, verified date
     'failing'  chip written, but red    -> red dot, self-check failed
     'failed'   loadData() rejected      -> red dot, nothing here is live, retry

     `0` is a claim about the database. An em-dash is the absence of a claim.
     Only 'ok' is allowed to show a number, and only from the rendered chip.
     ====================================================================== */
  function setReadout(state){
    var r = document.getElementById('st-readout');
    if(!r) return;
    if(state === true || state === 'ok'){
      var when = (typeof lastVerifiedLabel === 'function') ? lastVerifiedLabel() : '\u2014';
      r.innerHTML = '<span class="ok">\u25cf</span> self-checked on load \u00b7 last verified ' + when;
      return;
    }
    if(state === false || state === 'failing'){
      r.innerHTML = '<span class="bad">\u25cf</span> self-check failing \u2014 see console';
      return;
    }
    if(state === 'failed'){
      r.innerHTML = '<span class="bad">\u25cf</span> couldn\u2019t reach the data \u2014 nothing on this page is live '
        + '<button type="button" class="st-retry" id="st-retry">Retry</button>';
      var btn = document.getElementById('st-retry');
      if(btn) btn.addEventListener('click', function(){ location.reload(); });
      return;
    }
    r.innerHTML = '<span class="wait">\u25cf</span> loading data\u2026';
  }

  /* index.html already catches the boot rejection and reveals #boot-error, so
     that element becoming visible IS the failure signal — no need to intercept
     the promise or re-run loadData(). Retry is a full reload on purpose:
     calling init() a second time would re-bind every listener it attached. */
  function watchBootFailure(){
    var b = document.getElementById('boot-error');
    if(!b) return;
    function failed(){ return b.style.display && b.style.display !== 'none'; }
    if(failed()){ setReadout('failed'); return; }
    if(!window.MutationObserver) return;
    var mo = new MutationObserver(function(){
      if(!failed()) return;
      setReadout('failed');
      mo.disconnect();
    });
    mo.observe(b, {attributes:true, attributeFilter:['style']});
    teardown.push(function(){ mo.disconnect(); });
  }

  /* RENAMED in 2e-fix. As `revealCards` this shadowed the GLOBAL revealCards()
     in home.js, which story.js's fillCompanies() calls with no argument to
     unhide #cards-area. My version expects `cards`, threw on cards.length, and
     the company list never appeared. Introduced by me in 2d; the 2d harness
     missed it because it called renderCards() directly instead of going through
     fillCompanies(). Distinct names, permanently. */
  function revealHeroCards(cards){
    function show(el, i){
      if(reduced()){ el.classList.add('st-card-in'); return; }
      setTimeout(function(){ el.classList.add('st-card-in'); }, i * 80);
    }
    /* The cards bet visibility on a transition to .st-card-in. If that class is
       never added they are laid out, clickable and INVISIBLE — the Session AC
       defect exactly. So there is no path here that ends without it: no
       IntersectionObserver, reduced motion, or an element already on screen all
       add it, and the observer is only an optimisation on top. */
    if(reduced() || !window.IntersectionObserver){
      for(var i = 0; i < cards.length; i++) cards[i].classList.add('st-card-in');
      return;
    }
    var io = new IntersectionObserver(function(es, ob){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        show(e.target, [].indexOf.call(cards, e.target));
        ob.unobserve(e.target);
      });
    }, {threshold: 0.15});
    for(var j = 0; j < cards.length; j++) io.observe(cards[j]);
    teardown.push(function(){ io.disconnect(); });
  }

  function buildHero(){
    var page = document.getElementById('home-page');
    if(!page || document.getElementById('st-hero')) return;
    var scroll = page.querySelector('.home-scroll') || page;

    var cardHtml = '';
    for(var i = 0; i < HERO_CARDS.length; i++){
      var c = HERO_CARDS[i];
      cardHtml += '<button class="st-card" type="button" data-go="' + c.go + '">'
        + '<div class="st-card-k">' + c.k + '</div>'
        + '<div class="st-card-n">\u2014</div>'   // never 0: see setReadout
        + '<div class="st-card-l">' + c.l + '</div>'
        + '<div class="st-card-go">' + c.at + ' \u2192</div></button>';
    }

    var hero = document.createElement('div');
    hero.className = 'st-hero';
    hero.id = 'st-hero';
    hero.innerHTML =
        '<div class="st-glow" aria-hidden="true"></div>'
      + '<h1 class="st-h1"><b>Understand the business,</b>not the ticker.</h1>'
      + '<p class="st-lede">107 Indian listed companies, read as businesses \u2014 what they actually do, '
      + 'where they sit in their value chain, and which real-world forces move them.</p>'
      + '<div class="st-search">'
      +   '<div class="st-sbox">'
      +     '<input id="st-q" type="text" autocomplete="off" spellcheck="false" '
      +       'aria-label="Search companies, sectors, forces and value chains" '
      +       'placeholder="Search a company, sector, force or value chain">'
      +     '<span class="st-skey" aria-hidden="true">/</span>'
      +   '</div>'
      +   '<div class="st-res" id="st-res" role="listbox"></div>'
      + '</div>'
      + '<div class="st-cards" id="st-cards">' + cardHtml + '</div>'
      + '<div class="st-readout" id="st-readout"></div>';

    scroll.insertBefore(hero, scroll.firstChild);

    /* The aperture is MOVED, not copied. One element, its animations intact. */
    var ap = page.querySelector('.hero .logo-scene');
    if(ap) hero.insertBefore(ap, hero.firstChild);

    var cards = hero.querySelectorAll('.st-card');
    for(var k = 0; k < cards.length; k++){
      (function(b){
        b.addEventListener('click', function(){ goRoot(b.getAttribute('data-go')); });
      })(cards[k]);
    }
    /* Reveal is INDEPENDENT of the counts. If data never arrives the cards
       still appear, showing an honest dash, rather than an invisible grid. */
    revealHeroCards(cards);
    setReadout('loading');   // nothing is verified until the chip says so
    watchBootFailure();

    wireSearch();

    /* counts now if the chip is already written, otherwise the moment it is */
    if(!fillCounts()){
      var chip = document.getElementById('selftest-chip');
      if(chip && window.MutationObserver){
        var mo = new MutationObserver(function(){ if(fillCounts()) mo.disconnect(); });
        mo.observe(chip, {childList:true, characterData:true, subtree:true});
        teardown.push(function(){ mo.disconnect(); });
      }
    }
  }

  /* ---- one box, four kinds of answer ----
     story.js never builds the list. home.js's searchResultsHtml() returns
     finished markup, exactly as company.js returns finished chapter bodies, so
     this file is never handed a company field to mis-handle. */
  function wireSearch(){
    var q = document.getElementById('st-q'), res = document.getElementById('st-res');
    if(!q || !res) return;

    function close(){ res.classList.remove('on'); res.innerHTML = ''; }

    q.addEventListener('input', function(){
      var html = (typeof searchResultsHtml === 'function') ? searchResultsHtml(q.value) : '';
      if(!html){ close(); return; }
      res.innerHTML = html;
      res.classList.add('on');
    });

    res.addEventListener('click', function(e){
      var el = e.target, hit = null;
      while(el && el !== res){
        if(el.classList && el.classList.contains('st-hit')){ hit = el; break; }
        el = el.parentNode;
      }
      if(!hit) return;
      var kind = hit.getAttribute('data-kind'), key = hit.getAttribute('data-key');
      close(); q.value = '';
      if(kind === 'company' && typeof openCompany === 'function') return openCompany(key);
      if(kind === 'force'   && typeof openForce   === 'function') return openForce(key);
      if(kind === 'map')    return goRoot('map-page');
      if(kind === 'sector'){
        try{ activeSector = key; }catch(e2){}
        return goRoot('st-companies');
      }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === '/' && document.activeElement !== q){
        var t = document.activeElement, tag = t && t.tagName;
        if(tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault(); q.focus();
      }
      if(e.key === 'Escape') close();
    });
    document.addEventListener('click', function(e){
      var el = e.target;
      while(el && el.nodeType === 1){
        if(el.classList && el.classList.contains('st-search')) return;
        el = el.parentNode;
      }
      close();
    });
  }

  /* ---- Value chain wears the same chrome as every other tab ----
     #map-page is hand-written in index.html, so it inherits nothing. It gets
     the .st-page class (which carries flex-direction:column inside the layer)
     and an .st-page-head; its own .company-topbar is hidden by CSS rather than
     removed, so flag-off restores it untouched. */
  function dressMapPage(){
    var pg = document.getElementById('map-page');
    if(!pg || pg.querySelector('.st-page-head')) return;
    pg.classList.add('st-page');
    var meta = null;
    for(var i = 0; i < TABS.length; i++) if(TABS[i].id === 'map-page') meta = TABS[i];
    var head = document.createElement('div');
    head.className = 'st-page-head';
    head.innerHTML = '<button class="topbar-back st-page-back" type="button">\u2190 Back</button>'
      + '<h1>' + (meta ? meta.title : 'Value-chain maps') + '</h1>'
      + '<p>' + (meta ? meta.blurb : '') + '</p>';
    pg.insertBefore(head, pg.firstChild);
  }

  /* ---- What changed: the live factors, off Home ----
     buildFactorFeed() lives in home.js and writes into this container. This
     file supplies the box and never reads a company field. */
  function fillChanged(){
    var box = document.getElementById('st-changed-body');
    if(!box || box.getAttribute('data-filled')) return 0;
    if(typeof SEED === 'undefined') return 0;
    /* Two sections, both about currency: how old each company's figures are,
       then what is pushing on those businesses right now. Both are rendered by
       home.js — story.js supplies containers and never reads a company field. */
    box.innerHTML = '<div id="st-fresh-box"></div>'
      + '<h2 class="st-sec-h">Live factors</h2><div id="st-factor-box"></div>';
    var n = 0;
    if(typeof buildFreshness === 'function') n = buildFreshness(document.getElementById('st-fresh-box'));
    if(typeof buildFactorFeed === 'function') buildFactorFeed(document.getElementById('st-factor-box'));
    if(n) box.setAttribute('data-filled', '1');
    return n;
  }

  function boot(){
    if(!on) return;                       // <- the whole rollback, in one line
    document.body.classList.add('story'); // every UI-2 rule is scoped to this
    buildTabs();
    if(typeof IL_SPRITE === 'string' && !document.getElementById('il-sprite')){
      document.body.insertAdjacentHTML('beforeend', IL_SPRITE);   // 2e sprite, once
    }
    dressMapPage();
    buildHero();
    /* 2e: the grids may have rendered in init() before body.story was set on a
       cold load; re-run the (idempotent) decorators so nothing is left bare. */
    if(typeof decorateSectorButtons === 'function') decorateSectorButtons();
    if(typeof decorateForceButtons === 'function') decorateForceButtons();
    if(typeof decorateCompanyCards === 'function') decorateCompanyCards();
    if(typeof decorateCompareButtons === 'function') decorateCompareButtons();
    for(var i = 0; i < queue.length; i++){
      try { queue[i](); }
      catch(e){ if(window.console && console.warn) console.warn('story step failed:', e); }
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return { enabled: on, reduced: reduced, ready: ready, chapters: chapters, SPY: SPY,
           buildHero: buildHero, fillCounts: fillCounts, chipCounts: chipCounts,
           fillChanged: fillChanged, dressMapPage: dressMapPage, HERO_CARDS: HERO_CARDS,
           onNavigate: onNavigate, back: back, goRoot: goRoot, TABS: TABS,
           syncCompaniesHead: syncCompaniesHead,
           trail: function(){ return trail.slice(); } };
})();
