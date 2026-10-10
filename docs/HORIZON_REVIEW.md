# Navigation, presentation and dated signals — 10 October 2026

All changes are on `codex/trigger-intelligence`. No database writes, main updates,
workflow changes, deployments, paid assets or AI service were used.

## Where the information belongs

The seven root destinations remain Companies, Sectors, World factors, Indian
Markets, Connections, Compare, and Sources & dates. Indian Markets replaces
Banking & India. SBI retains its existing classification in the company/sector
catalogues; the homepage example now opens SBIN directly.

SBI's existing company sections contain the study:

- Overview: three checked annual changes, with historical channel labels.
- Numbers & growth: FY2026 numbers, all 15 collected series (125 observations),
  ten-year history, source checks and the unresolved FY2025 NII disagreement.
- Dependencies: deposits → lending → income; outside macro factors; inside micro
  factors. No guessed present-day RBI rate or numeric SBI exposure.
- People & risks: research limitations alongside the older leadership/risk record.
- News: collected reading leads, without an automatic event-to-impact claim.

Indian Markets contains possible sector paths and the Indian yield/Nifty history
check. It contains no SBI annual table. World factors separates new measurements
from older recorded exposure tags. Sources & dates includes each factor's actual
observation date, collection edition, expiry and official source link.

`?company=SBIN` and the old `?example=banking` open SBI after company data loads.
`?example=markets` opens Indian Markets. `/` opens the homepage.

## What the rules do

`etl/factor_signals.py` prepares `data/factor_signals.json` from the official FRED
snapshot. It validates dates, units, series identity, finite values and order;
compares the two latest actual observations; and labels a named activity.
Fuel buyers and oil producers can have opposite pressures. Currency translation
uses the explicit INR/USD quote. US yield changes are basis points and are never
presented as SBI's rate. Yen alone does not establish a carry-trade unwind.

Observations more than two calendar days old lose their current signal. Dated
historical directions remain identified as such. The browser adds an expiry
guard, rather than calculating business effects. Headwind/tailwind is not a
whole-company score, profit estimate or stock prediction.

This edition contains 10,975 official factor observations. Latest oil and jet
fuel dates: 6 October; INR and JPY: 2 October; US yield: 8 October. Latest two
values for all five were checked against their official FRED series pages.
Four feeds miss the 1–2 day target on 10 October. Collection is manual, and the
SBI quarterly/RBI current data and news verification pipeline remain unfinished.
The original historical publication vintages are not available.

Refresh offline from the repository root, replacing the date with the actual
assessment date:

```text
python etl/driver_refresh.py --end 2026-10-10 --output data/business_factors.json
python etl/factor_signals.py --as-of 2026-10-10
python etl/banking_brief.py
```

Financial calculations, channel rules and banking explanations stay in Python.
JavaScript presents them. No scheduled job or hosted Python service was added.

## Presentation and verification boundary

The new scoped theme adds luminous surfaces, an illustrative SVG circuit,
intersection-based entry motion and moving connection arrows. A global pause
control and device reduced-motion preference disable animation. Financial
numbers do not animate or pretend to stream. Company-map nodes and factor cards
are native keyboard-operable buttons. Navigation scrolls within its own row.
Responsive rules cover desktop, laptop, tablet and narrow phone layouts; wide
evidence tables scroll within their container.

Verification commands:

```text
python -m unittest discover -s tests -p '*_test.py' -q
node --test tests/banking_loader.test.cjs tests/factor_signals.test.cjs
node --test tests/business_drivers.test.cjs
git diff --check
```

Python: 69 tests. New/updated JavaScript loading and expiry boundaries: 12 tests.
Existing business-driver assertions: 16. JavaScript parsing and local asset
references are checked separately. These are code/data checks, not screenshots.

Browser security explicitly rejected local-preview access in this session.
No alternate browser or automation workaround was used. Visual, touch,
viewport, scroll and full Supabase browser boot acceptance remain unverified.
The local branch-only preview server was verified listening on 127.0.0.1:8765;
listening is not evidence that every page renders successfully.

Next gate: actual browser/device review and reader comprehension, then current
Indian macro releases and original SBI quarterly filings with publication dates.
Resolve the NII discrepancy before using that comparison; establish company
exposures before mapping a fresh factor to a company-wide effect.
