# InvestorLens India

A business- and value-chain-analysis platform for Indian listed companies.

> **Understand the business first. The stock price is just one data point about it.**

For any company it answers: *what does this business actually do, whose chain is it a
link in, and what real-world forces are pushing on it right now?* Valuation sits
deliberately second-to-last. This is a business-understanding engine — not a
stock-tip machine.

**58 companies · 19 sectors ·** per-company value-chain diagrams · a macro-force
exposure lens · compare mode · an inter-company chain map · verified management data
· and a self-test harness that checks data integrity on every load.

## Run it

- **Live:** GitHub Pages (Settings → Pages → deploy from `main`, root).
- **Locally:** the site reads local JSON, so it needs a web server — don't just
  double-click `index.html`. Run `python3 -m http.server` in this folder and open
  <http://localhost:8000>.

## How it's built

A plain static site (HTML/CSS/JS, no framework, no build step). Each file has one
job — see **STATE.md** for the map and **CONTRACT.md** for the data shapes. The full
plan is in **PLAN_v3.md**. Budget: ₹0.
