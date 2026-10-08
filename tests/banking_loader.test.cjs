/* Data-loading boundary tests. This is not browser or visual acceptance. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', name+'.json'), 'utf8'));
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

function fixture(overrides={}) {
  const calls=[], nodes=new Map();
  function node(key) {
    if(!nodes.has(key)) nodes.set(key, {innerHTML:'',open:false,events:{},dataset:{},
      addEventListener(event,fn){this.events[event]=fn;},setAttribute(){},
      querySelectorAll(){return [];},closest(){return {scrollTop:0};},
      insertAdjacentHTML(position,html){this.innerHTML+=html;}});
    return nodes.get(key);
  }
  const context=vm.createContext({Promise,Error,String,Number,Array,Object,isFinite,SEED:{SBIN:{}},
    BUSINESS_ENGINE:{escape:x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),safeURL:url=>/^https:\/\//.test(url)?url:null},
    document:{getElementById:node},
    fetch:async url=>{const name=path.basename(url,'.json');calls.push(name);return {ok:true,json:async()=>overrides[name]||read(name)};}});
  vm.runInContext(fs.readFileSync(path.join(root,'js/banking.js'),'utf8'),context);
  return {calls,node,context};
}

test('default view fetches only a prepared brief',async()=>{
  const f=fixture();f.context.BANKING.open();await flush();
  assert.deepEqual(f.calls,['banking_brief']);
  assert.match(f.node('bk-content').innerHTML,/Loans grew faster than deposits/);
  assert.doesNotMatch(f.node('bk-content').innerHTML,/Correlation|basis points/);
});
test('source details load only after the disclosure opens',async()=>{
  const f=fixture();f.context.BANKING.open();await flush();
  const details=f.node('bk-sources');details.open=true;details.events.toggle.call(details);await flush();
  assert.deepEqual(f.calls,['banking_brief','banking_history','banking_analysis']);
  assert.match(f.node('bk-evidence').innerHTML,/1,66,340/);
  assert.match(f.node('bk-evidence').innerHTML,/Correlation/);
});
test('mismatched source edition is withheld',async()=>{
  const data=read('banking_history');data.collected_at='2000-01-01';
  const f=fixture({banking_history:data});f.context.BANKING.open();await flush();
  const details=f.node('bk-sources');details.open=true;details.events.toggle.call(details);await flush();
  assert.match(f.node('bk-evidence').innerHTML,/different edition/);
  assert.doesNotMatch(f.node('bk-evidence').innerHTML,/<table/);
});
test('prepared prose is escaped as text',async()=>{
  const data=read('banking_brief');data.bank.insights[0].title='<img src=x onerror=alert(1)>';
  const f=fixture({banking_brief:data});f.context.BANKING.open();await flush();
  assert.match(f.node('bk-content').innerHTML,/&lt;img/);
  assert.doesNotMatch(f.node('bk-content').innerHTML,/<img/);
});
test('unsupported brief fails with a retry instead of invented data',async()=>{
  const data=read('banking_brief');data.version=99;
  const f=fixture({banking_brief:data});f.context.BANKING.open();await flush();
  assert.match(f.node('driver-root').innerHTML,/unsupported format/);
  assert.match(f.node('driver-root').innerHTML,/Try again/);
  assert.doesNotMatch(f.node('driver-root').innerHTML,/Loans grew/);
});
