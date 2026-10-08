# Banking first: what works, what is still missing

**8 October interface update:** the main view now uses a small, Python-prepared
brief. Detailed statistics and raw history load only when source checks open.
See `BANKING_EXPERIENCE.md` for the pipeline, next steps and the current visual
verification limitation. The underlying historical evidence and gaps below
remain unchanged.

The aim is to explain businesses and the forces changing them. It is not to
predict a share price. This phase starts with SBI, adds an Indian-market view,
and uses no AI service. It is a historical research prototype, not a daily
event-monitoring service. The phase has not passed a business-model validation
gate. Do not expand its claims to other sectors yet.

## What has actually been built

- A dark homepage with company search and sector filtering.
- Company overview, numbers/growth, dependencies, people/risks and news in five
  tabs. All ten original sections remain accessible. SBI overview numbers use
  the new official-source research; other profile material remains visibly dated.
- A banking page with automatic calculations and plain explanations. Users do
  not have to enter assumptions to read it.
- An Indian-market page with ten starting sector groups and one historical
  yield/index comparison. This is not a fitted model of all Indian shares.
- Python scripts to download official documents, check extraction, retain
  conflicts, calculate comparable changes and produce the site's research JSON.
- Separate data and software checks. Passing those checks does not establish
  that a business explanation is causal or useful out of sample.

The new dataset contains 125 SBI values: ten annual observations for ten
operating series (FY2017-FY2026), plus five annual observations for five ratios
(FY2022-FY2026). It also contains 261 RBI historical observations across policy
repo rate, CRR, SLR, Indian 10-year government yields, Nifty 50 monthly averages,
and system deposits/credit. Existing FRED context is separately dated.

SBI sources: [FY2026 report](https://sbi.bank.in/documents/17836/58092042/Annual%2BReport%2BFY2026.pdf/0f165880-8752-4d67-6d87-422984f5cc3f?t=1778164340579),
[financial highlights](https://sbi.bank.in/web/investor-relations/sbi-financial-%20highlights-past-5).
RBI sources: [policy rates](https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23865),
[Indian yields](https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=24003),
[Nifty averages](https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=24007),
[banking aggregates](https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=23866).

## One real example

In FY2026, SBI's net loans grew about 17.16%; deposits grew about 11.03%.
The algorithm identifies a 6.14 percentage-point growth gap and asks how the
extra lending was funded. It does not call this a liquidity crisis: other
borrowing, capital and liquid assets matter too.

Whole-bank interest margin fell from 3.09% to 2.91%. Domestic loan yield fell
from 8.98% to 8.50%; domestic deposit cost fell from 5.11% to 5.04%. These are
reported changes. Different coverage and denominators mean that their
differences cannot be directly equated. They do not establish the cause.

The official-source check also found a conflict: FY2025 NII is 166340 INR crore
in the report's history table and 166965 INR crore in the highlights table.
The PDF notes that earlier NII figures were regrouped; the exact reason for
this disagreement has not been established. Both values are retained, and
the algorithm blocks the NII growth conclusion and its historical coefficient.
Of 25 overlapping cross-check cells, 24 agree and one conflicts. None is silently
replaced or averaged. Verification means faithful extraction, not certification
of the underlying accounts or a resolution of every source discrepancy.

## How the layered algorithm should grow

1. **Collect facts.** Prefer RBI, bank releases, exchange filings and government
   statistical releases. Save the exact source, units, business coverage, period,
   publication time, retrieval time and document version. A report period is not
   the date on which people knew the result.
2. **Check facts.** Catch missing values, changes in definitions, conflicting
   sources, revisions and mergers. Quarantine a disagreement. Never invent zero
   to fill a gap. A structured source can be processed automatically; a new or
   changed document layout needs a source review.
3. **Classify the change.** Macro means outside the business: rates, inflation,
   currency, liquidity, oil, flows, policy and geopolitics. Micro means inside:
   deposits, lending, margins, bad loans, provisions, capital, costs, rate-reset
   timing and borrower concentration. Technology can be a sector-wide shift
   and a company-specific adoption event; its role needs context.
4. **Follow the paths.** A rate change can affect both loan income and deposit
   costs. Oil can affect borrower cash flows and inflation indirectly. The
   first connections need economic reasoning and source review; charts alone
   cannot discover reliable cause-and-effect. Code then executes those rules
   consistently. Unmeasured exposure means unknown magnitude.
5. **Check the history.** Use operating outcomes, not only stock prices. Exclude
   merger breaks and do not mix gross/net, annual/quarterly, domestic/whole-bank
   or consolidated/standalone figures. Start with a small number of mechanisms.
   Use earlier periods to calibrate, later periods to evaluate, compare a simple
   baseline and examine different economic conditions. Collect original release
   vintages before claiming a genuine historical replay.
6. **Explain simply.** Show what changed, which business part it may reach, the
   timing, what can offset it, and what is unknown. Distinguish a measured fact,
   a conditional mechanism, a historical association and an unverified headline.
7. **Keep checking.** Log explanations when issued and compare later operating
   results. An explanation that sounds plausible is not enough; revise or retire
   rules that fail. No current confidence percentage has been calibrated.

For arbitrary wars, politics or technology news, fully autonomous interpretation
without AI is not a realistic promise. A practical no-AI system can detect
structured changes and route specific announcements through reviewed rules.
Unfamiliar or ambiguous news still needs human review. Headlines alone must not
be treated as proof of a company event. A football headline about a player named
Trent was found in the existing company collection during preview. The new main
displays exclude obvious sports/name collisions and require a business-related
word; the original collection remains available. This conservative filter can
still miss relevant items or retain false matches. Verified company identities
and primary event documents are still needed before automated impact analysis.

Headlines alone must not change a measured factor or become a verified business
impact.

## What the Indian-market historical check says

There are 38 consecutive monthly comparisons between Indian 10-year yield
changes and percentage changes in the monthly average Nifty 50, April 2023 to
June 2026. Correlation is approximately -0.44 overall, -0.24 in the earlier half
and -0.58 in the later half. These are contemporaneous associations, not a
forecast, an experiment, total returns or proof that yields caused a market move.
Overlapping influences, serial dependence and revised editions limit the result.

Nifty 50 is a large-company proxy; it is not the whole Indian market. The ten
sector groups are an initial logical map. They have no fitted exposure weights,
net directional score or validated financial effect. Broader indices, sector
histories and verified current business exposures remain necessary for coverage.

## Bottlenecks and practical ways around them

| Bottleneck | Practical response |
| --- | --- |
| The existing 492 company business metrics each have only one observation date | Build quarterly operating history first. Do not mistake price history for business history. The 107 old profiles still need an official-source audit. |
| Ten SBI annual points provide only eight comparable changes after the merger | Collect original quarterly releases over several economic conditions. Aim for roughly 8-10 years where available, then judge effective sample size and model complexity; a row-count target alone proves nothing. |
| Source disagreement and revised figures | Preserve both editions, mark conflicts, block affected conclusions, and resolve against detailed statements/company reconciliation. |
| Rate effects depend on hidden details | Add deposit mix, loan-rate benchmarks, reset timing, duration, accounting classification and hedges. Until then show both paths and no numeric net effect. |
| Official operating data arrives quarterly; RBI handbook histories here end June 2026 | Show dates prominently. Connect current official releases separately. A daily website refresh cannot make quarterly information daily or guarantee a 1-2 day lag. |
| No original publication vintages | Keep the as-of backtest disabled; collect original filings and release timestamps before enabling it. |
| Free data cannot cover every factor or event | Prioritise high-impact, measurable factors. Show coverage gaps. Use narrowly reviewed event rules and a human-review queue. |
| Current homepage downloads full Supabase metric/headline tables | Precompute compact daily snapshots, load company history on demand and cache public data. This performance work is still pending. |
| Free hosting, database space and bandwidth have limits | Keep the public site static where possible; serve small prepared summaries. Store large raw histories separately and monitor usage. |
| Public sources are not automatically an unrestricted redistribution licence | Review each provider's reuse terms before a public data feed. Prefer derived summaries with source links; avoid copying full reports/articles into the public repo. |

Your 5 TB Google Drive can be useful as an **archive**: official source documents,
compressed historical CSV/Parquet files, versioned snapshots and backups. Python
can read selected files during preparation and publish only small summaries to
the site. Drive does not replace a database, compute service or guaranteed public
data feed; API quotas and access permissions still apply.
[Google's limits](https://developers.google.com/workspace/drive/api/guides/limits).
No Drive upload, sharing change or new account access has been performed here.

For a zero-incremental-cost prototype, use local Python preparation and static
site files. Standard runners in a public repo can be free for later preparation
jobs, subject to platform limits; this branch has no new scheduled workflow.
[GitHub billing](https://docs.github.com/en/actions/concepts/billing-and-usage).
Supabase Free currently includes a 500 MB database and 5 GB uncached egress;
large raw history and full-table page loads can consume that quickly.
[Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase).
Zero budget is feasible for a bounded prototype, not a promise of unlimited
coverage, users, uptime or research labour.

## The next phase gate

Before expanding to another sector, resolve the NII source conflict, collect
dated quarterly releases, add current RBI/other macro feeds, and evaluate a few
banking mechanisms with historical availability respected. Publish validation
results, failure cases, missing-data rates and source freshness. Do not call the
model validated because unit tests pass. All existing main/production resources
remain outside this branch work.

## Reproducing this phase

Python needs `pypdf` for the official SBI PDF; the current bundled runtime already
contains it. No paid API, AI service or service-role key is required. The collector
uses public GETs and writes only local static JSON.

```powershell
python etl/banking_refresh.py --cache-dir ../official-bank-cache
python etl/banking_analysis.py
python tests/banking_test.py
```

The default collector fetches pinned official source editions again; it does not
discover or validate future editions automatically. `--use-cache` explicitly
reprocesses local source files without a fresh retrieval. Do not confuse that
with a live refresh. Source-layout changes fail closed. Raw sources stay outside
the public checkout. Scheduling, separate databases and public deployment are
not part of this phase.
