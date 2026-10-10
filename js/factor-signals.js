/* Display the Python-prepared edition. No impact scoring or financial rules. */
var FACTOR_SIGNALS=(function(){
  'use strict';
  var E=BUSINESS_ENGINE,esc=E.escape,edition,pending;
  function prepare(){
    if(edition) return Promise.resolve(edition);
    if(pending) return pending;
    pending=fetch('./data/factor_signals.json').then(function(r){if(!r.ok) throw Error('Factor edition unavailable');return r.json();}).then(function(d){
      if(d.version!==1||!d.as_of||!Array.isArray(d.factors)||d.factors.length!==5) throw Error('Unsupported factor edition');
      edition=d;return d;
    }).finally(function(){pending=null;});return pending;
  }
  function html(d){
    // Expiry is a display guard. All direction and channel rules are in Python.
    var parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    var fields={};parts.forEach(function(p){fields[p.type]=p.value;});var today=fields.year+'-'+fields.month+'-'+fields.day;
    return '<div class="signal-heading"><div><div class="cl-eyebrow">MEASURED MACRO FACTORS</div><h2>What changed in the latest readings?</h2><p>'+esc(d.summary)+'</p></div><span class="cl-tag">Edition '+esc(d.as_of)+'</span></div>'
      +'<div class="signal-grid">'+d.factors.map(function(f){
        var expired=today>f.valid_through||today<d.as_of;
        return '<article class="signal-card"><div class="signal-card-top"><h3>'+esc(f.label)+'</h3><span class="signal-age">'+esc(expired?'Outside 2-day target':f.freshness)+'</span></div><div class="signal-value">'+esc(f.value)+' <small>'+esc(f.unit)+'</small></div><p class="signal-change">'+esc(f.reading)+' · '+esc(f.change)+'</p><p class="signal-dates">'+esc(f.previous_date)+' → '+esc(f.observation_date)+' · Last two observations</p>'
          +f.effects.map(function(e){var signal=expired?'Delayed':e.signal;return '<div class="signal-effect"><span class="signal-badge '+signal.toLowerCase()+'">'+esc(signal)+'</span><div><b>'+esc(e.audience)+'</b><p>'+esc(e.channel)+(signal==='Delayed'?' · '+esc(e.observed_signal)+' in the dated observation':'')+'</p><small>'+esc(e.limit)+'</small></div></div>';}).join('')
          +(f.context?'<p class="signal-context">'+esc(f.context)+'</p>':'')+'<a href="'+esc(E.safeURL(f.source_url)||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(f.source)+' · Observation source ↗</a></article>';
      }).join('')+'</div><p class="cl-note">'+esc(d.boundary)+'</p><details class="cl-evidence"><summary>How these signals are prepared</summary><div class="cl-expert"><p>Only observed values are used; missing dates are not filled. Headwind and tailwind refer to a specific activity, never a share-price forecast or a net company effect. Observations older than two calendar days lose their current signal.</p><p>Collected '+esc(d.collected_at.slice(0,10))+' · Dataset fingerprint '+esc(d.snapshot_sha256)+'</p>'+d.mechanism_sources.map(function(s){return '<p><a href="'+esc(E.safeURL(s.url)||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a></p>';}).join('')+'</div></details>';
  }
  function mount(root){if(!root) return;root.innerHTML='<p class="cl-note" role="status">Loading dated factors…</p>';prepare().then(function(d){if(root.isConnected!==false) root.innerHTML=html(d);}).catch(function(){root.innerHTML='<p role="alert">Measured factors could not be loaded. No signals have been substituted.</p><button type="button" class="signal-retry">Try again</button>';root.querySelector('button').onclick=function(){mount(root);};});}
  function mountSources(root){if(!root) return;prepare().then(function(d){if(root.isConnected===false) return;root.innerHTML='<section class="cl-panel"><div class="cl-eyebrow">FACTOR EDITION · '+esc(d.as_of)+'</div><h2>Dates behind the signals</h2><p class="cl-note">Manually collected '+esc(d.collected_at.slice(0,10))+'. A new collection does not make an older observation current. SBI’s annual source checks are in SBI → Numbers & growth.</p><div class="bk-table-wrap"><table class="bk-table"><thead><tr><th scope="col">Factor / source</th><th scope="col">Latest observation</th><th scope="col">Current badge expires after</th></tr></thead><tbody>'+d.factors.map(function(f){return '<tr><th scope="row"><a href="'+esc(E.safeURL(f.source_url)||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(f.label)+' · '+esc(f.source)+'</a></th><td>'+esc(f.observation_date)+'</td><td>'+esc(f.valid_through)+'</td></tr>';}).join('')+'</tbody></table></div></section>';}).catch(function(){root.innerHTML='<p class="cl-note">The factor source edition could not be loaded.</p>';});}
  return {prepare:prepare,mount:mount,mountSources:mountSources,html:html};
})();
