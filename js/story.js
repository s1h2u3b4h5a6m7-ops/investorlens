/* ============================================================================
   InvestorLens India — story.js
   THE UI-2 LAYER. Session AA (24 Jul 2026) lays the foundation only: this file
   decides whether the storytelling UI is switched on, and does nothing else
   yet. Chapters, the scroll spine, the hero and the tabs arrive in 2b-2f and
   all of them hang off what is here.

   The one rule this file exists to enforce:

     If CONFIG.storyMode is false, story.js MUST NOT touch the page.

   Not "touch it a little". Not "add a harmless class". Nothing. That is what
   makes the switch a real way back rather than a hopeful one — with the flag
   off, the site is byte-for-byte the site you had before UI-2 existed, and the
   harness proves it rather than assuming it.

   Load order matters: this file runs AFTER home.js so the router exists, and
   BEFORE selftest.js so the chip is still the last word on the page.
   ============================================================================ */

var STORY = (function(){

  // Is the switch on? Read defensively: if config.js were ever missing or the
  // key removed, we fall back to OFF, because off is the safe direction.
  var on = !!(typeof CONFIG !== 'undefined' && CONFIG && CONFIG.storyMode === true);

  /* Does this person's device ask software to stop moving things around?
     Some people get motion sickness or migraines from animation, and both
     phones and desktops have a system setting for it. Honouring it is not
     optional. home.js already has reducedMotion(); this mirrors it so story.js
     can stand alone if it is ever loaded without home.js. */
  function reduced(){
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Later sessions register their setup here instead of each one attaching its
     own listener. One queue, run once, in the order things were added — the
     same lesson as the router: five copies of a rule are not a rule. */
  var queue = [];
  function ready(fn){ if(typeof fn === 'function') queue.push(fn); }

  function boot(){
    if(!on) return;                       // <- the whole rollback, in one line
    document.body.classList.add('story'); // every UI-2 rule is scoped to this
    for(var i = 0; i < queue.length; i++){
      try { queue[i](); }
      catch(e){ if(window.console && console.warn) console.warn('story step failed:', e); }
    }
  }

  // Scripts sit at the end of index.html, so the body already exists. Guard the
  // other case anyway — a foundation that assumes its own timing is a trap.
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return { enabled: on, reduced: reduced, ready: ready };
})();
