/* Pure, deterministic business mechanisms. No network, AI or stock-price model. */
(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.BUSINESS_ENGINE = api;
})(typeof window !== 'undefined' ? window : this, function(){
  'use strict';
  var REPORT = 'https://www.goindigo.in/content/dam/goindigo/investor-relations/annual-report/2023-24/Annual-Report-2023-24.pdf';
  var BIS = 'https://www.bis.org/publications/bulletin-90-market-turbulence-and-carry-trade-unwind-august-2024';
  var EIA = 'https://www.eia.gov/todayinenergy/detail.php?id=61363';
  var FACTORS = [
    {key:'brent', label:'Brent crude', scale:10, unit:'%', kind:'Upstream proxy',
     path:['Crude oil', 'Refining & fuel supply', 'Jet fuel procurement', 'Operating costs'],
     mechanism:'More expensive crude can raise refined fuel prices. Refinery margins and supply disruptions can change that link.',
     limit:'Use the jet fuel series for the fuel calculation. Adding crude again would count the same cost twice.',
     source:EIA, sourceLabel:'EIA energy research · Feb 2024', words:/\b(oil|crude|opec|refiner\w*|red sea|hormuz)\b/i},
    {key:'jet', label:'Jet fuel', scale:10, unit:'%', kind:'Cost proxy',
     path:['Jet fuel market', 'Fuel procurement', 'Cost of flying', 'Margin pressure'],
     mechanism:'Fuel is a major operating expense. Higher input prices can squeeze margins if fares and efficiency do not offset them.',
     limit:'US Gulf spot fuel is a proxy. Indian ATF taxes, freight, purchase contracts and actual fuel consumption are not measured here.',
     source:REPORT, sourceLabel:'IndiGo FY2023–24 · fuel risk, p.47', words:/\b(jet fuel|atf|aviation fuel|fuel cost\w*)\b/i},
    {key:'inr', label:'Dollar / rupee', scale:3, unit:'%', kind:'Currency mechanism',
     path:['Dollar / rupee', 'Foreign-currency payments', 'Fuel, leases & maintenance', 'Rupee costs'],
     mechanism:'A weaker rupee makes dollar-priced inputs costlier in rupees. Foreign-currency revenue and hedges can offset part of the exposure.',
     limit:'The company reports foreign-currency lease, maintenance and insurance costs. Current net exposure and hedge amounts are not loaded.',
     source:REPORT, sourceLabel:'IndiGo FY2023–24 · currency risk, p.47', words:/\b(rupee|currency|forex|exchange rate|dollar)\b/i},
    {key:'yield', label:'US 10-year yield', scale:50, unit:'bp', kind:'Indirect link',
     path:['Global bond yields', 'Financing conditions', 'Borrowing & deposit income', 'Mixed business effects'],
     mechanism:'Higher yields can change financing conditions. Interest-bearing assets and liabilities can react in opposite directions.',
     limit:'A US Treasury yield is not IndiGo’s borrowing rate. No automatic conversion to company interest cost is supported.',
     source:REPORT, sourceLabel:'IndiGo FY2023–24 · financial risks, p.276', words:/\b(bond yield\w*|treasury|interest rate\w*|rate hike|rate cut|sofr)\b/i},
    {key:'yen', label:'Yen strength', scale:5, unit:'%', kind:'Stress clue only',
     path:['Yen appreciation', 'Possible carry-trade pressure', 'Global liquidity & risk appetite', 'Indirect market conditions'],
     mechanism:'Yen-funded leveraged trades can unwind during stress and amplify market turbulence. Currency movement alone does not establish an unwind.',
     limit:'No direct yen borrowing exposure is established for IndiGo. Positions, leverage and Japanese funding rates are missing.',
     source:BIS, sourceLabel:'BIS Bulletin 90 · Aug 2024', words:/\b(yen|carry trade\w*|boj|bank of japan)\b/i}
  ];
  var REGISTRY = [
    ['Funding & liquidity', ['US 10-year yield','Policy rates: India / US / Japan','Credit spreads','Yield curves','Bank lending conditions','Dollar funding stress','Central-bank balance sheets','Portfolio flows','Yen carry-trade positions']],
    ['Currencies & inputs', ['USD/INR','USD/JPY','Brent crude','Jet fuel','Gas & electricity','Metals & materials','Refining spreads','Indian ATF taxes & prices']],
    ['Supply & logistics', ['Shipping freight','Port / route disruption','Aircraft & engine availability','Supplier concentration','Inventories','Labour availability','Weather & disasters']],
    ['Demand & competition', ['Passenger traffic','Fares & seat occupancy','Household income','Tourism & business travel','Competitor capacity','Substitution & new entrants']],
    ['Policy & structural change', ['Wars & sanctions','Trade tariffs','Domestic regulation','Taxes & fiscal policy','Visa & border rules','Climate policy','AI & automation','Technology adoption','Cyber incidents','Political instability']]
  ];
  var CONNECTED = ['US 10-year yield','USD/INR','USD/JPY','Brent crude','Jet fuel'];
  var KEYS = FACTORS.map(function(f){return f.key;});
  function validDay(day){
    return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day;
  }
  function context(raw, cutoff){
    if(!validDay(cutoff)) throw new Error('A valid observation cutoff is required.');
    if(!raw || raw.schema_version !== 1 || !Array.isArray(raw.series)) throw new Error('Unsupported factor data.');
    var maps = {}, series = {}, now = new Date().toISOString().slice(0,10);
    KEYS.forEach(function(key){
      var entries = raw.series.filter(function(s){return s.key === key;});
      if(entries.length !== 1 || !Array.isArray(entries[0].observations)) throw new Error('Missing or duplicate factor: '+key);
      var s = entries[0], m = new Map();
      s.observations.forEach(function(row){
        if(!Array.isArray(row) || !validDay(row[0]) || typeof row[1] !== 'number' || !Number.isFinite(row[1]) ||
            (key !== 'yield' && row[1] <= 0)) throw new Error('Invalid '+key+' observation.');
        if(m.has(row[0])) throw new Error('Duplicate '+key+' observation date.');
        m.set(row[0], row[1]);
      });
      maps[key] = m; series[key] = s;
    });
    var days = Array.from(maps.brent.keys()).filter(function(d){
      return d <= cutoff && d <= now && KEYS.every(function(k){return maps[k].has(d);});
    }).sort();
    if(days.length < 21) throw new Error('Not enough shared observation dates. No missing values are filled.');
    return {days:days, maps:maps, series:series, cutoff:cutoff, collectedAt:raw.collected_at, vintage:raw.vintage};
  }
  function changes(ctx, endIndex){
    if(endIndex < 20 || endIndex >= ctx.days.length) throw new Error('A 20-interval window is required.');
    var start = ctx.days[endIndex-20], end = ctx.days[endIndex], result = {start:start,end:end,vector:{}};
    KEYS.forEach(function(k){
      var a = ctx.maps[k].get(start), b = ctx.maps[k].get(end);
      // Yield is a percentage level: +0.50 percentage points = +50 basis points.
      // USD/JPY falls when yen strengthens: use inverse currency conversion.
      result.vector[k] = k === 'yield' ? (b-a)*100 : k === 'yen' ? (a/b-1)*100 : (b/a-1)*100;
    });
    return result;
  }
  function checkedVector(vector){
    KEYS.forEach(function(k){
      if(typeof vector[k] !== 'number' || !Number.isFinite(vector[k]) || (k !== 'yield' && vector[k] <= -100))
        throw new Error('Invalid factor change: '+k);
    });
    return vector;
  }
  function distance(a,b){
    checkedVector(a); checkedVector(b);
    return Math.sqrt(FACTORS.reduce(function(sum,f){return sum+Math.pow((a[f.key]-b[f.key])/f.scale,2);},0)/FACTORS.length);
  }
  function fuelProxy(vector){
    checkedVector(vector);
    return ((1+vector.jet/100)*(1+vector.inr/100)-1)*100;
  }
  function correlation(pairs){
    if(pairs.length<3) return null;
    var x=pairs.reduce(function(s,p){return s+p[0];},0)/pairs.length;
    var y=pairs.reduce(function(s,p){return s+p[1];},0)/pairs.length;
    var xx=0,yy=0,xy=0;
    pairs.forEach(function(p){xx+=(p[0]-x)*(p[0]-x);yy+=(p[1]-y)*(p[1]-y);xy+=(p[0]-x)*(p[1]-y);});
    return xx && yy ? Math.max(-1,Math.min(1,xy/Math.sqrt(xx*yy))) : null;
  }
  function historicalLink(ctx,target){
    var pairs=[],same=0,directional=0,first=null,last=null;
    // Adjacent 20-interval returns share one boundary observation, no return intervals.
    for(var i=20;i<ctx.days.length && ctx.days[i]<target.start;i+=20){
      var w=changes(ctx,i),a=w.vector.brent,b=w.vector.jet;
      if(!first) first=w.start;last=w.end;pairs.push([a,b]);
      if(Math.abs(a)>1e-9 && Math.abs(b)>1e-9){directional++;if(Math.sign(a)===Math.sign(b)) same++;}
    }
    return {n:pairs.length,r:correlation(pairs),same:directional?same/directional:null,directional:directional,first:first,last:last};
  }
  function analogues(ctx, target, vector){
    checkedVector(vector);
    var candidates = [];
    // Entire candidate windows precede the displayed target's start. No outcome labels.
    for(var i=20;i<ctx.days.length && ctx.days[i]<target.start;i++){
      var c = changes(ctx,i); c.distance = distance(vector,c.vector); candidates.push(c);
    }
    candidates.sort(function(a,b){return a.distance-b.distance || a.end.localeCompare(b.end);});
    var picked=[];
    candidates.forEach(function(c){
      if(picked.length<3 && picked.every(function(p){return c.end<p.start || c.start>p.end;})) picked.push(c);
    });
    return picked;
  }
  function matchNews(rows, cutoff){
    if(!validDay(cutoff)) throw new Error('Invalid news cutoff.');
    var seen = new Set(), result = [];
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      if(!row || typeof row.title !== 'string') return;
      var day = typeof row.date === 'string' ? row.date.slice(0,10) : '', url = safeURL(row.url);
      if(!validDay(day) || day>cutoff) return;
      var identity = url || row.title.trim().toLowerCase();
      if(seen.has(identity)) return;
      seen.add(identity);
      var hits = FACTORS.filter(function(f){return f.words.test(row.title);}).map(function(f){return f.label;});
      if(hits.length) result.push({title:row.title,date:day,url:url,hits:hits});
    });
    return result.sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,6);
  }
  function safeURL(value){
    try{ var u = new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : null; }catch(e){return null;}
  }
  function escape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  return {FACTORS:FACTORS,REGISTRY:REGISTRY,CONNECTED:CONNECTED,REPORT:REPORT,BIS:BIS,EIA:EIA,
    context:context,changes:changes,analogues:analogues,distance:distance,fuelProxy:fuelProxy,
    correlation:correlation,historicalLink:historicalLink,
    matchNews:matchNews,safeURL:safeURL,escape:escape,checkedVector:checkedVector};
});
