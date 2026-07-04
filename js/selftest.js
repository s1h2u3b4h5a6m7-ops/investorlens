/* ============================================================================
   InvestorLens India — selftest.js
   Data-integrity self-tests, run on every page load. Same checks as V2.6 — they
   now validate the data loaded from the JSON seed. The result feeds the home chip.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   ============================================================================ */

/* ============ SELF-TESTS ============ */
function runSelfTests(){
  var fails = [];
  function chk(cond,msg){ if(!cond) fails.push(msg); }
  var VALID_T = {risk:1,tailwind:1,neutral:1};
  var metricChecks = 0;
  Object.keys(SEED).forEach(function(t){
    var c = SEED[t];
    chk(c.ticker===t, 'ticker key mismatch: '+t);
    ['name','sector','compare_group','as_of','business_core','source_note','moat_note'].forEach(function(f){ chk(!!c[f], t+': missing '+f); });
    chk(c.value_chain && c.value_chain.position, t+': missing value_chain.position');
    chk(Array.isArray(c.tech_geo_tags) && c.tech_geo_tags.length>=1, t+': no real-time factors');
    (c.tech_geo_tags||[]).forEach(function(x){ chk(VALID_T[x.type], t+': bad factor type "'+x.type+'"'); });
    chk(Array.isArray(c.bull)&&c.bull.length>0 && Array.isArray(c.bear)&&c.bear.length>0, t+': bull/bear missing');
    chk(Array.isArray(c.metric_order)&&c.metric_order.length>0, t+': metric_order empty');
    (c.metric_order||[]).forEach(function(k){
      metricChecks++;
      var m=(c.metrics||{})[k];
      chk(!!m, t+': metric_order key not in metrics: '+k);
      if(m) chk(m.label!==undefined && m.value!==undefined, t+': metric '+k+' missing label/value');
      chk(Object.prototype.hasOwnProperty.call(HIGHER_IS_BETTER,k), t+': "'+k+'" missing from HIGHER_IS_BETTER');
    });
    chk(!!GROUP_LABELS[c.compare_group], t+': compare_group not in GROUP_LABELS: '+c.compare_group);
    chk(typeof MARKET_CAP_CR[t]==='number' && MARKET_CAP_CR[t]>0, t+': missing market cap');
    var ch = CHAINS[t];
    chk(!!ch && (ch.up||[]).length>=1 && (ch.down||[]).length>=1, t+': value-chain nodes missing');
    if(ch) (ch.up||[]).concat(ch.down||[]).forEach(function(n){
      chk(!!n.l, t+': chain node without label');
      if(n.t) chk(VALID_T[n.t], t+': bad chain tag "'+n.t+'"');
    });
  });
  Object.keys(MARKET_CAP_CR).forEach(function(t){ chk(!!SEED[t], 'orphan market-cap ticker: '+t); });
  Object.keys(CHAINS).forEach(function(t){ chk(!!SEED[t], 'orphan chain ticker: '+t); });
  var forceLinks = 0, forceIds = {};
  FORCES.forEach(function(f){
    chk(!!f.id && !!f.label && !!f.blurb && f.re instanceof RegExp, 'force malformed: '+(f.id||'?'));
    chk(!forceIds[f.id], 'duplicate force id: '+f.id); forceIds[f.id]=1;
    var rows = forceMatches(f);
    chk(rows.length >= 1, 'force matches nothing: '+f.id);
    rows.forEach(function(r){ chk(!!SEED[r.ticker], 'force '+f.id+' matched missing ticker '+r.ticker); });
    forceLinks += rows.length;
  });
  var mapLinks = 0, mapChains = 0;
  (typeof CHAINMAP !== 'undefined' ? CHAINMAP : []).forEach(function(ch){
    mapChains++;
    chk(!!ch.title && !!ch.blurb, 'map chain missing title/blurb: '+ch.id);
    if(ch.kind === 'ownership'){
      chk(Array.isArray(ch.pairs) && ch.pairs.length>=1, 'map chain has no pairs: '+ch.id);
      (ch.pairs||[]).forEach(function(p){
        chk(!!SEED[p.parent], 'map '+ch.id+': missing parent '+p.parent);
        chk(!!SEED[p.child], 'map '+ch.id+': missing child '+p.child);
        chk(!!p.note, 'map '+ch.id+': pair missing note');
        mapLinks++;
      });
    } else {
      chk(Array.isArray(ch.stages) && ch.stages.length>=2, 'map chain needs >=2 stages: '+ch.id);
      chk((ch.flows||[]).length === ch.stages.length-1, 'map '+ch.id+': flow labels != gaps');
      (ch.stages||[]).forEach(function(st){
        (st.nodes||[]).forEach(function(n){ if(n.tk){ chk(!!SEED[n.tk], 'map '+ch.id+': missing ticker '+n.tk); mapLinks++; } });
      });
    }
  });
  var mgmtCount = 0;
  Object.keys(typeof MGMT !== 'undefined' ? MGMT : {}).forEach(function(t){
    var m = MGMT[t];
    chk(!!SEED[t], 'orphan MGMT ticker: '+t);
    chk(typeof m.promoter_pct === 'number' && m.promoter_pct >= 0 && m.promoter_pct <= 100, 'MGMT '+t+': promoter_pct out of range');
    ['who','pledge','capital','as_of','src'].forEach(function(f){ chk(!!m[f], 'MGMT '+t+': missing '+f); });
    mgmtCount++;
  });
  var res = { pass: fails.length===0, fails: fails, companies: Object.keys(SEED).length, metricChecks: metricChecks, forces: FORCES.length, forceLinks: forceLinks, mapChains: mapChains, mapLinks: mapLinks, mgmt: mgmtCount };
  if(fails.length) console.warn('[InvestorLens self-tests] FAILURES:', fails);
  else console.log('[InvestorLens self-tests] all checks passed — '+res.companies+' companies, '+metricChecks+' metric bindings, '+FORCES.length+' forces, '+forceLinks+' exposure links, '+mapChains+' value-chain maps, '+mgmtCount+' verified management records');
  return res;
}
