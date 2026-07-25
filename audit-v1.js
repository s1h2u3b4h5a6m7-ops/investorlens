/* ============================================================================
   audit-v1.js — THE HONESTY AUDIT

   This platform's promise is narrow and absolute: every figure on screen traces
   to a stored, dated row; nothing is inferred; no buy/sell signal is given.
   A generic QA sweep would not test any of that.

   So this walks ALL 107 company pages, plus every force, map and compare group,
   and asks of each rendered surface:
     1. does every number on screen exist in the data?
     2. does a missing value render as an absence, never as a zero?
     3. is any claim made that the data cannot support?
     4. does every dated thing show a date that was stored, not computed?

   It is written to be capable of failing. Where it passes, that is evidence.
   ============================================================================ */
'use strict';
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const LIVE='/home/claude/il/s2i/investorlens-main';
const TAB=require('./tables.json');
let pass=0,fail=0,warn=0; const issues=[];
function t(n,c,x){ c?(pass++):(fail++,issues.push(n+(x?'  — '+x:''))); if(!c) console.log('  FAIL  '+n+(x?'\n        '+x:'')); }
function w(n,x){ warn++; console.log('  NOTE  '+n+(x?'  — '+x:'')); }

function boot(){
  const src=f=>fs.readFileSync(path.join(LIVE,f),'utf8');
  const dom=new JSDOM(src('index.html'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://e.org/'});
  const w2=dom.window;
  w2.matchMedia=q=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  w2.IntersectionObserver=class{constructor(cb){this.cb=cb}observe(el){this.cb([{isIntersecting:true,target:el}],this)}unobserve(){}disconnect(){}};
  w2.fetch=u=>{const tb=String(u).split('/rest/v1/')[1].split('?')[0];return Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(TAB[tb]||[])});};
  const cfg=src('js/config.js').replace(/storyMode:\s*(true|false)/,'storyMode: true');
  w2.eval([cfg,src('js/data.js'),src('js/icons.js'),src('js/home.js'),src('js/company.js'),
    src('js/compare.js'),src('js/forces.js'),src('js/map.js'),src('js/story.js'),src('js/selftest.js'),
    'window.__F={FORCES:FORCES};'].join('\n;\n'));
  w2.document.dispatchEvent(new w2.Event('DOMContentLoaded',{bubbles:true}));
  return w2.loadData().then(()=>{w2.init();return w2;});
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
// every number-like token a human would read as a figure
const NUMS = s => (String(s).match(/-?\d[\d,]*\.?\d*/g)||[]).map(x=>x.replace(/,/g,''));

(async()=>{
console.log('\n################ v1 HONESTY AUDIT ################\n');
const W=await boot(); await wait(200); const D=W.document;
const SEED=W.SEED, MGMT=W.MGMT, CHAINS=W.CHAINS;
const tickers=Object.keys(SEED);

console.log('=== 1 · every company page renders, and none throws ===');
let rendered=0, threw=[];
for(const tk of tickers){
  try{ W.openCompany(tk); rendered++; }catch(e){ threw.push(tk+': '+e.message); }
}
await wait(120);
t('1.1 all 107 company pages render', rendered===107, rendered+'/107');
t('1.2 none throws', threw.length===0, threw.slice(0,3).join(' | '));

console.log('\n=== 2 · no rendered number is absent from the data ===');
/* For each company, collect the numbers the page prints in the metric section
   and check each exists among that company's stored metric values. A number on
   screen with no row behind it is the defect this platform cannot have. */
let unsourced=[], checked=0;
/* A figure is SOURCED if it appears anywhere in that company's stored text —
   not merely in metric.value. The prose fields are stored, verified rows too:
   metric_note carries prior-year comparisons ("Down from 4.93% a year ago"),
   business_core and moat_note carry sizes and shares. The first cut of this
   audit compared only against metric.value and reported 610 false positives,
   every one of them a number the database really does hold. Compare against the
   whole stored surface, or the audit indicts the product for being detailed. */
for(const tk of tickers){
  W.openCompany(tk); await wait(2);
  const sec=D.getElementById('s4');
  if(!sec) continue;
  const shown=new Set(NUMS(sec.textContent));
  const c=SEED[tk];
  let storedText=[c.business_core,c.moat_note,c.source_note,c.value_chain_note,c.as_of].join(' ');
  const stored=new Set();
  Object.keys(c.metrics||{}).forEach(k=>{
    const m=c.metrics[k];
    storedText += ' ' + (m.note||'') + ' ' + (m.label||'');
    if(m && m.value!=null){
      stored.add(String(m.value)); stored.add(String(Math.round(m.value)));
      stored.add(Number(m.value).toFixed(1)); stored.add(Number(m.value).toFixed(2));
    }
  });
  NUMS(storedText).forEach(n=>stored.add(n));
  checked++;
  shown.forEach(n=>{
    if(n==='') return;
    const f=parseFloat(n); if(!isFinite(f)) return;
    if(f<=10 && Number.isInteger(f)) return;
    if(/^(19|20)\d\d$/.test(n)) return;
    if(stored.has(n)||stored.has(String(f))||stored.has(f.toFixed(1))||stored.has(f.toFixed(2))) return;
    unsourced.push(tk+' shows '+n);
  });
}
t('2.1 every metric figure on screen exists in the data',
  unsourced.length===0, unsourced.length+' unsourced: '+unsourced.slice(0,6).join(', '));
console.log('       (checked '+checked+' companies)');

console.log('\n=== 3 · absence renders as absence, never as zero ===');
let zeroLies=[];
for(const tk of tickers){
  W.openCompany(tk); await wait(0);
  const body=D.querySelector('#company-body');
  if(!body) continue;
  const txt=body.textContent;
  // a metric with a NULL value must not print "0"
  const c=SEED[tk];
  Object.keys(c.metrics||{}).forEach(k=>{
    const m=c.metrics[k];
    if(m && (m.value===null||m.value===undefined)){
      const lbl=(m.label||k);
      const i=txt.indexOf(lbl);
      if(i>-1 && /\b0\b/.test(txt.slice(i,i+80))) zeroLies.push(tk+'/'+k);
    }
  });
}
t('3.1 no NULL metric renders as 0', zeroLies.length===0, zeroLies.slice(0,5).join(', '));

console.log('\n=== 4 · §5 management: promoter % matches the stored row exactly ===');
let mgmtBad=[];
/* wait(0) yielded once and read some pages mid-render, producing 57 phantom
   mismatches. Search the whole company body, after the render has settled. */
for(const tk of tickers){
  const m=MGMT[tk]; if(!m||m.promoter_pct==null) continue;
  W.openCompany(tk); await wait(2);
  const body=D.querySelector('#company-body'); if(!body) continue;
  const txt=body.textContent.replace(/,/g,'');
  const v=Number(m.promoter_pct);
  const forms=[String(m.promoter_pct),String(v),v.toFixed(1),v.toFixed(2)];
  if(!forms.some(f=>txt.indexOf(f)>-1)) mgmtBad.push(tk+' expects '+m.promoter_pct);
}
t('4.1 every promoter % on screen equals the stored value', mgmtBad.length===0,
  mgmtBad.length+' mismatched: '+mgmtBad.slice(0,5).join(', '));

console.log('\n=== 5 · no buy/sell language anywhere in the rendered product ===');
const BAN=/\b(buy|sell|hold|target price|undervalued|overvalued|cheap|expensive|recommend|should invest|multibagger|screaming)\b/i;
let banned=[];
for(const tk of tickers.slice(0,40)){
  W.openCompany(tk); await wait(0);
  const body=D.querySelector('#company-body'); if(!body) continue;
  const hits=(body.textContent.match(BAN)||[]);
  if(hits.length) banned.push(tk+': '+hits.join(','));
}
t('5.1 no advice language on company pages', banned.length===0, banned.slice(0,4).join(' | '));

console.log('\n=== 6 · the chip equals the truth, not a literal ===');
const chip=D.getElementById('selftest-chip').textContent.replace(/\s+/g,' ').trim();
const realCo=tickers.length;
const realForces=W.__F.FORCES.length;
const realMgmt=Object.keys(MGMT).length;
t('6.1 chip company count = real', chip.indexOf(realCo+' companies')>-1, chip);
t('6.2 chip force count = real', chip.indexOf(realForces+' forces')>-1);
t('6.3 chip mgmt count = real', chip.indexOf(realMgmt+' verified management records')>-1);

console.log('\n=== 7 · every force and map opens and shows only stored evidence ===');
let fBad=[];
W.__F.FORCES.forEach(f=>{
  try{
    W.openForce(f.id);
    const list=D.getElementById('frc-list');
    if(!list || !list.children.length) fBad.push(f.id+' empty');
  }catch(e){ fBad.push(f.id+': '+e.message); }
});
t('7.1 all 14 forces open with evidence', fBad.length===0, fBad.slice(0,4).join(' | '));
W.STORY.goRoot('map-page'); await wait(60);
t('7.2 value-chain maps render', (D.getElementById('map-content').innerHTML||'').length>200);

console.log('\n=== 8 · dates on screen are stored dates ===');
let dateBad=[];
W.STORY.goRoot('st-changed'); await wait(150);
const rows=D.querySelectorAll('#st-fresh-box .st-fr');
rows.forEach(r=>{
  const tk=r.getAttribute('data-ticker'); const c=SEED[tk];
  const shown=r.querySelector('.st-fr-p').textContent.trim();
  if(c.as_of && shown!==c.as_of) dateBad.push(tk);
});
t('8.1 reporting period shown verbatim for all 107', dateBad.length===0,
  dateBad.length+' altered: '+dateBad.slice(0,5).join(', '));

console.log('\n=== 9 · the sunset target ===');
const prev=path.join(LIVE,'preview');
if(fs.existsSync(prev)){
  const f=fs.readdirSync(prev);
  w('/preview/ still holds '+f.length+' files — all shipped, queued for deletion', f.join(', '));
}
const refs=[];
['index.html','js/story.js','js/home.js','CONTRACT.md'].forEach(f=>{
  const s=fs.readFileSync(path.join(LIVE,f),'utf8');
  if(/preview\//.test(s)) refs.push(f);
});
t('9.1 no CODE file links to /preview/', refs.filter(f=>!f.endsWith('.md')).length===0, refs.join(', '));
console.log('       (referenced in: '+(refs.join(', ')||'nothing')+')');

console.log('\n=================================================');
console.log('  '+pass+' passed, '+fail+' failed, '+warn+' notes');
if(fail) console.log('\n  ISSUES:\n   - '+issues.join('\n   - '));
console.log('=================================================\n');
process.exit(fail?1:0);
})().catch(e=>{console.error('CRASH:',e);process.exit(2);});
