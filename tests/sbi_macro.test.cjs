/* Prepared chart rendering, expiry and async boundaries. Not browser acceptance. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=()=>JSON.parse(fs.readFileSync(path.join(root,'data/sbi_macro_brief.json'),'utf8'));
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));};
function fixture({data=read(),when='2026-10-10',fail=false}={}){
 const calls=[],button={dataset:{sbiView:'2'}};
 const target={innerHTML:'',isConnected:true,querySelector(){return {};},querySelectorAll(){return [button];}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[when+'T12:00:00Z']));}}
 const ctx=vm.createContext({Date:Clock,Promise,Error,String,Number,Array,Object,isFinite,
  BUSINESS_ENGINE:{escape:x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),safeURL:url=>/^https:\/\//.test(url)?url:null},
  fetch:async()=>({ok:!fail,json:async()=>data}),openCompany:(...args)=>calls.push(args)});
 vm.runInContext(fs.readFileSync(path.join(root,'js/sbi-macro.js'),'utf8'),ctx);
 return {ctx,target,button,calls};
}
test('dependencies draw measured charts and qualified bond signals',async()=>{
 const f=fixture();f.ctx.SBI_MACRO.mount(f.target,'full');await flush();
 const html=f.target.innerHTML;
 assert.match(html,/Repo 5.50%/);assert.match(html,/3.57% → 3.35%/);
 assert.match(html,/₹1,746 crore/);assert.match(html,/Scenario only/);
 assert.match(html,/role="img"/);assert.match(html,/100 basis points = 1 percentage point/);
 assert.match(html,/Market value, not realized loss or net profit/);
 assert.doesNotMatch(html,/NaN|undefined/);
});
test('treasury section draws labelled allocation doughnuts and yield bars',async()=>{
 const f=fixture();f.ctx.SBI_MACRO.mount(f.target,'treasury');await flush();
 assert.match(f.target.innerHTML,/stroke-dasharray/);
 assert.match(f.target.innerHTML,/74.81%/);assert.match(f.target.innerHTML,/14.54%/);
 assert.match(f.target.innerHTML,/Government bonds &amp; bills/);
 assert.match(f.target.innerHTML,/7.13%/);assert.match(f.target.innerHTML,/6.93%/);
 assert.doesNotMatch(f.target.innerHTML,/sm-factor-grid/);
});
test('overview keeps compact signal cards and no raw tables or formula',async()=>{
 const f=fixture();f.ctx.SBI_MACRO.mount(f.target,'summary');await flush();
 assert.match(f.target.innerHTML,/sm-factor-grid/);assert.match(f.target.innerHTML,/Not established/);
 assert.doesNotMatch(f.target.innerHTML,/<table|Approximate value change|<svg/);
});
test('expired edition withholds current readings and badges',async()=>{
 const f=fixture({when:'2026-10-13'});f.ctx.SBI_MACRO.mount(f.target,'full');await flush();
 assert.match(f.target.innerHTML,/Refresh needed/);
 assert.doesNotMatch(f.target.innerHTML,/Repo 5.50%|7.2898% government-bond yield/);
 assert.match(f.target.innerHTML,/hypothetical scenarios below remain historical/);
 assert.match(f.target.innerHTML,/3.57% → 3.35%/);
});
test('unsupported data or fetch failure never supplies a replacement signal',async()=>{
 for(const options of [{data:{version:88}}, {fail:true}]){
  const f=fixture(options);f.ctx.SBI_MACRO.mount(f.target);await flush();
  assert.match(f.target.innerHTML,/No signal has been substituted/);
  assert.doesNotMatch(f.target.innerHTML,/sm-factor-grid|Tailwind/);
 }
});
test('delayed request cannot replace a detached company panel',async()=>{
 const f=fixture();f.ctx.SBI_MACRO.mount(f.target);f.target.isConnected=false;await flush();
 assert.match(f.target.innerHTML,/Loading/);assert.doesNotMatch(f.target.innerHTML,/₹1,746/);
});
test('source prose and chart labels are escaped',async()=>{
 const data=read();data.charts[0].bars[0].description='<img src=x onerror=bad()>';
 data.cards[0].title='<script>bad()</script>';
 const f=fixture({data});f.ctx.SBI_MACRO.mount(f.target);await flush();
 assert.match(f.target.innerHTML,/&lt;script&gt;/);assert.match(f.target.innerHTML,/&lt;img/);
 assert.doesNotMatch(f.target.innerHTML,/<script>|<img/);
});
test('World factors relation retains both sides and unknown net effect',async()=>{
 const f=fixture();f.ctx.SBI_MACRO.mount(f.target,'relationship');await flush();
 assert.match(f.target.innerHTML,/Potential tailwind/);assert.match(f.target.innerHTML,/Potential headwind/);
 assert.match(f.target.innerHTML,/Loan income/);assert.match(f.target.innerHTML,/Funding cost/);
 assert.match(f.target.innerHTML,/net effect not established/);
 assert.doesNotMatch(f.target.innerHTML,/3.57%|Repo 5.50%/);
 f.button.onclick();assert.deepEqual(f.calls,[['SBIN',2]]);
});
