'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const E = require('../js/driver-engine.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function close(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);}
const zero={brent:0,jet:0,inr:0,yield:0,yen:0};
const raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/business_factors.json'),'utf8'));
const cutoff=new Date().toISOString().slice(0,10);
const ctx=E.context(raw,cutoff);
const target=E.changes(ctx,ctx.days.length-1);
function copy(){return JSON.parse(JSON.stringify(raw));}
test('Fuel and currency compound, rather than add',()=>close(E.fuelProxy({...zero,jet:15,inr:3}),18.45));
test('Crude, yields and yen cannot double-count the fuel result',()=>close(E.fuelProxy({...zero,jet:15,inr:3,brent:20,yield:50,yen:10}),18.45));
test('Opposite fuel and FX movements can offset each other',()=>close(E.fuelProxy({...zero,jet:-10,inr:10}),-1));
test('Reject missing, infinite and impossible scenario inputs',()=>{
  assert.throws(()=>E.fuelProxy({...zero,jet:-100}));assert.throws(()=>E.fuelProxy({...zero,inr:NaN}));
  assert.throws(()=>E.fuelProxy({jet:1}));assert.throws(()=>E.fuelProxy({...zero,yield:Infinity}));
});
test('Correct yield basis points and inverse yen quote',()=>{
  const fixture={schema_version:1,series:E.FACTORS.map(f=>({key:f.key,observations:Array.from({length:21},(_,i)=>{
    const day=new Date(Date.UTC(2024,0,i+1)).toISOString().slice(0,10);
    return [day,f.key==='yield'?4+i*.025:f.key==='yen'?150-i*.75:100+i];
  })}))};
  const c=E.context(fixture,'2024-01-21'), v=E.changes(c,20).vector;
  close(v.yield,50);close(v.yen,(150/135-1)*100);close(v.brent,20);
});
test('Date replay only uses observations at or before cutoff',()=>{
  const replay=E.context(raw,'2024-08-05');
  assert.ok(replay.days.every(d=>d<='2024-08-05'));
  assert.ok(E.changes(replay,replay.days.length-1).end<='2024-08-05');
  assert.ok(E.historicalLink(replay,E.changes(replay,replay.days.length-1)).last<'2024-08-05');
});
test('No gap filling: a missing factor date leaves the shared timeline',()=>{
  const r=copy(),missing=r.series[1].observations.findIndex(x=>x[0]===target.end);
  r.series[1].observations.splice(missing,1);assert.ok(!E.context(r,'2026-10-07').days.includes(target.end));
});
test('Reject missing series, duplicates, non-numbers and impossible dates',()=>{
  let r=copy();r.series.pop();assert.throws(()=>E.context(r,'2026-10-07'));
  r=copy();r.series[0].observations.push(r.series[0].observations[0]);assert.throws(()=>E.context(r,'2026-10-07'));
  r=copy();r.series[0].observations[0][1]='1';assert.throws(()=>E.context(r,'2026-10-07'));
  r=copy();r.series[0].observations[0][0]='2024-02-31';assert.throws(()=>E.context(r,'2026-10-07'));
  assert.throws(()=>E.context(raw,'2026-13-07'));assert.throws(()=>E.context(raw,'2018-01-02'));
});
test('Analogue windows are earlier and do not overlap each other',()=>{
  const matches=E.analogues(ctx,target,{brent:20,jet:15,inr:3,yield:50,yen:0});
  assert.equal(matches.length,3);assert.ok(matches.every(m=>m.end<target.start));
  matches.forEach((a,i)=>matches.slice(i+1).forEach(b=>assert.ok(a.end<b.start || a.start>b.end)));
  const replay=E.context(raw,ctx.days[20]);assert.deepEqual(E.analogues(replay,E.changes(replay,20),zero),[]);
});
test('Distance is symmetric, deterministic and zero for equal vectors',()=>{
  const changed={...zero,jet:10};close(E.distance(zero,zero),0);
  close(E.distance(changed,zero),Math.sqrt(1/5));close(E.distance(changed,zero),E.distance(zero,changed));
  assert.deepEqual(E.analogues(ctx,target,zero),E.analogues(ctx,target,zero));
});
test('Correlation distinguishes co-movement, inversion and insufficient variation',()=>{
  close(E.correlation([[1,2],[2,4],[3,6]]),1);close(E.correlation([[1,-2],[2,-4],[3,-6]]),-1);
  assert.equal(E.correlation([[1,1],[1,2],[1,3]]),null);assert.equal(E.correlation([[1,1]]),null);
  const result=E.historicalLink(ctx,target);assert.ok(result.n>80);assert.ok(result.r>=-1 && result.r<=1);
  assert.ok(result.same>=0 && result.same<=1);assert.ok(result.last<target.start);
});
test('Headline rules discard future, undated, duplicate and malformed records',()=>{
  const rows=[{title:'Jet fuel costs',date:'2024-01-02',url:'https://example.com/a'},
    {title:'Duplicate oil story',date:'2024-01-02',url:'https://example.com/a'},
    {title:'Oil tomorrow',date:'2024-02-01'}, {title:'Oil undated'}, {title:'Oil bad date',date:7},
    {title:'Yen stress',date:'2024-01-03',url:'javascript:alert(1)'},
    {title:'Unrelated passenger announcement',date:'2024-01-02'}];
  const news=E.matchNews(rows,'2024-01-03');assert.equal(news.length,2);
  assert.equal(news[0].url,null);assert.deepEqual(news[1].hits,['Jet fuel']);
});
test('Untrusted text is escaped and unsafe source links are rejected',()=>{
  assert.equal(E.escape('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(E.safeURL('javascript:alert(1)'),null);assert.equal(E.safeURL('http://example.com'),null);
  assert.equal(E.safeURL('https://name:secret@example.com'),null);
  assert.equal(E.safeURL('https://example.com/a'),'https://example.com/a');
});
test('Snapshot has real multi-year, dated, sorted official series',()=>{
  assert.equal(raw.series.length,5);
  raw.series.forEach(s=>{assert.ok(s.observations.length>2000);assert.equal(s.first,s.observations[0][0]);
    assert.equal(s.latest,s.observations.at(-1)[0]);assert.ok(s.url.startsWith('https://fred.stlouisfed.org/series/'));
    assert.ok(s.observations.every((r,i)=>r[0]<=raw.collected_at.slice(0,10) && (!i || r[0]>s.observations[i-1][0])));
  });assert.ok(ctx.days.at(-1)<=raw.series.map(s=>s.latest).sort()[0]);
});
test('Coverage labels do not claim the missing 35 factors are connected',()=>{
  const registry=E.REGISTRY.flatMap(g=>g[1]);assert.equal(registry.length,40);
  assert.equal(new Set(registry).size,40);assert.equal(E.CONNECTED.length,5);
  assert.ok(E.CONNECTED.every(f=>registry.includes(f)));assert.ok(!E.CONNECTED.includes('Yen carry-trade positions'));
});
test('Story-off rollback causes the drivers module to touch nothing',()=>{
  const log=[];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/drivers.js'),'utf8'),{
    STORY:{enabled:false}, document:new Proxy({}, {get:()=>{log.push('DOM');throw Error('DOM touched');}})
  });assert.deepEqual(log,[]);
});
console.log(`${passed} business-driver tests passed`);
console.log(JSON.stringify({sharedDates:ctx.days.length,window:target,historicalLink:E.historicalLink(ctx,target)},null,2));
