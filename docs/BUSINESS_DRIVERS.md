# Business drivers: the first complete example

This branch adds an IndiGo example that explains how changes in the world
can reach a business. It contains no AI service and no stock-price forecast.
Open the `Business drivers` tab, or append `?example=indigo` to the site's URL.
That link returns directly to the example after a preview refresh.

## The six layers

1. **Observe:** five public factor histories, each with its unit, date and source.
2. **Connect:** sourced paths from global factors to business components, with
   explicit limits. One crude-to-jet link also has a historical co-movement check.
3. **Calculate:** a testable input-price mechanism with editable assumptions.
4. **Compare:** three earlier factor patterns using a disclosed distance rule.
5. **Route developments:** existing company headlines matched by visible keywords.
6. **Audit coverage:** 5 connected series and 35 clearly unconnected candidate
   factors. USD/JPY is connected; actual carry-trade positions are not.

For a simple scenario, assume jet fuel rises 15% and the rupee cost of a dollar
rises 3%. The translated fuel-input proxy rises **18.45%**, because the changes
compound: `1.15 × 1.03 − 1`. It does not mean the company's total costs or profit
change by that amount. Crude is upstream and is not added again.

## Data and provenance

| Factor | Series | Interpretation |
|---|---|---|
| Brent | DCOILBRENTEU | USD/barrel; upstream energy input |
| Jet fuel | DJFUELUSGULF | US Gulf spot proxy, USD/gallon |
| Dollar / rupee | DEXINUS | INR per USD; higher means weaker rupee |
| US 10-year yield | DGS10 | Percentage yield; changes displayed in basis points |
| Dollar / yen | DEXJPUS | JPY per USD; inverse used for yen strength |

Official FRED source links accompany every card. Company mechanisms cite
IndiGo's FY2023–24 report; current company exposures need review. EIA's
February 2024 Red Sea research and BIS Bulletin 90 provide two event lessons.
The snapshot downloaded on 2026-10-07 has 10,962 observations from 2018 onward.
Publication delays differ: the fuel series end on 2026-09-29; currencies on
2026-10-02; the yield series on 2026-10-05. This misses the proposed 1–2 day
goal for several inputs. Source age is visible instead of hidden.

The daily collector is public-read-only, standard-library Python:

```text
python etl/driver_refresh.py
```

Run it only in the working branch, review the dated output, run the tests,
then commit and push that branch. A failed download or changed page format
leaves the existing snapshot intact. The script does not contact Supabase.
It is **not scheduled**. No production workflow was edited or dispatched.
An always-running local computer can later refresh this branch at intervals.
GitHub's scheduled workflows use the default branch; that would conflict with
the user's instruction to leave main untouched. A separate repository is an
option if independent hosted scheduling becomes necessary.

## Algorithm details and limits

All changes use 20 intervals across dates present in all five series. This is
roughly a month, not exactly 20 calendar days or exchange sessions. A series'
latest level can be newer than the shared comparison date; both are labelled.
No gaps are filled. Replay filters observations and headlines by their dated
records. Revised historical data and delayed publication mean this is not a
point-in-time backtest. Static source explanations also do not change vintage
when the user selects an earlier date.

Crude/jet correlation uses adjacent 20-interval returns ending before the
target window begins. Those returns share only boundary observations. Pearson
correlation and same-direction frequency describe co-movement; neither proves
causation, a lag, or a company sensitivity. Zero variation or too few periods
produces an unavailable result.

History matching uses the square root of the mean squared standardized
differences. The scales are manually chosen: Brent 10%, jet 10%, INR 3%, yield
50 basis points and yen strength 5%. They are not calibrated confidence levels.
Candidates end before the displayed window starts. The three selected windows
cannot overlap each other. The nearest pattern may still be a poor match.
No company outcome is attached to an analogue.

Headlines are reading leads from the site's existing daily collection. Words
cannot resolve negation, quantify an event, verify a claim or establish a causal
effect. Matches do not automatically change factor values or scenario inputs.
Later headlines disappear in replay. The `Check loaded headlines` button lets
the user read the collection again if it completed loading after this tab.

## Next evidence to add

Prioritize Indian ATF prices, dated operating volumes, fares, occupancy and
verified company exposure information. Then measure how factor changes precede
operating results, allowing for reporting lags, other drivers and structural
changes. Keep training and evaluation periods separate and compare against
simple baselines. A correlation alone must never promote a candidate factor
into a causal claim.

Expand one channel at a time, starting with supply and demand variables this
example lacks. A complete global registry is a roadmap, not proof of coverage.
Google Drive can archive permitted public raw data and reproducible snapshots;
it is not a substitute for an interactive database or a running collector.

## Checks

```text
node tests/business_drivers.test.cjs
python -B tests/driver_refresh_test.py
```

The deterministic tests cover arithmetic, currency direction, basis points,
missing data, duplicate dates, replay cutoffs, candidate-window separation,
historical statistics, unsafe links, malformed headlines and story-off rollback.
Browser checks cover scenarios, custom inputs, all five relationship paths,
date replay, disclosures, navigation and responsive layout. No stored company
metric or existing production file is part of the factor calculation.
