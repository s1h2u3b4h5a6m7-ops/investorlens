# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phase 1 — The Great Split: DONE.** V2.6's single 4,561-line HTML file is now
  ~17 small files (each with one job, all under ~330 lines). Same look, same data,
  same behaviour — just carved apart so future changes are cheap.
- **Next: Phase 2 — Data moves into Supabase.** Only `js/data.js` will change: its
  `loadData()` will read the five tables instead of the local JSON. Deleting `/data`
  should then change nothing on the live site.

## What exists now (the file map)

```
investorlens/
├── index.html            page skeleton + CSS/JS links + boot
├── css/theme.css         locked design tokens + base (21 lines)
├── css/components.css    all component styles (330 lines)
├── js/config.js          constants + Phase-2 Supabase placeholders
├── js/data.js            THE WAITER — the only file that knows where data lives
├── js/home.js            hero, tabs, ticker, cards, search + shared helpers + init()
├── js/company.js         the 10-section master-detail company view
├── js/compare.js         compare mode (+ GROUP_LABELS, which holds functions)
├── js/forces.js          macro-force lens (+ FORCES, which holds regex matchers)
├── js/map.js             inter-company value-chain map (+ CHAINMAP)
├── js/selftest.js        data-integrity checks → the home status chip
├── data/companies.json   SEED — 58 companies (the big one)
├── data/chains.json      CHAINS — value-chain nodes
├── data/mgmt.json        MGMT — 15 verified management records
├── data/market_caps.json MARKET_CAP_CR
├── data/metric_meta.json HIGHER_IS_BETTER
├── etl/                  (empty until Phase 3 — the nightly robot)
├── CONTRACT.md           the data shapes (the menu)
├── STATE.md              this file
└── PLAN_v3.md            the source-of-truth plan
```

## Proof Phase 1 is faithful (self-tests pass identically)

V2.6 baseline **and** the split site both report, with **0 failures**:

> 58 companies · 295 metric bindings · 14 forces · 85 exposure links ·
> 4 value-chain maps · 15 verified management records

A headless render of every page (home, company incl. all 10 sections, compare
cards+table, forces, map) boots with no runtime errors.

## Things a future chat must know

- **Load order matters** (index.html): `config → data → home → company → compare →
  forces → map → selftest`, then the boot line `loadData().then(init)`.
- **The site needs http(s)** because it `fetch()`es local JSON. It works on GitHub
  Pages. It will **not** work by double-clicking `index.html` (file://) — use a
  local server for that: `python3 -m http.server` then open `localhost:8000`.
- **Three structures stay as code, not JSON** (see CONTRACT.md): `FORCES` (regex),
  `GROUP_LABELS` (functions), `CHAINMAP` (curated app structure).
- **Mission first.** This is a business-understanding engine — what a company does,
  whose chain it's a link in, and what real-world forces push on it. Valuation is
  deliberately second-to-last. Keep every change serving that, not stock-tipping.

## Changelog

- **v3.0 / Phase 1 (this pass):** Carved V2.6 into the file map above; data extracted
  to local JSON seed (lossless round-trip verified); self-tests pass identically;
  ready to deploy on GitHub Pages. No behaviour change.
