/* ============================================================================
   InvestorLens India — compare.js
   Compare mode: peer-group picker, best-in-class highlight, cards/table toggle.
   GROUP_LABELS lives here (it holds functions, so it is code, not JSON seed).
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   ============================================================================ */

/* ---- peer-group display metadata (contains functions → stays JS) ---- */
const GROUP_LABELS = {
  "Banks": { item: "bank",    count: (n) => `${n} bank${n===1?"":"s"}`, metricsLabel: "Banking" },
  "NBFCs": { item: "NBFC",    count: (n) => `${n} NBFC${n===1?"":"s"}`, metricsLabel: "NBFC" },
  "FMCG":  { item: "company", count: (n) => `${n} FMCG co${n===1?"mpany":"mpanies"}`, metricsLabel: "FMCG" },
  "IT":    { item: "company", count: (n) => `${n} IT co${n===1?"mpany":"mpanies"}`, metricsLabel: "IT Services" },
  "Pharma": { item: "company", count: (n) => `${n} Pharma co${n===1?"mpany":"mpanies"}`, metricsLabel: "Pharma" },
  "Auto":   { item: "automaker", count: (n) => `${n} automaker${n===1?"":"s"}`, metricsLabel: "Auto" },
  "Telecom": { item: "telco", count: (n) => `${n} telco${n===1?"":"s"}`, metricsLabel: "Telecom" },
  "Conglomerate": { item: "conglomerate", count: (n) => `${n} conglomerate${n===1?"":"s"}`, metricsLabel: "Conglomerate" },
  "Oil & Gas": { item: "energy company", count: (n) => `${n} energy co${n===1?"mpany":"mpanies"}`, metricsLabel: "Oil & Gas" },
  "Metals & Mining": { item: "metals company", count: (n) => `${n} metals co${n===1?"mpany":"mpanies"}`, metricsLabel: "Metals & Mining" },
  "Power": { item: "power company", count: (n) => `${n} power co${n===1?"mpany":"mpanies"}`, metricsLabel: "Power" },
  "Cement": { item: "cement company", count: (n) => `${n} cement co${n===1?"mpany":"mpanies"}`, metricsLabel: "Cement" },
  "Consumer Durables": { item: "company", count: (n) => `${n} consumer co${n===1?"mpany":"mpanies"}`, metricsLabel: "Consumer Durables" },
  "Insurance": { item: "insurer", count: (n) => `${n} insurer${n===1?"":"s"}`, metricsLabel: "Insurance" },
  "Healthcare": { item: "hospital operator", count: (n) => `${n} hospital operator${n===1?"":"s"}`, metricsLabel: "Healthcare" },
  "Infra & Capital Goods": { item: "company", count: (n) => `${n} infra/capital goods co${n===1?"mpany":"mpanies"}`, metricsLabel: "Infra & Capital Goods" },
  "Aviation": { item: "airline", count: (n) => `${n} airline${n===1?"":"s"}`, metricsLabel: "Aviation" },
  "Financial Services": { item: "company", count: (n) => `${n} financial services co${n===1?"mpany":"mpanies"}`, metricsLabel: "Financial Services" },
  "Consumer Services": { item: "company", count: (n) => `${n} consumer services co${n===1?"mpany":"mpanies"}`, metricsLabel: "Consumer Services" },
  /* ---- Phase 4: eight groups introduced by the 107-company dataset ---- */
  "Renewable Energy": { item: "renewables company", count: (n) => `${n} renewables co${n===1?"mpany":"mpanies"}`, metricsLabel: "Renewable Energy" },
  "PSU Infrastructure Lenders": { item: "infra lender", count: (n) => `${n} infra lender${n===1?"":"s"}`, metricsLabel: "PSU Infrastructure Lenders" },
  "Capital Goods": { item: "company", count: (n) => `${n} capital goods co${n===1?"mpany":"mpanies"}`, metricsLabel: "Capital Goods" },
  "Realty": { item: "developer", count: (n) => `${n} developer${n===1?"":"s"}`, metricsLabel: "Realty" },
  "Defence & Aerospace": { item: "defence company", count: (n) => `${n} defence co${n===1?"mpany":"mpanies"}`, metricsLabel: "Defence & Aerospace" },
  "Chemicals": { item: "chemicals company", count: (n) => `${n} chemicals co${n===1?"mpany":"mpanies"}`, metricsLabel: "Chemicals" },
  "Auto Components": { item: "component maker", count: (n) => `${n} component maker${n===1?"":"s"}`, metricsLabel: "Auto Components" },
  "IT Services": { item: "company", count: (n) => `${n} IT services co${n===1?"mpany":"mpanies"}`, metricsLabel: "IT Services" },
}

/* ============ COMPARE MODE ============ */
var CMP = { group: null, view: 'cards', selected: {}, pickerGroup: null };

function groupsForCompare(){
  var counts = {};
  Object.values(SEED).forEach(function(c){ counts[c.compare_group] = (counts[c.compare_group]||0)+1; });
  return Object.keys(GROUP_LABELS).filter(function(g){ return (counts[g]||0) >= 2; })
    .map(function(g){ return {g:g, n:counts[g]}; });
}

function dominantGroup(sector){
  var counts = {};
  (SECTORS[sector]||[]).forEach(function(c){ counts[c.compare_group]=(counts[c.compare_group]||0)+1; });
  var best=null, bn=0;
  Object.keys(counts).forEach(function(g){ if(counts[g]>bn){bn=counts[g];best=g;} });
  return best;
}

function openCompare(group){
  var av = groupsForCompare();
  if(!av.length) return;
  CMP.group = av.some(function(x){return x.g===group}) ? group : av[0].g;
  document.getElementById('home-page').classList.remove('active');
  document.getElementById('company-page').classList.remove('active');
  document.getElementById('compare-page').classList.add('active');
  renderCompare();
}

function renderCompare(){
  var g = CMP.group;
  var chipsEl = document.getElementById('cmp-groups');
  chipsEl.innerHTML = groupsForCompare().map(function(x){
    return '<button class="sector-btn'+(x.g===g?' active':'')+'" data-g="'+esc(x.g)+'">'+esc(x.g)+' · '+x.n+'</button>';
  }).join('');
  chipsEl.querySelectorAll('.sector-btn').forEach(function(b){
    b.addEventListener('click', function(){ CMP.group = b.getAttribute('data-g'); renderCompare(); });
  });

  var all = byMarketCapDesc(Object.values(SEED).filter(function(c){return c.compare_group===g}));
  // reset the selection to "all on" whenever the group changes
  if(CMP.pickerGroup !== g){
    CMP.selected = {};
    all.forEach(function(c){ CMP.selected[c.ticker] = true; });
    CMP.pickerGroup = g;
  }

  // company picker — tap to add/remove; never allow fewer than 2 selected
  var pick = document.getElementById('cmp-picker');
  pick.innerHTML = all.map(function(c){
    var on = !!CMP.selected[c.ticker];
    return '<button class="cmp-pick'+(on?' on':'')+'" data-tk="'+esc(c.ticker)+'" title="'+esc(c.name)+'">'+esc(c.ticker)+'</button>';
  }).join('');
  pick.querySelectorAll('.cmp-pick').forEach(function(b){
    b.addEventListener('click', function(){
      var tk = b.getAttribute('data-tk');
      var onCount = Object.keys(CMP.selected).filter(function(k){return CMP.selected[k];}).length;
      if(CMP.selected[tk] && onCount<=2) return; // keep at least two to compare
      CMP.selected[tk] = !CMP.selected[tk];
      renderCompare();
    });
  });

  var cos = all.filter(function(c){ return CMP.selected[c.ticker]; });
  var lbl = (GROUP_LABELS[g]||{}).metricsLabel || g;
  document.getElementById('cmp-title').textContent = lbl + ' — ' + cos.length + ' of ' + all.length + ' companies side by side';
  document.getElementById('cmp-sub').textContent = 'Best value per metric in cyan · "—" = not disclosed that way by this company · as of ' + ((cos[0]&&cos[0].as_of)||'Q4 FY26');

  var keys = [], seen = {};
  cos.forEach(function(c){ (c.metric_order||[]).forEach(function(k){ if(!seen[k]){seen[k]=1;keys.push(k);} }); });

  var content = document.getElementById('cmp-content');
  content.innerHTML = (CMP.view==='cards') ? cmpCards(cos,keys) : cmpTable(cos,keys);
  requestAnimationFrame(function(){
    content.querySelectorAll('.cmp-bar').forEach(function(b){ b.style.width = b.getAttribute('data-w')+'%'; });
  });
  document.querySelectorAll('#cmp-toggle button').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-view')===CMP.view);
  });
}

function metricMeta(cos,k){
  var label=null, unit='';
  cos.some(function(c){ var m=(c.metrics||{})[k]; if(m){label=m.label||k; unit=m.unit||''; return true;} return false; });
  return { label: label||k, unit: unit };
}

function bestTicker(cos,k){
  var dir = HIGHER_IS_BETTER[k];
  if(dir !== true && dir !== false) return null;
  var best=null, bv=null;
  cos.forEach(function(c){
    var m=(c.metrics||{})[k];
    if(!m || typeof m.value !== 'number') return;
    if(bv===null || (dir===true ? m.value>bv : m.value<bv)){ bv=m.value; best=c.ticker; }
  });
  return best;
}

function cmpCards(cos,keys){
  if(!keys.length) return '<div class="soon">No comparable metrics recorded for this group.</div>';
  return '<div class="cmp-grid">'+keys.map(function(k,ki){
    var meta = metricMeta(cos,k);
    var dir = HIGHER_IS_BETTER[k];
    var best = bestTicker(cos,k);
    var maxAbs = 0;
    cos.forEach(function(c){ var m=(c.metrics||{})[k]; if(m&&typeof m.value==='number') maxAbs=Math.max(maxAbs,Math.abs(m.value)); });
    var rows = cos.map(function(c){
      var m=(c.metrics||{})[k];
      var has = m && typeof m.value==='number';
      var w = (has && maxAbs) ? Math.max(3, Math.abs(m.value)/maxAbs*100) : 0;
      var neg = has && m.value < 0;
      return '<div class="cmp-row'+(best===c.ticker?' best':'')+(neg?' cmp-neg':'')+'" title="'+esc(c.name)+'">'
        + '<div class="cmp-co">'+esc(c.ticker)+'</div>'
        + '<div class="cmp-bar-wrap"><div class="cmp-bar" data-w="'+w.toFixed(1)+'"></div></div>'
        + '<div class="cmp-val">'+(has ? (m.value+(meta.unit?' '+esc(meta.unit):'')) : '—')+'</div>'
        + '</div>';
    }).join('');
    var flag = (dir===true) ? 'higher is better' : (dir===false) ? 'lower is better' : 'context metric — shown, not ranked';
    return '<div class="cmp-card fade-item" style="animation-delay:'+(ki*45)+'ms">'
      + '<div class="cmp-card-title">'+esc(meta.label)+'</div>'
      + '<div class="cmp-card-note">'+flag+'</div>'
      + rows + '</div>';
  }).join('')+'</div>';
}

function cmpTable(cos,keys){
  if(!keys.length) return '<div class="soon">No comparable metrics recorded for this group.</div>';
  var head = '<tr><th>Metric</th>'+cos.map(function(c){return '<th class="num" title="'+esc(c.name)+'">'+esc(c.ticker)+'</th>';}).join('')+'</tr>';
  var body = keys.map(function(k){
    var meta = metricMeta(cos,k);
    var best = bestTicker(cos,k);
    var dir = HIGHER_IS_BETTER[k];
    var cells = cos.map(function(c){
      var m=(c.metrics||{})[k];
      var has = m && m.value!==null && m.value!==undefined;
      return '<td class="num'+(best===c.ticker?' best':'')+'">'+(has ? (esc(String(m.value))+(m.unit?' '+esc(m.unit):'')) : '—')+'</td>';
    }).join('');
    var tag = (dir===true||dir===false) ? '' : ' <span class="cmp-flag">(context)</span>';
    return '<tr><td class="rowlab">'+esc(meta.label)+tag+'</td>'+cells+'</tr>';
  }).join('');
  return '<div class="cmp-table-wrap"><table class="mtable"><thead>'+head+'</thead><tbody>'+body+'</tbody></table></div>';
}
