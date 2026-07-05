# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phase 1 — The Great Split: DONE.** (17 small files, self-tests identical to V2.6.)
- **Phase 2 — Data moves into Supabase: CODE DONE + PROVEN. Waiting only on the
  founder's two pastes.** The five tables, the seed loader, and the new waiter
  (`data.js`) are all written and verified end-to-end on a real PostgreSQL 16:
  the tables load with zero errors, the anon key can read but **cannot** write
  (RLS tested), and a byte-level round-trip test rebuilt the site's in-memory
  data from the database and compared it to V2.6's originals — **0 differences**
  across all six globals (295 metrics incl. the 21 honest NULLs, 275 chain
  nodes + 4 map groups, 15 mgmt records, tri-state higher_is_better, ₹/— intact).

## What changed this pass (commit these 7 files)

```
sql/schema.sql   NEW — creates the five tables + RLS read-only policies
sql/seed.sql     NEW — one-time load of the entire V2.6 seed (idempotent)
js/config.js     filled: real project URL + anon key, dataSource:'supabase'
js/data.js       loadData() gains the supabase branch (local-json kept as parachute)
js/map.js        one word: const CHAINMAP → var, so the DB's map groups replace
                 the literal in supabase mode (the literal stays as fallback)
CONTRACT.md      v1 — now describes the five tables + the in-memory shapes
STATE.md         this file
```

## Founder checklist — finish Phase 2 (~10 minutes)

1. **Supabase dashboard → SQL Editor → New query** → paste **all of
   `sql/schema.sql`** → Run. Expect *"Success. No rows returned."*
2. **New query** → paste **all of `sql/seed.sql`** → Run (it's ~400 KB of
   INSERTs — one paste is fine). The bottom of the result must read exactly:
   **companies 58 · metrics 295 · factors 174 · chains 279 · mgmt 15.**
   Anything else: change nothing, paste me the error.
3. **GitHub** → upload/replace the 7 files above (drag folders in
   *Add file → Upload files* to keep the `sql/` and `js/` paths). Commit.
4. Open the live site, hard-refresh (Ctrl/Cmd+Shift+R). It must look **exactly**
   as before, and the home status chip must still say
   *58 companies · 295 metric bindings · 14 forces · 85 exposure links ·
   4 value-chain maps · 15 verified management records* with 0 failures.
5. **The acid test** (the plan's "done when"): delete the `/data` folder on
   GitHub in one commit → hard-refresh → **nothing changes.** The site is now
   living off the database. (Undo = revert that commit.) Only do this after
   step 4 looks perfect; keeping `/data` an extra week costs nothing.

## Emergency parachute

`js/config.js` → `dataSource: 'supabase'` ↔ `'local-json'`. One word, one
commit, and the site runs on the frozen JSON seed again (needs `/data` present).

## Verified this pass (future chats: don't re-check)

- `schema.sql` + `seed.sql` run clean twice on PostgreSQL 16 (idempotent),
  `ON_ERROR_STOP` the whole way.
- RLS: as `anon`, SELECT works; INSERT → *permission denied*. The master
  (service_role) key never appeared anywhere; it stays in GitHub Secrets.
- Round-trip proof: DB rows → `loadData()` → deep-compare vs V2.6 originals =
  **0 diffs**; `local-json` fallback also boots 58 companies with the map
  literal intact.

## Things a future chat must know (delta on the Phase 1 notes)

- Boot unchanged: `config → data → home → company → compare → forces → map →
  selftest`, then `loadData().then(init)`.
- `metrics` keeps **every** `snapshot_date`; `data.js` shows only the latest per
  `(ticker, metric_key)`. Never assume one-row-per-metric — history is the
  point (free trend charts later).
- **CHAINMAP is now database rows** (`chains` where `kind='map'`) in supabase
  mode; the `map.js` literal is fallback only. Adding an inter-company chain =
  INSERT one row. No code ships.
- Supabase free projects pause after ~7 idle days. Until Phase 3's nightly ping
  exists, any visit to the site (or dashboard) during the week resets the timer.
- All writing happens in the Supabase dashboard (Table Editor / SQL) or later
  via the robot's service key. The website's anon key *cannot* write, by design.

## Next single concerns (pick ONE per chat)

1. **Phase 3 — the robot wakes up:** `etl/refresh.py` (nightly market-cap
   refresh + keep-alive ping) + `etl/refresh.yml` + `etl/backup.yml` (weekly
   full dump to the private repo). Done when mcaps change overnight untouched.
2. **Phase 4 — data mission, DB-native:** §5 management cohort 2 (remaining 43
   companies) as INSERT sessions; then §8 Growth, §9 Valuation; **Q1 FY27
   refresh as results land from mid-July** — new `snapshot_date` rows, site
   updates instantly.
3. *(Optional tidy, after the robot runs stable for a week:)* retire the
   `local-json` branch in `data.js` + the `map.js` literal; CONTRACT → v1.1.

## Counts (CONTRACT.md header must always match)

58 companies · 295 metrics (21 honest NULLs) · 174 factors · 279 chain rows
(275 nodes + 4 maps) · 15 mgmt · 50 metric keys with ranking direction.

## Changelog

- **v3.0 / Phase 2 (this pass):** Five Supabase tables created (RLS: world may
  read, nothing may write via anon) and seeded with the entire verified V2.6
  dataset; `data.js` reads the tables and rebuilds the exact in-memory shapes
  (round-trip-proven, 0 diffs); `map.js` CHAINMAP now DB-sourced; parachute
  fallback retained. Mission unchanged: business understanding first —
  valuation still deliberately has no table.
- **v3.0 / Phase 1:** Carved V2.6 into the file map; data to local JSON
  (lossless); self-tests pass identically; live on GitHub Pages.
