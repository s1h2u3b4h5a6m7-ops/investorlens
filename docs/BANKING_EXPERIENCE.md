# Simple banking experience and its pipeline

Updated 8 October 2026. Work stays on `codex/trigger-intelligence`.

A reader should understand what changed, why that matters and what to watch.
They should not need to learn a correlation formula to use the page.

## What the reader sees

- SBI explained: three prepared explanations about loans/deposits, interest
  kept after funding costs and the remaining problem-loan share.
- Three steps showing how deposits, lending and interest fit together.
- Three outside influences described in everyday language.
- Across India: choose rates, oil, the rupee or the economy to see possible
  business connections. These are mechanisms, not current-event claims.
- One optional source disclosure contains raw history, source conflicts,
  macro/micro coverage and historical statistics. Short reliability notes
  remain visible in the first view.

Simplification must not turn old data into a current signal or a possibility
into a fact.

## Which job belongs where

| Part | Job | Current implementation |
| --- | --- | --- |
| Collection | Read official sources; keep dates, units and provenance | Python `banking_refresh.py`; manual, read-only |
| Checking and analysis | Reject bad comparisons; calculate changes; flag conflicts; examine history | Python `banking_analysis.py` |
| Explanation preparation | Choose honest wording; match factors to reviewed sector connections; format display values | Python `banking_brief.py` |
| Storage and delivery | Preserve history and publish a small dated summary | Static JSON in our branch; Supabase records unchanged |
| Website | Display prepared explanations, switch views and show optional evidence | `banking.js`; no business-impact calculations |

This is a backend preparation pipeline, not a new always-running hosted
backend. It fits the zero-budget prototype but does not provide automatic
daily updates or unlimited processing.

The first banking request loads a 9,822-byte prepared brief. History and analysis
load only when source checks open. The separate full Supabase boot load is still
heavy; this revision does not fix that whole-site performance bottleneck.

## Preparing a new edition

With the project Python runtime and `pypdf` available, run from the repository:

```powershell
python etl/banking_refresh.py --cache-dir ../official-bank-cache
python etl/banking_analysis.py
python etl/banking_brief.py
python tests/banking_test.py
python tests/banking_brief_test.py
node --test tests/banking_loader.test.cjs
```

Review all three generated JSON files together before committing to the work
branch. Mismatched source editions are withheld. The collector still uses pinned
reviewed editions; it does not discover the newest quarterly report itself.
No AI service, paid service, database write or production workflow was added.
The public anon key does not authorize privileged database operations.

## What we should do next

1. Test the page with non-expert readers. Ask them to explain how SBI makes
   money, name one change and describe what remains unknown. Record confusion,
   not just opinions about colors. Review actual desktop and mobile rendering.
2. Resolve the official SBI income disagreement. Keep the affected comparison
   blocked until its cause and correct treatment are established.
3. Collect original quarterly releases, consistent definitions and actual
   publication dates. Price history cannot replace business history.
4. Connect fresher macro releases and a small set of structured official events.
   General news still needs reliable company identification and review.
5. Test one business channel against subsequent operating outcomes and a simple
   baseline before making any quantified impact claim.
6. Prepare compact company summaries and load details on demand to reduce the
   site's remaining initial download.

Finish the banking checks before expanding sectors. Nifty 50 history is not
whole-market validation. Fully automatic interpretation of arbitrary wars,
policies and technology news remains an unrealistic no-AI promise.

## Validation and limitation

Fifteen brief tests cover changed directions, conflicts, merger breaks, zero
bases, mismatched periods/units and reproducible publication. Five loading tests
cover lazy evidence, mismatched editions, escaping and failure states. The
existing 38 banking tests also pass. These are software checks, not proof of
financial accuracy or visual quality.

Browser controls failed in this session. Fresh screenshots, actual responsive
rendering and interactive visual review have not been completed. The local
branch server was restarted; its page and prepared brief return HTTP 200.
This is not a claim of a 10/10 user experience.
