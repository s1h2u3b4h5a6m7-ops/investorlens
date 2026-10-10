# SBI: three macro factors and their business channels

This is a branch-only, chart-led research example. It is not a validated causal
model, an earnings forecast, a stock forecast or a completed research phase.
Seven public official source documents/pages were checked on 10 October 2026.
No production database, workflow, deployment or main branch is changed.

## Pipeline

1. Collect official SBI, RBI and MoSPI releases. Keep raw documents privately.
2. Record hashes, publication dates, periods, units and scope; check chart labels.
3. Store the curated edition in `data/sbi_macro_inputs.json`. This is a manual
   official-source verification step, not an automated news or data collector.
4. Python validates scope and dates, calculates mechanisms and prepares signal
   wording and chart geometry. Generate with:

   `python etl/sbi_macro.py --as-of 2026-10-10`

5. The site renders prepared cards and SVG primitives. A two-day expiry stops
   old prepared RBI readings appearing current. Dated quarterly history and
   labelled scenarios remain available. Rebuilding old inputs does not extend
   their validity. There is no daily refresh job or AI service.

## Interest rates

The RBI resolution of 7 October 2026 reports a 25 bp repo hike to 5.50%.
SBI domestic loan yield in comparable Apr–Jun periods fell from 8.78% to 8.20%,
while deposit cost fell from 5.21% to 4.85%. The spread proxy is therefore
3.57% to 3.35%, a 22 bp narrowing: a historical lending-channel headwind.
Domestic NIM is separately 3.01% to 3.00%, only 1 bp lower. Different balance
denominators and investment income mean the spread proxy cannot replace NIM.
The June observation cannot be caused by October's hike.

The March consolidated DF-9 reports State Bank Group one-year NII-risk
magnitudes of ₹11,899.52 crore for a 100 bp parallel shift and ₹23,798.29 crore
for 200 bp. The table does not specify the signed hike/cut response. It must
not become a standalone SBI profit coefficient or be applied mechanically to
the 25 bp repo event. The June consolidated disclosure was checked and has
no updated DF-9 shock table.

Latest comparative Q1 FY2027 ratios differ from the original Q1 FY2026
presentation (original domestic/whole NIM 3.02%/2.90%, latest comparative
3.01%/2.89%). Ratio charts use the latest paired edition; they do not splice
the originals. The exact reason for regrouping is not established here.

## Bond yields

SBI domestic investments as of 30 June: ₹17,27,352 crore. AFS share: 14.54%.
Estimated AFS book = ₹2,51,156.9808 crore. Disclosed AFS modified duration: 2.78.

`Δmarket value ≈ −AFS book × modified duration × (yield shock bp / 10,000)`

A +25 bp parallel shift implies about −₹1,745.54 crore; −25 bp implies
+₹1,745.54 crore. Displayed rounded: ±₹1,746 crore. These are conditional,
unchanged-portfolio, first-order market-value scenarios, not observed losses,
realized earnings or net profit. They ignore convexity, hedges, spread moves,
portfolio turnover and accounting adjustments. HTM is not included in this
valuation calculation; HTM holdings still carry economic interest-rate risk.

The RBI quotes 6.94% GS 2036 at 7.2898% yield on 8 October. One quote cannot
establish a move. It is not differenced against the old generic ten-year SGL
month-end series. No current bond direction is asserted. For the whole bank,
new investment income and funding effects can offset existing-bond pressure.

AFS composition uses the correctly read chart legend: government/bills 51%,
corporate 36%, state bonds 7%, other holdings 5%, commercial paper 1%.

## The economy

MoSPI's 31 August GDP edition supplies comparable Q1 2024/2025/2026 figures
under base 2022-23. Do not join the old 2011-12 series to this new edition.
Matched GDP and SBI domestic gross-loan stocks produce only two Q1
year-on-year growth comparisons. Real GDP growth in Q1 2026 is 7.81745%;
SBI domestic gross-loan growth is 18.15019%. Nominal GDP is shown separately
because loan balances are nominal. Growth comparisons are descriptive, not a
stock-to-flow ratio, elasticity or estimate of GDP-caused SBI lending.

The Tailwind badge refers to dated loan-demand context when both GDP and loan
growth are positive. It is a mechanism rule, not a calibrated profit signal.
No fitted coefficient, prediction or point-in-time validation is enabled.
The annual FY2025 NII source disagreement remains unresolved and unused.

## Presentation and verification

Overview: compact macro signals. Dependencies: paired rate bars, economic
growth comparisons, factor paths and two opposing bond-value scenarios.
Numbers & growth: two portfolio doughnuts plus the before/after investment
income-yield chart. Methods and official links sit in expandable source notes.
World factors' interest-rate view includes the same conditional two-channel
SBI relation: potential loan-income tailwind and potential funding-cost
headwind, net effect not established. Its existing saved-tag groupings are
separately labelled as unmeasured exposure records. Relationship objects
contain named components, evidence type, conditional direction and source IDs.
They are prepared by Python; the browser draws them without inferring effects.
No new root or company tab is introduced. All bars start at zero, all
allocations have explicit percentage labels, and colour is never the only
signal indicator. The dark styling, scroll-entry animation, pause control and
reduced-motion preference follow the existing site.

Tests check units/signs, unsupported shocks, scope/period/base-year failures,
source hosts, stale output, async detachment and text escaping. Those checks
are not browser acceptance. Local-preview inspection remains blocked by
browser security; no alternate browser or rendering workaround was used.
Actual visual, touch, viewport, screen-reader and Supabase boot review is pending.

## Next practical work

Collect compatible quarterly SBI loan, yield, funding and credit-loss history
with original publication dates, and a longer consistently defined GDP series.
Test predeclared lagged relationships against later observations, adjusting
for SBI mix, funding, mergers, policy changes and the economic cycle. Compare
with a simple previous-period baseline and examine stability, not just fit.
Revised GDP vintages prevent claiming an original-information backtest.
Add a same-instrument Indian bond-yield feed and verified bank repricing
exposures. Until then, retain the uncertain signals rather than fill the gap.
