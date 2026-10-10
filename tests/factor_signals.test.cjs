/* Renderer/date boundaries; not a browser or device acceptance test. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/factor_signals.json'),'utf8'));
function fixture(day='2026-10-10'){
  class Clock extends Date{constructor(...args){super(...(args.length?args:[day+'T06:00:00Z']));}}
  const context=vm.createContext({Promise,Error,Date:Clock,Intl,
    BUSINESS_ENGINE:{escape:x=>String(x).replaceAll('<','&lt;').replaceAll('>','&gt;'),safeURL:x=>/^https:\/\//.test(x)?x:null}});
  vm.runInContext(fs.readFileSync(path.join(root,'js/factor-signals.js'),'utf8'),context);
  return context.FACTOR_SIGNALS;
}
test('renderer retains units, dates and channel labels',()=>{
  const html=fixture().html(data);
  assert.match(html,/INR per USD/);assert.match(html,/2026-10-07 → 2026-10-08/);
  assert.match(html,/-6.00 basis points/);
  assert.match(html,/Headwind means pressure on the named activity/);
  assert.match(html,/Delayed/);assert.match(html,/Bond market prices/);
});
test('all current directions expire after their observation window',()=>{
  const html=fixture('2026-10-12').html(data);
  assert.doesNotMatch(html,/class="signal-badge (headwind|tailwind)"/);
  assert.match(html,/Outside 2-day target/);
});
test('future edition cannot show current directions',()=>{
  assert.doesNotMatch(fixture('2026-10-09').html(data),/class="signal-badge (headwind|tailwind)"/);
});
test('untrusted prepared prose is escaped',()=>{
  const row=structuredClone(data);row.factors[0].label='<script>injected</script>';
  assert.doesNotMatch(fixture().html(row),/<script>/);
  assert.match(fixture().html(row),/&lt;script&gt;/);
});
