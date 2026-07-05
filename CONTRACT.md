# CONTRACT.md — InvestorLens India

**This file is law.** It defines the exact shape of every data record. UI
sessions and data sessions both read *only this* — never each other's code.
If the database and this file ever disagree, one of them is a bug.

**Status: v1 — Phase 2 (data lives in Supabase).** Supersedes v0's local-JSON
era; the `/data` JSONs are legacy fallback only and are deleted once the Phase 2
acid test passes. Mirrors the V2.6 seed exactly:
**58 companies · 295 metrics · 174 factors · 279 chain rows · 15 mgmt**.

---

## 0. The two layers (read this first)

There are **two shapes** for the same data, and the contract covers both:

1. **The database shape** — what the five Supabase tables look like (§1–§5).
   Rows, columns, types. This is what `seed.sql` writes and the robot updates.
2. **The in-memory shape** — the JavaScript objects the UI actually renders
   (§7). `js/data.js` is the *only* file allowed to translate layer 1 → layer 2.
   Every other UI file (`home.js`, `company.js`, `compare.js`, `forces.js`,
   `map.js`) sees only the in-memory shape and never touches Supabase.

Think of it like a restaurant: the tables are the pantry (§1–§5), `data.js`
is the kitchen, and the UI is the diner reading the plated dish (§7). The diner
never walks into the pantry.

---

## 1. Table `companies` — one row = one company

The index card. Everything else points back at `ticker`.

| column                 | type          | notes |
|------------------------|---------------|-------|
| `ticker`               | text **PK**   | NSE symbol, e.g. `RELIANCE`. Uppercase. The join key everywhere. |
| `name`                 | text NOT NULL | Display name, e.g. `Reliance Industries`. |
| `exchange`             | text          | Always `NSE` today. |
| `sector`               | text          | Broad sector label, e.g. `Banking`. |
| `sub_sector`           | text          | Finer label, e.g. `Private Bank`. |
| `compare_group`        | text          | Peer bucket for Compare mode, e.g. `Banks`, `IT`, `NBFCs`. |
| `as_of`                | text          | Human period, e.g. `Q3 FY26 (quarter ended 31 Dec 2025)`. |
| `fetched_at`           | date          | Day we recorded this card. Seeds `snapshot_date`/`tagged_on`. |
| `source_note`          | text          | Where the numbers came from (shown in §1). |
| `business_core`        | text          | Plain-English "what this company does" (§1). |
| `value_chain_position` | text          | §2 upstream/downstream write-up. |
| `value_chain_note`     | text          | The honesty caveat under §2. May be NULL. |
| `moat_note`            | text          | §6 durable-advantage note. |
| `bull`                 | jsonb         | **Array of strings.** The bull case bullets. Default `[]`. |
| `bear`                 | jsonb         | **Array of strings.** The bear case bullets. Default `[]`. |
| `metric_order`         | jsonb         | **Array of metric_key strings**, in display order. Default `[]`. |
| `market_cap_cr`        | bigint        | ₹ crore. The robot refreshes this nightly (Phase 3). |
| `updated_at`           | timestamptz   | Auto `now()`. DB bookkeeping; UI ignores it. |

**Why `bull`/`bear`/`metric_order` are JSONB, not their own tables:** they are
short ordered lists that only ever belong to one company and are always read
together with it. One row = one whole company stays simple. (Metrics and
factors *do* get their own tables because they carry dates and get ranked.)

---

## 2. Table `metrics` — one row = one metric value for one company **on one date**

| column             | type        | notes |
|--------------------|-------------|-------|
| `id`               | bigint **PK** identity | DB-internal only. UI never relies on it. |
| `ticker`           | text NOT NULL → companies | Cascade-deletes with the company. |
| `metric_key`       | text NOT NULL | Stable code, e.g. `nim`, `revenue_growth_pct`. |
| `label`            | text        | Human label, e.g. `Net Interest Margin`. |
| `value`            | numeric     | **NULL is allowed and meaningful** — a number we refuse to fake (e.g. `TMPV.realization_growth_pct`). Renders as `—`. |
| `unit`             | text        | `%`, `₹`, `x`, `bn`, or `''`. |
| `note`             | text        | One-line caveat under the number. |
| `higher_is_better` | boolean     | **Tri-state:** `true` (green = high good), `false` (green = low good), `NULL` (display-only, never ranked in Compare). |
| `snapshot_date`    | date NOT NULL | The date this reading is *for*. |

**Unique key:** `(ticker, metric_key, snapshot_date)` — one reading per metric
per company per day. Re-running the loader replaces; the robot adds new dates.

**The snapshot rule (the quiet superpower):** the UI shows the **latest**
`snapshot_date` per `(ticker, metric_key)`. Keeping the older ones is what
makes trend charts free later. `data.js` already picks the latest; do not
assume "one row per metric" in any UI code.

---

## 3. Table `factors` — one row = one real-time factor tag (§3 Factor Tracker)

| column      | type        | notes |
|-------------|-------------|-------|
| `id`        | bigint **PK** identity | DB-internal. |
| `ticker`    | text NOT NULL → companies | |
| `type`      | text NOT NULL | **Exactly one of** `risk` \| `tailwind` \| `neutral`. Enforced by CHECK. |
| `label`     | text NOT NULL | The tag sentence shown to the user. |
| `tagged_on` | date        | When the tag was attached (seed = `fetched_at`). |
| `position`  | int         | Preserves display order within the company. |

The Macro-Force lens (§forces) is **computed from these `label`s at runtime**,
not stored. A company appears under a force only if one of its factor labels
matches that force — never mere theoretical exposure. See §6.

---

## 4. Table `chains` — TWO row-kinds, told apart by `kind`

`kind='node'` → one value-chain node for **one** company (§2 diagram).
`kind='map'`  → one **inter-company map group**, stored whole as JSONB.

| column      | type        | applies to | notes |
|-------------|-------------|-----------|-------|
| `id`        | bigint **PK** identity | both | DB-internal. |
| `kind`      | text NOT NULL | both | `node` \| `map`. Default `node`. |
| `ticker`    | text → companies | node | The company this node belongs to. |
| `side`      | text        | node | `up` (upstream input) \| `down` (downstream channel). |
| `position`  | int         | both | Order within the side (node) / order of groups (map). |
| `label`     | text        | node | The node text (`l` in memory). |
| `tag`       | text        | node | `risk` \| `tailwind` \| `neutral` \| **NULL** (untagged link) (`t`). |
| `note`      | text        | node | Optional one-line "why" (`n`). |
| `map_id`    | text        | map  | Group id, e.g. `power`, `metals-auto`, `holding`, `banca`. |
| `map_group` | jsonb       | map  | The **entire** group object, intact (see §7.4 for its shape). |

A CHECK enforces: node rows need `ticker`+`side`; map rows need `map_id`+`map_group`.

**Why map groups are one JSONB blob:** they are shape-shifty — a `flow`/`input`
group has `stages`/`flows`/`evidence`; an `ownership` group has `pairs`. Forcing
that into fixed columns would lie about the data. We keep each group whole and
let `data.js` hand it to the map renderer unchanged.

**Fallback note:** `js/map.js` still carries the original 4-group literal, now
declared with `var`, purely so `dataSource:'local-json'` mode keeps a working
map. In supabase mode `loadData()` replaces it with the DB rows — the database
is the source of truth; new inter-company chains are added as rows, not code.

---

## 5. Table `mgmt` — one row = one verified §5 management record

| column         | type        | notes |
|----------------|-------------|-------|
| `ticker`       | text **PK** → companies | One row per company (15 verified so far). |
| `promoter_pct` | numeric     | Promoter/most-significant holding %. `0` is real (promoter-less). |
| `who`          | text        | Who the promoter is, in words. |
| `pledge`       | text        | **Always TEXT, never a forced number** — verified prose. |
| `capital`      | text        | Capital-allocation narrative. |
| `as_of`        | text        | `Mar 2026` / `Q4 FY26` — human period, not a date. |
| `sources`      | text        | The `src` line shown under §5. |

Companies without an `mgmt` row show the honest "queued — no guesses" box.

---

## 6. What is NOT in the database (and why)

- **FORCES** (the 14 macro pressures) live in the **app** (`js/forces.js` /
  `config`), because each one carries a regular-expression matcher, which is
  code, not data. Force→company exposure is **derived** by matching a force's
  regex against each company's `factors.label`s. Storing it would duplicate
  truth and risk drift. Reference definition only: `{ id, label, blurb, re }`.
- **GROUP_LABELS / sector display strings** — pure presentation, app-side.
- **Self-test expectations** — live in `js/selftest.js`, now checking the DB.

---

## 7. The in-memory shape (what `data.js` returns to the UI)

`await DataLayer.load()` returns **exactly** these objects. The UI depends on
these names and shapes; changing them is a contract change.

### 7.1 `SEED` — object keyed by ticker
```js
SEED["RELIANCE"] = {
  ticker, name, exchange, sector, sub_sector, compare_group,
  as_of, fetched_at, source_note, business_core, moat_note,
  market_cap_cr,                       // number — attached by init() (home.js:18)
                                       //   from MARKET_CAP_CR after loadData()
  metric_order: ["...", "..."],        // from companies.metric_order
  bull: ["...", "..."],                // from companies.bull
  bear: ["...", "..."],                // from companies.bear
  value_chain: { position, note },     // from value_chain_position/_note
  metrics: {                           // keyed by metric_key, latest snapshot
    nim: { value, unit, label, note }, // value may be null
    ...
  },
  tech_geo_tags: [                     // from factors, ordered by position
    { label, type }                    // type ∈ risk|tailwind|neutral
  ]
}
```

### 7.2 `MARKET_CAP_CR` — `{ TICKER: number }` (₹ crore)

### 7.3 `CHAINS` — `{ TICKER: { up:[node], down:[node] } }`, from chains `kind='node'`
```js
node = { l: label, t: tag|undefined, n: note|undefined }  // ordered by position
```

### 7.4 `CHAINMAP` — array of the intact `map_group` objects, ordered by position
Each group is one of these shapes (unchanged from the seed):
```js
// kind 'flow' | 'input'
{ id, kind, title, blurb, stages:[{ label, nodes:[{tk}|{t}] }], flows:[...], evidence }
// kind 'ownership'
{ id, kind, title, blurb, pairs:[{ parent, child, note }] }
```

### 7.5 `MGMT` — `{ TICKER: { promoter_pct, who, pledge, capital, as_of, src } }`
(`src` in memory = `sources` column.)

### 7.6 `HIGHER_IS_BETTER` — `{ metric_key: true|false|null }`
Rebuilt by `data.js` from the `metrics` rows (one entry per distinct
`metric_key`). Compare mode uses it to pick the best-in-class cell.

---

## 8. Invariants the self-tests enforce (Phase 2 onward)

1. Every `metrics.ticker`, `factors.ticker`, `chains(node).ticker`,
   `mgmt.ticker` exists in `companies` (no orphans). *(FKs guarantee this.)*
2. `metrics.value` is numeric or NULL — never a string.
3. `factors.type` and `chains.tag` ∈ {risk, tailwind, neutral} (tag may be NULL).
4. `promoter_pct` is between 0 and 100.
5. Counts match this contract's header unless a data session says otherwise
   and updates STATE.md: 58 / 295 / 174 / 279 / 15.
6. Anon key can `select` but never `insert/update/delete` (RLS).

---

## 9. Change discipline

Any change to a **column, type, allowed value, or in-memory shape** is a change
to *this file first*, in its own session, with STATE.md updated. Data content
changes (new companies, refreshed quarters) do **not** touch this file — only
add/replace rows. That separation is what keeps sessions cheap.
