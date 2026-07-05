/* ============================================================================
   InvestorLens India — map.js
   Inter-company value-chain map: the 58 companies read as one connected system.
   CHAINMAP (curated links, all named in the companies' own profiles) + renderer.
   Carved verbatim from V2.6 (Plan v3 §4, Phase 1 — The Great Split).
   ============================================================================ */

/* ============ INTER-COMPANY VALUE-CHAIN MAP ============
   The 58 companies are not islands — they buy from, sell to, and own each
   other. Every link below is named in the companies' OWN verified profiles
   (see the note on each chain), and both ends are inside our 58-company
   universe so you can click straight through. This is the market read as one
   connected system — the platform's core promise, made literal.
   Phase 2 note: in supabase mode, loadData() REPLACES this literal with the
   map groups stored in the chains table (kind='map') — so new inter-company
   chains can be added as database rows, no code shipped. The literal below
   remains only as the local-json fallback (`var`, so it can be reassigned). */
var CHAINMAP = [
  {
    id:"power", kind:"flow",
    title:"How electricity reaches you",
    blurb:"India's power travels through three listed links in a row. Coal India digs the coal, NTPC burns it to make electricity, and Power Grid carries that electricity across the country to the state distributors who hand it to homes and factories. A shock at any one link (a coal shortage, a plant trip, a grid bottleneck) ripples down the whole line.",
    stages:[
      { label:"Fuel", nodes:[{tk:"COALINDIA"}] },
      { label:"Generation", nodes:[{tk:"NTPC"}] },
      { label:"Transmission", nodes:[{tk:"POWERGRID"}] },
      { label:"End users", nodes:[{t:"State discoms → homes & industry"}] }
    ],
    flows:["coal (long-term supply pacts)","power onto the grid","wheeled to distributors"],
    evidence:"Coal India delivers coal to power utilities via Fuel Supply Agreements; NTPC generates and sells bulk power; Power Grid's own profile describes moving electricity “from generators (like NTPC)” to distributors."
  },
  {
    id:"metals-auto", kind:"input",
    title:"Metals into mobility",
    blurb:"Every car, truck and motorcycle begins life as steel and aluminium. India's big metal makers sit upstream of every listed vehicle maker, so when steel prices, import duties or the Novelis plants move, the effect eventually reaches the automakers' cost sheets. This is an input dependency — not a single named contract — but it is structurally real for all of them.",
    stages:[
      { label:"Raw metal", nodes:[{tk:"TATASTEEL"},{tk:"JSWSTEEL"},{tk:"HINDALCO"}] },
      { label:"Vehicle makers", nodes:[{tk:"MARUTI"},{tk:"M&M"},{tk:"TMPV"},{tk:"EICHERMOT"},{tk:"BAJAJ-AUTO"}] }
    ],
    flows:["steel & aluminium — the metal in every vehicle"],
    evidence:"Tata Steel and JSW Steel sell into automotive end-markets; Hindalco's Novelis supplies automotive body-panel sheet; each automaker lists steel and components among its core inputs."
  },
  {
    id:"holding", kind:"ownership",
    title:"Who owns whom — holding-company trees",
    blurb:"Some of these 58 tickers are really parent and child. Knowing the tree tells you when two “separate” companies actually rise and fall together, and where a parent's value is just the sum of what it owns.",
    pairs:[
      { parent:"ADANIENT", child:"ADANIPORTS", note:"Adani Enterprises incubated Adani Ports from scratch and then listed it separately — its “build-mature-monetise” model." },
      { parent:"GRASIM", child:"ULTRACEMCO", note:"Grasim holds the majority stake in UltraTech, India's largest cement maker — so Grasim's value partly is UltraTech." },
      { parent:"BAJAJFINSV", child:"BAJFINANCE", note:"Bajaj Finserv is the holding company; Bajaj Finance is the consumer-lending NBFC it owns and captures the value of." },
      { parent:"RELIANCE", child:"JIOFIN", note:"Jio Financial was demerged out of Reliance and still sits on top of the Reliance/Jio consumer ecosystem it was born from." }
    ]
  },
  {
    id:"banca", kind:"ownership",
    title:"Banks that sell insurance for their own insurer",
    blurb:"A life insurer needs somewhere to sell policies. These two lean on their sister bank's branch network to do exactly that — “bancassurance.” So the bank's reach is quietly the insurer's growth engine, and anything that changes the bank changes the insurer.",
    pairs:[
      { parent:"SBIN", child:"SBILIFE", note:"SBI Life reaches customers overwhelmingly through State Bank of India's own branches — a big cost advantage and a real dependency." },
      { parent:"HDFCBANK", child:"HDFCLIFE", note:"HDFC Life sells a large share of its policies through HDFC Bank branches (alongside agency and digital channels)." }
    ]
  }
];

function shortName(n){
  return String(n||'').replace(/ (Industries|Limited|Ltd\.?|Corporation|Company|of India|India)\b.*$/,'').trim() || n;
}
function mapCoNode(tk){
  var c = SEED[tk]; if(!c) return '';
  return '<div class="vc-node clk" data-tk="'+esc(tk)+'"><div class="vc-role">'+esc(tk)+'</div>'+esc(shortName(c.name))+'</div>';
}
function mapEndNode(text){
  return '<div class="vc-node"><div class="vc-role">downstream</div>'+esc(text)+'</div>';
}
function mapArrow(label){
  return '<div class="vc-arrow map-arrow">'+(label?'<span>'+esc(label)+'</span>':'')+'<b>→</b></div>';
}

function openMap(){
  ['home-page','company-page','compare-page','forces-page'].forEach(function(id){ document.getElementById(id).classList.remove('active'); });
  document.getElementById('map-page').classList.add('active');
  renderMap();
}

function renderMap(){
  var html = CHAINMAP.map(function(ch){
    var body = '';
    if(ch.kind === 'ownership'){
      body = ch.pairs.map(function(p){
        return '<div class="map-pair">'
          + mapCoNode(p.parent) + mapArrow('owns / backs') + mapCoNode(p.child)
          + '<div class="map-note">'+esc(p.note)+'</div></div>';
      }).join('');
    } else {
      var flow = '<div class="vc-diagram"><div class="vc-flow">';
      ch.stages.forEach(function(st, i){
        flow += '<div class="vc-stack"><div class="map-stage-label">'+esc(st.label)+'</div>'
          + st.nodes.map(function(n){ return n.tk ? mapCoNode(n.tk) : mapEndNode(n.t); }).join('') + '</div>';
        if(i < ch.stages.length - 1) flow += mapArrow((ch.flows||[])[i] || '');
      });
      flow += '</div></div>';
      body = flow;
    }
    return '<div class="map-chain fade-item">'
      + '<h3>'+esc(ch.title)+'</h3>'
      + '<div class="map-blurb">'+esc(ch.blurb)+'</div>'
      + body
      + (ch.evidence ? '<div class="map-evidence">Grounded in the companies\' own profiles: '+esc(ch.evidence)+'</div>' : '')
      + '</div>';
  }).join('');
  var el = document.getElementById('map-content');
  el.innerHTML = html;
  el.querySelectorAll('.vc-node.clk').forEach(function(n){
    n.addEventListener('click', function(){ openCompany(n.getAttribute('data-tk')); });
  });
}
