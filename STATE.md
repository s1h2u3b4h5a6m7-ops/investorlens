# STATE.md — the briefing (read me first, every chat)

*Start every new chat with: "Read STATE.md and CONTRACT.md. Today's single concern: ___. Files involved: ___. Proceed."*

---

## Where we are

- **UI-2 ADOPTION ARC: SHIPPED (Sessions 1A–8 + sticky addendum, 28–31 Jul
  2026). Session 9 (polish + flag decision) OPENED, code not yet written.**
  The site was re-skinned screen by screen, straight on `main`, `storyMode:true`
  throughout, ending working after every session. Live bytes at this commit:
  `css/components.css` 89,102 · `js/home.js` 37,659 · `js/story.js` 60,828 —
  every session's landed files byte-diffed IDENTICAL to what was delivered.
  **No SQL in any session of the arc; parachute 20/20 throughout.** Chip
  invariant word-for-word; 492 proven structurally unaffected by news
  (`selftest.js` contains no reference to `NEWS`). Full arc record below in
  “The UI-2 arc”; lessons in “Lessons the UI-2 arc added”; remaining Session 9
  work in the arc section's OPEN list. Next commit is **v6.8**.
- **Phases 1–4: DONE.** The site is live on the **ten**-table schema with
  **107 companies** (flip completed in the early hours of 8 Jul 2026 IST;
  `valuation_inputs` added in Session T, 17 Jul 2026).
- **VALUATION panel: DONE (Session T, 17 Jul 2026).** §9 is live for all 107:
  nightly price + market cap, lens-aware P/E · P/B · EV/EBITDA that appear only
  once a human-verified denominator exists. Denominators are all NULL today, so
  the panel says "awaiting verification" — honestly, by design. **The four
  valuation keys are display-only and can never move the 492.**
- **NEWS & SENTIMENT panel: DONE (Session U, 22 Jul 2026).** §10 is live for all
  107: a `news_items` table filled by its own daily robot (`etl/news_refresh.py`,
  workflow `news.yml`), each headline machine-tagged **tailwind/headwind/neutral**
  by a fixed, re-checkable word list, shown newest-first with a plain tone tally
  and **no verdict** (no cheap/expensive/buy/sell — asserted in harness). The
  site's one openly non-verified surface: a separate table behind its own RLS,
  read into its own `NEWS` pocket that **never touches `metric_order`, so the 492
  is invariant** (harness-proven with news present and absent). The panel shows an
  honest "no headlines yet" state until the robot's first run populates it.
- **GROWTH & FUTURE VIEW: DONE (Session V, 22 Jul 2026) — THE COMPANY PAGE HAS
  NO PLACEHOLDERS LEFT.** §8 was the last "coming soon" on all 107 pages. It now
  answers *which way is this business moving, and what is pushing it right now*,
  built **entirely from already-verified rows** — no new table, no new fetch, no
  data mission. Selection is a fixed key-name rule (`growth`/`cagr` → measured
  growth; `ORDER_BOOK_HINTS` → forward-booked work, tested first). On the real
  107-company data: **104 show measured growth, 18 show an order book, 3 show the
  honest "nothing verified yet" line** (IOC, LICI, SIEMENS), 107/107 render.
  Analyst consensus, estimates and price targets are **excluded as a stated
  position printed on the page**, not deferred as a gap. **JS-only session: no
  SQL, no migration, no grant — 492 proven invariant before and after render.**
- **THE ACID TEST IS NOW ONE STRING (Session W, 22 Jul 2026).** The chip is
  built by `chipText()` in `js/home.js` and carries **six** counts:
  `● data checks: 107 companies · 492 metric bindings · 14 forces · 139 exposure links · 4 value-chain maps · 107 verified management records`
  The console line in `js/selftest.js` carries the same six in the same order;
  a harness asserts they agree. Previously the page rendered **four** counts
  ending *verified promoter records* while the console rendered **six** ending
  *verified management records* — both were quoted as "the chip" in different
  documents, and Session V was run against a STOP condition the site could not
  satisfy. `forceLinks` (139) and `mapChains` (4) now have a visible surface for
  the first time. **JS + CSS + docs only; no SQL, no data change.**
- **§2 HONESTY CAVEATS: COMPLETE — 107/107 (Session Y, 23 Jul 2026).** The 14
  missing `value_chain_note` rows (13 lenders + ITC) are written: for a lender
  the chain is deposits → underwriting → credit, and each note names the
  metrics that measure THAT business; ITC's explains the four-business
  structure behind the cigarette chain §2 traces. The caveat was the site's
  one silently-optional surface (`vc.note ? … : ''` renders nothing when NULL)
  — every §2 is now deliberate, none accidental. Last content gap before the
  UI lane.
- **UI-1 PAGE TRANSITIONS: DONE (Session Z, 23 Jul 2026) — AND THE SITE NOW HAS
  A ROUTER.** Opening verification of the UI lane found that page switching was
  hand-written in FIVE places with THREE different lists of pages to switch off:
  `forces.js` omitted `map-page`; `compare.js` omitted `forces-page` and
  `map-page`. Every call site was traced before this was called a bug — it was
  **not** one, because every entry into Compare and Forces happened from Home or
  the company page, so the omitted pages were already inactive. It was safe by
  accident of which buttons existed, and `.page.active{display:flex}` means two
  `active` pages render **stacked**. UI-2 will want a force link from inside a
  company page, which is exactly the click that would have shipped the bug.
  `showPage(id, dir)` in `js/home.js` is now the single switch; it reads the page
  list from the DOM, so **a 6th page needs no router change** (harness-proven by
  adding one at runtime). Transitions are **enter-only** — the incoming page
  animates, nothing animates out — because an exit-then-enter transition needs a
  timer and a cleanup step, and a dropped cleanup strands the site blank or
  doubled. Also shipped: `.pane-in` made real (see lessons), a capped card
  stagger, press feedback, all inside `prefers-reduced-motion`. **JS + CSS only:
  no SQL, no migration, no grant, no data change — chip proven byte-identical
  before and after, and `selftest.js`/`data.js` were not delivered at all.**
  Founder confirmed live: forward from the right, back from the left, section
  switching visible, card hover-lift intact, no stacked pages.
- **UI-2a FOUNDATION + ROLLBACK: DONE (Session AA, 24 Jul 2026).** UI-2 ships as
  a scoped overlay behind `CONFIG.storyMode`. **As of the close of Session 2e it
  is live and ON** — the founder left it `true` on `main` after review, so UI-2 is
  now the site people see. Any session opening after this must expect
  `storyMode:true` in the opening verification and must NOT report it as a
  defect. The rollback is still one word, and still exact except the one declared
  `#map-page` selector.
  `js/story.js` (new) adds the class `story` to `<body>` only when the flag is
  strictly `true`; every UI-2 rule is written under `body.story`, so with the
  flag off the new rules cannot match and the site is the site it was.
  Also landed: a type + spacing scale in `theme.css` (16 tokens, declared and
  read by nothing yet, so 2a moves no pixel), a static page wash, and `/preview/`
  with three self-contained design prototypes for on-device review.
  **Founder confirmed all four checkpoints live, including flipping the switch
  true and back to false with no residue.** The UI-2 queue from here: 2b company
  chapters · 2c navigation model + nav stack · 2d Home hero · 2e cards + icons
  · 2f What changed · 2g harden + sunset the old path · 2h final polish.
- **UI-2b COMPANY CHAPTERS: DONE (Session AB, 24 Jul 2026).** In story mode the
  ten sections become one scroll: a grouped pill rail (*The business* §§1-4 /
  *The judgement* §§5-10) with hand-drawn marks and § badges, sticky chapter
  headings, a reversible heading wipe, one-way body reveals, the value chain
  drawing itself at 260ms a node, counters firing per chapter on entry, and a
  narrow-screen pill strip. **The §4→§5 gate was cut** at the founder's request
  — it interrupted the scroll — and replaced by a change of ground tone.
  **The scroll-spy mismatch is fixed**: a chapter is current only once its top
  passes **62%** of the canvas, so the rail never renames while the previous
  section still fills the screen. `js/company.js` changed by exactly one guarded
  hook; `showSection(0)` survives in the `else`. Chip invariant, flag still
  **off** on `main` — deliberately, so the live site is not half-migrated while
  Home and the tabs are still the old UI.
- **JUN-2026 SHP SWEEP: ATTEMPTED, CORRECTLY ABANDONED — and deferred behind
  v1 (Session 2h, 25 Jul 2026).** Filings were due ~21 Jul, so the sweep was
  opened. It does not proceed, and the reason is the finding:
  **the quarter has not landed in any source the project trusts.** Trendlyne —
  designated in Session Q as the only reliable quarter-labelled channel — still
  shows `Mar 2026 (latest)` for both Tier-1 names checked (INDIGO, BANDHANBNK),
  with no Jun-2026 entry. Screener *appears* to carry June for BANDHANBNK
  (37.5%, "−1.44% over last quarter", which reconciles: 38.98 − 1.44 = 37.54)
  but only to **one decimal**, where `promoter_pct` is a two-decimal field —
  entering it would mean inventing a digit or storing something less precise
  than what it replaces. Kotak Neo was caught serving INDIGO's rounded
  **Mar**-2026 figure under a **Jun '26** label. Angel One served Dec-2025 as
  current. Ingestion is uneven and mid-flight.
  **Founder decision: the sweep now sits BEHIND v1, not in front of it.** It is
  no longer a parallel lane racing the build; it resumes after ship.
- **BANDHANBNK Mar-2026 CORRECTED (Session 2h).** The sweep attempt surfaced a
  real error in existing data. `promoter_pct` held **39.0**, sourced — per its
  own `source_note` — from "Kotak Neo + Share.Market trackers". The filed
  Mar-2026 promoter total is **38.98%** (628,023,845 shares: BFHL 625,978,369 /
  38.86% plus Bandhan Mutual Fund 2,045,476 / 0.13%). One migration,
  `2026-07-25_bandhanbnk_mar26_exact.sql`, two value-guarded UPDATEs: the number
  and the sentence that carries it, including re-sourcing the note off the
  aggregator. `capital_note` deliberately untouched — its 40.00% → 37.93% is
  BFHL alone across the sell-down, dated after the 31-Mar snapshot, and remains
  correct. Dry-run twice on PostgreSQL 16.2 against a fixture built from live
  bytes: run 1 UPDATE 1/1 with nine PASS, run 2 UPDATE 0/0 with nine PASS. Row
  count unchanged at 107, so the acid-test chip is unaffected by construction.
- **V1 QA: PASSED, AND `/preview/` RETIRED (Session 2i, 25 Jul 2026).** A new
  standing instrument, `audit-v1.js`, walks all 107 company pages plus every
  force, map and ledger row and asserts what the platform actually promises.
  **13/13, zero failures.** What it checked: all 107 pages render without
  throwing; every figure on screen exists in that company's stored text; no NULL
  metric renders as `0`; every promoter % on screen equals its stored row; no
  buy/sell language anywhere; the chip equals the REAL counts rather than a
  literal; all 14 forces open with evidence; the maps render; and every reporting
  period is shown verbatim.
  **Both of its first-run failures were the audit's, not the product's** — and
  saying so is the point. 610 "unsourced" figures were prior-year comparisons
  living in stored `metric_note` prose ("Down from 4.93% a year ago"), because
  the first cut compared only against `metric.value`; 57 promoter mismatches were
  the loop reading the DOM before the render settled. Fixed in the instrument,
  never in the product.
  `/preview/`'s four shipped prototypes are deleted. No code file ever linked to
  them — only CONTRACT — so nothing can break, and the audit asserts that.
- **A CORRECTION TO THE v1 LIST I published in Session 2h.** It named "the 14
  value-chain content caveats" as outstanding. They were **complete on 23 July**
  (Session Y, 13 lenders + ITC), and this document said so in the same file I
  claimed to have read off the repo. Verified now against the data: 14 explicit
  `UPDATE ... value_chain_note` rows, and all 107 companies carry a note — as do
  `business_core`, `moat_note`, `source_note` and `value_chain_position`.
  **The content lane closed on 23 July.** Searching for what remained without
  cross-checking what was marked done nearly cost a session writing notes that
  already existed.
- **UI-2f THE FRESHNESS LEDGER: DONE (Session 2f, 25 Jul 2026).** The tab that
  was called "What changed" now answers the question the platform can actually
  answer. **It cannot be a change log** — `metric_snapshots` stores one verified
  row per metric per reporting period, so there is no before/after to diff, and a
  literal change log would be empty or invented. Session 2d had already written
  the honest version of this on the page: the platform records when a figure was
  written down, not when it started being true.
  What it does instead: **107 rows, oldest first**, each showing the company's
  reporting period exactly as a human wrote it, when the figures were pulled, and
  when the management record was last checked. The finding that justifies the
  page: **27 companies still sit on Q3 FY26 (quarter ended 31 Dec 2025) while 77
  are current to 31 Mar 2026** — two reporting periods behind, and nothing else
  on the site said so. Stale rows carry a red left edge. The live-factor feed
  from 2d survives below it as a second section.
  `periodEndOf()` is deliberately timid: it extracts a sortable date only where
  the label plainly contains one, returns null otherwise, and never rewrites the
  label. Tab renamed **Freshness**; heading **Data freshness**. Three files, JS +
  CSS only — **`data.js` untouched**, so the 492 pipeline never moves. 27/27 new
  harness plus 24/24, 18/18 and 5/5 regression.
  **One defect shipped in the first cut and was caught by the founder's own
  review output.** The row printed "pulled 25 Jul 2026" beside "Q3 FY26 (quarter
  ended 31 Dec 2025)". `companies.fetched_at` is stamped nightly by
  `etl/refresh.py` for every ticker whose MARKET-CAP pull succeeded — it dates
  the price, not the fundamentals — so that line invited a reader to believe
  December figures had been refreshed today, on the one page built to prevent
  exactly that. Fixed before the session sealed: the human `verified_on` date now
  leads as **checked**, the robot stamp follows as **price**, and the note says
  in words what each means. The three stalest companies, from the founder's
  review: **ABB (CY25, ended 31 Dec 2025), AUBANK and AXISBANK (both Q3 FY26)**.
- **V1 READINESS, assessed 25 Jul 2026 (Session 2h) — read off the repo, not
  memory. THREE items remain:** (1) **UI-2f** — What changed, dated rows; much
  reduced, because Session 2d already gave that page all 321 live factors and a
  computed tally, leaving only real chronology from `as_of`/`verified_on`;
  (2) the **14 value-chain content caveats** (writing, not code); (3) **v1 QA and
  soft launch**. **2g-sunset** (delete `/preview/`'s four now-shipped prototypes,
  retire the pre-story path) is optional and gates nothing.
  **Deliberately NOT v1 gates, each re-checked this session:** `valuation_inputs`
  denominators remain all NULL — and the panel is correct as it stands, printing
  `—` through `fmtX()` plus an explicit "Awaiting verification" line rather than
  a guess, under a header that locks valuation to context read *after* the
  business and forbids any cheap/expensive label; `news_items` is empty and its
  panel says the robot writes nightly; IOC, LICI and SIEMENS still render §8's
  honest "nothing verified yet" line and need no code change when their figures
  land; long-run CAGR stays a post-v1 lane. The Jun-2026 SHP sweep sits behind
  v1 by founder decision.
- **UI-2g CARD WEIGHT + TONE: DONE (Session 2g, 25 Jul 2026).** Three things the
  founder asked for after the 2e review, grouped by blast radius (the story-mode
  visual layer, no data):
  (1) **The browse buttons became cards.** `#sector-grid`, `#force-grid` and
  `#compare-grid` are now auto-fill grids of 212px cards, each with its mark in a
  34px tile. `#frc-chips` — the filter row on the force DETAIL page, which reuses
  `.force-btn` — deliberately stays a compact chip row.
  (2) **Force detail became a grid of tone-tinted cards.** `dominantTone()` counts
  stored `tag_type` values; risk and tailwind decide, a tie takes neither side and
  tints neutral. The tone reads as a 3px edge plus a faint left-to-right wash, so
  the text stays legible.
  (3) **The value-chain reveal is quicker** — `.fade-item` runs `.26s` inside the
  layer, down from `.45s`, with no `animation:none` added anywhere.
  Also: **Compare groups gained marks.** 22 of the 27 group names are spelled
  exactly like a sector and resolve through `SECTOR_ICON` for free; `GROUP_ICON`
  maps the other five, four by reusing an existing mark (Banks, IT, NBFCs, PSU)
  and one new glyph drawn for **Defence & Aerospace**.
  Five files, JS + CSS. No SQL, no data change. 24/24 functional, 17/17 paint
  oracle, 55/55 regression, 18/18 honest-failure, 5/5 slow-network.
- **HONEST FAILURE STATE: DONE (Session 2f-hf, 25 Jul 2026).** The defect logged
  at the close of 2e is fixed. The six hero cards now hold `—` until six real
  integers have been read from the rendered chip, and the readout carries four
  states instead of a hardcoded pass: `loading` while the fetch is out, `ok` once
  the chip confirms, `failing` when the chip reports a failed self-check, and
  `failed` — red, with a Retry — when `loadData()` rejected. Failure is detected
  by observing `#boot-error`, which `index.html` already reveals in its own catch,
  so story.js never touches the promise. Retry is a full reload, because calling
  `init()` twice would re-bind every listener.
  **The boot toast was also lying.** Its text still described Phase-1 local JSON
  files and advised opening the site through GitHub Pages — which the visitor
  already was. It now names the real cause (the database could not be read),
  states plainly that no figure on the page is live, and says no stored data has
  been lost.
  Three files, JS + CSS + one paragraph of copy in index.html. No SQL, no data
  change. 18/18 on a new failure-world harness that reproduces the defect against
  live `main` before proving the fix, plus 55/55 regression and 5/5 slow-network.
  **VERIFIED IN A REAL BROWSER: the `loading` and `ok` states only.** On a
  throttled 3G connection the founder confirmed all six cards hold `—` with a
  dim `loading data…` readout while the fetch is out, then fill to the six
  counts with a green verified line — which exercises the em-dash rendering, the
  readout wiring and the loading→ok transition on real hardware.
  **The `failed` state is BROWSER-VERIFIED (25 Jul 2026, Session 2h).** Confirmed
  on the live site by blocking only the Supabase host in DevTools → Network →
  request blocking (pattern `uhqyhsniwlgivdlxbpoj.supabase.co`) and
  hard-refreshing — the case where **the page loads but its data does not**.
  Observed: all six hero cards at `—` with no zeros anywhere, a red readout
  reading "couldn't reach the data — nothing on this page is live", a working
  Retry, and the boot toast carrying its corrected copy — the database named as
  the cause, no mention of JSON files or GitHub Pages, "No stored data has been
  lost", and `Details: Failed to fetch` captured from the browser. Unblocking and
  pressing Retry reloaded and filled normally. **All four readout states are now
  proven on real hardware; no v1 surface is trusted on harness evidence alone.**
  Recorded for reuse: DevTools *Offline* is the WRONG instrument — taking the
  network down before a refresh stops `index.html` itself loading, so the browser
  shows its own error page and the application never runs at all.
- **RESOLVED (was: OPEN DEFECT) — the app lied when the fetch failed.** Found
  at the very end of Session 2e when a burst of rapid hard-refreshes (the C3
  test) tripped what looked like a Supabase rate limit and `loadData()` rejected.
  With no data, the Home hero renders **`0` in all six cards** and the readout
  prints a **green dot** beside "self-checked on load · last verified —". Both
  are false: `0` is a factual claim that the platform is empty, and a green tick
  is a claim that the self-check *passed*. The signature was reproduced exactly
  in jsdom by failing every fetch with HTTP 429, which is how it was told apart
  from a navigation bug — no navigation defect can empty every tab at once.
  Nothing on screen distinguishes "this platform has no data" from "I could not
  reach the data", which on a platform whose entire promise is that every number
  traces to a verified row is the most damaging failure mode available.
  **The fix is not written.** It needs: `—` not `0` in the cards until real
  counts arrive; a red dot and an explicit "couldn't load data" line instead of a
  green self-checked claim; a retry. `setReadout(true)` is called unconditionally
  in `buildHero()` — that unconditional `true` is the bug, introduced in 2d.
  It is **not** a 2e regression and was not caused by the icon work.
- **UI-2e CARDS + ICONS: DONE, after a defect pass (Session 2e, 24 Jul 2026).**
  A 37-mark hand-drawn sprite (`js/icons.js`, 23 sectors + 14 forces + an "All"
  mark) tags three surfaces in story mode: every company card carries its
  **sector** mark, and the sector-filter and force pills carry theirs. 8 glyphs
  came from the founder-approved prototype, 15 were newly drawn, near-siblings
  drawn to separate at 16px. `SECTOR_ICON` covers all 23 live sector strings with
  a neutral fallback. All decorators are guarded on `body.story` and idempotent;
  the harness proves the three surfaces are byte-identical to a pre-session
  checkout with the flag off.
  **The first cut shipped with four defects, found by the founder in review, two
  of which were mine from 2d.** (1) The sector and force marks were invisible:
  `document.createElement('svg')` builds an XHTML element, not an SVG one — the
  company-card marks used `innerHTML` and rendered, which is why only two of the
  three surfaces failed. (2) The 107-company list never appeared, because a
  `revealCards(cards)` I added to story.js in 2d shadowed `home.js`'s global
  zero-arg `revealCards()`; renamed to `revealHeroCards`. (3) The Home search
  dropdown rendered *behind* the six count cards — equal z-index, later sibling
  wins. (4) The `.drawer-toggle` from the pre-bezel era reappeared at left-middle
  on every story root. Also fixed: the Companies tab inherited `activeSector`
  from the Sectors tab and stayed filtered forever. A **sixth** defect surfaced
  in the re-check: opening the Companies tab while `loadData()` was still in
  flight rendered "Showing 0 companies" and never recovered, because nothing
  re-rendered when the rows arrived. All three data-backed roots now wait on
  `whenDataReady()` and show an honest loading state. 55/55 regression plus a new
  5/5 slow-network harness that reproduces the defect against live `main` before
  proving the fix.
- **UI-2d THE HOME HERO: DONE (Session 2d, 24 Jul 2026).** Home was rebuilt
  inside the UI-2 layer as one symmetric page. The existing aperture
  (`.logo-scene`) is **moved**, not copied, into an injected `.st-hero`, held at
  `scale(3.4)` / `opacity:.14` with its ring still spinning behind a radial
  glow. Headline *"Understand the business. Then look at the price."*; one search
  box matching companies, sectors, forces and value-chain maps grouped by type;
  the acid-test chip promoted to **six symmetric cards that count up on entry**,
  each routing to its own surface; and a quiet instrument readout,
  `● self-checked on load · last verified <date>`, where the date is the newest
  **human** `verified_on` across `MGMT` (ISO strings compared as strings — no
  `Date` object, so no UTC-midnight shift). The 300px rail is suppressed on Home
  (`display:none` + `padding-left:0`), never removed. **The cards do not hold a
  second copy of the counts**: they are parsed out of the rendered
  `#selftest-chip`, so the hero cannot disagree with the chip and prints dashes
  when the chip goes red. Four files, JS + CSS only, no SQL and no data change.
  68/68 harness, run twice — once against the build, once against live `main`.
- **THE ONE UNSCOPED RULE (Session 2d, founder decision).**
  `#map-page{flex-direction:column}` ships **outside** `body.story`. Every other
  page carried that declaration; `#map-page` never did, so
  `.page.active{display:flex}` laid it out as a ROW and `.company-topbar`
  (`flex-shrink:0`) became a tall column glued to the left edge — pre-existing,
  and live on `main` since long before UI-2. The rollback invariant is therefore
  now **"flag off renders identically except this one named selector"**, declared
  by name in CONTRACT and asserted by selector in the harness. Never a general
  relaxation.
- **THE SIX-BANKS DEFECT: FOUND AND FIXED (Session 2d).** The live-factor ticker
  had never shown the newest factors despite a code comment saying so.
  `data.js` reads `tech_geo_tags` in `id.asc` and `buildTicker()` took the first
  18 `(ticker|type)` pairs, so **the same six banks filled the strip on every
  load and 100 companies never appeared once**. Dates do not fix it — the tags
  share one bulk-insert timestamp, so a date sort resolves on `id` and lands
  back on the same six. Breadth does: `buildFactorFeed()` walks one factor per
  company, cycling, market-cap order. Harness-proven that the first 18 rows are
  18 **different** companies. `data.js` was **not** touched — its `id.asc` is the
  display order of §3 on all 107 company pages.
- **LIVE FACTORS MOVED OFF HOME into What changed (Session 2d, founder's call
  over my recommendation).** That page is no longer a placeholder: it renders
  all 321 factors with a computed tally and states plainly that it is ordered
  **for breadth, not by date**, because the platform records when a factor was
  written down, not when it started being true. Value chain also gained the
  `.st-page` chrome so it matches the other five tabs.
- **UI-2c NAVIGATION MODEL: DONE (Session AC, 24 Jul 2026) — five defects, all
  mine, all found by the founder on the live site.** Browsing moved out of the
  cramped Home panels onto five runtime-injected pages reached from a floating
  bezel (Companies · Sectors · Forces · Value chain · Compare · What changed),
  with a navigation trail: Back retraces the path taken, a tab or the brand
  resets it, revisiting a page truncates rather than grows it. `home.js` gained
  one guarded reporting line. Chip invariant; flag still **off** on `main`.
- **OPEN, one line, for 2d: `#map-page` has no `flex-direction:column`.**
  `#home-page`, `#company-page`, `#compare-page` and `#forces-page` all have it;
  the map does not, so `.page.active{display:flex}` lays it out as a ROW — the
  topbar becomes a narrow left column with the back button and title stacked
  inside it. **This is pre-existing, not caused by 2c**; the bezel merely made
  the map a place people go. 2d fixes the axis and gives the map the `.st-page`
  chrome so it matches the other tabs.
- **Robots v2: DONE (Session C, 8 Jul 2026).** Both GitHub Actions robots now
  speak the eight-table schema — details below.
- **New UI: DONE (Session D, 9 Jul 2026).** Bull/bear debate re-housed into
  §9 (per CONTRACT) with the centre "vs" spine; §2 strategic-position card;
  honest §10 placeholder; §5 queued copy now count-driven. Shipped
  byte-verified against `main`; chip text unchanged.
- **Mgmt gaps, Batch 1: DONE (Session E, 9 Jul 2026).** The 8
  government-promoter tickers (BANKBARODA, CANBK, PNB, COALINDIA, NTPC,
  ONGC, POWERGRID, BEL): machine-researched with named sources,
  founder-verified against screener + exchange SHP filings, inserted via
  SQL Editor. Chip confirmed: **72 verified promoter records** (was 64).
  35 of the original 43 gaps remain.
- **Mgmt gaps, Batch 2: DONE (Session G, 11 Jul 2026).** The 5 private banks
  (AUBANK, AXISBANK, BANDHANBNK, FEDERALBNK, IDFCFIRSTB): machine-researched
  with named sources — including AU's own 31-Mar-2026 exchange SHP read at
  source and BFHL's SEBI Reg 29(2) sell-down filing — founder-verified, then
  inserted via SQL Editor. Two of the five have **no promoter at all**
  (FEDERALBNK, IDFCFIRSTB): a fact, recorded as 0%, not a gap left blank.
  Chip confirmed: **77 verified promoter records** (was 72). 30 gaps remain.
- **Mgmt gaps, Batch 3: DONE (Session H, 11 Jul 2026).** The 5 NBFC/insurance
  names (CHOLAFIN, SHRIRAMFIN, JIOFIN, HDFCLIFE, SBILIFE): machine-researched
  with named sources — including HDFC Bank's own Q4 FY26 deck and its FY26
  Reg 31(4) nil-encumbrance filing, HDFC Life's FY26 call transcript, and the
  post-event shareholding patterns of 08-Apr-2026 (SHRIRAMFIN) and 21-Apr-2026
  (JIOFIN) — founder-verified, then inserted via SQL Editor. In **none of the
  five did a promoter sell a share**; four saw a capital event inside 90 days.
  Chip confirmed: **82 verified promoter records** (was 77). 25 gaps remain.
- **Mgmt gaps, Batch 4: DONE (Session I, 11 Jul 2026).** The 7 IT + auto names
  (HCLTECH, TECHM, WIPRO, BAJAJ-AUTO, EICHERMOT, M&M, TMPV): machine-researched
  with named sources — Tech Mahindra's and Eicher's own 31-Mar-2026 exchange
  SHPs read at source, Wipro's and Eicher's FY26 Reg 31(4) nil-encumbrance
  filings, and Wipro's 30-Jun-2026 buyback-extinguishment filing — then
  founder-verified and inserted via SQL Editor. **First non-zero pledges on the
  platform:** M&M 0.02% (40,000 shares, one named individual) and BAJAJ-AUTO
  ~0.01%. Chip confirmed: **89 verified promoter records** (was 82). 18 gaps
  remain.
- **Mgmt gaps, Batch 5: DONE (Session J, 11 Jul 2026).** The 5 pharma + health
  names (CIPLA, DRREDDY, SUNPHARMA, APOLLOHOSP, MAXHEALTH): machine-researched
  with named sources — Dr Reddy's and Max Healthcare's FY26 Reg 31(4)
  nil-encumbrance declarations, Apollo's NCLT scheme filings, and the Mar-2026
  shareholding tables read entity by entity — then founder-verified and
  inserted via SQL Editor. **The pledge batch:** SUNPHARMA 1.42% and RISING
  (two named individuals; the founder's own shares unpledged), APOLLOHOSP 2.49%
  and FALLING (16.30% → 2.49% in three years). Chip confirmed: **94 verified
  promoter records** (was 89). 13 gaps remain.
- **Mgmt gaps, Batches 6 + 7: DONE (Sessions K + L, 11 Jul 2026) — BACKLOG
  COMPLETE.** Batch 6, metals/cement/infra (HINDALCO, JSWSTEEL, TATASTEEL,
  ULTRACEMCO, GRASIM, ADANIPORTS) and Batch 7, consumer/new-age (ASIANPAINT,
  NESTLEIND, TATACONSUM, TITAN, TRENT, INDIGO, ETERNAL). Headlines: JSWSTEEL
  carries the platform's largest pledge (11.81% of the block, six named
  entities, falling from 15.24%); ASIANPAINT has a live multi-entity pledge;
  ETERNAL is the first no-promoter row (promoter_pct = 0 recorded as an
  answer); INDIGO's headline % is derived pending SHP confirmation. Files are
  count-chained: 5 → 6 → 7 pre-flights expect 89 / 94 / 100. Chip after all
  three: **107 verified promoter records — every company covered.** 0 gaps
  remain.
- **Flag 5 closed: DONE (Session F, 9 Jul 2026).** §5's "Verified <date>" is
  now data-driven: `mgmt_profiles.verified_on` (date, nullable) added and
  backfilled (64 × 02 Jul 2026, 8 × 09 Jul 2026, 0 NULLs), the waiter carries
  it (+1 mapping line in `data.js`), and `company.js` prints each row's own
  date — "—" when NULL, never a borrowed date. Migration saved as
  `sql/2026-07-09_flag5_verified_on.sql`; CONTRACT's MGMT shape, translation
  rules and parachute updated. Chip text unchanged. Batch 2 is unblocked.
- **Narratives `display_order`: DONE (Session N, 14 Jul 2026).** Flag 1 closed.
  `cross_company_narratives.display_order` (integer, nullable, spaced by 10s,
  not unique) added and backfilled in the order the site was already showing;
  the waiter now orders by `display_order.asc.nullslast,id.asc` (`data.js:198`,
  1 line changed). Map order is a data decision now — editable in the Table
  Editor, no deploy. Migration saved as
  `sql/2026-07-14_narratives_display_order.sql`. Chip text unchanged.
  **Part C (the curated renumber) was run same day:** map order is now
  power → metals-auto → holding → banca.
- **LTIM peer group: DONE (Session O, 14 Jul 2026).** Flag 2 closed. One
  guarded UPDATE moved LTIM's `compare_group` from the solo "IT Services"
  bucket into "IT" (now 6 members). Pre-flight confirmed "IT Services" held
  ONLY LTIM before the move; post-flight judge: it_services_left = 0. Root
  cause understood, not just patched: `groupsForCompare()` (compare.js:46)
  only surfaces groups with ≥ 2 members, so a solo group renders NO chip and
  company.js:33 hides the compare button — LTIM was un-comparable, not
  mislabelled. No code shipped; the empty "IT Services" label stays in
  GROUP_LABELS on purpose (see Lessons Session O). Migration saved as
  `sql/2026-07-14_ltim_peer_group.sql`. Chip text unchanged.
- **INDIGO exact figure: DONE (Session P, 15 Jul 2026). The Session N+ queue
  is now EMPTY of one-off items.** The derived 40.48 is replaced by the filed
  Mar-2026 SHP total: **41.57%** (160,732,247 shares — IGE 35.69 + Bhatia
  individuals 0.03 + Rakesh Gangwal 4.53 + Chinkerpoo Family Trust 1.32),
  founder-verified against the exchange filing. The old derivation's error is
  now explained, not just replaced: it missed the Chinkerpoo Trust's 1.32%
  (filed RG side 5.85, not 4.78). Four value-guarded UPDATEs in
  `sql/2026-07-15_indigo_shp_exact.sql` — the number lived in FOUR places
  (headline + two prose sentences + source_note), so Part D of the repair file
  alone would have left the page contradicting itself. Part D is hereby
  superseded and stays commented-out forever. Chip text unchanged.
- **New home shell: DONE (Session Q-UI, 16 Jul 2026) — UI only, no DB.** The home
  page was rebuilt for an immersive, symmetric, futuristic feel: a new animated
  **Aperture** logo (metallic ring spins forever; rising bars + spark play once
  and settle lit), an **“InvestorLens India”** wordmark that sweeps in
  left-to-right, a **bigger search bar** with the small tagline below it, and all
  five actions moved into a left **“Menu”** column — docked on Home, a
  left-edge pull-tab **drawer** on inner pages and on mobile. The live-factors
  feed moved into that Menu below a slick separator and is now a **scrollable
  list with hard newest/oldest limits** (the old cross-page marquee is gone). The
  hero now **fills the whole viewport**, content vertically centred, with a
  mirrored top/bottom grid. Two stale “58”s fixed for free (browse-all button
  → data-driven `Object.keys(SEED).length`; map intro no longer hard-codes a
  number). Three files only: `index.html`, `css/components.css`, `js/home.js`.
  Byte-asserted build 18/18; `node --check` + CSS brace balance + ID uniqueness
  green; a jsdom boot ran the real `init()` — 17/17 behaviour checks. Chip text
  unchanged.
- **Architecture: DONE (Session R, 16 Jul 2026) — the repo now matches the
  paperwork.** `OPERATING_MANUAL.md` v3 landed at the repo root (byte-verified);
  the retired `/sql` husk pair was replaced by the underscore-named parachute
  pair; flags 3 and 4 closed; the `market_cap_cr` prune shipped. Chip unchanged.
- The Phase-2 five-table world is retired: the flip emptied its dependent
  tables (rows preserved in `investorlens-backups`, including a fresh manual
  run taken minutes before the flip). The `sql/schema.sql` + `sql/seed.sql` husks were **removed in Session R
  (16 Jul 2026)** and replaced by the current parachute pair
  (`1_SCHEMA_complete.sql` + `2_DATA_complete.sql`); their history stays in git.
- **CONTRACT.md v1** describes the new shapes. It is the menu again.

## The UI-2 arc — Sessions 1A–8, the sticky addendum, Session 9 opened

Written up 31 Jul 2026 as a docs-only commit. The arc ran in two working chats:
Sessions 1A–6 are recorded from the first chat's close summary and spot-checked
against live bytes where marked ✓; Sessions 7–9 were measured directly at this
write-up. Nine sessions shipped, plus one addendum.

### 1A — type, tokens, headline
Google Fonts removed; six self-hosted variable woff2 (Sora, Inter, JetBrains
Mono; Latin + Latin-Extended; 209 KB; SIL OFL 1.1). Two tokens added to the
twelve: `--stale:#F5B544` (out of date, not wrong) and `--chain:#A78BFA`
(value-chain family). Headline became **“Understand the business, not the
ticker.”** in five places (`<title>`, `og:title`, `twitter:title`, story h1,
regenerated `og-card.png`); the `<b>` wraps the FIRST clause ✓. STATE was
already stale at this point and the arc knowingly continued without it.

### 1B — wording pass (copy only; company.js, compare.js, map.js)
§3 states `tag_type` is a stored, human-checked column — not a live reading.
§7: “A short list does not mean a safe business.” Compare legend: “‘—’ means
not disclosed that way — an empty cell is more honest than an estimate” ✓.
Chain evidence: “never inferred from sector codes” ✓. The forces-page tone
note was deferred to Session 6's rebuild.

### 2 — the Chrome tab bar (story.js, components.css)
Left rail and mobile pill row replaced by one two-row bar at every width,
4 (The business) + 6 (The judgement). Active tab drops to the reading's ground
colour and loses its bottom border — a hole through the bar, not a highlighted
pill. `--st-ground` flips at §5 via the scroll-spy's `in-judgement` class ✓.
`--st-strip` is MEASURED from the rendered bar by `syncStrip()` ✓ and written
onto `<body>`; the CSS value is fallback only. ≤900px: one scrollable row.

### 3 — the right-hand digest (story.js, components.css)
`#canvas` became a two-column grid; the aside is the last DOM child so it falls
below §10 on narrow screens — content, never a drawer. **The hard rule: the
digest may never state a figure its section doesn't.** Readings vs N peers
(rank + best-value attribution) and Force exposure (stored tone as a dot);
every row jumps into the section it summarises. Honest empty states verified.

### 4 — peer range track (story.js, components.css)
Coloured run = this company on the peer range; white dot = peer best, withheld
where `HIGHER_IS_BETTER: null` declines the judgement. The range is a rounded
band, not min→max: ~four intervals, low rounds down, high rounds up, never
zero-based (CIPLA −2.8% needs headroom). Competition ranking, tie-aware.
Digest unpinned (a max-height was silently hiding half of it); labels wrap to
two lines. **Compare deliberately untouched** — see the three-scales invariant.

### 5 — strict band bounds (story.js only)
`niceBand()` ✓ now pushes a bound out one more unit when rounding lands it
exactly on the data: `lo < min` and `hi > max` for all inputs. Ten shapes
tested, including both-negative, crossing zero, tiny spread, sub-decimal.

### 6 — Forces + Value chain (index.html, forces.js, map.js, story.js, css)
Forces tab routes straight to `#forces-page` (`moves:null`); the 14-button
chooser is gone. Left index with counts; eyebrow `FORCE N / 14`; three shelves
always drawn, in order **Tailwind · Context · Headwind** ✓ — Context in the
middle because it is neither push; columns equal width ON PURPOSE (sizing by
count would turn a count into a picture of significance). Every card quotes
that company's own stored factor; a disagreeing factor shows its type badge.
Value chain: same shell, chain index left, ONE chain read at a time (all four
were stacked before; the third and fourth were effectively never seen). The
two ownership chains carry no `evidence` field and correctly render no
evidence line. `.frc-body/.frc-index/.frc-main` became shared by both pages.

### 7 — Sectors becomes a ledger (home.js, story.js, components.css)
`#sector-grid` re-skinned from a chip wall to a 23-row ledger — the click
handler was asserted BYTE-IDENTICAL, so “filters do not change” holds by
construction. Order: count-descending, alphabetical tie-break, one compound
comparator (Auto · Financial Services · Power all sit at 7). Each row: mark ·
name · `N of 107` · a rail whose fill is n/total — **a TRUE denominator,
never rescaled; the widest fill is ~14% and that flatness is the finding.**
Nothing typed in: names, counts, denominator all computed from `SEED` at
render (harness-asserted no literal 23 or 107 in the code). The brief said
“Renewable”; the record says **Renewable Energy** — rendering from `SEED`
made the screen right regardless. Reset pill lifted above the ledger, same
`.sector-btn`, same handler. `#sector-grid` lifted OUT of seven rules shared
with `#force-grid`/`#compare-grid` (8 grouped selectors out, 25 id-scoped in,
0 still shared). Third column considered and REJECTED (largest-by-mcap plants
biggest=important; stale-count duplicates the ledger). 34/34 jsdom checks
against the real 107; control run against old bytes fails — the harness
discriminates. css 79,679→85,323 · home 31,141→32,813 · story 57,884→58,063.

### 8 — Freshness becomes two tabs; the headline river (home.js, story.js, css)
Tab 1 **Data currency** is exactly what the page already was — ledger then
Live factors, same builders, same containers. Tab 2 **Headlines** pools the
§10 pocket across all companies, newest-first by plain ISO string compare
(undated sorts last; ticker tie-break — deterministic on every load), capped
at `NEWS_FEED_MAX = 60` with both numbers said in words and counted at render:
“showing the 60 most recent of N held · across M of 107 companies”. Sized
from `etl/news_refresh.py` (107 companies × cap 12, retention 30d — steady
state several hundred to 1,000+ rows), so an uncapped river was rejected
before it was drawn. **The one thing this session refused to build: a
cross-company tone tally.** §10's tally describes one company in context;
pooled across 107 it becomes a sentiment leaderboard — a robot's word count
ranking businesses, the verdict the platform refuses. Harness asserts no
aggregate tally renders and no verdict word appears. Rows open the company
page (the outbound link stays in §10 — you cannot reach the article without
passing the business); no `<a>` inside a `<button>`. Tab switch toggles
`[hidden]` only — never a re-render; the river builds AT the destination
(fourth application of that lesson) behind its own `data-filled` guard, and
an empty render returns 0 so the guard stays unset and the next visit
retries. Caught pre-ship: the news pocket's tone set is
tailwind/**headwind**/neutral while `.st-fdot` only knew risk/tailwind/neutral
— every headwind dot would have been invisible; one rule added. The fence
borders in `--stale` — the token's first consumer. Chip invariance proven
BOTH ways: `metricChecks` identical with `NEWS` populated and `{}`, and
`selftest.js` never references `NEWS` at all. 43/43, twice, identical.
css 85,323→88,408 · home 32,813→37,659 · story 58,063→60,828.

### Addendum — the sticky tab bar (css only, 88,408→89,102)
`.st-t2bar` pinned so the switch stays reachable down 107 rows. `top:0` with
NO bezel offset — `.st-page-body` is the scroll container and `.st-page-head`
is `flex:none`, so the container's top edge already sits below the bezel
(unlike the company page's `.st-head`, which offsets by `--st-strip`). Solid
`--void`, not `.st-head`'s gradient: rows must not ghost through a control.

### Session 9 — opened 31 Jul 2026; measured, decisions pending, code not written
Verify-first clean (sticky landed at 89,102; parachute 20/20; chip ✓).
Surface measured, not remembered: 664 selector blocks — 295 `body.story`-scoped,
369 un-scoped, 9 `#force-grid` blocks, braces 701/701.
**Correction logged: the Session 8 handoff claimed “the 369 un-scoped rules
ARE the pre-story site.” Wrong — they include `#forces-page` (12), `#map-page`
(12), `.frc-*` (22+), `.mtable`, `.co-card`, `body` and every keyframe: live
Session 6 work.** Un-scoping the 295 was then measured instead of assumed:
34 hooks are styled both scoped and un-scoped; in **20** of them the un-scoped
rule sits later in the file, so removing `body.story` (0,2,1 → 0,1,0) flips
those to source-order ties the WRONG rule wins — including `.fade-item` (the
paint path), the tone colours, and Session 6's entire Forces/Chain layer.
**Recommendation on the table: keep `body.story` permanently as the app's
root class; delete only the flag and the genuinely dead.** Genuinely dead,
provable: `.menu-rail`, `#home-tabs`, `.menu-*`, `.drawer-*`,
`#home-page .hero`, the 9 `#force-grid` blocks, `setupHomeTabs()` and the
drawer wiring (home.js:128–151) and their markup.
Governance found and fixed in citation: the restore drill is
**OPERATING_MANUAL §2, iron rule 8** — there is no §8; and the project-files
copy of the manual was stale (8,108 b vs repo 10,112 b, missing the drill
entirely) — re-sync instructed.
Restore-drill split for this environment: the container drill proves schema +
data + 20 migrations replay and no-op on second run; the character-for-character
chip match is against the LIVE site, per the manual.

**OPEN (Session 9 remaining — next commit v6.8):**
1. Founder decisions: (a) keep `body.story` permanently vs un-scope-with-audit;
   (b) bezel — floating pill vs full-width bar; (c) Sectors reset pill —
   jump to Companies (current) vs in-place reset.
2. Delete the flag (`config.js:23`, `story.js:41` gate) + the genuinely-dead
   CSS/JS/HTML above.
3. Cross-screen consistency + `.st-h1` clamp check (max-width:15ch was tuned
   for a 23-char line; the line is now 15) — desktop and mobile together.
4. `--chain` has ZERO consumers — apply it to the value-chain family or delete
   it. `--stale` has ONE (the news fence); the ledger's 27 behind-a-period
   rows still don't carry it.
5. `audit-v1.js` 13/13 across all 107; restore drill per §2 rule 8; chip; then
   STATE → v6.8.

**Deferred past v1 (unchanged):** `⇄ Compare these N` on the force page ·
watchlist + share card · `force_readings` v2 side quest (spec owed to STATE)
· Jun-2026 SHP sweep (~20 fast-movers) · 107→150 expansion.

## Session B — how flip day actually went (verified, not narrated)

- The branch hold didn't take: `data.js` (+ STATE v3.2) landed **straight on
  `main`** (~19:26–19:56 UTC, 7 Jul) → GitHub Pages published immediately →
  early blackout while live Supabase still held the old tables.
- Decision: verify forward, fast. Same-day re-proofs before any live click:
  both SQL files re-run clean on a fresh PostgreSQL 16 UTF-8 (idempotency +
  all-or-nothing + full audit green); then the round-trip harness against the
  **actual bytes on `main`** — order clauses asserted correct, and precisely
  the 19 predicted peer-group failures appeared, nothing else.
- Founder ran: fresh backup → `1_SCHEMA_complete.sql` → `2_DATA_complete.sql`
  on live. Site returned on the new schema.
- `compare.js` took two attempts: the first commit **silently never landed**
  — caught by direct repo verification (commit feed + byte-diff), not by eye.
  The fix file was built from `main`'s exact bytes +9 lines (the 8 groups,
  house style), harness-proven, committed (`8139799`), then verified
  byte-identical end to end. Full-tree diff: nothing else changed.
- Harness on the exact live bytes: **all checks passed — 107 companies,
  492 metric bindings, 14 forces, 139 exposure links, 4 value-chain maps
  (17 links), 64 verified management records.** Home chip text:
  `● data checks: 107 companies · 492 metric bindings · 14 forces · 64
  verified promoter records`.

## Session C — robots v2 (done, harness-proven)

- **`etl/refresh.py` v2 (nightly, 20:30 UTC = 02:00 IST).** Each night it
  writes **one dated `metric_snapshots` row per ticker**
  (`metric_key='market_cap_cr'`, `status='verified'` direct — market cap is
  price × shares inside sane fences, so no human review needed), then stamps
  `companies.fetched_at` for the tickers that succeeded. It no longer touches
  the vestigial `companies.market_cap_cr` / `updated_at` leftovers and speaks
  **only Phase-4 columns**, so it also works on a database rebuilt from
  `1_SCHEMA_complete.sql`.
- **Idempotent-per-day:** the schema has no "one row per company per day"
  rule, so the robot brings its own — before inserting it deletes **today's**
  market-cap rows for **exactly the tickers it is re-inserting** (never
  yesterday, never another metric, never a ticker it has no fresh number
  for). Run it five times in a day: one row per ticker remains. On a **total
  source outage it writes NOTHING** and exits non-zero (GitHub emails);
  same-day earlier rows survive. The keep-alive ping is unchanged.
- Dates are the runner's UTC date (at 02:00 IST that is the previous IST
  calendar day) — consistent night to night; newest-date-wins unaffected.
- **`etl/backup.py` v2 (weekly, Sun 21:30 UTC).** Dumps **all eight tables**
  + manifest (`"schema": "phase4-eight-tables"`), pages past 1,000 rows,
  sorts companies/mgmt_profiles by `ticker` and the rest by `id`, and refuses
  to write a backup with 0 companies **or 0 metric snapshots** (an empty
  `staged_metric_snapshots` is healthy and saved as `[]`).
- **Both workflow files unchanged** — verified zero functional need
  (`git add -A` picks up the new filenames). A stale "five tables" comment
  remains in `backup.yml`; deliberately left, cosmetic only.
- **Verification:** 28/28 harness checks against a fake PostgREST (fresh
  night; same-day re-run replaces without duplicates; total-outage writes
  nothing; 3-page backup pagination; empty-backup refusal; `M&M` /
  `BAJAJ-AUTO` travel quoted through every `in.()` filter) + 5/5 round-trip
  through the **exact live `data.js` bytes** (tonight's rows win by newest
  date; market cap stays out of `metric_order` and `HIGHER_IS_BETTER`).

## Live counts

107 companies · 599 metric snapshots **at flip** (107 market-cap rows + 492
business metrics; 21 honest NULLs) · 518 chain nodes · 321 factor tags ·
642 bull/bear · **107 mgmt profiles** (64 at flip + 8 E + 5 G + 5 H + 7 I +
5 J + 6 K + 7 L) · 4 narratives · staging 0. Current chip (Session W wording): `● data checks: 107 companies · 492 metric bindings · 14 forces · 139 exposure links · 4 value-chain maps · 107 verified management records`.
**The mgmt_profiles backlog is closed: full coverage.**
`metric_snapshots` now grows by ~107 rows per successful night (599 + one row
per fetched company per night; ≈706 after the first v2 run).

## ⚠️ Flags carried (accepted, not blockers)

1. ~~**Map page lists stories alphabetically.**~~ **CLOSED (Session N,
   14 Jul 2026).** `cross_company_narratives.display_order` (integer, nullable,
   spaced by 10s) now drives the map page; `data.js` orders by
   `display_order.asc.nullslast,id.asc`. A NULL means *not placed yet* and
   renders last, never mid-list. Order is now a Table-Editor edit, not a code
   ship.
2. ~~**LTIM sits alone in "IT Services".**~~ **CLOSED (Session O,
   14 Jul 2026).** LTIM moved to "IT" via a guarded one-row UPDATE
   (`sql/2026-07-14_ltim_peer_group.sql`); compare page now shows IT · 6 and
   LTIM's page gained its "compare with peers" button. The empty "IT Services"
   label deliberately remains in GROUP_LABELS — deleting it while any company
   points at it turns the chip red (selftest.js:30), and empty it costs
   nothing (the ≥ 2 filter never surfaces it).
3. ~~**Four stale husk files + the retired `/sql` husk pair.**~~ **CLOSED
   (Session R, 16 Jul 2026).** Main repo: `sql/schema.sql` + `sql/seed.sql`
   removed, replaced by the underscore-named parachute pair
   (`1_SCHEMA_complete.sql` + `2_DATA_complete.sql`), byte-verified. Backup
   repo: the four husks (`metrics.json`, `factors.json`, `chains.json`,
   `mgmt.json`) were **already absent** on `main` when checked — paperwork
   was stale; a valid v2 backup (`schema: phase4-eight-tables`, 13 Jul,
   107/107) confirms nothing was lost. History stays in git.
4. ~~**Snapshot growth:** ~3.2k rows/month.~~ **CLOSED (Session R,
   16 Jul 2026).** `2026-07-16_snapshot_prune.sql` caps the nightly
   `market_cap_cr` series: keep the last 90 days + each company's
   first-of-month row forever, delete the rest. Scoped to `market_cap_cr`
   only (the 492 bindings untouched; chip invariant); idempotent (re-run is
   DELETE 0); proven on PostgreSQL 16 (real data → 0 deleted today; synthetic
   aged → exact keep/delete; re-run → 0). Live run: 0 deleted, 492 held,
   chip word-for-word intact. Standing maintenance — a future session can
   fold it into `refresh.py`.

## Session N+

1. ~~**INDIGO exact figure owed.**~~ **DONE — Session P, 15 Jul 2026.** Filed
   figure 41.57% verified and pasted; Part D superseded by
   `2026-07-15_indigo_shp_exact.sql` (four guarded UPDATEs, not one — the
   number lived in four places). The queue's only remaining item is the
   standing quarterly sweep (item 4).
2. ~~**Narratives `display_order`.**~~ **DONE — Session N, 14 Jul 2026.**
   Column added + backfilled order-preservingly; `data.js:198` reorders. The
   curated renumber (Part C of the migration: power → metals-auto → holding →
   banca) is optional and is the founder's call — run it in the SQL Editor or
   just edit the four numbers in the Table Editor whenever.
3. ~~**LTIM compare_group.**~~ **DONE — Session O, 14 Jul 2026.** Pre-flight
   proved the bucket held only LTIM; the guarded UPDATE moved it; IT is now a
   6-member group. Re-run returns UPDATE 0 by construction.
4. **Mgmt maintenance** — quarterly re-verification
   sweep after each SHP season, prioritising the flagged rows: INDIGO (derived
   %, RG Group exit drifts it down every quarter), BAJAJ-AUTO (post-buyback
   SHP), ASIANPAINT (live pledge moves), SUNPHARMA (rising pledge + Organon
   clause), ADANIPORTS (encumbrance-table check), HDFCLIFE (post-16-Jun event
   SHP), TMPV (demerger-era comparisons).
   **Sweep OPENED — Session Q checkpoint, 16 Jul 2026: roster 20, all
   awaiting Jun-2026 filings (due ~21 Jul). Architecture session (item 5) is
   DONE (Session R); the sweep RESUMES in Session S, after ~21 Jul — re-run
   `session_q_paste1_preflight.sql` first, then work the filings name by
   name. Detail in the v4.7 changelog entry.**
   - Batch 6 — metals/cement/infra (6): HINDALCO, JSWSTEEL, TATASTEEL,
     ULTRACEMCO, GRASIM, ADANIPORTS
   - Batch 7 — consumer/new-age (7): ASIANPAINT, NESTLEIND, TATACONSUM,
     TITAN, TRENT, INDIGO, ETERNAL
5. ~~**Architecture session.**~~ **DONE — Session R, 16 Jul 2026.** (a) Item 0:
   `OPERATING_MANUAL.md` v3 committed to the repo root, raw-view verified;
   (b) flag 3 husk files + retired `/sql` pair closed; (c) flag 4 snapshot
   prune shipped; (d) the single-writer rule written into the manual (§2
   rule 8). The consistency-check caught two draft errors before commit — a
   missing single-writer rule, and a mis-attributed incident (the real
   silent loss was Session B's dropped `compare.js` commit, not a find/
   replace). **UI lane now UNBLOCKED** — next UI work: a transitions
   session, then the storytelling company page.
6. **Three companies have no verified growth reading** (data lane, small, NOT a
   v1 gate). IOC, LICI and SIEMENS render §8's honest "nothing verified yet"
   line because no metric key of theirs contains `growth`/`cagr`. One verified
   growth figure each closes it — and because §8 selects by key name, **no code
   change is needed**: the row appears the moment it lands.
7. **Long-run CAGR (post-v1 data lane, deliberately not in v1).** A multi-year
   revenue/PAT series verified to §3 standard would let §8 show compounding, not
   just the latest period. Sized honestly: 107 companies × several filed years.
   It is queued as an upgrade, and §8 is **complete without it** — the page
   makes no promise that this is missing.
8. ~~**PARACHUTE GAP: 58 companies would rebuild with a NULL `as_of`.**~~
   **CLOSED — NOT A DEFECT (Session X, 23 Jul 2026). The Session W diagnosis was
   wrong.** `2_DATA_complete.sql` does omit `as_of` from 58 of its INSERT column
   lists, but **line 943 onward backfills all 58 with `UPDATE` statements** in
   the same file. A real rebuild yields 107 companies, **0 NULL**, 0 failures.
   The error: the analysis parsed INSERT column lists and stopped, and the JS
   harness "confirmed" it only because its parser also read INSERTs and never
   the UPDATEs — hypothesis and test shared one blind spot, so their agreement
   meant nothing. Superseded by item 11, the defect an actual restore found.
11. **Session E's 8 PSU mgmt records were never committed to `/sql`.**
   **CLOSED (Session X)** by `sql/2026-07-10_mgmt_batch1_psu.sql`. Found by
   running the first restore drill. See the v5.4 changelog.
12. **The dated migrations' judges do not stop anything** (found Session X,
   open). They are informational `SELECT`s for a human to read. On the rebuild,
   batch2–batch7 each printed a wrong pre-flight figure ("expect exactly 72")
   and every file still reported success. Cheap upgrade: wrap each pre-flight in
   a `DO $$ ... RAISE EXCEPTION ... $$` so a wrong count actually halts the run.
13. **The parachute needs three Supabase roles to dry-run** (found Session X,
   documented not fixed). `anon`, `authenticated` and `service_role` do not
   exist on a stock PostgreSQL, and `valuation_inputs_expose`,
   `valuation_inputs_lockdown` and `news_items` abort without them. Harmless in
   a real recovery onto a new Supabase project; the drill creates them first.
9. **`js/selftest.js:64` can throw and take the whole chip down** (found
   Session W, not currently reachable). Line 63 checks
   `Array.isArray(ch.stages)` but only *records* a failure; line 64 then reads
   `ch.stages.length` unguarded. A non-ownership narrative row with NULL
   `stages` would throw inside `runSelfTests()`, so `initApp` dies and the chip
   never renders at all — a data problem presenting as a blank page. Guard it.
10. **`forceLinks` and `mapChains` have no floor assertion** (found Session W).
   A force must match ≥ 1 company, so one that silently stopped matching 19 of
   its 20 fails nothing; a lost CHAINMAP story fails nothing at all. Session W
   put both numbers **on the chip** so a human can see them move, which is a
   surface, not a test. Cheap follow-up: assert a floor.
- *(Flags 1–4 are all closed — Sessions N, O, and R. Live queue items: the
  quarterly sweep (item 4, Session S); two optional data lanes (items 6 and 7);
  findings from Sessions W and X (items 9–13; item 8 closed as not-a-defect and
  item 11 closed by the PSU migration). **The parachute now restores to a chip
  identical to live**, proven by drill on 23 Jul 2026. Nothing in the remaining
  queue gates v1.)*
- *(UI lane after Session Z: **UI-1 is done**. Next is **UI-2** — the
  storytelling company page (scroll chapters) — then the 14 value-chain
  content micro-pass, then v1 QA and soft launch. UI-2 inherits a working
  router and must not reintroduce a second one.)*

## Lessons the UI-2 arc added (Sessions 1A–9 open, 31 Jul 2026)

1. **Assert on code patterns, never bare identifiers — and strip comments
   first.** Prose contains the identifiers. Five false failures across three
   sessions (three in 1A; one in S7, one in S8 — both S7/S8 trips were on
   judges written in the same session, including a probe for `new Date(` that
   fired on the comment explaining why the code avoids `new Date()`).
2. **must-not-lose means the count is PRESERVED, not that it equals 1.**
   `.st-fr{` legitimately appears three times (base, mobile, reduced-motion);
   an `== 1` judge failed on healthy bytes.
3. **Never assert a remembered integer — judges derive their expectations.**
   Three guessed counts failed in two sessions (20 vs 25; 8 and 13 vs actual).
   The derived form that works: every class the JS emits must be styled, and
   every new class styled must be emitted — tokenising real `class="..."`
   attributes, because a substring probe missed `st-nfence` as the second
   token of `class="st-fnote st-nfence"`.
4. **Verify runsheet expectations against live bytes, not the arc summary.**
   A Session 7 check told the founder to expect the Forces card wall that
   Session 6 had already retired; the founder caught it.
5. **A lazily-built surface renders AT the destination** — now four
   applications: `map-page`, `st-changed`, `forces-page`, and S8's Headlines
   tab (a tab is a destination too). Every `moves:null` route and every pane
   needs its `whenDataReady`/guarded builder at arrival.
6. **A shared class is only shared for the values it already knows.**
   `.st-fdot` knew risk/tailwind/neutral; news speaks tailwind/headwind/
   neutral — headwind dots would have shipped invisible.
7. **Three bar scales are three instruments, on purpose.** Compare:
   `|value| ÷ group max`. Digest: strict rounded band. Sectors: true
   n/total, never rescaled. Different questions; do not “fix” one into
   another.
8. **Un-scoping a root class is a measurable act, not a cleanup.** 34 shared
   hooks, 20 flip to source-order ties the wrong rule wins. Specificity was
   doing load-bearing work; deleting it is a rewrite, not a tidy.
9. **Read counts from the record, not the brief.** The brief said
   “Renewable”; the seed says “Renewable Energy”. Rendering from `SEED`
   (never typing the 23 or the 107) made the screen immune to the error.
10. **`.st-page-body` is the scroll container on every `.st-page`;
    `.st-page-head` is `flex:none`.** Sticky children there use `top:0` with
    NO bezel offset — unlike the company page's `.st-head` (`top:
    var(--st-strip)`). Copying the wrong idiom parks a control mid-page.
11. **Cite sections that exist.** Every arc prompt cited “OPERATING_MANUAL
    §8”; the manual stops at §7 — the drill is §2 iron rule 8. And the
    project-files manual copy was missing the drill entirely: governance
    documents in project knowledge must be re-synced when the repo copy moves.

## Lessons Session 2i added

- **A queue is not a status. Cross-check "remaining" against "done".** The v1
  list published in 2h carried an item finished two days earlier and recorded as
  COMPLETE a hundred lines up in the same document. Reading forward through open
  items without reconciling them against the completion record produces a plan
  that is confidently wrong — and it is the same failure as calling a regression
  "pre-existing" without checking the previous tarball.
- **An audit that has never failed has not been tested; an audit that fails must
  be suspected before the product is.** This one failed twice on its first run
  and both were its own defects. That is not an argument against writing it — the
  failures forced the checks that proved the product correct — but it is an
  argument for diagnosing before reporting. Four times this week an apparent
  defect was tooling: two replay-parser artefacts, one DOM-timing artefact, one
  over-narrow comparison.
- **"Sourced" includes prose.** `metric_note` is a stored, verified field, and a
  prior-year comparison inside it is as traceable as the metric itself. An audit
  that only recognises numeric columns will indict a product for being thorough.

## Lessons Session 2f added

- **A date field means what WRITES it, not what it is called.** `fetched_at`
  reads like "when we got these figures". It is actually stamped nightly by the
  market-cap robot for every company it reaches, so it says only when the price
  moved. Labelling it "pulled" next to a six-month-old reporting period produced
  a page that quietly contradicted its own purpose. **Before displaying any
  timestamp, read the code that writes it** — the column name is a hint, not a
  definition.
- **The founder's review output is a test surface.** The defect was not in any
  harness assertion; it was visible in the three rows pasted back from a real
  screen, where "Q3 FY26 … pulled 25 Jul 2026" sat side by side and read wrong to
  a human. Asking for literal output rather than a pass/fail is what made it
  catchable.
- **A tab's name can promise something the schema cannot deliver.** "What
  changed" was on the roadmap for months and was never buildable: nothing in the
  database stores a change. The honest move was not to fake a diff but to ask
  what the stored dates *can* support — which turned out to be more useful than
  the original idea, because it surfaced 27 companies sitting two reporting
  periods behind. **Check the schema against the promise before building the
  page**, and rename the promise if it does not hold.
- **Free text stays free text.** `as_of` is written by a human and reads
  thirteen different ways across 107 companies. The ledger sorts by a date
  extracted from it but always DISPLAYS the original string. Normalising those
  labels into a tidy enum would have been easy, would have looked better, and
  would have silently replaced what a person wrote with what a machine inferred.
- **The parser is not the database — for the third time.** Two apparent data
  gaps this week were replay-harness artefacts: `verified_on` looked NULL for 64
  companies (the harness only applies UPDATEs scoped to a ticker, and `flag5`
  backfills in bulk), and `metric_snapshots.as_of` looked missing (the column is
  `snapshot_date`). Both would have been reported as defects without a schema
  check. **Read the schema before trusting the replay.**

## Lessons Session 2h added

- **"Not yet" is a valid, and sometimes the correct, session outcome.** The
  sweep was opened on a calendar assumption — filings due 21 Jul, today is the
  25th — and the assumption held for the *filing* while failing for the
  *ingestion*. Shipping rounded aggregator figures to hit the session's stated
  goal would have put worse data in the database than leaving it alone. A
  verification pass that concludes "do not update" has done its job.
- **The provenance note is the audit trail, and it caught this.** The error was
  not visible in the number: 39.0 looks like a perfectly ordinary holding. It
  was visible in `source_note`, which honestly recorded "Kotak Neo +
  Share.Market trackers". Because the project writes down *where a figure came
  from*, a wrong figure could be found by reading its provenance rather than by
  re-verifying all 107. Every honest source note is a future error detector.
- **Check the parser before reporting the defect.** INDIGO's `promoter_who`
  appeared to contain raw SQL (`replace(promoter_who, ...`). It was the replay
  harness mishandling a real `UPDATE ... SET col = replace(col, ...)` from
  Session P — the database is intact. One grep of the source separated a tooling
  artefact from a live defect, and the same check would have caught the
  `revealCards` misattribution in 2e.
- **Escape sequences leaked into the governance files and lived there for
  sessions.** Twelve literal `\uXXXX` strings — `\u2014`, `\u2192`, `\u2026` —
  were shipped into STATE.md and CONTRACT.md by build scripts that wrote the
  escape rather than the character, and were live on `main`. They surfaced only
  when a byte-exact `str.replace` assertion failed against prose I had written
  myself: the assertion caught what re-reading never did. **Prose in the
  governance files is content too** — it deserves the same class of check as the
  code, and any build step that emits text must be verified against the bytes it
  actually produced, not the string that was intended.
- **An idempotent migration must look clean on re-run, not merely behave
  correctly.** The first draft's judges reported `*** FAIL ***` twice on a
  correct second run, because they asserted the pre-state still held. Behaviour
  was right and the report was alarming — and an operator who learns to ignore
  red output has lost the value of every future check.

## Lessons Session 2g added

- **One class, three surfaces — check every emitter before styling it.** A grep
  for `.force-btn` found it in `#force-grid`, `#compare-grid` AND `#frc-chips`.
  Styling the bare class would have delivered exactly what was asked for on two
  pages and wrecked a third, and it would have looked correct in every screenshot
  anyone thought to take. The cost of the grep was thirty seconds.
- **A shared class can also be a gift.** Compare groups reuse `.force-btn`, so
  two of the three requested surfaces were one change. Worth checking whether
  surfaces are already related before treating them as separate work.
- **Retire a test by inverting it, not by deleting it.** The honest-failure
  harness asserted that live `main` reproduced the zeros-under-a-green-tick
  defect. Once the fix shipped, that assertion failed — correctly, because its
  premise was gone. Inverted, it becomes the standing guard that the honest
  failure state never regresses out of production. A test whose premise expires
  is evidence of progress, and deleting it throws away the guard.
- **`const` at file scope is a lexical global, not a window property, and a later
  `eval` cannot see it.** `FORCES` was unreachable from the harness in both ways
  tried: not on `window`, and not visible to a second `eval` call, because every
  eval gets its own lexical environment. It has to be exported from inside the
  same eval that declared it. Same root cause as the `GROUP_LABELS` failure in
  2e — worth knowing once rather than rediscovering per session.

## Lessons Session 2f-hf added

- **The absence of a claim is a valid thing to render, and often the only honest
  one.** `0` and `—` are not two formats for the same state. `0` asserts that
  the platform holds nothing; `—` asserts nothing at all. Every placeholder
  in a product built on traceable numbers has to be checked against that
  distinction, because a zero is indistinguishable from a real measurement.
- **A hardcoded `true` in a status call is a lie waiting for the right day.**
  `setReadout(true)` at build time was written in 2d for a page that had always
  loaded successfully in testing. It survived two sessions and a founder review
  because nothing ever failed while anyone was watching. Status must be derived
  from the thing it reports on, never asserted alongside it.
- **Test the failure world, not just the success world.** Every harness before
  this one booted with data present or data delayed — never data *refused*. One
  fetch returning 429 was all it took to expose a defect that had been shipping
  since 2d. The failure world is a first-class test environment, and running the
  old code inside it first is what makes the result evidence rather than opinion.
- **"Offline" is the wrong instrument for testing a data failure.** Taking the
  whole network down before a reload stops the page itself from loading, so the
  browser's own error screen appears and the application never executes — the
  failure path under test is never reached. A data-layer failure state needs the
  document to load and only its data requests to fail: block the API host
  specifically, or throttle hard enough to time out. Choosing the wrong tool here
  produces a test that cannot fail and cannot pass.
- **Partial verification is still verification, and it should be recorded as
  partial.** The 3G run proved the em-dash cards, the readout wiring and the
  loading→ok transition on real hardware; it did not touch the red failed
  state, which remains harness-only. Writing "verified" without that boundary
  would have quietly converted an untested path into a trusted one — which is
  precisely how `setReadout(true)` survived two sessions and a founder review.
- **Error copy rots faster than code.** The boot toast still explained a
  local-JSON architecture the project left behind at Phase 2, and told the user
  to do something they were already doing. Nobody re-reads an error message that
  never fires. When a data layer changes, its failure text is part of the change.

## Lessons Session 2e added

- **Presence is not renderability. `querySelectorAll` matches both namespaces.**
  The 2e harness asserted every button carried an `.il-btn-ic` node and went 35/35
  green while both icon rows were invisible in a real browser. The node existed;
  it was an XHTML element named "svg" that no browser paints. This is the Session
  AC defect wearing a different coat — I built a paint oracle for *opacity* and
  then never asked the same question about *namespace*. Any harness assertion of
  the form "the element is there" must be paired with one of the form "and it can
  actually be painted."
- **`document.createElement('svg')` is always wrong.** Only the HTML parser
  (`insertAdjacentHTML` / `innerHTML`) puts SVG in the SVG namespace.
- **A function added to story.js can silently disable a domain file.** story.js
  loads last; an internal helper sharing a global's name shadows it for every
  call site inside story.js. `revealCards(cards)` vs `revealCards()` cost the
  entire company list, and the failure was a *caught* console warning, so nothing
  went red anywhere. Distinct prefixes for internal helpers, permanently.
- **I called a regression "pre-existing" without checking, and it was mine.**
  In 2e I noted the `revealCards` collision as "pre-existing since 2c" and queued
  it. One `grep` against the pre-2d tarball would have shown story.js had exactly
  one reference to that name before I touched it. **Check the previous tarball
  before attributing a defect to an earlier session** — the cost of being wrong
  is that a live defect gets filed instead of fixed.
- **The same guard-vs-documentation trap, twice.** 2d's unscoped-selector check
  fired on prose inside its own comment; 2e-fix's `createElement('svg')` guard
  fired on the comment explaining the bug it guards against. Strip comments before
  any source-level assertion. Learning a lesson once is not the same as encoding it.
- **A failure signature is evidence; use it before theorising.** The founder's
  screenshot showed six zeros and "last verified —". Rather than guess, the same
  state was reproduced by failing every fetch with 429 — an exact match, which
  proved the cause was a dead data layer and not the navigation change shipped
  minutes earlier. One reproduction settled it faster than any amount of reading
  the diff, and it stopped a correct fix from being blamed and reverted.
- **"No data" and "could not reach the data" must never render the same.** The
  first is a claim about the platform, the second about the request. Rendering a
  green self-checked tick over six zeros asserts both that the check passed and
  that the database is empty, and both were untrue.
- **A harness that always awaits the network never tests the app people
  actually load.** Both the 2d and 2e harnesses called `await loadData()` before
  navigating, so `SEED` was populated in every single test. The state a real
  first paint passes through — tab tapped, rows not back yet — was not merely
  untested, it could not occur. It took a founder on a real connection to find
  it. `slow-net.js` now holds every fetch open, navigates, and releases; it
  reproduces the defect against live `main` and then proves the fix, which is the
  only form of evidence worth having.
- **An empty surface must say what is true about the REQUEST, not make a claim
  about the PLATFORM.** "Showing 0 companies" asserted a fact about the database
  and it was false. "Loading companies…" asserts a fact about the fetch and it is
  true. On a platform whose whole promise is that every number is traceable, a
  placeholder that lies about a count is a bigger failure than an empty box.
- **Set flags absolutely, never relatively.** The harness flipped storyMode with
  `replace('false','true')`. Once live config.js shipped `true`, every "flag off"
  test silently ran with the flag ON. Normalise with a regex that sets the value
  outright.

## Lessons Session 2d added

- **A rule that forbids a file from reading a field is a rule about WHERE code
  lives, not about whether the feature ships.** Folding the factor feed into
  What changed looked like it needed `story.js` to read `tech_geo_tags` — a field
  CONTRACT names in story.js's forbidden list, with a harness asserting the token
  never appears there. The wrong fix was amending CONTRACT. The right fix was
  putting `buildFactorFeed()` in `home.js`, which already owned `buildTicker()`
  and already reads company fields, and handing `story.js` a container and
  finished HTML — the same shape `company.js` already uses for chapter bodies.
  **When a guard blocks you, ask which file the work belongs in before asking
  whether the guard is right.**
- **An oracle that only ever says "fine" is not an oracle.** Before trusting the
  paint oracle, the Session AC bug was re-injected into a copy of the stylesheet
  and the oracle was required to CALL IT INVISIBLE. It did, for all three cards.
  A validation suite that has never seen the failure it exists to catch is
  decoration.
- **Read the animation's end state, not its middle.** Two harness failures
  (2 of 6 cards revealed; counts at `[6,26,1,7,0,6]`) looked exactly like the
  Session AC defect and were neither — the harness sampled at 40ms while a 6×80ms
  stagger and a 900ms count-up were still running. Diagnose before patching:
  partial-animation values are numerically plausible, which is precisely what
  makes them dangerous to read as data.
- **A guard that cries wolf on its own documentation gets switched off.** The
  unscoped-selector check flagged two lines of **prose inside a block comment**,
  because it excluded lines starting `/*` or `*` but not continuation lines.
  Strip comments before analysing CSS, always.
- **Two INSERT shapes live in this repo, and reading only one silently loses
  data.** The parachute uses `VALUES (...)`; the mgmt batch migrations use
  `INSERT ... SELECT ... FROM (VALUES ...) v(...)`, and batches 2–7 put
  `verified_on` as a **literal in the SELECT projection**, so the tuple is one
  column shorter than the insert column list. An arity check alone dropped 35 of
  43 records and the chip read 72, not 107. Separately, 58 of the 107 companies
  receive `as_of` by **UPDATE**, not INSERT. A replay harness that parses INSERTs
  only fails with "missing as_of" on exactly those 58 — which looks precisely
  like a data defect and is not.
- **The restore drill can be a byproduct.** Replaying `2_DATA_complete.sql` plus
  all 19 dated migrations in filename order, through the real `data.js`, produced
  `107 · 492 · 14 · 139 · 4 · 107` — the acid test, rebuilt from the parachute
  alone. Every UI harness from here should replay that way; it costs nothing and
  it proves the parachute still lands.
- **Ask before building when the answer changes the shape.** Three decisions went
  to the founder up front — where the ticker goes, how far the map fix reaches,
  and whether to fix selection now. One went against my recommendation. Building
  first and asking after would have wasted the larger half of the session.

## Lessons Session AC added

- **A harness that does not reproduce production's STARTUP ORDER blesses bugs.**
  `index.html` runs `loadData().then(init)`, so `init()` lands AFTER the network
  resolves — after `DOMContentLoaded`, after `story.js` boots. The harness
  attached `goHome` BEFORE dispatching `DOMContentLoaded`: the reverse. So
  `story.js` detached a listener that did not exist yet (silent no-op), `init()`
  then attached it, both ran, and Back always landed Home — **with 36 tests
  green**. The harness now boots story first and `init()` second. And the fix
  does not depend on order at all: capture-phase interception on the document.
  **Prefer designs that cannot be ordered wrongly over tests that check order.**
- **“Invisible but clickable” means the CASCADE, not the DOM.** The founder's
  report — “no cards visible, but clicking empty space opens a company” — is
  diagnostic on its own. Something opaque on top would swallow the clicks; the
  clicks landed. So the elements were present, laid out, hit-testable, and
  painted at zero. Only `opacity:0` does that.
- **Do not disable a mechanism globally when you have only replaced it locally.**
  `body.story .fade-item{animation:none}` killed the only route to visibility for
  every `.fade-item` on the site, while the replacement (`.st-rv`) existed only
  inside `#canvas`. STATE already warned that `.fade-item` bets visibility on
  motion. The warning was not copied — it was **disarmed globally and re-armed
  in one room**. Scope every disable to exactly where the replacement lives.
- **jsdom cannot see paint, so the harness needed an oracle that can.** It now
  resolves the stylesheet by hand for opacity — matching rules, specificity,
  story-mode gating, and whether a surviving animation can rescue a zero base —
  and fails on any element whose final answer is 0. It reproduced the live bug
  before the fix and passes after, and probes `.frc-co`, `.cmp-card`,
  `.map-chain` by name.
- **Content coupled to a PATH breaks when you add a door or move a wall.** Two
  forms of the same fault in one session: moving `cards-area` preserved every
  reference to it and broke what assumed it was NEARBY (the sector dead-end);
  routing to `map-page` preserved the page and broke what assumed the OLD DOOR
  (`renderMap()` is called only by `openMap()`, so the tab opened an empty map).
  **Trigger rendering at the destination, never on the route.**
- **An injected page inherits no chrome.** Original pages carry their own
  `.topbar-back` in markup; the five new pages had no way back at all until it
  was added. Anything created at runtime must be given, explicitly, everything
  the hand-written pages get for free.
- **A container's padding does not shrink a fixed-height child.**
  `body.story #app{padding-top:64px}` with `.page{height:100vh}` made every page
  64px taller than its visible window, silently clipping the bottom of all of
  them. Fixed with `height:calc(100vh - var(--st-bezel))`.
- **Five defects arrived as one symptom cluster.** “Nothing works” was in fact
  a double-bound back button, a global animation kill, a missing renderer call,
  a missing back control and a 64px clip. Each was diagnosed and fixed
  separately, with a test added per fix. Fixing the cluster as one thing would
  have produced a guess that happened to help.

## Lessons Session AB added

- **An animation that starts at RENDER is not an animation on ENTRY, and the
  difference only shows up once you render everything at once.** `.fade-item`
  had been correct for two months because the old canvas rendered one section at
  a time. Stack all ten and the same rule becomes wrong — the chain finishes
  animating in an empty viewport. Nothing about `.fade-item` changed; the
  surrounding assumption did. **When a layout changes from one-at-a-time to
  all-at-once, re-audit every animation for what triggers it.**
- **A grep that finds nothing may mean the PATTERN is wrong, not that the thing
  is absent.** `class="vc-[a-z-]*"` missed `.vc-node` because the class is built
  dynamically (`'vc-node fade-item' + type`). The conclusion “that selector is
  dead” was drawn and was false. Grep for the bare token before concluding
  something does not exist.
- **Use a real DOM, not a shim you wrote.** A hand-built stub agrees with the
  code you had in mind while writing it. `jsdom` parsed the actual
  `index.html` company-page markup and ran the real `company.js` + `story.js`,
  which is the only reason the content-equality test means anything.
- **The content-equality pattern, worth reusing.** To prove a presentation layer
  changed nothing: render through the layer, strip ONLY what the layer is
  permitted to add (here, one class and a transition-delay), normalise
  serialisation on BOTH sides, then demand byte equality. Any altered word,
  number or tag fails. Pair it with a negative test — assert the layer's source
  never mentions the data field names at all.
- **The cross-realm `deepStrictEqual` trap was already in this file, and it was
  hit again.** Arrays built inside the `vm` carry that realm's prototypes, so a
  structurally identical array fails `deepStrictEqual`. Recording a lesson is
  not the same as building a guard: the harness now carries a permanent
  `eq(a, b)` helper that compares via `JSON.stringify`, so the trap cannot be
  walked into a third time.
- **Six harness failures, zero code failures — again.** Diagnose before fixing.
  Every one was a defect in the test (jsdom still parsing when the scripts ran,
  cross-realm equality, an over-strict content assertion, searching only the
  LAST reduced-motion block, forbidding a line that legitimately moved into an
  `else`). Had any been “fixed” in the source, working code would have been
  broken to satisfy a broken test.

## Lessons Session AA added

- **Scoping asks whether a rule CAN match. Stacking asks whether anyone will SEE
  it. They are different questions and the first harness only tested one.** The
  wash was correctly scoped to `body.story`, correctly parsed, and correctly
  painted — and completely invisible on Home, because `.hero` is
  `min-height:100vh` with an opaque `linear-gradient` base sitting above it. The
  founder reported “the switch is not working”; the switch was working
  perfectly. **Before concluding a feature is broken, check whether it is merely
  hidden.** The harness now walks every rule, finds any full-viewport surface
  with an opaque background, and fails unless story mode overrides it.
- **A rollback built on scoping beats a rollback built on reverting.** Because
  every UI-2 rule needs `body.story`, turning the feature off is one word rather
  than restoring six files. The old code is never edited, only unselected. The
  cost is temporary duplication in the repo, which is why 2g is a scheduled
  sunset session rather than a hope.
- **Ship the switch OFF and make the harness prove OFF is inert.** The strongest
  test in 2a was not “does it work” but “with the flag off, does `story.js`
  touch the page at all?” — answered by recording every call into a fake page
  and asserting the log is EMPTY. Not “nothing important”. Empty.
- **Default to off, and check for `=== true`.** `CONFIG` missing, the key
  missing, `storyMode:1`, `storyMode:"true"` — all resolve to off. Off is the
  safe direction, so every ambiguous input must fall that way.
- **Declare tokens before anything reads them.** The 16 type/spacing tokens
  landed in `theme.css` in 2a and are consumed from 2b onward. A custom property
  nothing reads is invisible, so the scale can be reviewed and argued about
  without a single pixel moving.
- **Do not test a thing at a threshold where a human cannot see it.** The wash
  shipped at `.055` alpha. Even unobstructed it was barely perceptible, so the
  checkpoint was unfair regardless of the stacking bug. When asking someone to
  confirm something by eye, pitch it well above the threshold and turn it down
  afterwards.
- **Prototype fonts are not production fonts.** The `/preview/` prototypes set
  headings in Inter; the app uses **Sora** for `h1`–`h4` and **JetBrains Mono**
  for numbers. The type scale must be tuned against Sora when 2b is live, not
  against the prototype.

## Lessons Session Z added

- **Five copies of a rule are not a rule.** The page switch existed in five
  files with three different lists, and the two wrong ones had been wrong for
  weeks without a symptom. Nothing failed because no button happened to reach
  the broken path. A duplicated invariant is not "working" — it is **untested**,
  and it fails on the day someone adds the obvious next link. The fix is not to
  correct the copies; it is to delete four of them.
- **Derive the list, never type it.** `showPage()` reads `.page` elements from
  the DOM instead of naming them. A hand-typed list is a thing a future session
  must remember to update; a derived list cannot be forgotten. The harness proves
  this by adding a sixth page at runtime and asserting it is switched off.
- **A CSS animation with only a `to` does nothing.** `@keyframes fadeUp{to{...}}`
  fills its `from` from the element's current computed style, so
  `.pane-in{animation:fadeUp}` animated opacity 1 → opacity 1. It had been on
  every section of every company page since the split and had **never rendered
  anything**. `.home-panel` had the same dud. Declared motion is not shipped
  motion — it has to be watched, or asserted.
- **Motion must never be load-bearing for visibility.** Every new rule puts its
  hidden state in the keyframes' `from`, never in the base rule, and uses no
  fill-mode it doesn't need. If an animation fails to run for any reason the
  content is simply visible. The older `.fade-item` pattern (`opacity:0` in the
  base rule + `forwards`) is the opposite bet and is why it could not be reused
  on the cards — **left as-is, deliberately; do not copy it into new work.**
- **`translate` composes, `transform` fights.** The card stagger animates the
  independent `translate` property, because `.co-card:hover` already owns
  `transform` and an animation with a fill-mode would pin it and silently kill
  the hover lift. Two properties, no conflict, and a browser without `translate`
  just fades the card in.
- **Cap a stagger against the real row count, not the demo one.** 107 cards at
  the usual 22ms step is a 2.4-second wait for the last card. `Math.min(i,15)`
  caps the worst case at 330ms; the harness asserts it stays under 400ms.
- **Injecting host intrinsics into a `vm` context is the same cross-realm trap
  as `deepStrictEqual`.** Passing the host `RegExp` into the sandbox made the
  real `/crude/i` literals built INSIDE the context fail `f.re instanceof
  RegExp`, and 14 real forces reported themselves malformed. The harness now
  injects **no** intrinsics and passes data in as source text so the vm builds
  every object with its own. Four harness failures in the first run; all four
  were defects in the test, none in the code — diagnosed before anything was
  changed, which is the only reason the code was not "fixed" into being wrong.

## Lessons Session Y added

- **A judge's expected value is itself a figure — verify it like one.**
  "Expect ≥95 with `gnpa_pct`" was written from intuition, never checked
  against the data; GNPA exists only for lenders (exactly 15 tickers). A
  wrong expectation manufactures a false STOP and spends founder trust that
  real STOPs need. Before a number sits next to a paste as "expected", it is
  read out of the parachute.
- **The UNION'd-judge rule holds only if applied every single time.** Four
  separate SELECTs made the judges that mattered invisible on a live paste —
  a lesson already written down, violated anyway. One statement, one grid,
  `ORDER BY ord`, expected rows in a comment above it. No exceptions.
- **Runsheet labels are read off the screen's bytes, not off changelog
  prose.** "Strategic-position card" (STATE language) sent the founder
  hunting for a heading that does not exist; the page says "2 · Value Chain"
  and "Where it sits & why that matters". Every label a runsheet quotes is
  grepped from the live JS first.
- **A UI field that renders as silence hides its own gaps.** `vc.note ? … :
  ''` meant 14 missing notes looked like 14 complete pages for weeks. When a
  surface is optional on screen, its count must live somewhere a human reads
  — this session's judge (0 NULLs / 107 companies) is that surface for the
  §2 note.

## Lessons Session X added

- **A backup is not proven until it has been restored.** The parachute had been
  reviewed, byte-checked and reconciled against its own paperwork (Session R),
  and it was still missing eight verified management records. Nobody had ever
  run it. The first drill found the gap in one pass.
- **A green check is not a passing restore.** The rebuilt site passed every
  self-test while holding 99 records instead of 107, because missing data here
  renders an honest placeholder rather than an error. **Compare counts to live**
  — "nothing is red" and "nothing is missing" are different claims.
- **A harness that shares the hypothesis's blind spot proves nothing.** The
  as_of "defect" was confirmed by a harness whose parser, like the analysis,
  read only INSERT rows and never the UPDATEs 400 lines below. Two things
  agreeing is worthless when they can only fail the same way. Ask what the test
  would have to see to *dis*prove the claim.
- **Judges that are `SELECT`s do not judge.** Six migrations printed a wrong
  pre-flight count on the rebuild and all reported success. A guard that relies
  on a human reading a number is a convention, not a control.
- **Dry-runs earn their keep on boring failures.** The PSU migration failed
  first time on `verified_on is of type date but expression is of type text` —
  a bare `VALUES` list infers every column as text. Invisible on inspection,
  instant in a real run.
- **Date a reconstructed migration to where it belongs in the sequence, not to
  the day it was written.** `2026-07-10_mgmt_batch1_psu.sql` must sort after the
  file that adds `verified_on` and before batch2, whose judge reads "expect
  exactly 72". Dating it 23 Jul would have left every later batch printing a
  wrong figure on every future rebuild.

## Lessons Session W added

- **If two strings can both answer "what is the acid test?", the acid test does
  not exist.** The chip rendered four counts; the console rendered six with
  different wording; OPERATING_MANUAL quoted the first, working memory held the
  second. Nobody was wrong on purpose — the codebase simply never forced them to
  agree. A check that has two accepted answers will eventually be quoted in the
  form that suits the moment.
- **Put the invariant behind ONE function.** `chipText()` exists so the string
  has a single source and can be asserted directly. Before, the chip text was an
  expression buried inside `initApp` — unreachable from any harness, so no test
  could ever have caught the divergence.
- **A number nobody can see is a number nobody checks.** `forceLinks` and
  `mapChains` were computed on every page load and shown nowhere. Both can decay
  without failing anything. Displaying them is not a test, but it is the
  difference between a silent rot and a visible one.
- **Name the thing you are NOT allowed to use as a reference.** STATE's
  changelog honestly quotes older chip strings; that is what a changelog is for.
  The manual now says explicitly: read the chip off the page, not from STATE.
  Correct history is still a wrong reference.
- **History is not rewritten to match the present.** Sixteen STATE entries quote
  the old four-count string and were left exactly as they were. Only
  forward-looking statements (the manual's rule, the "current chip" line, the
  robot's expected-chip comment) were updated. Editing the log to look
  consistent would have destroyed the only record of what actually happened.
- **When the harness disagrees with the site, suspect the harness first.** Two
  failures this session were fixture bugs, not defects: jsonb values in the dump
  carry a trailing `::jsonb` cast, and `evidence` is TEXT that must not be
  JSON-parsed. Fixing the fixture, rather than "fixing" the site, is what then
  surfaced the genuine `as_of` parachute gap underneath.
- **Replaying the parachute is itself a test.** Nothing was looking for item 8;
  it fell out of running the real rebuild data through the real pipeline and
  reading the failure list instead of dismissing it as fixture noise. A backup
  is only proven by a restore.

## Lessons Session V added

- **Check what the database already knows BEFORE designing a data mission.** §8
  looked like a multi-session research job (CAGR, guidance, order book, analyst
  consensus for 107 companies). One query of the existing keys showed **104 of
  107 already carried a verified growth reading and 18 an order book** — the
  panel shipped the same day, JS-only, with zero new data. The expensive plan
  was expensive only because nobody had counted first.
- **Select by rule, not by list.** §8 picks metrics by key name
  (`growth`/`cagr`, `ORDER_BOOK_HINTS`) rather than a curated array. A curated
  list would silently miss every metric added later; the rule means a future
  data pass lights up §8 with no code change. The cost is that the rule must be
  written down where a human can re-check it — hence the CONTRACT entry.
- **Order matters when two rules can both match.** `order_backlog_growth_pct`
  satisfies both the growth rule and the order-book rule. Testing order-book
  FIRST is what makes it read as movement in the *book* rather than in
  delivered revenue. Any key-name scheme needs its precedence stated, or the
  same key lands in different blocks depending on iteration order.
- **Silence is honest; a fake "not applicable" is not.** §9 may say *not
  applicable* because a human set a lens per company. §8 has no lens, so a
  company with no order-book metric simply loses that block. Claiming "this is
  not a book-and-bill business" from the *absence* of data would have been a
  guess dressed as a fact.
- **A harness failure is not always a code failure.** The first run reported the
  site's self-test failing — the cause was the *fixture* (wrong column names for
  bull/bear, no chain nodes), not the panel. Fixing the fixture to the real
  shapes turned a meaningless red into a meaningful green; accepting the red, or
  deleting the check, would have thrown away the only proof that mattered.
- **Fixtures prove logic; real data proves reality.** The 38-check vm harness
  passed before the panel had ever met a real company. Replaying the actual
  parachute data (107 companies, 492 bindings) is what confirmed the coverage
  numbers, the 3 honest-empty companies, and that no verified prose trips the
  no-verdict assertion.

## Lessons Session Q-UI added

- **A retired class can still fight a new one — cascade order beats intentions.**
  The old `.home-tab` pill rules sat *later* in the file than the new `.menu-btn`
  layout, so at equal specificity they silently overrode the full-width buttons.
  Fix: retire the old rules; re-express only the keeper (the ▾ caret) as
  `.menu-btn.home-tab[data-panel]::after`. When you move + restyle an element,
  hunt the *old* selectors that still match it.
- **Keyframe names are global.** A new bar-grow would have collided with the
  existing `@keyframes barGrow`; named it `apBarGrow`. CSS has no keyframe
  scoping — prefix new ones.
- **`.hero > *` re-positions decorative layers too.** That universal-child rule
  (`position:relative;z-index:1`) matched the grid `<div>`s and, at equal
  specificity + later source order, overrode their `position:absolute`. Pinned
  them deterministically with a higher-specificity
  `.hero .hero-grid-floor,.hero .hero-grid-ceil{position:absolute;z-index:0}`.
- **Decouple cross-file state with an observer, not edits to four files.**
  `body.on-home` (dock-vs-drawer) is kept in sync by a MutationObserver watching
  every `.page`’s class — so `company/compare/forces/map.js` never learned about
  the menu. One file’s concern stayed in one file.
- **A drawer button on an inner page must go Home *before* its own handler.** A
  capture-phase listener on the rail calls `goHome()` first; the button’s normal
  bubble handler then toggles the now-visible panel. Capture-then-bubble does the
  sequencing for free.
- **“Scroll to a limit” and “infinite marquee” are opposite designs.** The tweak
  made the feed a plain `overflow-y:auto` list (no duplication, no animation) so
  it stops at newest/oldest; `overscroll-behavior:contain` stops scroll chaining
  to the page.
- **Verify from a browser-shaped DOM.** jsdom running the real `init()` exercises
  the wiring `node --check` can’t. The lone stderr line
  (`scrollIntoView is not a function`) is a jsdom limitation, fires *after* its
  assertions, and is not a site bug.
- **Two chats, one file: last writer wins, silently.** The home-shell commit
  whole-file-replaced STATE and CONTRACT from a base taken before the sweep
  checkpoint landed — the v4.7 sweep entry, the queue's architecture item, and
  CONTRACT's relabel parachute line all vanished with no error anywhere.
  Standing rule from today: **STATE.md and CONTRACT.md are single-writer
  files** — whichever chat is about to commit them re-pulls the tarball at
  commit time, rebases onto whatever is live, and takes the NEXT version
  number rather than reusing one. (Both halves restored at the 16-Jul merge.)

## Lessons Session Q added

- **A keyword grep finds keyword-shaped markers and nothing else.** The
  drift-marker grep surfaced 16 names; STATE's own standing list held 4 more
  whose rows say "next SHP", "this cell moves", "post-buyback" — vocabulary
  the grep never asked for. The shortlist builder is grep + STATE's standing
  list + any row carrying a forward instruction. STATE is data too.
- **A file on `main` is not a file in governance.** The relabel migration was
  committed but named in neither CONTRACT nor STATE — invisible to the
  parachute replay and to the next session's briefing. The pre-flight
  (rows 00a/00b) had to establish at runtime what the paperwork should have
  said on paper. Close the books in the same session that ships the file.
- **Aggregator "latest" is a lie with a straight face.** On one day, Angel
  One/Upstox served INDIGO's Dec-2025 41.58% as current, Tijori called
  Jun-2025's 43.5% "last quarter", and only the quarter-labelled Trendlyne
  table showed Mar-2026 41.57 as latest. Quarter labels are not a nicety of
  the verification standard; they are the standard.
- **"Derived, not filed" belongs in the tracker, never the database.**
  HDFCLIFE's Jun figure is reconstructable to ≈50.53% from the company's own
  share math — and it still does not go in until the SHP prints it. The
  reconciliation's job is to catch a filing that is wrong, not to pre-empt a
  filing that is late.

## Lessons Session P added

- **A number is not a cell; it is every sentence that mentions it.** Part D
  assumed the fix was one UPDATE. The bytes showed 40.48/4.78 living in four
  places — headline, two prose sentences, source_note. Fixing only the
  headline would have shipped a page that disagreed with itself. Before
  replacing any figure, grep for it everywhere it could have been narrated.
- **A wrong number you can explain beats a right number you can't.** The
  derived 40.48 wasn't sloppy arithmetic — it undercounted the RG side by
  exactly the Chinkerpoo Trust's 1.32%. Finding the mechanism of the error is
  what makes the correction trustworthy, and it sharpened the platform's
  understanding of the promoter structure at the same time.
- **Aggregators disagree by QUARTER more often than by value.** 41.58 vs 41.57
  vs 43.5 were all "true" — for Dec-2025, Mar-2026, and Jun-2025 respectively.
  The verification instruction must decode the noise in advance, or the
  verifier drowns in numbers that are each correct about a different date.
- **"Founder-verified" is a claim the database makes; it must be earned before
  it is pasted.** The migration carried a written hard gate: PASTE 2 does not
  run until the exchange filing has been seen with human eyes. Source one is
  never enough, even when three aggregators agree.

## Lessons Session O added

- **A solo peer group is invisible, not broken.** `groupsForCompare()` filters
  to ≥ 2 members, so a one-member group renders NO chip at all, and the
  company page then hides its compare button too. The symptom ("LTIM shows no
  compare chip") looked like a rendering bug; the bytes showed it was a
  membership fact. Diagnose from the code path, then verify from the data.
- **An empty label is free; a dangling pointer is not.** The tempting cleanup —
  delete the now-unused "IT Services" from GROUP_LABELS — has a live tripwire:
  selftest.js:30 asserts every company's compare_group exists in GROUP_LABELS,
  so deleting the label before every row has moved turns the home chip red.
  Empty, the label costs nothing and is ready for a future IT-services name
  without a deploy. Sequencing debt again, in miniature.
- **The code names the buckets; only the database knows the members.** The repo
  could prove two IT buckets exist, but "is LTIM alone in there?" was
  answerable only by the pre-flight grid. That is why the migration's Paste 1
  carries a written STOP condition: more-than-LTIM would have been a business
  decision (two real tiers of IT?) — not a typo fix.

## Lessons Session N added

- **A migration and a decision are different statements.** Adding the column and
  *choosing the order* were separable, so they were separated: Part B is
  order-preserving and provable ("nothing moved"); Part C is the founder's call
  and is the only line in the file that changes a pixel. A migration that also
  reorders the page cannot be verified as surgical — it has already moved the
  thing it would be checked against.
- **NULL is a position, not a hole.** `nullslast` parks an unnumbered story at
  the END of the map page instead of letting it barge into the middle
  alphabetically. Same reasoning as `verified_on`: nullable keeps the parachute
  re-runnable, and the honest render is a *defined* one, not an accident.
- **Gaps of 10 are cheap; renumbering is not.** A fifth story slots in as 25.
  Consecutive integers would have forced an UPDATE on every row beneath it.
- **The backfill must not be able to clobber the decision.** Part B counts up
  from the current MAX and only ever touches NULLs — proven by re-running it
  after Part C and getting the renumbered order back untouched. A re-runnable
  file that quietly resets your choices is worse than one that errors.

## Lessons Session B added

- The iPad GitHub web editor can **silently drop a commit** (and the "create a
  new branch" option can fail to take). Rule: after every commit, confirm it
  landed — the file page must show the new content, or the commits list the
  new entry — before doing anything that depends on it.
- **"The site renders" ≠ "the tests pass."** Acid tests read the chip
  word-for-word.
- Direct repo verification (commit feed, sha-pinned file fetches, full-tree
  diffs) caught both misses on flip day; eyeballs caught neither.

## Lessons Session C added

- When the schema has no uniqueness rule for a job, **the robot brings its
  own discipline** (delete today's rows only for the tickers being
  re-inserted) — proven by the same-day re-run test, not assumed.
- On a total source outage the robot must **write nothing at all** — a
  half-write would destroy same-day rows it cannot replace.
- Robot code should speak **only the current schema's columns**, never
  leftovers that happen to exist on the live table — otherwise a parachute
  rebuild breaks the robot.

## Lessons Session D added

- When a design fork appears, **the founder's own CONTRACT is the arbiter**:
  its "§9 bull case / §7 red flags" annotations settled where the debate
  lives. No doctrine (titles, nav, section count) was edited — only bodies.
- The commit-landed check that works on iPad: open **Raw** view → Safari
  **Find on Page** → search a string only the NEW bytes contain (expect 1)
  and one only the OLD bytes contained (expect 0). Content is the
  fingerprint, not "the page looks right."

## Lessons Session E added

- The mission-lock division works as a *pipeline*: machine researches and
  drafts WITH named sources; human verifies every number and sentence
  against screener + the exchange SHP filing before anything is pasted.
  Aggregator discrepancies (one-decimal promoter figures; Coal India's
  ₹26.5-vs-₹26.75 FY26 total) are exactly what the human pass exists to
  catch.
- A draft SQL file should carry its own judges: pre-flight SELECT (expect
  zero rows), post-flight COUNT (expect the exact number), and the chip
  acid test — the paste becomes self-verifying on iPad, no extra tooling.
- Inserting rows made flag 5 louder, not quieter: a cosmetic
  lie-in-waiting became a live falsehood the moment real verified-dates
  diverged from the hardcoded one. Sequencing debt compounds.

## Lessons Session F added

- `select=*` delivers a new column to the browser, but the waiter's mapping
  is an explicit list — so every new column is, by design, a one-line
  `data.js` edit. Nothing reaches the UI unnamed.
- `verified_on` stays NULLABLE on purpose: NOT NULL would make the verified,
  re-runnable `1_SCHEMA`/`2_DATA` pair fail on a re-run (its mgmt INSERTs
  don't know the column). Honesty is enforced where it is seen — a missing
  date renders "—" — plus each batch's own post-flight judges.
- Harness-proven surgical: for the 64 at-flip records the new §5 output is
  byte-identical to the old hardcode; only the 8 Batch-1 pages change on
  screen. "Fixed" and "nothing else moved" were both proven, not eyeballed.

## Lessons Session G added

- **"No promoter" is an answer, not an absence.** Two of the five banks have
  zero promoter — and the *reason* differs: FEDERALBNK never had one;
  IDFCFIRSTB stopped having one when IDFC Ltd reverse-merged into it
  (1 Oct 2024). Writing 0% with the story attached is more honest — and more
  useful — than leaving the row queued. §5 already renders 0% correctly
  (HDFCBANK, ICICIBANK, ITC, LT set that precedent at the flip).
- **Promoter % is not always a sentiment signal.** BANDHANBNK's promoter sold
  ~2% because RBI's licensing terms *force* dilution — its own filing calls it
  "disposal of excess shareholding." A tracker showing "promoter selling" would
  have read as a red flag; the filing says it is a staircase agreed to in
  advance. This is exactly what the human verification pass is for.
- **Trackers round; filings do not.** AUBANK came out of the exchange SHP at
  22.76% with a machine-readable "encumbered: 0" — no aggregator needed. Where
  a primary filing exists, read the filing.
- **The `WHERE NOT EXISTS` insert makes a batch re-runnable without assuming a
  unique constraint** — the paste can be repeated after a dropped connection
  and cannot double-insert. Proven on PostgreSQL 16.2: run twice → 77 rows,
  second run inserts 0.

## Lessons Session H added

- **Read the event SHP, not just the quarterly one.** A capital-structure
  change forces a company to re-file its shareholding pattern. Three of this
  batch had done so since 31 Mar 2026 — SHRIRAMFIN on 08 Apr, JIOFIN on
  21 Apr. Recording the March figure for those two would have shipped a number
  the company itself had already superseded. `as_of` earns its keep here: the
  batch honestly carries a mix of "Mar 2026" and "Apr 2026".
- **The percentage lies; the share count does not.** In four of these five the
  promoter's share COUNT was unchanged quarter-on-quarter — SHRIRAMFIN held
  47,76,30,880 shares before and after falling from 25.38% to 20.30%; SBI has
  held the same 55,50,00,000 shares in SBILIFE for years; CHOLAFIN's promoter
  crossed below 50% without selling. A tracker that reports only "% down"
  reports a decision that nobody made. Always read the share count next to it.
- **Lock-in is not pledge.** JIOFIN shows 25 crore promoter shares "locked" —
  the statutory lock-in on a preferential allotment, a rule the promoter agreed
  to, not collateral a lender can seize. Same column on a tracker, opposite
  meaning. §5's pledge sentence says so explicitly.
- **A batch can carry a comparison the single pages cannot.** HDFCLIFE and
  SBILIFE are both bank-owned life insurers; one closed FY26 at 177% solvency
  and took ₹1,000 cr from its parent, the other at 190% and took nothing. Two
  rows researched in the same pass make that visible; two rows researched six
  months apart would not have.

## Lessons Session M added

- **A delivered filename is part of the delivered bytes.** The batch files
  landed with spaces instead of underscores — the download UI displays names
  without underscores, and the display name got typed into the GitHub filename
  box. The parachute replays migrations in filename order, so a space (0x20 <
  0x5F) silently reorders the chain. Commit-verification now includes the
  FILENAME, not just the content: the Ctrl+F step must be run against the
  sql/ directory listing too.
- **A [VERIFY] marker is a tripwire, not a decoration.** Both markers walked
  straight into production because the paste step didn't include the
  documented zero-hits Ctrl+F. Future flagged files put the tripwire IN THE
  JUDGES: a pre-flight `SELECT ... LIKE '%VERIFY%'` with "expect 0 in your
  edited paste" would have shown 2 in the results grid before the insert ran.
- **Stale memory loses to live bytes, in both directions.** The backlog said
  the robots weren't live; the repo says they are. Fetch-first isn't just for
  catching missing work — it also stops you redoing finished work.

## Lessons Sessions K + L added

- **The biggest pledge is a financing model, not a distress flare.** JSWSTEEL:
  11.81% of the block pledged across six named entities (two offshore vehicles
  at 100%), yet falling for two years while the promoter BUYS and the rating
  agencies UPGRADE (CARE AA+, Fitch BB+ positive, the same week). Size alone
  reads as alarm; trajectory + who-pledged + ratings read as treasury.
- **Two nils are not the same nil.** Wipro's Reg 31(4) says nothing was
  encumbered, full stop. ADANIPORTS' and INDIGO-RG's FY26 filings say no NEW
  encumbrance was created "excluding those already disclosed" — a narrower
  sentence. The pledge_note must quote the construction, or the platform
  flattens a real distinction.
- **promoter_pct = 0 is a governance model, not missing data.** ETERNAL has no
  promoter; the founder is a public shareholder. Every question the column
  usually answers gets answered elsewhere (board, ESOPs, register pressure).
  First row of its kind here; there will be more as new-age listings age in.
- **A derived number must confess.** INDIGO's 40.48% is arithmetic (IGE ~35.7 +
  RG residual ~4.78), not a filed figure — the row says so in three places.
  Better an honest derivation flagged loudly than a false precision quietly.
- **The state can be the biggest promoter.** TITAN: TIDCO (Tamil Nadu govt)
  holds ~27.88% — more than the Tatas who run it. Control and the largest
  claim on value can live at different addresses.
- **Cross-links are now load-bearing.** GRASIM promotes ULTRACEMCO (both
  rows); GRASIM's Birla Opus attacks ASIANPAINT (both rows); M&M promotes
  TECHM; JSW Energy holds JSW Steel. The mgmt layer is becoming a graph, not
  a table — a future UI candidate.

## Lessons Session J added

- **A pledge has a direction, and the direction is the story.** Two non-zero
  pledges, pointing opposite ways. SUNPHARMA's went 0.97% → 1.42% in one
  quarter — a fresh pledge, created now. APOLLOHOSP's went 16.30% → 2.49% over
  three years — a family unwinding leverage in public. Identical-looking cells;
  opposite meanings. A static percentage cannot carry that, so the §5 sentence
  carries the trajectory.
- **Ask WHO pledged, not HOW MUCH.** Sun Pharma's 1.42% is not Dilip Shanghvi —
  his 23 crore shares are unencumbered, as is all of Shanghvi Finance. The
  pledge belongs to Raksha Sudhir Valia (63.96% of everything she owns) and
  Kumud Shantilal Shanghvi (100% of hers). Apollo's 2.49% is K Vishweshwar
  Reddy (42.16% of his) and Suneeta Reddy (11.58%). Block-level pledge numbers
  hide personal balance sheets; the entity table shows them.
- **A founder can be reclassified out of his own company.** Analjit Singh built
  Max Healthcare; Abhay Soi reverse-merged Radiant Life Care into it in 2020,
  and the Singh family was moved from promoter to PUBLIC. The `who` field
  records who promotes it today, not who founded it — and for MAXHEALTH those
  are different people.
- **A depositary bank is not a shareholder.** DRREDDY's biggest non-promoter
  name is J P Morgan Chase Bank NA at 11.94% — that is the ADR custodian for
  the New York listing, not a conviction holder. Reading it as an institutional
  vote of confidence would be a category error.
- **Selling and then stopping is itself a signal.** Cipla's Hamieds dropped
  four points across 2024, then held exactly 23,52,87,003 shares for five
  straight quarters. The flat line after the sell-down says as much as the
  sell-down did.

## Lessons Session I added

- **A pledge cell is finally not blank — twice.** Eight batches of nil made nil
  feel like the default. M&M carries 40,000 pledged shares (0.02% of the block)
  and they belong to one named promoter-group individual, Sanjay Mohan Labroo —
  a personal arrangement, not company leverage. BAJAJ-AUTO shows ~0.01% on the
  trackers. The §5 sentences say so plainly. A tracker that rounds these to
  "0%" is not being kind; it is deleting the only information in the cell.
- **A buyback can make a promoter sell AND rise.** Wipro's promoters tendered
  42,80,45,126 shares into the ₹15,000 cr buyback — real cash out — and their
  stake still went 72.52% → 72.59%, because 60 crore shares were cancelled
  faster than the family sold. "Promoter stake up" and "promoter sold" were
  both true in the same fortnight. Only the share count untangles it.
- **A rename is not a continuity.** TMPV *is* the old Tata Motors Limited (same
  BSE code 500570), renamed 13 Oct 2025 after the CV demerger. Every pre-Oct-25
  comparison for that ticker is comparing two different companies, and its FY26
  profit carries demerger accounting. The row says so, out loud, rather than
  letting the number imply a trend that does not exist.
- **"Promoter" can be mostly not-the-promoter.** A third of TECHM's promoter
  block is the TML Benefit Trust, not M&M; nearly all of HCLTECH's is two
  holding companies, with the founder's own name against 736 shares. The `who`
  field earns its place — the percentage alone would mislead in both.
- **When Trendlyne is stale, go to the company.** Its TECHM page still showed
  Dec-2025 while the company's own Q4 SHP for 31-Mar-2026 was sitting on
  techmahindra.com. Aggregator lag is silent; it does not announce itself.

## Mission lock (unchanged)

Business UNDERSTANDING first — value chains, business cores, moats, live
factors, management quality. Valuation secondary; stock-picking out of scope.
Machines refresh NUMBERS; only humans write/verify SENTENCES.

## Changelog

- **v6.7 / UI-2 arc write-up: Sessions 1A–8 + sticky addendum recorded;
  Session 9 opened and measured.** 31 Jul 2026, docs-only commit — no JS, no
  CSS, no SQL, nothing that renders. Opening verification clean (parachute
  20/20 both directions, chip word-for-word, sticky landed at 89,102). Nine
  sessions of shape-and-architecture work entered into the record from two
  working chats (1A–6 from the first chat's close summary, spot-checked ✓
  against live bytes; 7–9 measured directly): self-hosted type + `--stale`/
  `--chain`; wording pass; Chrome two-row tab bar with measured `--st-strip`;
  right-hand digest under the never-states-a-figure-its-section-doesn't rule;
  peer range track with strict rounded band; Forces index + three equal
  shelves; Value chain one-at-a-time; Sectors as a 23-row ledger with a true
  n/107 rail and a byte-identical filter handler; Freshness two tabs with the
  60-cap headline river, no pooled tone tally, chip invariance proven
  structurally; sticky tab bar. Live at commit: css 89,102 · home.js 37,659 ·
  story.js 60,828, all byte-diff IDENTICAL to delivered. Session 9 measured:
  664 blocks (295 scoped / 369 un-scoped / 9 dead `#force-grid`); un-scoping
  `body.story` measured at 20 guaranteed source-order regressions and
  recommended AGAINST; three founder decisions pending; governance corrected
  (§2 rule 8, not §8; stale project-files manual re-synced). Eleven arc
  lessons entered. CONTRACT gains “The UI rule”. Next commit **v6.8**.
- **v6.6 / Phase 4 Session 2i: v1 QA passed, `/preview/` retired.** Opening
  verification clean (STATE v6.5, parachute 20/20, `storyMode:true`, all five 2f
  files byte-identical). Declared concern was the 14 value-chain caveats — found
  **already complete since 23 July**, which corrected a stale item in the v1 list
  published in 2h; the content lane has been closed for two days. Session became
  v1 QA: `audit-v1.js` written and run, **13/13 across all 107 company pages**,
  14 forces, 4 maps and the 107-row ledger. Both first-run failures were the
  audit's own and were fixed in the instrument. `/preview/`'s four shipped
  prototypes deleted; CONTRACT updated to retire them and to record the audit as
  a standing instrument. **No JS, no CSS, no SQL, no data change** — nothing that
  renders was touched. **v1 is ready to launch.**
- **v6.5 / Phase 4 Session 2f: the freshness ledger.** Opening verification
  clean (STATE v6.4, parachute 20/20, `storyMode:true`, zero leaked escapes
  beyond the three quoted in their own lesson). Three files: `js/home.js`
  23,917 → 30,279; `js/story.js` 44,526 → 45,070; `css/components.css`
  63,471 → 65,355. **No SQL, no data change, `data.js` untouched.** "What
  changed" became **Freshness** — a 107-row ledger, oldest first, built from
  `as_of` / `fetched_at` / `verified_on`, stating in its own copy that it is not
  a change log; surfaced that 27 companies are a reporting period behind, and
  corrected a first-cut label that mis-sold the nightly price stamp as a figure
  date. 27/27
  new harness, plus 24/24 + 18/18 + 5/5 regression; paint oracle confirms the
  Session AC rule untouched. One new CONTRACT invariant: the ledger reports
  currency only, and an `as_of` label is displayed verbatim.
- **v6.4 / Phase 4 Session 2h: the sweep that correctly did not happen, plus
  one real correction.** Opening verification clean (only STATE.md moved since
  the 2g seal, v6.3, parachute 19/19, `storyMode:true`). The Jun-2026 SHP sweep
  was opened and abandoned on evidence: no source the project trusts has
  ingested the quarter, and two aggregators were caught mislabelling or serving
  stale data. **Founder moved the sweep behind v1.** One genuine error found and
  fixed along the way: BANDHANBNK `promoter_pct` 39.0 → **38.98**, the filed
  Mar-2026 total, with its aggregator provenance replaced. New file
  `sql/2026-07-25_bandhanbnk_mar26_exact.sql` (parachute now **20** dated
  migrations). No JS, no CSS, no schema change; row counts and the acid-test
  chip unaffected. Two new CONTRACT invariants: an aggregator may corroborate
  but never originate a figure, and an idempotent migration must read all-PASS
  on every run.
- **v6.3 / Phase 4 Session 2g: card weight, tone and motion.** Opening
  verification clean (only STATE.md moved since the 2f-hf seal, v6.2, parachute
  19/19, `storyMode:true`). Five files: `js/icons.js` 11,382 -> 12,553;
  `js/forces.js` 10,119 -> 11,019; `js/home.js` 23,212 -> 23,917; `js/story.js`
  44,447 -> 44,526; `css/components.css` 58,752 -> 63,471. **No SQL, no data
  change.** Browse buttons became cards on three grids while the force-detail
  filter row stayed a chip row; force-detail companies became tone-tinted cards
  counted from stored `tag_type`; the value-chain reveal shortened to .26s inside
  the layer with no animation disabled; compare groups gained marks including one
  new Defence & Aerospace glyph. Paint oracle re-run in full (17/17) because the
  animation timing was touched — the Session AC rule that only `#canvas` may
  disable `.fade-item` is asserted intact. Two new CONTRACT invariants: card
  styling is scoped by container, and tone is counted rather than inferred.
- **v6.2 / Phase 4 Session 2f-hf: the honest failure state.** Opening
  verification clean (main byte-identical to the 2e seal, STATE v6.1, parachute
  19/19, `storyMode:true` as expected). Three files: `js/story.js` 41,715 ->
  44,447; `css/components.css` 58,342 -> 58,752; `index.html` 9,070 -> 9,113.
  **No SQL, no data change.** Fixed the defect queued at 2e close: the hero
  printed `0` in six cards under a green "self-checked on load" whenever
  `loadData()` failed, asserting both that the check had passed and that the
  database was empty. Cards now hold an em-dash until sourced from the chip; the
  readout has four states; a failed load shows a red dot, an honest sentence and
  a Retry. The boot toast's Phase-1 copy about local JSON files was replaced.
  18/18 failure-world harness (baseline reproduces, fix passes), 55/55
  regression, 5/5 slow-network.
- **v6.1 / Phase 4 Session 2e: UI-2e — cards + icons, plus a five-defect fix
  pass.** Opening verification clean (main byte-identical to the 2d seal, STATE
  v6.0, parachute 19/19). Shipped `js/icons.js` (new, 11,382 b — the 37-mark
  sprite and 23-entry lookup) and wired three surfaces; founder approved all 37
  marks on a preview sheet before wiring. Review found four defects plus a state
  leak; all five fixed in the same session before STATE was written, which is why
  there is one changelog entry and not two. Final bytes: `js/icons.js` 11,382;
  `css/components.css` 58,342; `js/home.js` 23,212; `js/forces.js` 10,119;
  `js/story.js` 39,517; `index.html` 9,070; `CONTRACT.md` 39,7xx. **No SQL, no
  migration, no data change.** 55/55 harness including six new namespace
  assertions that would have caught the shipped defect, plus a 5/5 slow-network
  harness. Final `js/story.js` 41,715 b. Four new CONTRACT invariants: SVG through
  the HTML parser only; no story.js helper may shadow a domain global; the
  Companies tab is always all 107; and every data-backed tab must survive being
  opened before the data arrives. Closed with all seven founder checks passing
  (A-G) and C1-C4 re-verified after the data-timing fix. **`storyMode` left ON**
  on `main` by founder decision. One open defect logged and queued at the top of
  Where-we-are: the app renders zeros and a green self-checked tick when
  `loadData()` fails.
- **v6.0 / Phase 4 Session 2d: UI-2d — the Home hero, one declared exception,
  and a selection bug that had been hiding in plain sight.** Opening verification
  clean (STATE v5.9, parachute 19/19 both directions, `storyMode:false` on main,
  chip grepped from live `chipText()`). Four files: `CONTRACT.md` 31,332 →
  35,417; `css/components.css` 47,498 → 56,012; `js/home.js` 13,961 → 20,696;
  `js/story.js` 26,562 → 38,139. **No SQL, no migration, no data change.**
  `index.html`, `data.js`, `selftest.js`, `company.js`, `compare.js`, `forces.js`,
  `map.js`, `theme.css` untouched and byte-verified on main after the fact.
  Built: the injected `.st-hero` (moved aperture, agreed headline, grouped
  search, six counting chip-cards, instrument readout); `.st-page` chrome for
  Value chain; the live-factor feed relocated to What changed with a round-robin
  selection rule; and the single unscoped `#map-page{flex-direction:column}`.
  Harness 68/68 in production boot order with the paint oracle, run against the
  build and then again against live `main`; the oracle itself was validated 10/10
  including a deliberate re-injection of the Session AC defect. Two harness
  defects surfaced and were fixed **in the harness** — the source was never
  bent to satisfy a broken test. Founder confirmed A–E pass and flip-back clean;
  closing byte-diff IDENTICAL on all four files, `storyMode` verified back to
  `false`.
- **v5.9 / Phase 4 Session AC: UI-2c — the navigation model, and five defects
  the founder caught that the harness had blessed.** Opening verification green
  (STATE v5.8, parachute 19/19). Three files: `js/story.js` 13,627 → 26,562
  bytes, `css/components.css` +≈60 lines all scoped to `body.story`,
  `js/home.js` +1 guarded line. Six bezel tabs; five `.page` elements injected
  at runtime with the existing panels re-parented into them, ids intact;
  `map-page` reused; a navigation trail with truncation on revisit.
  **The session's real work was repair.** In order: (1) the Sectors tab was a
  dead end because `cards-area` had moved to another page — story.js now follows
  the filter forward; (2) Back always jumped Home because `init()` binds
  `goHome` AFTER `story.js` boots, so the boot-time detach was a no-op —
  replaced with order-independent capture-phase interception; (3) force,
  compare and map cards were **invisible but clickable**, because Session AB's
  body-wide `body.story .fade-item{animation:none}` removed the only route to
  opacity 1 for elements with no replacement reveal — the kill is now scoped to
  `#canvas`; (4) the Value chain tab opened an empty map because `renderMap()`
  is only ever called by `openMap()` — `goRoot()` now invokes it; (5) every page
  was 64px taller than its viewport because of the bezel padding. The harness
  grew from 28 to **46 tests**, gained production startup order, and gained a
  **paint oracle** that resolves final opacity from the stylesheet, because
  jsdom cannot see paint and that is precisely how defect (3) passed 38 green
  tests. Closing byte-diff: all three **IDENTICAL**; `config.js`, `theme.css`,
  `index.html`, `selftest.js`, `data.js` untouched. Founder verified E, F, J, K,
  K2 and L green. **No SQL, no migration, no data change; the chip is
  unchanged.** Open for 2d: `#map-page` lacks `flex-direction:column`
  (pre-existing) and needs the `.st-page` chrome. Next: 2d, the Home hero.
- **v5.8 / Phase 4 Session AB: UI-2b — the company chapters.** Opening
  verification green (STATE v5.7, parachute 19/19 both directions, flag off).
  Three files: `js/story.js` rewritten 2,782 → 13,627 bytes; `css/components.css`
  +89 lines, 42 selectors, **every one scoped to `body.story`**;
  `js/company.js` +5 lines, one guarded hook. Ten sections now render as one
  scroll under the flag, with the grouped pill rail, sticky headings, the
  reversible wipe, one-way body reveals, a 260ms value-chain draw, per-chapter
  counters and a narrow-screen strip. Gate cut, tone split in its place.
  Scroll-spy moved to **62%**, fixing the rail/section mismatch the founder
  reported. Two build-time bugs found and fixed before delivery: `.fade-item`
  fires at render so it had to be neutralised inside the layer, and a bad grep
  pattern led to `.vc-node` being wrongly declared non-existent. Harness moved
  to **jsdom** so it runs the real markup and the real renderers: **24/24**,
  including a byte-for-byte comparison of all ten chapter bodies against
  `sectionBody()`. Closing byte-diff: all three **IDENTICAL**; `config.js`,
  `home.js`, `selftest.js`, `data.js`, `theme.css`, `index.html` untouched.
  Founder verified all nine checkpoints. **No SQL, no migration, no data change;
  the chip is unchanged.** Next: 2c, the navigation model.
- **v5.7 / Phase 4 Session AA: UI-2a — the foundation, and the way back.**
  Concern: the scaffolding every later UI-2 session hangs off, plus a rollback
  that is one word rather than six file restores. Opening verification green
  (STATE v5.6, parachute 19/19 both directions, chip grepped from `chipText()`).
  Shipped: `CONFIG.storyMode` (live, **off**); `js/story.js` (new, 2,782 bytes)
  which adds `body.story` only when the flag is strictly `true` and otherwise
  does not touch the page at all; a 16-token type + spacing scale in
  `theme.css`, declared and read by nothing; a static page wash scoped to
  `body.story`; one line added to `index.html` loading `story.js` after the
  router and before the self-tests; and `/preview/` with three dependency-free
  design prototypes, recorded in CONTRACT and scheduled for deletion in 2g.
  **Checkpoint C initially failed** — the founder could not see the wash with
  the flag on. Cause was not the switch: `.hero` is `min-height:100vh` with an
  opaque gradient base and was painting over it, and the alpha was pitched at
  `.055`, below what a person can reasonably confirm. Fixed by a scoped
  `body.story .hero` override that keeps the accent radial and drops the opaque
  base, and by raising the wash to `.10`/`.07`. The harness gained the assertion
  it had been missing: it now fails on any full-viewport opaque surface left
  above the wash. **23/23** on the delivered bytes; closing byte-diff on all
  five files **IDENTICAL**; flag confirmed `false` on `main`. Founder verified
  the switch both ways with no residue. **No SQL, no migration, no data change;
  the chip is unchanged.** Next: 2b, the company chapters.
- **v5.6 / Phase 4 Session Z: UI-1 — page transitions, and the router that had
  to exist first.** Single concern: page transitions + micro-animations. Opening
  verification green (STATE v5.5, parachute 19/19 reconciled both directions,
  chip grepped from `chipText()` in `js/home.js`, not from prose). The session's
  real finding was structural: five files switched pages by hand using three
  different lists (`forces.js` −`map-page`; `compare.js` −`forces-page`
  −`map-page`), safe only by accident of which buttons existed. `showPage(id,dir)`
  in `js/home.js` is now the only thing that touches a `.page` class; it derives
  the page list from the DOM. Transitions are enter-only and direction-aware
  (`fwd` from the right, `back` from the left). `.pane-in` and `.home-panel` —
  both inert since the split, animating opacity 1→1 — now really animate;
  company cards gained a stagger capped at 330ms worst case that uses `translate`
  so the `:hover` lift survives; press feedback added; everything inside
  `prefers-reduced-motion`, which the router also honours in JS.
  **Six complete files** (`home.js` 44 changed lines, `components.css` 38,
  `company.js` 5, `forces.js` 5, `compare.js` 4, `map.js` 3); `data.js`,
  `selftest.js`, `config.js`, `theme.css` and `index.html` were **not delivered
  and are byte-identical**. vm round-trip harness: **30/30 on the delivered
  bytes and 30/30 re-run on the bytes now live on `main`** — chip string
  byte-identical live-vs-new, `chipText()` source byte-identical, all 25
  page-to-page transitions leave exactly one page active, the old leak
  reproduced on the live bytes then shown impossible, a 6th page handled with no
  code change, reduced-motion switches pages with no animation, and no new CSS
  rule sets a base `opacity:0`. Closing byte-diff: all six **IDENTICAL**.
  Founder confirmed all five checkpoints live. **No SQL, no migration, no data
  change; the chip is unchanged.** Next: UI-2, the storytelling company page.
- **v5.5 / Phase 4 Session Y: §2 closes at 107/107 — the last content gap.**
  Single concern: the 14 missing `companies.value_chain_note` rows — 13
  lenders (AUBANK, AXISBANK, BAJFINANCE, BANDHANBNK, BANKBARODA, CANBK,
  CHOLAFIN, FEDERALBNK, IDFCFIRSTB, KOTAKBANK, PNB, SBIN, SHRIRAMFIN) + ITC.
  Decision: write the real note, not N/A — a lender's chain is legitimately
  different (deposits are the raw material, underwriting the processing,
  credit the product), and each note names the metrics that measure THAT
  business (NPA %, NIM, cost-to-income; funding cost for the NBFCs); ITC's
  explains the four-business structure behind the cigarette chain §2 traces.
  Three drafts founder-approved (SBIN, KOTAKBANK, ITC), then all 14 shipped as
  `2026-07-23_value_chain_notes.sql`: UPDATEs guarded on ticker AND
  `value_chain_note IS NULL` (re-run = 14 × UPDATE 0; an edited note is never
  clobbered), dry-run twice on the parachute extract (14 → 0 → 0). **The kit
  shipped with two judge faults, both caught mid-session, both corrected
  before commit:** (1) v1 carried FOUR separate judge SELECTs, so the editor
  showed only the last grid and Judges 0–3 ran invisibly — the documented
  UNION'd-judge rule, violated anyway; (2) the one visible judge expected
  "95+" companies with `gnpa_pct`, but GNPA is a lender-only metric carried by
  exactly 15 tickers — live's "15" was the database agreeing with its own
  parachute and the judge being wrong, a false STOP manufactured by an
  unverified expectation. v2 rebuilt the judge as ONE UNION'd statement with
  UPDATE bodies byte-asserted identical to what had already run on live; the
  re-paste doubled as recovery proof (grid 0 · 14 · 107 · SBIN spot-check,
  exactly as predicted). A third fault, also the kit's: the runsheet pointed
  at a "§2 Strategic Position section" — changelog language that appears
  nowhere on screen (the page says "2 · Value Chain" / "Where it sits & why
  that matters"), and a NULL note had always rendered as silent absence
  (`vc.note ? … : ''`), which is why 14 gaps looked like 14 finished pages.
  Site verified: the caveat paragraph now renders for all 14. Chip confirmed
  word-for-word; no counted thing moved. CONTRACT parachute +1. Every §2
  surface is now deliberate: 107 positions, 107 notes.
- **v5.4 / Phase 4 Session X: the parachute was restored for the first time —
  and it was incomplete.** Single concern declared as "fix the parachute `as_of`
  gap"; the gap **did not exist**, and saying so is the first half of this
  entry. `2_DATA_complete.sql` backfills all 58 `as_of` values by `UPDATE` at
  line 943; a rebuild yields 107 companies, 0 NULL, 0 failures, and the drafted
  backfill migration updated **0 rows**. It was discarded rather than committed
  — a no-op does not belong in the parachute. **Root cause of the bad call:**
  the analysis read INSERT column lists and stopped, and the verifying harness
  read only INSERT rows too, so it agreed for the same wrong reason.
  **What the drill found instead.** Rebuilding onto a blank PostgreSQL 16
  (`1_SCHEMA` → `2_DATA` → all 17 dated migrations, twice) produced a site that
  **passed every self-test** while holding **99** verified management records
  against live's 107. Session E's eight PSU records — BANKBARODA, BEL, CANBK,
  COALINDIA, NTPC, ONGC, PNB, POWERGRID — were written straight to live in July
  and never committed as a file. Nothing was red, because a missing
  `mgmt_profiles` row renders the honest "queued for verification" placeholder;
  the sole signal was the chip. Eight companies' verified human research would
  have been lost in a real recovery, silently.
  **Fix:** `sql/2026-07-10_mgmt_batch1_psu.sql` — values read back out of live
  (not re-researched), `WHERE NOT EXISTS` per row so it never overwrites,
  explicit `::numeric` / `::date` casts (the first dry-run failed on
  `verified_on is of type date but expression is of type text`), and a judge
  that verdicts on all-8-present so it reads correctly on both a rebuild
  (mgmt_total 72) and live (107). **Dated 10 Jul deliberately:** it must sort
  after `flag5_verified_on` and before `mgmt_batch2`, whose pre-flight judge
  reads "expect exactly 72 (64 at flip + 8 from Session E)".
  **Proof:** full rebuild run **twice**, zero failures both passes, mgmt_total
  107, companies_without_mgmt 0; the rebuilt tables replayed through the real
  pipeline give a chip **identical to live, character-for-character**.
  **Also found, logged as items 12–13:** the dated migrations' judges are
  informational `SELECT`s that halt nothing (six printed wrong figures on the
  rebuild and all "succeeded"), and the drill needs `anon` / `authenticated` /
  `service_role` created first on a bare Postgres.
  **Governance:** OPERATING_MANUAL gains §8, the standing restore drill, with
  the explicit warning that a green self-test is not a passing drill; CONTRACT
  gains the restore rule and the new file in the parachute list.
  **One migration added. No live data changed** — the file is a no-op against
  production, where all eight rows already exist.

- **v5.3 / Phase 4 Session W: one acid test, not two.** Single concern
  delivered. **Root cause:** `js/home.js` rendered a FOUR-count chip ending
  *verified promoter records*; `js/selftest.js` logged a SIX-count console line
  ending *verified management records*. Both were quoted as "the chip" — the
  OPERATING_MANUAL had the four-count version (correct for the page), working
  memory had the six. Session V's runsheet therefore carried a STOP condition
  the site **could not satisfy**; the founder read the chip correctly and it
  looked like a failure. Nothing was ever broken in the data.
  **Fix:** the chip's text now comes from a single function, `chipText()`, and
  renders all six counts with one vocabulary:
  `● data checks: 107 companies · 492 metric bindings · 14 forces · 139 exposure links · 4 value-chain maps · 107 verified management records`
  — `js/selftest.js`'s console line carries the same six in the same order, and
  the harness asserts the two agree, so they can no longer drift apart.
  **Why six:** `forceLinks` (139) and `mapChains` (4) were computed on every
  load and displayed nowhere, and neither has a floor assertion — a force that
  quietly stopped matching 19 of its 20 companies, or a lost story, fails
  nothing. They now have a visible surface. **Why *management*:** the row is a
  `mgmt_profiles` record — holding, pledge and capital allocation — and §5 has
  always been titled *Management & Capital Allocation*; *promoter* undersold it.
  **CSS:** `.selftest-chip` gained `flex-wrap:wrap` + `max-width:100%` so the
  longer string wraps on a narrow screen instead of overflowing.
- **THE PARACHUTE HAS NOW ACTUALLY BEEN RESTORED (Session X, 23 Jul 2026) —
  and the first drill found it incomplete.** A full rebuild onto a blank
  PostgreSQL 16 (`1_SCHEMA` → `2_DATA` → every dated migration, twice) produced
  a site that **passed every self-test** while silently holding **99** verified
  management records instead of 107. Session E's 8 PSU records had been written
  straight to live and never committed as a migration. Nothing was red: a
  missing `mgmt_profiles` row renders the honest "queued for verification"
  placeholder, so the only signal was the chip reading 99 where live reads 107.
  `sql/2026-07-10_mgmt_batch1_psu.sql` closes it, and the rebuilt chip now
  matches live **character-for-character**. The drill is written into
  OPERATING_MANUAL §8 as a standing pre-release step.
  **Docs:** OPERATING_MANUAL §7 now states the canonical string, names the two
  places that produce it, and says explicitly to read the chip off the page and
  **not** from STATE — whose changelog correctly quotes older strings.
  CONTRACT gained the rule. `etl/refresh.py`'s expected-chip comment updated.
  **History was NOT rewritten:** 16 STATE entries still quote the old string.
  **Proof:** `node --check` + `py_compile` clean; **18-check harness** on the
  real parachute data asserting chip and console carry identical counts in
  identical order and identical vocabulary, that `chipText()` with live counts
  equals the documented string character-for-character, and that all three docs
  quote it verbatim. Counts unmoved: 107 · 492 · 14 · 139 · 4.
  **Found along the way, logged as items 8–10, all out of scope:** the parachute
  would rebuild 58 companies with a NULL `as_of` and a red chip (item 8, the one
  that matters before launch); `selftest.js:64` can throw and blank the page
  (item 9); the link/map counts have no floor assertion (item 10).
  **No SQL, no migration, no data change.**

- **v5.2 / Phase 4 Session V: the GROWTH panel — the last placeholder is gone.**
  Single concern delivered. Every section of every company page now holds real
  content; nothing on the company page says "coming soon" any more.
  **The design fork, resolved first (founder's call):** build §8 from the
  already-verified record — chosen over a new `growth_inputs` table on the
  Session-T pattern (correct architecture, but it seeds all-NULL, so v1 would
  launch with *two* empty panels and a multi-session research mission in front
  of it) and over retiring §8 to nine sections (cheapest, but throws away
  answers already sitting in the database).
  **The counting that decided it:** of 107 companies, **104 already carry a
  verified growth-rate metric** and **17–18 an order-book metric**; only **one**
  carries a CAGR. So "Revenue/PAT CAGR, guidance, order book and analyst
  consensus" was promising three things the record could largely already answer
  and one (consensus) that is off-mission entirely.
  **What §8 now is:** *which way is this business moving, and what is pushing it
  right now* — measured growth, forward-booked work, and the company's own §3
  factors regrouped by direction with a §10 tone line where headlines exist.
  Selection is a **fixed key-name rule** (`growth`/`cagr`; `ORDER_BOOK_HINTS`
  tested first so `order_backlog_growth_pct` reads as movement in the *book*),
  so a growth metric added by any future data pass appears with **no code
  change**. Growth numbers are printed **without colour on purpose** — a rising
  number is not automatically good, a falling one not automatically bad.
  **What it refuses, in writing on the page:** analyst consensus, earnings
  estimates, price targets, any projection. Stated as a position, not an
  apology — so nothing on the page admits incompleteness.
  **JS-ONLY SESSION — no SQL, no migration, no grant, no new table.** `data.js`,
  `refresh.py`, the schema and every RLS gate are untouched. The only changed
  file is `js/company.js` (+8,957 bytes), plus governance.
  **Proof:** `node --check` clean; **38-check vm round-trip harness** on the
  exact committed bytes covering all four panel states (growth+book, growth
  only, neither, no tags), NULL values, hostile-label escaping, block
  precedence, and the no-verdict assertion on every state; then the **real
  107-company parachute data replayed through the real pipeline**: 107/107
  panels rendered, **492 metric bindings before render and 492 after**, zero
  verdict words, coverage 104 growth / 18 order book / 3 honest-empty.
  **Chip invariant:** `107 companies · 492 metric bindings · 14 forces · 139
  exposure links · 4 value-chain maps · 107 verified management records` — §8
  adds no key and writes to nothing, so it cannot move the chip.
  **Queued from this session (neither is a v1 gate):** one growth figure each
  for IOC, LICI and SIEMENS (item 6), and the long-run CAGR series (item 7).

- **v5.1 / Phase 4 Session U: the NEWS & SENTIMENT panel — live for all 107.**
  Single concern delivered. §10 is no longer a placeholder.
  **The design fork, resolved first (founder's call):** a robot-fed `news_items`
  table with a tailwind/headwind tally — chosen over deriving §10 from §3's
  existing factors and over a hand-curated table (which cannot be live for 107).
  **SQL, one dated migration:** `2026-07-22_news_items.sql` creates `news_items`
  and ships all THREE gates in one file (the Session-T lesson): an RLS SELECT
  policy (`is_active=true` only), `GRANT SELECT` to anon/authenticated/service_role,
  and a REVOKE of the INSERT/UPDATE/DELETE/TRUNCATE that Supabase's default
  privileges silently hand anon — plus `NOTIFY pgrst`. A `sentiment` CHECK fixes
  the vocabulary to tailwind/headwind/neutral; a unique `url_hash` is the robot's
  dedup key. Dry-run **twice** on a from-scratch PostgreSQL 16 rebuild: identical
  judge grid both runs (`rows 0 · rls t · policies 1 · anon_can_read t ·
  anon_can_write f · sentiment_guard 1`). Both gates attacked and held: even after
  reproducing the hostile default-privilege ALL grant, `anon_can_write=f`; anon
  sees only active rows (1 of 2 planted); anon INSERT refused (`permission denied`).
  **JS guard shipped with the read, never after:** `data.js` routes `news_items`
  into a new `NEWS` pocket and never into `metric_order`; `company.js` §10 renders
  the newest headlines + a plain tone tally. vm round-trip harness on the exact
  live bytes, 15 checks: **metric bindings = 6 with news and without** (the 492 is
  invariant), display-only keys stay out of `metric_order`, NEWS pocket newest-first
  with a correct 1/1/1 tally, links carry `rel="noopener"`, headline + URL are
  HTML-escaped, and the panel contains **none of** cheap/expensive/undervalued/
  overvalued/buy/sell — the empty state is verdict-free too.
  **The news robot (new, separate file):** `etl/news_refresh.py` pulls Google
  News' free RSS search per company, tags each headline by a fixed word list
  (larger count wins; a tie is neutral — silence, honestly), dedups by `url_hash`,
  upserts with `resolution=ignore-duplicates`, and prunes rows older than 30 days.
  Kept OUT of `refresh.py` on purpose: a flaky news feed must never endanger the
  proven nightly market-cap/price run. Its own workflow `news.yml` runs 19:00 UTC
  daily (00:30 IST), clear of the 20:30 refresh and Sunday 21:30 backup. Pure
  logic unit-tested offline (classifier, dedup, tolerant RSS parse); the live
  fetch runs on GitHub Actions.
  **Chip invariant:** `107 companies · 492 metric bindings · 14 forces · 139
  exposure links · 4 value-chain maps · 107 verified management records` — news is
  not a metric and cannot move it.
  **State of the data:** `news_items` ships empty; §10 shows its honest "no
  headlines yet" state for all 107 until the news robot's first run (trigger it
  from the Actions tab to populate today).

- **v5.0 / Phase 4 Session T: the VALUATION panel — live for all 107.**
  Single concern delivered. §9 is no longer a placeholder.
  **The design fork, resolved first:** Option B — verified denominators ×
  nightly live price — chosen over an automated aggregator feed (fails
  OPERATING_MANUAL §3: black-box ratios cannot be reconciled, and Yahoo's
  Indian ratio coverage is patchy) and over shipping price-only.
  **SQL, three dated migrations:** `2026-07-17_valuation_inputs.sql` creates
  `valuation_inputs` and seeds 107 rows — lens set (EV/EBITDA **off** for all
  26 financials; `lens_note` for life insurers, telecom, aviation,
  conglomerates, developers), every denominator NULL. Dry-run twice on a
  from-scratch PostgreSQL 16 parachute rebuild: run 1 `INSERT 0 107`, run 2
  `INSERT 0 0`. Judge grid live: `107 · 26 · 81 · 107 · 0 ...` all ok.
  **Two follow-up migrations, both from real defects the judge grids caught:**
  `_expose.sql` (the site read 404'd — a new table grants anon *nothing*, and
  PostgREST reports invisible as 404; GRANT SELECT + `NOTIFY pgrst`) and
  `_lockdown.sql` (the next grid returned `anon_can_write = 3` — Supabase's
  DEFAULT PRIVILEGES silently grant anon ALL on new public tables; REVOKEd).
  **Nothing was ever exposed:** RLS held both times, proven by attacking the
  reproduced grant state (`UPDATE 0`; INSERT refused by policy). Defence in
  depth restored — both gates now shut.
  **JS guard shipped BEFORE the robot, deliberately inverting the usual order:**
  `data.js` routes `price_inr` / `pe_ttm` / `pb` / `ev_ebitda` into a new
  `VALUATION` pocket via `VALUATION_KEYS` / `isDisplayOnlyKey()`, never into
  `metric_order`. Had the robot written first, those keys would have entered
  `metric_order` and the chip would have read ~800 the next morning.
  Harness-proven across three scenarios (no ratio rows / ratio rows flowing /
  table missing 404): bindings unchanged in all three.
  **Robot v3 → v3.2**, two real defects found on live runs and fixed:
  v3.0 returned as soon as *either* market cap or price arrived, so market cap
  lost v2's retries (98/107 on the first run) — v3.1 retries until both are
  present; then 9 companies (RELIANCE, TCS, JSWSTEEL, BOSCHLTD, RECLTD, IOC,
  TVSMOTOR, SUZLON, LTIM) proved to have **no** market cap at source at all, so
  v3.2 derives it as price × shares (Reliance → ₹17.5 lakh cr, correct).
  Final live run: **market_cap 106 · price 106**, 212 rows written.
  **Panel:** price, market cap, market-cap-vs-own-record, and three lens-aware
  ratio rows that distinguish *not applicable for this business* (with the
  business reason) from *awaiting verification*. Peer comparison uses the
  median and stays silent below three peers. 13 assertions pass, including
  "never says cheap/expensive/undervalued/buy/sell".
  **Chip invariant, confirmed live four times** across 204 and then 212 new
  nightly rows: `107 companies · 492 metric bindings · 14 forces · 107 verified
  promoter records`.
  **State of the data:** all 107 denominators are still NULL by design, so the
  panel honestly shows price + market cap and "awaiting verification" for every
  ratio. That is the correct state until the results-season lane runs.

- **v4.9 / Phase 4 Session R: architecture — structure matches the paperwork.**
  Single concern delivered. (1) `OPERATING_MANUAL.md` v3 committed to the repo
  root (was never on `main`; the 15-Jul commit had silently dropped) —
  consistency-checked against CONTRACT/STATE first, which caught a missing
  single-writer rule (added as §2 rule 8) and a mis-attributed incident (the
  "lost find/replace" was really Session B's silently-dropped `compare.js`
  commit); byte-verified after commit; also uploaded to project knowledge.
  (2) Flag 3: the retired `/sql` husk pair (`schema.sql` + `seed.sql`) removed
  and replaced by the underscore-named parachute pair — which first landed
  with spaces (the display-name trap), caught by byte-diff and re-committed
  clean; the four `investorlens-backups` husks were found already absent
  (paperwork stale), a valid v2 backup confirming no loss. (3) Flag 4:
  shipped `2026-07-16_snapshot_prune.sql` — keep-last-90-days + first-of-month
  for the nightly `market_cap_cr` series, scoped so the 492 bindings and the
  chip are untouchable; idempotent; proven twice on PostgreSQL 16 (real → 0
  deleted today, synthetic aged → exact keep/delete, re-run → 0); live run 0
  deleted, 492 held, chip intact. No `data.js` change needed (verified: the
  waiter paginates and reads only the newest market-cap row). CONTRACT
  parachute now lists 13 dated migrations and carries the retention rule;
  this STATE committed last under the single-writer rule (tarball re-pulled,
  rebased onto live, next version taken).**
- **v4.8 / Phase 4 Session Q-UI: new home shell (UI only, no DB touched).**
  Aperture logo (ring spins forever; bars+spark once), left-to-right wordmark
  sweep, bigger search, a left “Menu” column holding all five actions (docked on
  Home; left-edge pull-tab drawer on inner pages + mobile), the live-factors feed
  moved into the Menu as a **scrollable newest→oldest list** (marquee retired),
  and a **full-viewport symmetric hero** (mirrored top/bottom grid, content
  centred). Browse-all count is now data-driven; two hard-coded “58”s removed.
  Three files: `index.html`, `css/components.css`, `js/home.js`. 18/18
  byte-asserted transforms; `node --check` + brace balance + ID uniqueness; 17/17
  jsdom boot. The Menu is an app-level shared shell driven by `body.on-home`,
  kept in sync by a MutationObserver — no other JS file changed. Chip text
  unchanged. Queued next (UI lane): page transitions + micro-animations, then the
  storytelling company page — sequenced after the architecture session
  (Session N+ item 5) and the sweep resume. *(Renumbered v4.7 → v4.8 at the
  16-Jul merge: two parallel chats each wrote a v4.7; the data-lane
  checkpoint follows below.)*
- **v4.7 / Phase 4 Session Q (checkpoint): quarterly sweep OPENED — baseline
  locked, zero Jun-2026 filings available yet; Item 0 closed; architecture
  session queued next by founder decision.** Opening verification found two
  discrepancies: (a) `sql/2026-07-15_indigo_source_relabel.sql` sat on `main`
  but in neither CONTRACT's parachute nor this changelog — a parachute orphan,
  fixed this session (CONTRACT +1; this entry is the STATE half); the 18-row
  read-only pre-flight proved its UPDATE had already run (00a=t / 00b=f).
  (b) **OPERATING_MANUAL.md is not in the repo** — the 15-Jul commit never
  landed; Session Q ran governance off the opening prompt; re-committing the
  manual is Item 0 of the architecture session. Sweep state: shortlist built
  from the data (marker grep of seed + batch files, then an 18-row read-only
  judge against the live table — all 16 markers found, every figure matching),
  then reconciled against the standing list in Session N+ item 4, which added
  4 names the keyword grep missed (BAJAJ-AUTO, ASIANPAINT, ADANIPORTS, TMPV —
  their rows say "next SHP" / "this cell moves" / "post-buyback", not
  "drift"). **Roster: 20. Coverage: Jun-checked-changed 0 ·
  Jun-checked-unchanged 0 · awaiting filing 20 · stable names out of scope
  ~87.** Spot-checks on all three Tier-1 names on 16 Jul (INDIGO via the
  quarter-labelled Trendlyne table, BANDHANBNK via screener + the announcement
  stream, HDFCLIFE via Equitymaster/IIFL) show every channel still serving
  Mar-2026 as latest; filings are due by ~21 Jul. Direction expectations
  recorded for the resume: INDIGO ↓ toward ~41.3 iff the 25-May ₹487 cr block
  seller was RG, else ~flat; BANDHANBNK ↓ toward ~37.9 (BFHL tranches ran to
  12-May, inside the quarter); HDFCLIFE ↑ ≈50.5 — DERIVED, NOT FILED:
  (1,08,33,42,272 + 1,45,23,906) / 2,17,24,74,981 = 50.53%, and the pre-issue
  math reproduces the recorded 50.20/50.21 exactly, so the components
  reconcile. No database row changed during this session (the relabel UPDATE
  pre-dated it); chip text unchanged by construction. Founder decision
  recorded: complete the project architecture (manual + flags 3–4) before the
  sweep resumes. *(Restored at the 16-Jul merge after the Q-UI commit had
  overwritten it — see Lessons Session Q-UI.)*
- **v4.6 / Phase 4 Session P: INDIGO's filed figure lands — the Session N/O/P
  queue is complete.** promoter_pct 40.48 (derived) → **41.57** (filed Mar-2026
  SHP, founder-verified against the exchange filing 15-Jul-2026). Research
  trail: Trendlyne entity-level table (self-reconciling to the share:
  35.69 IGE + 0.03 Bhatia individuals + 4.53 Rakesh Gangwal + 1.32 Chinkerpoo
  Trust = 41.57 / 160,732,247 shares), corroborated by IIFL (41.57) and Kotak
  (41.6 rounded); discrepancy log resolved 41.58 = Dec-2025 and 43.5 = Jun-2025
  before verification began. Error mechanism identified: the old derivation
  missed the Chinkerpoo Trust's 1.32%. Executed as FOUR value-guarded UPDATEs
  (`2026-07-15_indigo_shp_exact.sql`), not Part D's one — the number lived in
  four places (promoter_pct, two promoter_who sentences, source_note); Part D
  verbatim would have left "41.57" above prose still calling it "a derived
  40.48". Dry-run on a production-identical fixture (batch7 text + repair
  B3/B4 applied): pre-flight t/t/t → four UPDATE 1 → judge green → re-run four
  UPDATE 0. Prose now reads "the filed Mar-2026 SHP figure… will drift lower
  each quarter until the RG Group reaches zero" — the drift warning survives,
  the caveat retires. CONTRACT parachute +1 (file replays last by filename;
  batch7's 40.48 judge remains true at its point in the replay and is
  superseded by this file's judge). Chip text unchanged. With this, every
  one-off item queued at Session N's opening is closed; what remains is the
  standing quarterly SHP re-verification sweep — INDIGO explicitly flagged as
  drift-prone until the RG Group reaches zero.
- **v4.5 / Phase 4 Session O: LTIM joins its peers (flag 2 closed).** One
  guarded UPDATE (`WHERE ticker = 'LTIM' AND compare_group = 'IT Services'`)
  moved LTIM into "IT" — the guard means it can only ever touch LTIM and
  re-running returns UPDATE 0, proven twice on PostgreSQL 16.14. Pre-flight
  judge confirmed the solo bucket held only LTIM (STOP condition written into
  the file for the other case). vm harness on the exact live compare.js bytes,
  before vs after: BEFORE — no "IT Services" chip (< 2 members), LTIM compare
  button HIDDEN; AFTER — IT · 6, button SHOWN; metric keys union cleanly (a
  metric only LTIM discloses renders "—" for the other five, already captioned
  honestly). No code shipped; "IT Services" stays in GROUP_LABELS empty (the
  selftest.js:30 tripwire makes deleting it strictly worse than keeping it).
  Only other pixel moved: LTIM's home-card chip now reads "IT" (home.js:148
  prints compare_group). CONTRACT parachute +1 dated migration
  (`2026-07-14_ltim_peer_group.sql` — note it sorts BEFORE the narratives file
  in filename-order replay; the two touch different tables and are
  order-independent), and the stale "repair file runs last" sentence — left
  behind by Session N's own edit — corrected in the same pass. Chip text
  unchanged. Session N+ queue now holds a single item: INDIGO's filed
  Mar-2026 SHP figure.
- **v4.4 / Phase 4 Session N: narratives get a sort key (flag 1 closed).**
  `cross_company_narratives.display_order` (integer, NULLABLE, spaced by 10s, no
  unique constraint) added and backfilled **in the order the site was already
  showing** — so the migration itself moves nothing on screen; the curated order
  (power → metals-auto → holding → banca) is a separate, optional Part C the
  founder runs when he wants it. `data.js` 1 line changed (`:198`): `id.asc` →
  `display_order.asc.nullslast,id.asc`. SQL-before-JS enforced (JS first would
  400 on an unknown order column and blank the map page). Dry-run on PostgreSQL
  16.14: pre-flight reproduces the alphabetical bug; Part B run twice →
  identical (idempotent); Part C run twice → identical (re-runnable); Part B
  re-run AFTER Part C does **not** clobber the renumber; a 5th story inserted
  with no number lands **last** and gets 50 on the next Part B. vm round-trip
  harness against the exact live bytes: 5/5 — order param changes, every
  CHAINMAP story object byte-identical, no `display_order` key leaks into the UI
  shape, the other six tables' order clauses untouched. CONTRACT updated
  (Narratives translation rule + parachute now names
  `2026-07-14_narratives_display_order.sql`, which must run before a rebuilt
  database serves `data.js`). Chip text unchanged.
- **v4.3 / Phase 4 Session M: post-paste repair + record corrections.**
  (1) Verified from live bytes that BOTH robots are already v2 on main —
  refresh.py writes dated `metric_snapshots` rows with the delete-then-insert
  guard (cron 02:00 IST nightly), backup.py photocopies all 8 tables with
  empty-backup refusal (cron Sun 03:00 IST) — the "robots v2 need to land"
  backlog line was stale; what remains is a green-run check in the Actions
  tab. (2) Batches 5-7 landed on main byte-identical to the drafts, which
  means the two [VERIFY] flags entered production unresolved; shipped
  `2026-07-12_session_m_flag_repair.sql` (4 guarded UPDATEs, idempotent,
  proven twice on the 107-row end-state fixture: flags 2→0, count 107
  unchanged). SUNPHARMA's Organon clause is now CONFIRMED — definitive
  agreement 26-Apr-2026, US$14.00/share all-cash, EV US$11.75 bn, 103%
  premium, close expected early 2027 (joint release + Organon SEC 8-K) — the
  Forbes clause was true and now carries the filing. INDIGO's bracket became
  an honest house-style caveat; the exact SHP figure is still owed (Session
  N+ item 1). (3) The three batch files were committed with SPACES in their
  filenames ("2026-07-11 mgmt batch5 pharma health.sql"), which breaks the
  parachute's filename-order replay (space sorts before underscore) and
  orphans CONTRACT's references — rename runsheet issued; CONTRACT text is
  correct once the renames land. New lesson below.
- **v4.2 / Phase 4 Sessions K + L: MGMT BACKLOG COMPLETE.** Batches 6 and 7
  shipped as count-chained files (pre-flights 94 and 100; paste order 5→6→7
  enforced by Judge 0a). Batch 6 (HINDALCO 34.64, JSWSTEEL 45.32, TATASTEEL
  33.19, ULTRACEMCO 59.33, GRASIM 43.74, ADANIPORTS 68.02): JSWSTEEL's 11.81%
  pledge is the platform's largest — six named entities, offshore vehicles at
  100%, falling from 15.24% — recorded alongside the same-week CARE/Fitch
  upgrades; ADANIPORTS' nil carries its 17.31%-in-2023 history and the
  "excluding already-disclosed" Reg 31(4) wording verbatim. Batch 7
  (ASIANPAINT 52.63 with a live Smiti/Sattva pledge incl. 5,00,000 shares to
  Bajaj Finance 2-Mar-2026; NESTLEIND 62.76; TATACONSUM 33.84; TITAN 52.90
  with TIDCO 27.88% as the larger promoter; TRENT 37.01; INDIGO 40.48 DERIVED
  and marked [VERIFY]; ETERNAL 0 — first no-promoter row). Batch 7 adds Judge
  6: zero companies without a mgmt row. Chained dry-run on PostgreSQL 16.14:
  89→94→100→107, all judges as predicted, second pass INSERT 0 0 on all three
  files. Chip acid test: 107 verified promoter records. Backlog: 0.
- **v4.1 / Phase 4 Session J:** Mgmt gaps Batch 5 shipped. 5 pharma/health
  records (CIPLA 29.21%, DRREDDY 26.63%, SUNPHARMA 54.48%, APOLLOHOSP 28.02%,
  MAXHEALTH 23.74%) machine-researched — Dr Reddy's FY26 Reg 31(4)&(5)
  nil-encumbrance declaration (signed by K Satish Reddy and G V Prasad), Max
  Healthcare's FY26 Reg 31(4) filing (6-Apr-2026, Abhay Soi + Aditya Soi),
  Apollo's NCLT-approved composite scheme (24-Jun-2026) demerging pharmacy and
  digital health, and the Mar-2026 shareholding tables read entity by entity —
  founder-verified, inserted via SQL Editor as
  `sql/2026-07-11_mgmt_batch5_pharma_health.sql`. Idempotent `WHERE NOT EXISTS`
  insert + 6 self-judges; dry-run on PostgreSQL 16.14 passed twice (94 rows,
  0 dupes, 0 NULL verified_on, date buckets 64/8/22). **Two substantive
  pledges, moving in opposite directions:** SUNPHARMA 1.42% and rising (Raksha
  Sudhir Valia 63.96% of her holding; Kumud Shantilal Shanghvi 100% of hers;
  Dilip Shanghvi himself 0.00%), APOLLOHOSP 2.49% and falling from 16.30% at
  Jun-2023 (K Vishweshwar Reddy 42.16% of his; Suneeta Reddy 11.58%). CONTRACT
  parachute list updated (+1 dated migration). Chip acid test: 94 verified
  promoter records. 13 gaps remain (batches 6-7).
- **v4.0 / Phase 4 Session I:** Mgmt gaps Batch 4 shipped. 7 IT/auto records
  (HCLTECH 60.86%, TECHM 34.97%, WIPRO 72.59% *as of Jun-26, post-buyback*,
  BAJAJ-AUTO 55.01%, EICHERMOT 49.07%, M&M 18.45%, TMPV 42.56%)
  machine-researched — Tech Mahindra's and Eicher's own 31-Mar-2026 exchange
  SHPs read at source (TECHM's encumbrance rows all "No"), Wipro's FY26
  Reg 31(4) nil-encumbrance filing (6-Apr-2026), Eicher's promoter-group
  Reg 31(4)&(5) filings (8-Apr-2026), and Wipro's 30-Jun-2026 extinguishment
  filing (60 cr shares cancelled; promoter 72.52% → 72.59% *while selling*
  42,80,45,126 shares) — founder-verified, inserted via SQL Editor as
  `sql/2026-07-11_mgmt_batch4_it_auto.sql`. Idempotent `WHERE NOT EXISTS`
  insert + 6 self-judges; dry-run on PostgreSQL 16.14 passed twice (89 rows,
  0 dupes, 0 NULL verified_on, date buckets 64/8/17; `M&M` and `BAJAJ-AUTO`
  round-tripped intact). First two non-zero pledge cells on the platform.
  CONTRACT parachute list updated (+1 dated migration). Chip acid test: 89
  verified promoter records. 18 gaps remain (batches 5-7).
- **v3.9 / Phase 4 Session H:** Mgmt gaps Batch 3 shipped. 5 NBFC/insurance
  records (CHOLAFIN 49.25% Mar-26, SHRIRAMFIN 20.30% Apr-26, JIOFIN 49.13%
  Apr-26, HDFCLIFE 50.21% Mar-26, SBILIFE 55.33% Mar-26) machine-researched —
  SHRIRAMFIN's 08-Apr-2026 and JIOFIN's 21-Apr-2026 event shareholding patterns
  read at source, plus HDFC Bank's Q4 FY26 deck (50.21%, solvency 177%), its
  FY26 Reg 31(4) nil-encumbrance filing (3 Apr 2026) and HDFC Life's own FY26
  call transcript (₹1,000 cr preferential issue, ~900 bps of solvency) —
  founder-verified, inserted via SQL Editor as
  `sql/2026-07-11_mgmt_batch3_nbfc_insurance.sql`. Idempotent `WHERE NOT
  EXISTS` insert + 6 self-judges; dry-run on PostgreSQL 16.14 passed twice
  (82 rows, 0 dupes, 0 NULL verified_on, date buckets 64/8/10). CONTRACT
  parachute list updated (+1 dated migration). Chip acid test: 82 verified
  promoter records. 25 gaps remain (batches 4-7). Zero pledges across all five.
- **v3.8 / Phase 4 Session G:** Mgmt gaps Batch 2 shipped. 5 private-bank
  records (AUBANK 22.76%, AXISBANK 8.15%, BANDHANBNK 39.0%, FEDERALBNK 0%,
  IDFCFIRSTB 0%) machine-researched — AU's 31-Mar-2026 exchange SHP and FY26
  Reg 31(4) nil-encumbrance read at source; BFHL's Reg 29(2) filing (40.00% →
  37.93%, Sep-25 → 12-May-26) read at source — founder-verified, inserted via
  SQL Editor as `sql/2026-07-11_mgmt_batch2_private_banks.sql`. Idempotent
  `WHERE NOT EXISTS` insert + 6 self-judges; dry-run on PostgreSQL 16.2 passed
  twice (77 rows, 0 dupes, 0 NULL verified_on, date buckets 64/8/5). Chip acid
  test: 77 verified promoter records. 30 gaps remain (batches 3–7).
- **v3.7 / Phase 4 Session F:** Flag 5 closed. `mgmt_profiles.verified_on`
  (date, nullable) added + backfilled via self-judging SQL (Judge 1: 64 →
  02 Jul, 8 → 09 Jul; Judge 2: 0 NULLs); `data.js` mgmt mapping +1 line;
  `company.js` gained `fmtVerifiedOn()` and prints the row's date ("—" when
  NULL). vm-harness on exact bytes: six globals identical old-vs-new;
  02-Jul pages byte-identical; COALINDIA differs only at the date; queued
  box untouched; formatter immune to Date() timezone shift. CONTRACT MGMT
  shape + parachute updated; migration committed as
  `sql/2026-07-09_flag5_verified_on.sql`. Chip text unchanged.
- **v3.6 / Phase 4 Session E:** Mgmt gaps Batch 1 shipped. 8
  government-promoter records (BANKBARODA, CANBK, PNB, COALINDIA, NTPC,
  ONGC, POWERGRID, BEL) machine-researched — including three FY26 SEBI
  SAST nil-encumbrance disclosures found at source — founder-verified
  against exchange SHP filings, then inserted via SQL Editor. Chip acid
  test passed: 72 verified promoter records. 35 gaps remain, pre-grouped
  into batches 2–7. Flag 5 escalated: the hardcoded "Verified 02 Jul 2026"
  is now false for the 8 new rows — Session F top priority before Batch 2.

- **v3.5 / Phase 4 Session D:** New UI shipped. Bull/bear debate re-housed
  from §10 into §9 Price & Valuation (per CONTRACT: bull=§9, bear=§7/§9) with
  intro line, count badges and a centre "vs" spine; §2 gained the
  strategic-position card; §10 is now an honest news placeholder; §5 queued
  copy is count-driven (auto-reads "64 of 107", never stale). Framework
  untouched — 10 sections, titles/nav byte-identical. 22/22 vm-harness checks
  on the exact new bytes incl. §7 regression; chip text unchanged; both
  commits content-verified via raw-view find. NEW FLAG: §5 verified-date is
  hardcoded "02 Jul 2026" in company.js — needs a data-driven date (Session E).

- **v3.4 / Phase 4 Session C (this pass):** Robots v2 shipped. `refresh.py`
  writes one dated, idempotent-per-day market-cap row per ticker into
  `metric_snapshots` (`status='verified'`) + stamps `companies.fetched_at`;
  `backup.py` dumps all eight tables with pagination + manifest; both
  workflows verified unchanged. 28/28 fake-PostgREST harness checks + 5/5
  round-trip through live `data.js` bytes. New flags: backup-repo husk files
  (optional delete), snapshot growth / future prune session.
- **v3.3 / Phase 4 Session B (this pass):** DB flipped live (fresh backup →
  1_SCHEMA → 2_DATA); `compare.js` +8 peer groups on `main` (commit `8139799`,
  byte-verified); harness green on the exact live bytes
  (107/492/14/139/4/64). Incidents documented above: early blackout (commits
  landed on `main`, no branch) and a silently-dropped commit — both caught by
  direct repo verification and resolved forward. Robots v2 promoted to
  Session C with the backup gap flagged.
- **v3.2 / Phase 4 Session A:** New 8-table `data.js` written; `compare.js`
  +8 peer groups (9 lines). Round-trip harness: NEW selftest PASS
  (107/492/14/139/4/64); OLD baseline PASS (58/295/14/85/4/15); 58-overlap
  zero structural + zero value diffs; order-by-id proven == curated
  metric_order for all 58. Flags: CHAINMAP alphabetical order (cosmetic),
  LTIM solo in "IT Services".
- **v3.1 / Phase 4 dry run:** Both founder SQL files executed cleanly on local
  PostgreSQL 16 UTF-8; full audit green. Discovered the companies-name
  collision → locked the frontend-first, fast-flip order.
- **v3.0 / Phase 4 kickoff:** 107-company SQL revealed; pre-load backup rule.
- **v3.0 / Phase 3a+3b:** nightly mcap robot; weekly backup (6 files landed).
- **v3.0 / Phase 2:** five tables seeded; acid test passed.
- **v3.0 / Phase 1:** monolith split; self-tests identical.
