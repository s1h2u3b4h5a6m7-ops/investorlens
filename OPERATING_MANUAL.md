# InvestorLens India — Operating Manual v3 (16 Jul 2026)
## Your working format, step by step, under the new division of labour

This document is the contract between you and Claude for every future session.
It replaces the informal habits of Sessions A–P with written rules. It lives in
TWO places on purpose: at the REPO ROOT as `OPERATING_MANUAL.md` (so every
tarball download carries the rules, and Claude reads them during opening
verification), and in project knowledge (so a brand-new chat has them before
the first download). If the two ever differ, the repo copy wins — it has
version history.

---

## 0 · The division of labour (changed 15 Jul 2026)

**Claude:** researches, drafts, VERIFIES, dry-runs, and delivers. Verification
is Claude's job now — repo bytes, SQL behaviour, JS behaviour, and data figures
(standard in §3).

**You:** execute and report. You never edit inside files, never verify figures,
never resolve find/replace. Your entire toolkit is four moves:
1. **Paste** a SQL block into Supabase and click Run
2. **Upload** a complete file to GitHub (replace, never edit)
3. **Paste back** whatever grid / message / screen text appears
4. **Look** at the live site when the runsheet says to, and say what you see

Step 3 is not "verification" — it is telemetry. Claude cannot see your Supabase
or your screen; the paste-back is Claude's only window into them. Everything
that CAN be checked without your eyes (the repo, the code, the migration
logic, the figures) Claude checks itself and shows proof.

## 1 · Complete files only — the no-editing rule

- Claude never again delivers a find/replace instruction for a repo file.
  Every changed file arrives as a **complete replacement file**, built from the
  live tarball's exact bytes with byte-asserted edits.
- Your GitHub move is always the same: open the file → pencil → select all →
  delete → paste the complete new file → commit. (Or for new files:
  Add file → Upload files.)
- After every commit, Claude re-downloads the repo and **byte-diffs** what
  landed against what was delivered, and reports IDENTICAL/DIFFERS. A session
  is not closed on your word or Claude's memory — only on that diff.
- Why this rule exists: on Session B (8 Jul 2026, the flip), the first
  `compare.js` commit **silently never landed** — caught only by direct repo
  verification (commit feed + byte-diff), not by eye. Whole files plus a
  mandatory post-commit byte-diff make that failure impossible to miss.

## 2 · The unchanged iron rules (from Sessions A–P, still binding)

1. **One session, one concern.** Everything else queues in STATE.
2. **SQL before JS.** Shape changes flow menu → table → waiter → UI. JS that
   references a column ships only after the column exists.
3. **STATE.md commits LAST**, only after acid tests are green. STATE must
   never claim something `main` or the database doesn't show.
4. **Idempotency is non-negotiable.** Every migration is value-guarded or
   NOT-EXISTS-guarded; re-running anything is a no-op, proven in dry-run.
5. **Filenames use underscores.** The download screen shows spaces; the real
   filename has underscores. Check after upload: Ctrl+F the folder listing.
6. **Every multi-statement paste ends in a judge** (the editor shows only the
   last grid). Pre-flight judges read before anything writes.
7. **The chip is the acid test.** After every database change, the home page
   chip must read, word for word:
   `● data checks: 107 companies · 492 metric bindings · 14 forces · 139 exposure links · 4 value-chain maps · 107 verified management records`
   — unless the session's concern changes a counted thing, in which case the
   runsheet states the NEW expected text **in advance**.
   **Read it off the page, not from memory, and not from STATE.md.** STATE's
   changelog quotes the chip as it stood in each past session (earlier strings
   had four counts, said *promoter records*, and showed 64 management records
   before the backlog closed). Those entries are history and are correct as
   history — they are **not** the current reference. The current reference is
   this line and `chipText()` in `js/home.js`.
   **One string, two places.** `chipText()` in `js/home.js` renders it on the
   page; the console line in `js/selftest.js` carries the same six counts in the
   same order. They must always agree; a harness asserts it. Changing one
   without the other is what caused the Session W defect.
8. **THE RESTORE DRILL (new, 23 Jul 2026).** Before any release, and after any
   session that adds a migration, prove the parachute by *running* it:
   ```
   createdb rebuild
   psql -d rebuild -c 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated
                       NOLOGIN; CREATE ROLE service_role NOLOGIN;'
   psql -v ON_ERROR_STOP=1 -d rebuild -f sql/1_SCHEMA_complete.sql
   psql -v ON_ERROR_STOP=1 -d rebuild -f sql/2_DATA_complete.sql
   for f in sql/2026-*.sql (in filename order): psql -v ON_ERROR_STOP=1 -f $f
   # then run every dated migration a SECOND time — all must be no-ops
   ```
   Then replay the rebuilt tables through the real pipeline and compare the chip
   to live: **it must match character-for-character.** The roles are a
   dry-run-only prerequisite (Supabase supplies them; a bare Postgres does not,
   and three migrations abort without them).
   **A green self-test is NOT a passing drill.** The first drill ever run
   produced a site that passed every check and was silently missing 8 verified
   management records — 99 where live has 107. Missing data is not an error
   here; it renders an honest placeholder. **Compare the counts to live.**
9. **STATE.md and CONTRACT.md are single-writer files (new, 16 Jul 2026).**
   Before either is committed, Claude re-pulls the live tarball, rebases the
   edit onto whatever `main` actually holds, and takes the NEXT version
   number — never reusing one. This exists because two parallel chats each
   wrote a v4.7 on 16 Jul 2026; the second commit whole-file-replaced both
   files from a stale base, and the sweep checkpoint, the architecture queue
   item, and a CONTRACT parachute line all vanished with no error anywhere.
   Both halves were restored at the 16-Jul merge — this rule exists so that
   merge is never needed again.

## 3 · Claude's verification standard for data figures (new)

Because you no longer verify, Claude's own bar rises. A figure may enter the
database only when ALL of these hold:

1. **Primary source attempted.** Claude tries to reach the exchange filing /
   SEBI disclosure / company release directly. (Exchange sites are often
   machine-unreadable; the attempt and its outcome are recorded.)
2. **≥ 3 independent, quarter-labelled corroborations** when the primary is
   unreachable — sources that state WHICH quarter they describe, so stale
   numbers can't masquerade as current ones.
3. **Reconciliation where possible.** Entity-level or component-level sums
   must reconcile to the headline (the INDIGO standard: parts summed to
   41.57% and to the exact share count).
4. **A discrepancy log.** Every different number found in the wild is
   explained (which quarter it belongs to), not ignored.
5. **Honest labelling in the database.** The source_note says exactly what was
   done: "cross-verified against N sources", never "read from the filing" or
   "founder-verified" unless that literally happened. If confidence is
   lowered (e.g. only 2 corroborations), the note says so and STATE carries a
   watch flag.

## 4 · Anatomy of every session (what you will receive, in order)

1. **Opening verification** — Claude downloads the live tarball, confirms the
   previous session fully landed (byte-diffs), and states the session's single
   concern.
2. **The kit** — complete files only:
   - `sql/YYYY-MM-DD_<concern>.sql` — numbered pastes, each ending in a judge,
     with expected grids written next to each paste
   - any changed code/doc files as complete replacements
   - `STATE.md` (complete) — held for LAST
   - a **runsheet** written click-level, with STOP conditions in bold
3. **Proof of work** — dry-run output on local PostgreSQL 16 (run twice:
   effect, then no-op) and, for JS, the vm round-trip harness on the exact
   live bytes. You never take Claude's word for behaviour.
4. **Your execution** — pastes in order, paste-backs at every checkpoint the
   runsheet marks 📸.
5. **Closing verification** — Claude re-downloads the repo, byte-diffs
   everything, and declares the session closed (or names exactly what's off).

## 5 · STOP conditions (the only judgement calls you keep)

The runsheet will mark, in advance, any grid where a specific result means
STOP — e.g. "if this shows more than LTIM, stop and paste the grid back."
When a STOP fires: change nothing, run nothing further, paste what you see.
A fork in the data is a business decision, and business decisions are yours;
Claude will lay out the options, never bury them.

## 6 · Standing cadence (the repeating calendar)

- **Nightly** — `refresh.py` updates market caps (robot, no action).
- **Weekly** — `backup.py` snapshots to `investorlens-backups` (robot).
- **Quarterly, ~3 weeks after quarter end** — SHP season: promoter
  re-verification sweep (Session Q is the first). INDIGO is drift-prone until
  the RG Group reaches zero.
- **Quarterly, results season** — metrics / factors / bull-bear refresh per
  company as FY/quarter results land (cadence to be formalized in a future
  data-lane session).

## 7 · Session hygiene

- New sessions start in a NEW chat with the handoff prompt Claude provides at
  the previous session's close. The prompt + project memory + this manual
  (repo root) + STATE.md on `main` are together sufficient context; nothing
  lives only in an old chat. Claude's opening verification includes reading
  `OPERATING_MANUAL.md` from the freshly downloaded tarball.
- If Claude ever asks you to edit inside a file, quote line numbers at you as
  instructions, or deliver a partial file — point at this manual and refuse.
