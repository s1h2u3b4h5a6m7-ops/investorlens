/* ============================================================================
   InvestorLens India — forces.js
   Macro-force exposure lens: 14 real-world forces matched to each company's own
   verified factor tags. FORCES lives here because each force carries a RegExp
   matcher (regex can't be stored as JSON), and the self-test asserts it is one.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   ============================================================================ */

/* ============ MACRO-FORCE EXPOSURE LENS ============
   A second way to read the SAME verified data. Each force is a real-world
   pressure; its regex matches the company's own verified §3 factor tags, and
   every match carries the exact tag text as evidence — nothing is asserted
   without its source. A force can be a tailwind for one business and a risk
   for another (crude hurts paint makers; GST 2.0 helps carmakers), so the
   lens shows who wins and who loses when each force moves. */
const FORCES = [
  { id:"crude", label:"Crude oil & petrochemicals",
    blurb:"Crude oil isn't just fuel — it's the raw ingredient behind paint, plastic, packaging and synthetic fibre. When crude climbs, the cost ripples into everything made from it.",
    re:/crude|palm oil|petrochem|titanium diox|\bTiO2\b|monomer|\bresin/i },
  { id:"fx", label:"Currency — USD/INR & emerging markets",
    blurb:"Many Indian firms earn in dollars (IT exports) or sell into other countries. A weaker rupee makes those foreign earnings look bigger at home — a tailwind for exporters, a headwind for importers.",
    re:/\bUSD\b|\bGBP\b|\bEUR\b|rupee|\bINR\b|currency|constant.currency|naira|forex|foreign.exchange/i },
  { id:"rates", label:"Interest rates & RBI policy",
    blurb:"The Reserve Bank of India sets the price of money. Cheaper money lifts loan demand and helps lenders; costlier money squeezes both borrowers and margins.",
    re:/\brepo\b|\bRBI\b|interest rate|monetary|rate cut|rate hold|policy transmission|cost of borrow|funding.cost/i },
  { id:"monsoon", label:"Monsoon & rural demand",
    blurb:"A large share of India lives off farming. A good monsoon lifts rural incomes — which means more soap, tractors, two-wheelers and packaged food sold in the villages.",
    re:/monsoon|rural|farm.income|tractor|freight.cycle|\bCV.cycle/i },
  { id:"china", label:"China supply chain",
    blurb:"China makes inputs the world leans on — like the rare-earth magnets inside electric-car motors. When China restricts exports, factories elsewhere feel the pinch.",
    re:/\bchina\b|rare.earth|chinese/i },
  { id:"gst", label:"GST 2.0 tax reform",
    blurb:"In late 2025 India cut the tax on several goods (notably small cars). Lower tax means a lower sticker price, which pulls in more buyers — a direct demand booster for the sectors it touched.",
    re:/\bGST\b/i },
  { id:"ai", label:"AI & automation",
    blurb:"AI can do some work more cheaply than people. For IT firms that bill by the hour that's both a threat (fewer billable hours) and a prize (new AI projects to sell).",
    re:/\bAI\b|A\.I\.|automation|AI-native|AI-augmented|AI-driven|artificial intelligence/i },
  { id:"geo", label:"Geopolitics & trade — West Asia, tariffs",
    blurb:"Wars, trade deals and tariffs reshape what it costs to ship and sell across borders. A Middle-East conflict can choke oil supply; a trade deal can cut the tariff on exported cars.",
    re:/west asia|middle east|geopolit|\btariff|trade deal|trade resolution|conflict|sanction/i },
  { id:"transition", label:"Energy transition",
    blurb:"The world is shifting from coal and petrol toward solar, wind and batteries. That's a structural tailwind for green-energy players and a slow headwind for fossil-fuel ones.",
    re:/energy.transition|renewable|\bsolar\b|wind (capacity|power)|\bEV\b|green (power|hydrogen|energy|ammonia)|decarbon|battery|500 GW/i },
  { id:"upi", label:"UPI & zero-MDR payments",
    blurb:"When you pay by UPI, an app sits between you and your bank — and by law the bank can't charge a fee for it. Convenient for you, structurally awkward for the banks carrying the cost.",
    re:/\bUPI\b|zero.MDR|disintermediat|account aggregator|payments layer/i },
  { id:"mfi", label:"Microfinance stress",
    blurb:"Microfinance means very small loans to low-income borrowers. When too many struggle to repay at the same time, the lenders most exposed to that book take the hit first.",
    re:/microfinance|\bMFI\b|unsecured.(consumer|credit)|\bEEB\b/i },
  { id:"fda", label:"US FDA & drug regulation",
    blurb:"To sell medicine in America, Indian pharma must clear US FDA inspections. A single failed inspection can freeze an entire product line and its profits.",
    re:/\bFDA\b|\bANDA\b|USFDA|paragraph.IV|regulated.(us|export)/i },
  { id:"qcomm", label:"Quick-commerce disruption",
    blurb:"Ten-minute grocery delivery is rewriting how everyday goods reach you. It's a fast-growing new shelf for packaged-goods brands — and a threat to the old corner-shop distribution network.",
    re:/quick.commerce|q-comm|dark store|blinkit|zepto|10.minute|modern trade/i },
  { id:"psu", label:"Government / PSU ownership",
    blurb:"Some giants are majority-owned by the government. That brings steady backing and national priorities — but also social obligations a purely commercial rival wouldn't carry.",
    re:/government (major|owned|majority)|majority.owned|\bPSU\b|sovereign|state-owned|maharatna|government-notified|lead-bank/i },
];

function forceMatches(force){
  var rows = [];
  Object.values(SEED).forEach(function(c){
    var hits = (c.tech_geo_tags||[]).filter(function(t){ return force.re.test(t.label); });
    if(!hits.length) return;
    rows.push({
      ticker: c.ticker, name: c.name, mcap: c.market_cap_cr||0,
      types: hits.map(function(h){return h.type;}),
      evidence: hits.map(function(h){return {type:h.type, label:h.label};})
    });
  });
  return rows.sort(function(a,b){ return b.mcap - a.mcap; });
}

function forceTally(rows){
  var t={risk:0,tailwind:0,neutral:0};
  rows.forEach(function(r){ r.evidence.forEach(function(e){ if(t[e.type]!=null) t[e.type]++; }); });
  return t;
}

/* ============ MACRO-FORCE LENS (view) ============ */
function buildForceGrid(){
  var g = document.getElementById('force-grid');
  g.innerHTML = FORCES.map(function(f){
    var n = forceMatches(f).length;
    return '<button class="force-btn" data-force="'+esc(f.id)+'">'+esc(f.label)+' <span class="fb-n">'+n+'</span></button>';
  }).join('');
  g.querySelectorAll('.force-btn').forEach(function(b){
    b.addEventListener('click', function(){ openForce(b.getAttribute('data-force')); });
  });
}

function openForce(id){
  var f = FORCES.filter(function(x){return x.id===id;})[0] || FORCES[0];
  currentForce = f.id;
  showPage('forces-page', 'fwd');
  renderForces();
}

function renderForces(){
  var f = FORCES.filter(function(x){return x.id===currentForce;})[0] || FORCES[0];
  var chips = document.getElementById('frc-chips');
  chips.innerHTML = FORCES.map(function(x){
    var n = forceMatches(x).length;
    return '<button class="force-btn'+(x.id===f.id?' active':'')+'" data-force="'+esc(x.id)+'">'+esc(x.label)+' <span class="fb-n">'+n+'</span></button>';
  }).join('');
  chips.querySelectorAll('.force-btn').forEach(function(b){
    b.addEventListener('click', function(){ currentForce = b.getAttribute('data-force'); renderForces(); });
  });

  var rows = forceMatches(f);
  var tally = forceTally(rows);
  document.getElementById('frc-title').textContent = f.label;
  document.getElementById('frc-blurb').textContent = f.blurb;
  document.getElementById('frc-tally').innerHTML =
    '<span>'+rows.length+' companies carry a live factor tied to this force</span>'
    + '<span class="up">▲ <b>'+tally.tailwind+'</b> tailwind</span>'
    + '<span class="down">▼ <b>'+tally.risk+'</b> risk</span>'
    + '<span class="neu">• <b>'+tally.neutral+'</b> context</span>';

  var list = document.getElementById('frc-list');
  list.innerHTML = rows.map(function(r,i){
    var ev = r.evidence.map(function(e){
      return '<div class="frc-ev '+e.type+'"><span class="frc-evtype">'+e.type+'</span>'+esc(e.label)+'</div>';
    }).join('');
    return '<div class="frc-co fade-item" data-ticker="'+esc(r.ticker)+'" style="animation-delay:'+(i*35)+'ms">'
      + '<div class="frc-co-top"><span class="frc-co-name">'+esc(r.name)+'</span>'
      + '<span class="frc-co-tk">'+esc(r.ticker)+'</span>'
      + '<span class="frc-co-mcap">'+fmtCr(r.mcap)+'</span></div>'
      + ev + '</div>';
  }).join('');
  list.querySelectorAll('.frc-co').forEach(function(card){
    card.addEventListener('click', function(){ openCompany(card.getAttribute('data-ticker')); });
  });
}
