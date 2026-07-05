/* ============================================================================
   InvestorLens India — data.js  (THE WAITER)
   The ONE file that knows where the data comes from. Every other file just uses
   SEED / CHAINS / CHAINMAP / MGMT / MARKET_CAP_CR / HIGHER_IS_BETTER and never
   asks where they came from.

   Phase 1: fetch the local JSON seed files in /data (kept below as fallback).
   Phase 2 (now): CONFIG.dataSource === 'supabase' reads the five tables and
   rebuilds the exact same in-memory shapes (CONTRACT.md §7) — so nothing else
   in the app changes. That clean seam is why the project was split into files.
   ============================================================================ */

// These become the app's global data once loadData() finishes. They start empty
// and are filled in before init() runs, so every render function sees real data.
// CHAINMAP is declared here too since Phase 2 sources it from the chains table;
// in local-json mode the curated literal in map.js remains the value.
var SEED = {};
var CHAINS = {};
var CHAINMAP = [];
var MGMT = {};
var MARKET_CAP_CR = {};
var HIGHER_IS_BETTER = {};

// Fetch one JSON file and hand back its parsed contents. Throws loudly (with the
// file name) if the file is missing or malformed, so a broken seed can't fail
// silently — it shows up in the console and the boot error banner.
function fetchJson(name) {
  var url = CONFIG.dataDir + '/' + name;
  return fetch(url).then(function (res) {
    if (!res.ok) throw new Error('could not load ' + url + ' (HTTP ' + res.status + ')');
    return res.json();
  });
}

/* ---------------------------------------------------------------------------
   SUPABASE READERS (Phase 2)
   Supabase exposes every table over plain HTTPS (PostgREST). We ask politely
   with the read-only anon key; RLS on the server means that key can only look,
   never touch. No library needed — fetch() is enough.
--------------------------------------------------------------------------- */

// Pull EVERY row of one table, 1,000 at a time (Supabase's page cap), in a
// stable order. Today no table is near 1,000 rows; tomorrow, when the robot
// has stacked up months of snapshot history, this same loop just keeps going.
function fetchTable(table, order) {
  var base = CONFIG.supabaseUrl + '/rest/v1/' + table + '?select=*&order=' + order;
  function page(from, acc) {
    return fetch(base, {
      headers: {
        apikey: CONFIG.supabaseAnonKey,
        Authorization: 'Bearer ' + CONFIG.supabaseAnonKey,
        Range: from + '-' + (from + 999)
      }
    }).then(function (res) {
      if (!res.ok) throw new Error('Supabase read failed: ' + table + ' (HTTP ' + res.status + ')');
      return res.json();
    }).then(function (batch) {
      acc = acc.concat(batch);
      return batch.length < 1000 ? acc : page(from + 1000, acc);
    });
  }
  return page(0, []);
}

// Turn the five tables' rows back into the exact in-memory shapes the UI has
// always eaten (CONTRACT.md §7). One row at a time into the right pocket.
function buildFromTables(companies, metrics, factors, chains, mgmt) {
  var seed = {}, caps = {}, chainsByCo = {}, maps = [], mg = {}, hib = {};

  // companies → SEED skeleton + MARKET_CAP_CR
  companies.forEach(function (c) {
    caps[c.ticker] = c.market_cap_cr || 0;
    seed[c.ticker] = {
      ticker: c.ticker, name: c.name, exchange: c.exchange,
      sector: c.sector, sub_sector: c.sub_sector, compare_group: c.compare_group,
      as_of: c.as_of, fetched_at: c.fetched_at, source_note: c.source_note,
      business_core: c.business_core, moat_note: c.moat_note,
      value_chain: { position: c.value_chain_position, note: c.value_chain_note },
      metric_order: c.metric_order || [], bull: c.bull || [], bear: c.bear || [],
      metrics: {}, tech_geo_tags: []
    };
  });

  // metrics → the LATEST snapshot per (ticker, metric_key). Older snapshots
  // stay in the table for future trend charts; the UI shows today's reading.
  var newest = {};
  metrics.forEach(function (m) {
    if (!(m.metric_key in hib)) hib[m.metric_key] = m.higher_is_better; // true/false/null
    var c = seed[m.ticker]; if (!c) return;
    var k = m.ticker + '\u00A7' + m.metric_key;
    if (newest[k] && newest[k] >= m.snapshot_date) return; // ISO dates compare as text
    newest[k] = m.snapshot_date;
    c.metrics[m.metric_key] = { value: m.value, unit: m.unit, label: m.label, note: m.note };
  });

  // factors → tech_geo_tags, already server-ordered by (ticker, position)
  factors.forEach(function (f) {
    var c = seed[f.ticker]; if (c) c.tech_geo_tags.push({ label: f.label, type: f.type });
  });

  // chains → per-company nodes (kind='node') + inter-company map groups (kind='map')
  chains.forEach(function (r) {
    if (r.kind === 'map') { maps.push(r); return; }
    var e = chainsByCo[r.ticker] || (chainsByCo[r.ticker] = { up: [], down: [] });
    var node = { l: r.label };
    if (r.tag) node.t = r.tag;
    if (r.note) node.n = r.note;
    node._p = r.position;
    e[r.side].push(node);
  });
  Object.keys(chainsByCo).forEach(function (t) {
    ['up', 'down'].forEach(function (s) {
      chainsByCo[t][s].sort(function (a, b) { return a._p - b._p; })
                      .forEach(function (n) { delete n._p; });
    });
  });
  maps.sort(function (a, b) { return a.position - b.position; });

  // mgmt → MGMT (the DB column is `sources`; the app has always called it `src`)
  mgmt.forEach(function (m) {
    mg[m.ticker] = { promoter_pct: m.promoter_pct, who: m.who, pledge: m.pledge,
                     capital: m.capital, as_of: m.as_of, src: m.sources };
  });

  // publish — same globals, same shapes, new pantry
  SEED = seed; CHAINS = chainsByCo; MGMT = mg;
  MARKET_CAP_CR = caps; HIGHER_IS_BETTER = hib;
  CHAINMAP = maps.map(function (r) { return r.map_group; });
  window.SEED = SEED; window.CHAINS = CHAINS; window.MGMT = MGMT;
  window.MARKET_CAP_CR = MARKET_CAP_CR; window.HIGHER_IS_BETTER = HIGHER_IS_BETTER;
  window.CHAINMAP = CHAINMAP;
}

// Load the data (in parallel) and publish the results as the app globals.
// Returns a promise; the bootstrap in index.html waits for it, then calls init().
function loadData() {
  if (CONFIG.dataSource === 'supabase') {
    return Promise.all([
      fetchTable('companies', 'ticker.asc'),
      fetchTable('metrics',   'ticker.asc,metric_key.asc,snapshot_date.desc'),
      fetchTable('factors',   'ticker.asc,position.asc,id.asc'),
      fetchTable('chains',    'id.asc'),
      fetchTable('mgmt',      'ticker.asc')
    ]).then(function (r) {
      buildFromTables(r[0], r[1], r[2], r[3], r[4]);
      return { source: 'supabase', companies: Object.keys(SEED).length };
    });
  }

  if (CONFIG.dataSource === 'local-json') {
    return Promise.all([
      fetchJson('companies.json'),
      fetchJson('chains.json'),
      fetchJson('mgmt.json'),
      fetchJson('market_caps.json'),
      fetchJson('metric_meta.json')
    ]).then(function (r) {
      SEED = r[0];
      CHAINS = r[1];
      MGMT = r[2];
      MARKET_CAP_CR = r[3];
      HIGHER_IS_BETTER = r[4];
      // expose on window too, so bare references resolve no matter the load order
      window.SEED = SEED; window.CHAINS = CHAINS; window.MGMT = MGMT;
      window.MARKET_CAP_CR = MARKET_CAP_CR; window.HIGHER_IS_BETTER = HIGHER_IS_BETTER;
      // CHAINMAP stays the curated literal from map.js in this mode
      return { source: 'local-json', companies: Object.keys(SEED).length };
    });
  }

  return Promise.reject(new Error('unknown dataSource: ' + CONFIG.dataSource));
}
