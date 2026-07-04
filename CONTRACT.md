# CONTRACT.md — the menu (data shapes)

*The one document the kitchen (data) and the dining room (UI) both agree on.*
**Status: v0 — Phase 1.** Describes the local JSON seed the site reads today.
Phase 2 turns these same shapes into five Supabase tables; the field names here are
chosen to survive that move unchanged.

> **Rule:** UI code and data both read *this file*, never each other. If a shape
> needs to change, it changes here first, then in the data, then in the UI.

---

## Where the data lives (Phase 1)

Five JSON files in `/data`, loaded by `js/data.js` and published as the app globals
`SEED`, `CHAINS`, `MGMT`, `MARKET_CAP_CR`, `HIGHER_IS_BETTER`. No other file knows
where the data came from — that is the whole point of the split.

| File | Global | One entry = | Becomes (Phase 2) |
| --- | --- | --- | --- |
| `data/companies.json` | `SEED` | one company (keyed by ticker) | `companies` (+ `metrics`, `factors`) |
| `data/chains.json` | `CHAINS` | one company's value-chain nodes | `chains` |
| `data/mgmt.json` | `MGMT` | one verified management record | `mgmt` |
| `data/market_caps.json` | `MARKET_CAP_CR` | ticker → market cap (₹ Cr) | `companies.mcap` / `metrics` |
| `data/metric_meta.json` | `HIGHER_IS_BETTER` | metric key → ranking direction | `metrics.higher_is_better` |

---

## `companies.json` — the `SEED` record

An object keyed by ticker. Each value:

```jsonc
{
  "ticker": "RELIANCE",            // must equal the key
  "name": "Reliance Industries",
  "exchange": "NSE",              // optional, defaults to "NSE" in the UI
  "sector": "Conglomerate",
  "sub_sector": "Oil-to-Telecom-to-Retail", // optional
  "compare_group": "Conglomerate",// must exist in GROUP_LABELS (see compare.js)
  "as_of": "Q4 FY26",
  "source_note": "…",             // where the numbers came from
  "business_core": "…",           // §1 What the business actually does
  "moat_note": "…",               // §6 Moat
  "value_chain": { "position": "…", "note": "…" }, // §2 (position required)
  "tech_geo_tags": [               // §3 real-time factors (>=1 required)
    { "type": "risk|tailwind|neutral", "label": "…" }
  ],
  "metric_order": ["nim", "gnpa_pct"], // which metrics to show, in order (>=1)
  "metrics": {                     // §4 business-quality metrics
    "nim": { "label": "Net interest margin", "value": 3.5, "unit": "%", "note": "…" }
    // value may be null → the UI renders "—" (honest missing data)
  },
  "bull": ["…"],                  // §9 bull case (>=1)
  "bear": ["…"]                   // §7 red flags / §9 bear case (>=1)
}
```

The self-tests (`js/selftest.js`) enforce: ticker matches key; `name`, `sector`,
`compare_group`, `as_of`, `business_core`, `source_note`, `moat_note`,
`value_chain.position` present; `tech_geo_tags` non-empty with valid `type`; every
`metric_order` key exists in `metrics` and in `metric_meta`; `compare_group` exists
in `GROUP_LABELS`; a market cap exists for the ticker.

## `chains.json` — the `CHAINS` record

Keyed by ticker. `up` = upstream inputs, `down` = downstream channels. Each ticker
in the file must exist in `SEED`, and needs at least one `up` and one `down` node.

```jsonc
{
  "RELIANCE": {
    "up":   [ { "l": "Crude & feedstock", "t": "risk", "n": "why, one line" } ],
    "down": [ { "l": "Fuel retail",        "t": "tailwind" } ]
  }
}
```
`l` = label (required). `t` = optional tag `risk|tailwind|neutral`, set only where a
live §3 factor touches that exact link. `n` = optional one-line note.

## `mgmt.json` — the `MGMT` record

Keyed by ticker (a subset of companies — verified ones only). Every field required.

```jsonc
{
  "RELIANCE": {
    "promoter_pct": 50.01,        // number, 0–100
    "who": "…",                   // who the promoter is
    "pledge": "…",                // pledge/encumbrance status, as verified TEXT
    "capital": "…",               // capital-allocation narrative
    "as_of": "Mar 2026",
    "src": "…"                    // 2+ independent sources
  }
}
```
Companies **not** in this file show an honest "queued — no guesses" box.

## `market_caps.json` — `MARKET_CAP_CR`

`{ "RELIANCE": 1642125, ... }` — ticker → market cap in ₹ crore (number > 0). Every
key must exist in `SEED`; every `SEED` company must have one.

## `metric_meta.json` — `HIGHER_IS_BETTER`

`{ "nim": true, "gnpa_pct": false, "anp_spend_pct": null }` — metric key → ranking
direction. `true` = higher is better, `false` = lower is better, `null` = show but
don't rank (a context metric). Every metric used by any company must appear here.

---

## What is **not** seed data (stays as code)

Three structures live in the feature JS, not in `/data`, because they hold things
JSON can't store or are curated app logic rather than per-company rows:

- **`FORCES`** (`js/forces.js`) — 14 macro forces, each with a **RegExp** matcher.
  JSON can't hold a regex, and the self-test asserts `force.re instanceof RegExp`.
- **`GROUP_LABELS`** (`js/compare.js`) — peer-group display metadata; holds
  **functions** (pluralisation), so it can't be JSON.
- **`CHAINMAP`** (`js/map.js`) — the 4 curated inter-company chains. Pure data, but
  it's curated app structure (Phase 2 folds it into the `chains` table).
