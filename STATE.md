# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **Phase 1 — The Great Split: DONE.** (Small files; self-tests identical to V2.6.)
- **Phase 2 — Data moved into Supabase: DONE ✅ (acid test PASSED).**
  Founder-confirmed on 5 Jul 2026: Table Editor shows the correct counts
  (companies 58 · metrics 295 · factors 174 · chains 279 · mgmt 15); the live
  site hard-refreshes to the correct status chip; and the `/data` folder is
  deleted from the repo — so the site is provably living off the database, not
  a local fallback.
- **Phase 3a — The robot's nightly refresh + ping: DELIVERED, awaiting first run.**
  New files `etl/refresh.py` + `.github/workflows/refresh.yml`. Green when a
  manual "Run workflow" changes `companies.market_cap_cr` and the numbers move
  on the live site.

## What changed this pass (commit these files)

```
etl/refresh.py                    NEW — nightly: reads companies (=the ping),
                                  fetches each market cap, writes market_cap_cr.
                                  Touches NO qualitative field (mission lock).
.github/workflows/refresh.yml     NEW — 02:00 IST schedule + manual Run button.
                                  MUST live in .github/workflows/ (not etl/) or
                                  GitHub ignores it. (Corrects Plan v3 §4 map.)
STATE.md                          this file
```

## Founder checklist — light up Phase 3a (~10 minutes)

1. **GitHub → Add file → Create new file.** In the filename box type exactly
   `etl/refresh.py` → paste the whole `refresh.py` → **Commit**.
2. **Add file → Create new file** again. Filename box, type exactly
   `.github/workflows/refresh.yml` → paste the whole `refresh.yml` → **Commit**.
   (Typing the slashes creates the folders automatically.)
3. **Actions tab** → left side, click **"Nightly market-cap refresh"** →
   **Run workflow ▾ → Run workflow** (this is the manual test button).
4. Watch it go green (~2–3 min). Open the run log; the last lines should read
   `Refreshed N/58 …` and `Done.`
5. **The Phase-3a acid test:** hard-refresh the live site. The market-cap
   numbers on the cards/ticker should now reflect today's values. If they
   moved untouched by human hands, the robot is alive. ✅

## Emergency parachute (CORRECTED)

The old note said "flip `dataSource` to `local-json`." **That no longer works**
— `/data` is deleted, so `local-json` mode would 404 and blank the site. The
real rollback now is: **on GitHub, revert the commit that deleted `/data`**
(one click) — that restores the frozen JSON seed, then flip the flag if needed.
(Optional tidy later: correct the stale comment in `js/config.js` to say the
same, and retire the dormant `local-json` branch — see Next concerns #3.)

## Verified this pass (future chats: don't re-check)

- `refresh.py` compiles cleanly; its network-free logic is unit-tested:
  ticker→Yahoo symbol (`HDFCBANK`→`HDFCBANK.NS`, BSE→`.BO`), the INR→₹-crore
  conversion (÷1e7, e.g. 11.5e12 → 1,150,000 cr), and the sane-fence that
  rejects junk (too-small / absurd values return None, never overwrite good data).
- `refresh.yml` parses; cron `30 20 * * *` = **02:00 IST**; has a manual
  `workflow_dispatch` Run button for testing.
- The live Yahoo fetch itself can only be proven by the first Action run
  (Yahoo is unreachable from the build sandbox) — that IS the acid test above.

## Things a future chat must know

- **The robot's target is `companies.market_cap_cr` only.** The UI reads market
  cap from there (→ `SEED[t].market_cap_cr`), so updating that one column moves
  the ticker, cards, forces-ranking and company view. Nothing else.
- **Mission lock holds:** the robot refreshes a machine-verifiable *number*
  (company size). It must never write `business_core`, `value_chain*`,
  `moat_note`, `factors`, or `mgmt` — those stay human-verified in sessions.
- **Real-world risk:** free Yahoo data gets rate-limited (HTTP 429), worse from
  shared cloud IPs like GitHub runners. Handled by design: partial failures keep
  yesterday's numbers (site never breaks); a total blackout exits non-zero so
  GitHub emails you, and the DB was already pinged so it stays awake.
- Supabase free projects pause after ~7 idle days; the nightly `GET companies`
  in the robot is the keep-alive ping.
- `metrics` still keeps every `snapshot_date`; `data.js` shows only the latest
  per (ticker, metric_key). History stays free for future trend charts.

## Next single concerns (pick ONE per chat)

1. **Phase 3b — the weekly backup:** `.github/workflows/backup.yml` dumps all
   five tables to JSON and commits them to a **private** repo (Supabase free
   tier keeps no backups). Phase 3 is fully "done" when a backup file appears
   there AND mcaps refresh nightly.
2. **Phase 4 — data mission, DB-native:** §5 management cohort 2 (remaining 43
   companies) as INSERT sessions; then §8 Growth, §9 Valuation; the Q1 FY27
   refresh as results land from mid-July — new rows, site updates instantly.
3. *(Optional tidy, after the robot runs stable for a week:)* retire the
   `local-json` branch in `data.js` + the `map.js` literal; fix the `config.js`
   parachute comment; CONTRACT → v1.1.

## Counts (CONTRACT.md header must always match)

58 companies · 295 metrics (21 honest NULLs) · 174 factors · 279 chain rows
(275 nodes + 4 maps) · 15 mgmt · 50 metric keys with ranking direction.

## Changelog

- **v3.0 / Phase 3a (this pass):** Added the nightly robot — `etl/refresh.py`
  (reads companies = keep-alive ping; fetches each company's market cap from a
  free source; writes `companies.market_cap_cr` + `fetched_at`/`updated_at`;
  touches no qualitative field) and `.github/workflows/refresh.yml` (02:00 IST
  + manual Run). Corrected the workflow location (must be `.github/workflows/`,
  not `etl/`) and the emergency-parachute note (revert the /data-delete commit,
  since `local-json` no longer has files to read). Mission unchanged.
- **v3.0 / Phase 2:** Five Supabase tables created (RLS: world reads, anon may
  not write) and seeded with the entire verified V2.6 dataset; `data.js` reads
  the tables and rebuilds the exact in-memory shapes (round-trip-proven, 0
  diffs); `map.js` CHAINMAP now DB-sourced. Acid test passed.
- **v3.0 / Phase 1:** Carved V2.6 into the file map; data to local JSON
  (lossless); self-tests pass identically; live on GitHub Pages.
