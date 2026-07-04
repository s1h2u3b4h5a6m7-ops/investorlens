# InvestorLens India — Project Plan v3 (Source of Truth)

**Business & Value-Chain Analysis Platform**
Supersedes Plan v2 (1 Jul 2026). Updated: 4 July 2026.
Decisions locked with the founder: **budget strictly ₹0 · audience = founder + a few friends · data freshness = daily (nightly refresh)**.

---

## 1. Why v3 Exists — What We Learned the Hard Way

The v2 plan produced a real product: **V2.6 Command Center** — a single HTML file with 58 companies across 19 sectors, per-company value-chain diagrams, a macro-force lens, compare mode, an inter-company chain map, 15 verified management records, and a self-test harness. That single-file approach was the *right* choice for prototyping. It is now the *wrong* choice for everything that comes next, for four proven reasons:

1. **Token fire.** Changing one button means re-reading ~6,000 lines. Development cost grows with file size, not with the size of the change.
2. **Fragility.** One corrupted file = the whole project gone. No undo, no history. (The v2 plan file itself silently became a text file wearing a .docx name — exactly the kind of quiet damage version control prevents.)
3. **Static forever.** A lone HTML file can never update itself. No nightly data, no living feel.
4. **Decoupling without a contract fails.** The founder tried separating UI and data by hand and couldn't re-merge them. Not a skill problem — separating the kitchen from the dining room without first writing down the menu fails for professional teams too. v3 writes the menu first.

**What v3 changes:** the plumbing. **What v3 keeps:** everything else — the mission, the 10-section framework, the honesty rules, the "Precision Instrument" design, and all 58 companies of verified data living inside V2.6, which becomes the seed.

---

## 2. Mission (Unchanged, Restated)

> **Understand the business first. The stock price is just one data point about it.**

This platform exists to answer, for any Indian listed company: *what does this business actually do, whose chain is it a link in, and what real-world forces are pushing on it right now?* Valuation stays deliberately second-to-last. This is a business-understanding engine, not a stock-tip machine. Every v3 architecture decision serves that mission: fresher factors, historical trends, and a site that reads like a living story of each business — with an honest "as of" timestamp on everything.

---

## 3. The New Architecture — Explained Like You're 12

Think of the whole system as a small restaurant:

| Piece | Restaurant job | Real name | Cost |
| --- | --- | --- | --- |
| **The dining room** — the pretty part visitors see | Tables, menus, lighting | Static website (HTML/CSS/JS) hosted free on **GitHub Pages** | ₹0 |
| **The filing cabinet** — where every company's data lives | The pantry, perfectly organised | **Supabase** (a free online Postgres database) | ₹0 |
| **The waiter** — carries data from cabinet to dining room | Takes orders, brings food | Supabase's built-in **auto-API** (no server code needed for reads) | ₹0 |
| **The robot on a timer** — works while we sleep | Restocks shelves nightly, photocopies the recipe book | **GitHub Actions** (free scheduled scripts) | ₹0 |
| **The recipe book with every version photocopied** | Nothing is ever lost | **GitHub repository** (version control) | ₹0 |
| **The menu / the contract** | Kitchen and dining room agree on dish names once, forever | `CONTRACT.md` — one short document defining data shapes | ₹0 |

```
  GitHub Actions (robot, nightly)          GitHub repo (recipe book)
        │  refresh + ping + backup                │ hosts the site
        ▼                                         ▼
  Supabase database (filing cabinet) ───► Website on GitHub Pages (dining room)
        ▲         auto-API (waiter)              ▲
        └── Claude + founder add verified data ──┘  (browser of you + friends)
```

**The key idea:** the dining room never stores food; it *asks* the cabinet each time. So data can change every night **without touching the UI**, and the UI can be redesigned **without touching the data**. That is the decoupling that failed before — made safe by the contract.

**Why no separate "backend server" (FastAPI) yet:** Supabase ships with a built-in read API. For a read-only site serving a few people, adding our own server is an extra machine to babysit for zero benefit. The plan keeps FastAPI as a *later option* (Section 10, Phase 6) for when we need computed endpoints. Fewer moving parts = fewer things a two-person team can break.

---

## 4. The Token-Economy Rules (How Development Gets 10× Cheaper)

These five rules are the heart of v3. They are non-negotiable working discipline:

1. **Small files.** The single 6,000-line file becomes ~10 files, each with one job (target < 400 lines each). A UI tweak session reads *one* small file, not everything.
2. **The contract is law.** `CONTRACT.md` defines the exact shape of every data record (what fields a company has, what a factor looks like). UI sessions and data sessions both read only the contract — never each other's code.
3. **One session, one concern.** Each new chat does exactly one thing: "restyle the hero," or "add 5 companies," or "fix the compare bug." Never mixed.
4. **The briefing file replaces memory.** A short `STATE.md` in the repo records what exists, what changed last, and what's next. Every new chat starts by reading STATE.md + CONTRACT.md + the one file being changed — maybe 500 lines total instead of 6,000.
5. **GitHub is the only source of truth.** No more uploading HTML files back and forth. Claude reads current files from the repo's public URLs (raw.githubusercontent.com) and hands back exact replacement files or small patches; the founder pastes/uploads them on github.com in the browser. Every change is a commit — instantly undoable.

**Worked example of the saving:** "Make the ticker slower." Old world: read 6,000 lines, rewrite one, re-deliver 6,000. New world: read `STATE.md` (60 lines) + `ticker.js` (80 lines), deliver `ticker.js` (80 lines). Roughly **40× less material moved** for the same change.

### The repo layout (the target file map)

```
investorlens/
├── index.html          ← page skeleton only (~150 lines)
├── css/theme.css       ← the locked Precision Instrument design tokens
├── css/components.css  ← everything else visual
├── js/config.js        ← Supabase URL + anon key + constants
├── js/data.js          ← ALL talking-to-database code (the only file that knows Supabase exists)
├── js/home.js          ← hero, tabs, ticker, cards
├── js/company.js       ← 10-section master-detail view
├── js/compare.js       ← compare mode
├── js/forces.js        ← macro-force lens
├── js/map.js           ← inter-company chain map
├── js/selftest.js      ← the integrity checks, now testing DB data
├── etl/refresh.py      ← the robot's nightly script
├── etl/backup.yml + refresh.yml   ← GitHub Actions schedules
├── CONTRACT.md         ← the data shapes (the menu)
├── STATE.md            ← current status + next step (the briefing)
└── PLAN_v3.md          ← this document
```

---

## 5. The Founder's Job vs Claude's Job (Roles, Stated Plainly)

**Claude = CTO.** Designs everything, writes every line of code, writes every SQL command, explains every decision in plain language, and never asks the founder to figure anything out alone.

**Founder = the hands.** Only ever asked to do things from this closed list — nothing else will ever be required:
- Create free accounts (GitHub, Supabase) with email + password.
- Click buttons Claude names, in the order Claude gives.
- Copy-paste: URLs, keys, SQL snippets into Supabase's SQL editor, file contents into GitHub's web editor.
- Paste back to Claude: any error message, any URL, any key *from the allowed list below*.
- Make the judgement calls Claude explicitly asks for (business priorities, what to build next, what looks right).

**The two-keys rule (the one security lesson that matters):** Supabase gives two keys. The **anon key** is the *front-door key* — safe to paste anywhere, even inside the public website; it can only read what we allow. The **service_role key** is the *master key to the safe* — it goes ONLY into GitHub's encrypted "Secrets" box for the robot, and is never pasted in chats, files, or the website. Claude will never ask for the master key in plain text; if it ever leaks, we click "regenerate" in Supabase and the old one dies.

---

## 6. Data Architecture (The Filing Cabinet's Drawers)

Five tables, mirroring what V2.6 already proved works. Sizes are trivial: even at 5,000 companies this is a few hundred MB of *text* — years of headroom inside Supabase's 500 MB free database (58 companies ≈ under 2 MB).

| Table | One row = | Key fields |
| --- | --- | --- |
| `companies` | one company | ticker (key), name, sector, compare_group, business_core, value_chain text, moat_note, mcap, as_of |
| `metrics` | one metric value for one company **on one date** | ticker, metric_key, label, value, unit, note, higher_is_better, `snapshot_date` |
| `factors` | one real-time factor tag | ticker, type (risk/tailwind/neutral), label, `tagged_on` |
| `chains` | one value-chain node | ticker, side (up/down), label, tag, note — plus a `chainmap` group for inter-company links |
| `mgmt` | one verified management record | ticker, promoter_pct, who, pledge, capital, as_of, sources |

**Why `snapshot_date` is the quiet superpower:** the single HTML file could only ever hold *today's* number. The database keeps **every** nightly/quarterly value forever — which is what makes 10-year trend charts (v2 plan §6 promise) possible later without any redesign. History becomes free.

**Access rules:** Row Level Security ON, policy = *anyone may read, nobody may write* via the anon key. All writing happens through the master key (the robot) or the Supabase dashboard (founder + Claude sessions). Friends can be given the website URL safely — they can only look.

**The honesty rule survives intact:** verified-only data, nulls render "—", every record carries its as_of/source, qualitative sections (management, moat, chains) are **never** auto-scraped — they remain researched and verified in Claude sessions before insertion. The robot only touches what a machine can verify (see §7).

---

## 7. The Robot — Nightly Automation at ₹0 (Honest Version)

One GitHub Actions workflow, running on a nightly schedule (~2:00 AM IST), doing three jobs in one visit:

1. **Refresh** what a machine can safely fetch: market caps / delayed prices from free public sources (Yahoo Finance–style endpoints), and freshness timestamps. Written into `metrics` with today's `snapshot_date`. It **never** touches qualitative fields — a scraper is not allowed to "improve" a verified sentence.
2. **Ping** the database (one tiny read/write). This is the medicine for Supabase's one real free-tier catch, confirmed by July-2026 research: **free projects pause after 7 quiet days**. A nightly ping means the timer never reaches zero.
3. **Backup**: weekly, dump the entire database to a file and commit it into a private GitHub repo. Supabase's free tier keeps **no backups** — this Action means that even if the cabinet burned down, we rebuild from last Sunday's photocopy in minutes.

**Free-tier reality check (verified July 2026):** GitHub Actions gives ~2,000 free minutes/month on private repos (unlimited-ish public); our robot needs ~3 minutes/night ≈ 90/month. Supabase free tier: 500 MB DB, unlimited API reads, 5 GB bandwidth/month — a few friends browsing cannot dent this. Fit confirmed with 10× headroom.

**What "real-time" honestly means here (kept from v2 §11):** data is *daily-fresh with visible "as of" stamps* — a living, self-updating site, but labelled "recent," never fake-"live." Intraday freshness stays a future option, not a promise.

---

## 8. What Happens to V2.6 (Nothing Is Thrown Away)

V2.6 is the **seed**, not the casualty. Its UI becomes the split files (§4 map) essentially unchanged — same look, same 10-section master-detail, same lens/map/compare. Its embedded `SEED`, `CHAINS`, `FORCES`, `CHAINMAP`, `MGMT` objects become the first rows of the five tables. Its self-test harness survives as `selftest.js`, now checking the *database's* integrity on every page load. The session-log habit moves into `STATE.md` + Git commit history.

---

## 9. Risks & Mitigations (v3 Update)

| Risk | Mitigation |
| --- | --- |
| Supabase free project pauses after 7 idle days | Robot's nightly ping resets the timer forever |
| Free tier has no backups | Robot commits a weekly full dump to a private repo |
| Master key leaks | Two-keys rule (§5); key lives only in GitHub Secrets; regenerate on any doubt |
| Free data sources block or change | Robot fails *loudly* (email from GitHub), site keeps serving yesterday's data — degrades gracefully, never breaks |
| Founder edits the wrong thing on GitHub | Every change is a commit — one click reverts; Claude reviews via raw URLs |
| Scope creep re-inflates files | Rule 1 hard cap: any file crossing ~400 lines gets split in its own session |
| "Real-time" overpromise | Every displayed number carries its as_of; UI says "updated nightly" |

---

## 10. Execution Roadmap — Sized in Chat Sessions

Each phase = 1–3 focused chats. **Never start a phase until the previous one's checklist is green.**

**Phase 0 — Foundations (founder ~30 min, guided click-by-click).** Create GitHub account → create repo `investorlens` → create Supabase account + project. Paste to Claude: repo URL, Supabase project URL, anon key. Put service key in GitHub Secrets (guided). ✅ Done when: both dashboards open and links are pasted.

**Phase 1 — The Great Split (pure refactor, zero behaviour change).** Claude carves V2.6 into the §4 file map; data still ships as local JSON seed files for now; self-tests must pass identically before/after. Site goes live on GitHub Pages. ✅ Done when: the GitHub Pages URL shows V2.6 exactly as before.

**Phase 2 — Data Moves Into the Cabinet.** Claude writes `CONTRACT.md`, the five `CREATE TABLE` snippets (founder pastes into Supabase SQL editor), and a one-time loader that pours the V2.6 seed into the tables. Then `data.js` switches from local JSON to Supabase reads. ✅ Done when: deleting the local JSON changes nothing on the live site.

**Phase 3 — The Robot Wakes Up.** Nightly refresh + ping + weekly backup Actions. ✅ Done when: the site's mcaps change overnight without anyone touching anything, and a backup file appears in the private repo.

**Phase 4 — Resume the Data Mission (now DB-native).** §5 Management cohort 2 (remaining 43 companies), then §8 Growth, §9 Valuation, and the **Q1 FY27 refresh as results land from mid-July 2026** — all verified in sessions, inserted as rows, instantly live. No HTML ever re-shipped.

**Phase 5 — Scale & Story.** Nifty Next 50 (→108 companies) and beyond; news ingestion into `factors`; trend charts drawn from accumulated `snapshot_date` history — the "website telling a live story" the founder asked for.

**Phase 6 — Optional Future (only if needed).** FastAPI layer for computed endpoints (scores, screens); LLM summaries of concalls (always source-linked + "AI-generated, verify" tagged, per v2 §11); mobile polish.

---

## 11. How Every Future Chat Starts (The Ritual)

First message template for the new project's chats:

> *"Read STATE.md and CONTRACT.md in the repo. Today's single concern: ____. The file(s) involved: ____. Proceed."*

Claude then reads only those, does the work, delivers the changed file(s) + an updated STATE.md, and the founder commits both. That's the whole workflow — small, cheap, and unbreakable.

---

## 12. What Makes This Different (Unchanged From v2, Now Deliverable)

Business-first ordering; sector-aware metrics; explicit value-chain mapping (including the inter-company map no free Indian tool has); the Real-Time Factor Tracker as a first-class citizen; verified-only honesty with visible sources — and now, for the first time, **a site that updates itself while everyone sleeps, on a budget of exactly ₹0.**

*Next concrete action: Phase 0. Start the new chat with: "Plan v3, Phase 0 — walk me through the accounts, click by click."*
