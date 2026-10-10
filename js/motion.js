/* Presentation only. Content is never hidden while waiting for motion. */
(function(){
  'use strict';
  if(!CONFIG.storyMode||!CONFIG.clarityMode) return;
  STORY.ready(function(){
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),paused=false,queued=false,seen=new WeakSet(),animations=new Set();
    var button=document.createElement('button');button.type='button';button.className='motion-toggle';
    document.querySelector('.st-bezel-in').appendChild(button);
    function sync(){var stopped=paused||reduced.matches;document.body.classList.toggle('motion-paused',stopped);button.textContent=stopped?'Enable motion':'Pause motion';button.setAttribute('aria-pressed',String(stopped));button.setAttribute('aria-label',reduced.matches?'Motion is disabled by your device preference':stopped?'Enable animations':'Pause animations');button.disabled=reduced.matches;if(stopped){animations.forEach(function(a){a.cancel();});animations.clear();}}
    button.onclick=function(){paused=!paused;sync();};reduced.addEventListener('change',sync);sync();
    // A schematic, not a financial chart or a measured flow.
    var note=document.querySelector('.cl-home-note');if(note) note.insertAdjacentHTML('afterbegin','<svg class="orbit-graphic" viewBox="0 0 260 95" aria-hidden="true"><path class="orbit-path" d="M25 44 C70 -5 100 95 135 44 S205 0 235 44 M25 44H235"/><path class="orbit-stream" d="M25 44 C70 -5 100 95 135 44 S205 0 235 44"/><circle cx="25" cy="44" r="8"/><circle cx="135" cy="44" r="12"/><circle cx="235" cy="44" r="8"/><text x="4" y="80">World</text><text x="111" y="80">Business</text><text x="211" y="80">Activity</text></svg>');
    if(!window.IntersectionObserver) return;
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting) return;observer.unobserve(entry.target);if(paused||reduced.matches||!entry.target.animate) return;var a=entry.target.animate([{opacity:.65,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:440,easing:'cubic-bezier(.2,.75,.25,1)'});animations.add(a);a.onfinish=function(){animations.delete(a);};});},{threshold:.06});
    function scan(){queued=false;document.querySelectorAll('.cl-company-card,.cl-panel,.bk-insight,.signal-card,.bk-sector-briefs article,.vc-node,.frc-co,.sector-btn').forEach(function(el){if(seen.has(el)) return;seen.add(el);observer.observe(el);});}
    new MutationObserver(function(records){
      records.forEach(function(record){record.removedNodes.forEach(function(node){if(node.nodeType!==1) return;observer.unobserve(node);node.querySelectorAll('.cl-company-card,.cl-panel,.bk-insight,.signal-card,.bk-sector-briefs article,.vc-node,.frc-co,.sector-btn').forEach(function(el){observer.unobserve(el);});});});
      if(!queued){queued=true;queueMicrotask(scan);}
    }).observe(document.body,{childList:true,subtree:true});scan();
  });
})();
