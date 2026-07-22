# CONTRACT.md — the menu (data shapes)

*The one document the kitchen (data) and the dining room (UI) both agree on.*
**Status: v1 — Phase 4.** The kitchen is now eight Supabase tables; the dining
room still eats the exact same six globals it has eaten since Phase 1. That is
the whole point of the split: the kitchen was rebuilt and the menu never changed.

> **Rule:** UI code and data both read *this file*, never each other. If a shape
> needs to change, it changes here first, then in the tables (service_role SQL),
> then in `js/data.js`'s translation, and only then — if at all — in the UI.

---

## Where the data lives (Phase 4)

Nine tables in Supabase (Mumbai / ap-south-1). `js/data.js` — the waiter — reads
eight of them over PostgREST with the public anon key and rebuilds the same app
globals: `SEED`, `CHAINS`, `CHAINMAP`, `MGMT`, `MARKET_CAP_CR`,
`HIGHER_IS_BETTER`, plus `VALUATION` and `VAL_INPUTS` (Session T). No other file
knows the data moved. The ninth table is the robot's inbox; the site never reads
it.

| Table | Feeds | One row = |
| --- | --- | --- |
| `companies` | `SEED` (skeleton) | one company's identity + verified sentences |
| `metric_snapshots` | `SEED[t].metrics` + `metric_order`, `MARKET_CAP_CR`, `HIGHER_IS_BETTER` | one number for one company on one date |
| `chain_nodes` | `CHAINS` | one upstream or downstream link |
| `tech_geo_tags` | `SEED[t].tech_geo_tags` | one live §3 factor |
| `bull_bear_cases` | `SEED[t].bull` / `.bear` | one bull or bear sentence |
| `mgmt_profiles` | `MGMT` | one verified management record |
| `cross_company_narratives` | `CHAINMAP` | one multi-company story |
| `valuation_inputs` | `VAL_INPUTS` | one company's valuation lens + verified denominators |
| `staged_metric_snapshots` | *(nothing — robot inbox, human review)* | one unverified scraped number |

## The app globals (unchanged since Phase 1)

`SEED` — object keyed by ticker:

```jsonc
{
  "ticker": "RELIANCE",            // must equal the key
  "name": "Reliance Industries",
  "exchange": "NSE",
  "sector": "Conglomerate",
  "sub_sector": "…",               // optional
  "compare_group": "Conglomerate", // must exist in GROUP_LABELS (compare.js — 27 groups)
  "as_of": "Q4 FY26",
  "fetched_at": "2026-03-31",      // last machine touch (may be null)
  "source_note": "…",              // where the numbers came from
  "business_core": "…",            // §1 what the business actually does
  "moat_note": "…",                // §6 moat
  "value_chain": { "position": "…", "note": "…" },   // §2 (position required)
  "tech_geo_tags": [ { "label": "…", "type": "risk|tailwind|neutral" } ], // ≥1
  "metric_order": ["nim", "gnpa_pct"],   // display order (≥1) — see row-order rule
  "metrics": { "nim": { "label": "…", "value": 3.5, "unit": "%", "note": "…" } },
  "bull": ["…", "…", "…"],         // 3 in practice (data guarantees 3+3)
  "bear": ["…", "…", "…"]
}
```

`CHAINS` — `{ TICKER: { up: [{l, t?, n?}], down: [{l, t?, n?}] } }`, ≥1 each side.
`MGMT` — `{ TICKER: { promoter_pct, who, pledge, capital, as_of, src,
verified_on } }` — a subset; a missing ticker honestly means "queued — no
guesses", never a guess. `as_of` is the period the numbers describe (the SHP
quarter); `verified_on` is the ISO date the founder verified the record.
`MARKET_CAP_CR` — `{ TICKER: number > 0 }` for every SEED ticker.
`HIGHER_IS_BETTER` — `{ metric_key: true|false|null }` for every metric used
(110 keys today). `true` = higher better, `false` = lower better, `null` = show
but don't rank.
`CHAINMAP` — array of story objects
`{ id, kind, title, blurb?, stages?, flows?, pairs?, evidence? }`.

## How rows become globals (the waiter's translation rules)

- **Newest wins.** Per `(ticker, metric_key)`, the row with the latest
  `snapshot_date` supplies value/unit/label/note. Older rows are history — kept
  for future trend views, never overwritten, never deleted.
- **Row order is display order.** `metric_order` is the first-seen `id` order of
  a ticker's snapshot rows; chain nodes and factor tags also render in `id`
  order. Operational rule: INSERT in the order you want to see; to change
  wording, UPDATE the row in place — delete-and-reinsert changes ids and
  therefore order.
- **Market cap is a snapshot like any other**, except
  `metric_key = 'market_cap_cr'` feeds `MARKET_CAP_CR` (newest per ticker) and
  is excluded from `metrics` / `metric_order`.
- **Market-cap snapshot retention (Session R, 16 Jul 2026).** The nightly
  `market_cap_cr` series is pruned by `2026-07-16_snapshot_prune.sql`: keep
  every row from the last 90 days plus each company's first-of-month row
  forever, delete the rest. Scoped to `market_cap_cr` only — the 492 business
  bindings and the newest reading (what the site shows) are never touched, so
  the chip is invariant. Idempotent standing maintenance; a re-run is DELETE 0.
- **`higher_is_better` rides on snapshot rows**; newest wins per metric key.
- **Directions translate.** DB `'upstream'/'downstream'` → app `up`/`down`;
  columns `node_name / tag / note` → `l / t / n`.
- **Bull/bear.** The newest `snapshot_date` *set* per ticker wins, rendered
  `case_order` 1→3. To refresh a company's cases, insert a complete new 3+3 set
  under a new date.
- **Narratives.** JSONB `stages/flows/pairs` pass through as-is; null columns
  are omitted. Map order is `cross_company_narratives.display_order` (integer,
  **nullable**, spaced by 10s, **not unique**), lowest first, ties broken on
  `id`. A NULL means *not placed yet* and renders **last**, never mid-list.
  `display_order` is a **sort key only** — it is read by the waiter's `order=`
  clause and deliberately does NOT enter the `CHAINMAP` object, so the story
  shape the UI eats is unchanged.
- **`verified_on` passes through untouched.** `mgmt_profiles.verified_on` (a
  date column) becomes `MGMT[t].verified_on` as an ISO string; the UI formats
  it for display ("2026-07-09" → "09 Jul 2026").
- **Honest gaps stay honest.** `metric_value` NULL renders "—"; a ticker absent
  from `mgmt_profiles` renders the queued box; a NULL `verified_on` renders
  "—", never a borrowed date.

## Who may read and write what (RLS)

- The browser's **anon key** can only SELECT, and only: `metric_snapshots`
  where `status='verified'`; `tech_geo_tags` where `is_active=true`; the other
  six read-tables in full (including `valuation_inputs`).
  `staged_metric_snapshots` has **no** public read.
- **TWO GATES, NOT ONE (Session T, learned the hard way).** A table is readable
  only if BOTH a GRANT and an RLS policy allow it. Creating a table gives the
  anon role *no* grant, so PostgREST answers **404** — that is what a missing
  grant looks like from the browser, not an empty list. Worse, Supabase's
  project-wide DEFAULT PRIVILEGES then hand anon **ALL** privileges on new
  public tables, so a fresh table can silently carry INSERT/UPDATE/DELETE that
  nobody asked for. RLS blocked those writes (proven: `UPDATE 0`, and INSERT
  refused with *new row violates row-level security policy*), but one gate is
  not the standard. **Every new table must therefore ship three things: an RLS
  SELECT policy, an explicit `GRANT SELECT`, and a REVOKE of
  INSERT/UPDATE/DELETE/TRUNCATE from anon and authenticated.** Add
  `NOTIFY pgrst, 'reload schema';` or the API layer keeps serving its cached
  table list. `GRANT` adds a privilege and never removes one — only `REVOKE`
  takes privileges away.
- All writes use the **service_role key**: GitHub Actions for numbers, the
  founder in the SQL Editor for sentences. **Machines refresh NUMBERS; only
  humans write or verify SENTENCES.**

## What the self-tests enforce (`js/selftest.js`)

Ticker equals key; `name`, `sector`, `compare_group`, `as_of`, `business_core`,
`source_note`, `moat_note`, `value_chain.position` present; ≥1 factor with a
valid type; `bull` and `bear` non-empty; every `metric_order` key exists in
`metrics` AND in `HIGHER_IS_BETTER`; `compare_group` exists in `GROUP_LABELS`;
a positive market cap per ticker; ≥1 up and ≥1 down chain node, labelled, tags
valid; no orphan tickers in caps/chains/MGMT; every force matches ≥1 company;
every story well-formed (pairs for ownership; otherwise ≥2 stages and
flows = stages−1, every ticker real); MGMT rows complete, `promoter_pct` 0–100.

## The valuation rule (Session T)

Valuation is **context, read after the business is understood** — never a
buy/sell signal. It sits second-to-last on the company page, above only News,
by design. The panel states what the market is paying and what that is measured
against; it never renders a verdict, and the words *cheap*, *expensive*,
*undervalued*, *overvalued*, *buy* and *sell* do not appear in it. That is
asserted in the panel's test harness, not merely intended.

**Numerator by machine, denominator by human.** The nightly robot supplies only
today's price (a market observation, like market cap). Every denominator —
TTM EPS, book value per share, TTM EBITDA, net debt — is read from the company's
own filed results to the OPERATING_MANUAL §3 standard and stored in
`valuation_inputs`. **No verified denominator, no ratio, ever.** The panel says
"awaiting verification" instead of printing a guess.

**The lens decides which ratios describe a business.** `ev_ebitda_applicable`
is FALSE for all 26 financials: for a lender, borrowing is raw material, not
leverage. `lens_note` carries the per-business nuance (P/EV for life insurers,
EV/EBITDA(R) for telecom and aviation, sum-of-the-parts for conglomerates,
inventory-accounting distortion for developers). A lens change is a Table Editor
edit, never a ship. The panel distinguishes the two silences: *not applicable
for this business* (the lens says no, and says why) versus *awaiting
verification* (the denominator is not checked yet).

**Refusals are features.** No ratio is written for a loss-making company
(negative EPS produces a negative P/E, which reads like "cheap" and means "did
not earn"), for negative book value or negative EBITDA, or for any answer
outside a sane fence. Peer comparison uses the **median** and stays silent below
three peers, because a "typical" figure drawn from two companies is typical of
nothing.

**The four display-only keys.** `price_inr`, `pe_ttm`, `pb`, `ev_ebitda` are
written nightly into `metric_snapshots` and are **display-only**, exactly like
`market_cap_cr`: `js/data.js` keeps them out of `metric_order` via
`VALUATION_KEYS` / `isDisplayOnlyKey()`, and `js/selftest.js` counts the chip's
bindings by walking `metric_order`. **The 492 is therefore invariant under any
number of nightly valuation rows** — proven by harness with ratio rows present
and absent. Adding a NEW nightly key REQUIRES adding it to `VALUATION_KEYS` in
the same breath, or the chip moves the next morning.

## What is **not** data (stays as code)

- **`FORCES`** (`js/forces.js`) — 14 macro forces; holds RegExp, so it is code.
- **`GROUP_LABELS`** (`js/compare.js`) — 27 peer groups; holds functions.
- **`CHAINMAP` moved OUT of code in Phase 4:** new stories are database rows in
  `cross_company_narratives` — adding one needs no deploy.
- **The home shell (Session Q-UI, 16 Jul 2026) is layout, not data.** The **Menu** lives at app
  level (a fixed `.menu-rail`, not inside `#home-page`) so it survives page
  switches; it **docks** as the left column on Home and becomes a left-edge
  pull-tab **drawer** on inner pages + mobile. The single switch is the body
  class **`on-home`**, kept in sync by a MutationObserver on every `.page`’s
  `class` — so no other page file references the menu. The live-factors feed is
  the same `tech_geo_tags` data as before, now rendered as a **scrollable
  newest→oldest list** (no marquee). Data shapes are unchanged by this session.

## The parachute

There is no local-JSON fallback anymore. To rebuild the entire database from a
blank project: run `1_SCHEMA_complete.sql` then `2_DATA_complete.sql`
(idempotent + all-or-nothing), then the dated migrations in `/sql` **in
filename order** — currently `2026-07-09_flag5_verified_on.sql` (adds +
backfills `verified_on`), `2026-07-11_mgmt_batch2_private_banks.sql`
(Session G's 5 private-bank mgmt records) and
`2026-07-11_mgmt_batch3_nbfc_insurance.sql` (Session H's 5 NBFC/insurance mgmt
records), `2026-07-11_mgmt_batch4_it_auto.sql` (Session I's 7 IT/auto mgmt
records), `2026-07-11_mgmt_batch5_pharma_health.sql` (Session J's 5
pharma/health mgmt records), `2026-07-11_mgmt_batch6_metals_cement_infra.sql`
(Session K's 6 metals/cement/infra records) and
`2026-07-11_mgmt_batch7_consumer_newage.sql` (Session L's 7 consumer/new-age
records — backlog complete at 107), then
`2026-07-12_session_m_flag_repair.sql` (closes the two [VERIFY] flags pasted
into production: SUNPHARMA's Organon clause upgraded to the signed 26-Apr-2026
agreement, INDIGO's derived-figure caveat rewritten in house style), then
`2026-07-14_ltim_peer_group.sql` (Session O: moves LTIM's `compare_group` from
the solo "IT Services" bucket into "IT"; guarded on ticker + current value, so
a re-run is UPDATE 0), then
`2026-07-14_narratives_display_order.sql` (Session N: adds + backfills
`cross_company_narratives.display_order`; its Part B is order-preserving, its
Part C is the curated renumber), then
`2026-07-15_indigo_shp_exact.sql` (Session P: the filed Mar-2026 SHP figure —
four value-guarded UPDATEs replacing the derived 40.48 with 41.57 everywhere
the number lived; supersedes the repair file's commented-out Part D), then
`2026-07-15_indigo_source_relabel.sql` (Session Q Item 0: one value-guarded
UPDATE correcting INDIGO's source_note attribution — the "founder-verified"
label becomes the four-source cross-verification actually performed; filename
order already replays it after the exact-figure file, `shp_exact` sorting
before `source_relabel`), then `2026-07-16_snapshot_prune.sql` (Session R: standing maintenance prune of the nightly `market_cap_cr` series — keep the last 90 days plus each company's first-of-month row forever, delete the rest; scoped to `market_cap_cr` only, so the 492 business bindings and the newest reading stay untouched and the chip is invariant; idempotent, a re-run is DELETE 0, and on a fresh rebuild it finds nothing old enough and no-ops). The
then the three Session-T files in order: `2026-07-17_valuation_inputs.sql`
(creates `valuation_inputs`, seeds 107 rows with the lens set — EV/EBITDA off
for the 26 financials — and every denominator NULL; idempotent via
ON CONFLICT DO NOTHING, so a re-run inserts 0 and never clobbers a denominator a
human has since filled), then `2026-07-17_valuation_inputs_expose.sql`
(GRANT SELECT to anon/authenticated/service_role + `NOTIFY pgrst`), then
`2026-07-17_valuation_inputs_lockdown.sql` (REVOKEs the INSERT/UPDATE/DELETE/
TRUNCATE that Supabase's default privileges had silently granted anon). All
three are additive and re-runnable; the expose and lockdown files must follow
the create file, and lockdown must follow expose. The
narratives file must run before a rebuilt database serves `data.js`, which
orders by its new column. The order
is not cosmetic twice over: the Batch-2 through Batch-7 files write
`verified_on`, so the flag-5 file must have created the column first; and
Batches 5→6→7 are count-chained (pre-flights expect 89/94/100), so they must
run in that order. The repair file only ever rewrites sentences; the two 14-Jul files touch
different tables, so their mutual order is free; the 15-Jul file replays last
and rewrites what the repair file's Part D had left pending. (Rows inserted after the flip and *not* carried by a dated
migration — e.g. Session E's 8 mgmt records — come back from
`investorlens-backups`.) To resurrect the pre-Phase-4 world: revert the flip
commits on `main` and restore the old five tables from `investorlens-backups`.

## Counts as of the flip (8 Jul 2026) — the checkable state

107 companies · 599 metric snapshots (107 market-cap + 492 business; 21 honest
NULLs) · 518 chain nodes · 321 factor tags · 642 bull/bear (3+3 × 107) ·
64 mgmt profiles · 4 narratives · staging empty.
