#!/usr/bin/env python3
# ============================================================================
# InvestorLens India — etl/refresh.py   (robot v3.2 — Session T, valuation)
# ----------------------------------------------------------------------------
# WHAT THIS SCRIPT DOES, in one breath:
#   1. Ask the database for the list of companies.
#        (This one call also PINGS Supabase, so the free project never falls
#         asleep — Supabase pauses a project only after 7 quiet days.)
#   2. Ask the database for the VERIFIED valuation denominators (v3, new).
#   3. For each company, ask a free public source two things: "how big are you
#        today?" (market capitalisation) and "what does one share cost today?"
#        (last traded price).
#   4. Turn today's price into ratios — but ONLY where a human has already
#        verified the bottom half of the fraction. No verified denominator
#        means no ratio, ever. Silence is the correct answer.
#   5. Write ONE dated row per company per key into metric_snapshots, then
#        stamp companies.fetched_at = today for the companies that succeeded.
#
# WHAT CHANGED FROM v2, and WHY:
#   v2 wrote a single nightly key: market_cap_cr. v3 adds four DISPLAY-ONLY
#   keys that feed the valuation panel:
#        price_inr   — today's share price, in ₹
#        pe_ttm      — price / verified TTM earnings per share
#        pb          — price / verified book value per share
#        ev_ebitda   — (market cap + verified net debt) / verified TTM EBITDA
#   Only price_inr is a pure market observation like market cap. The other
#   three are ARITHMETIC performed on a human-verified number, which is why
#   they may go in as status='verified' without a fresh human look: the robot
#   supplies only the numerator (today's price), never the denominator.
#
# THE ONE RULE THAT MATTERS MOST (chip safety):
#   These four keys are DISPLAY-ONLY. js/data.js keeps them out of
#   metric_order (see VALUATION_KEYS / isDisplayOnlyKey there), exactly as it
#   has always done for market_cap_cr. js/selftest.js counts the home page's
#   "metric bindings" by walking metric_order, so these rows CANNOT move that
#   number. Expected chip, unchanged, word for word (Session W wording):
#     ● data checks: 107 companies · 492 metric bindings · 14 forces · 139 exposure links · 4 value-chain maps · 107 verified management records
#   If you ever add a NEW nightly key here, you MUST add it to VALUATION_KEYS
#   in js/data.js in the same breath, or the chip will jump the next morning.
#
# WHEN THE ROBOT REFUSES TO WRITE A RATIO (the honesty rules, Plan v3 §6/§7):
#   * no verified denominator yet           -> no row (panel says "awaiting")
#   * the lens says the ratio does not
#     describe this business (e.g. EV/EBITDA
#     for a bank)                           -> no row (panel says "not applicable")
#   * the company is LOSS-MAKING (EPS <= 0) -> no P/E row. A negative P/E is not
#                                              a cheap valuation, it is a company
#                                              that did not earn. Printing one is
#                                              actively misleading.
#   * negative book value / negative EBITDA -> no P/B, no EV/EBITDA, same reason
#   * the answer lands outside a sane fence -> rejected as a bad fetch
#   A refused ratio is never an error. It is the platform declining to state a
#   number it cannot stand behind. Market cap still writes normally.
#
# WHAT THIS SCRIPT NEVER DOES  (the mission lock, Plan v3 §6/§7):
#   It never touches business_core, value_chain, moat_note, factors, or mgmt.
#   Those are the *understanding* of the business and are human-verified in
#   Claude sessions. A machine may refresh a NUMBER; only a human may change a
#   SENTENCE. It never writes to valuation_inputs — it only READS the verified
#   denominators. Valuation here is CONTEXT read after the business is
#   understood, never a buy/sell call.
#
# IDEMPOTENT-PER-DAY (safe to run twice, or five times, in one day):
#   Before inserting, the robot DELETES today's rows for exactly the keys and
#   tickers it is about to (re)insert — never yesterday's rows, never any other
#   metric. However often it runs today, you end with ONE row per company per
#   key for today. History before today is never touched.
#
# THE ONE SECRET IT NEEDS:
#   the service_role master key, read from the environment variable
#   SUPABASE_SERVICE_KEY. That variable is filled by GitHub from
#   Settings > Secrets > Actions. The key is NEVER written in this file.
# ============================================================================

import os
import sys
import time
import datetime as dt

import requests
import yfinance as yf

# ---- Fixed, PUBLIC settings ------------------------------------------------
# Safe to hardcode: this is the very same project URL already shipped inside
# the public website (js/config.js). It is not a secret. (The env override
# exists only so the test harness can point the robot at a fake database;
# GitHub Actions sets no SUPABASE_URL, so production always uses the default.)
SUPABASE_URL = os.environ.get("SUPABASE_URL",
                              "https://uhqyhsniwlgivdlxbpoj.supabase.co")
COMPANIES_ENDPOINT = SUPABASE_URL + "/rest/v1/companies"
SNAPSHOTS_ENDPOINT = SUPABASE_URL + "/rest/v1/metric_snapshots"
VALINPUTS_ENDPOINT = SUPABASE_URL + "/rest/v1/valuation_inputs"

# ---- What a nightly market-cap row looks like -------------------------------
# The website ignores label/unit/note on market-cap rows (js/data.js reads only
# metric_value + snapshot_date for this key) — these three exist purely so the
# rows read nicely in the Supabase Table Editor. higher_is_better is left NULL:
# size is shown, never ranked.
MCAP_KEY = "market_cap_cr"
MCAP_LABEL = "Market Cap"
MCAP_UNIT = "₹ cr"
MCAP_NOTE = "auto-refreshed nightly by robot v3 (Yahoo Finance)"

# ---- The four display-only valuation keys (v3) ------------------------------
# MIRROR OF js/data.js VALUATION_KEYS. These must match exactly, or the home
# page chip moves. higher_is_better stays NULL for all four on purpose: a lower
# P/E is not "better", it is CHEAPER, and cheap is often cheap for a reason.
# That judgement belongs to the reader, after the business is understood.
PRICE_KEY = "price_inr"
PE_KEY = "pe_ttm"
PB_KEY = "pb"
EV_KEY = "ev_ebitda"
VALUATION_KEYS = [PRICE_KEY, PE_KEY, PB_KEY, EV_KEY]

# ---- Safety fences ---------------------------------------------------------
# A real Indian listed company sits comfortably inside this range (in ₹ crore).
# Anything outside is almost certainly a bad/garbled fetch, so we REFUSE it
# rather than let one junk number sit next to good, verified ones.
MIN_CR = 100                 # ₹100 crore floor
MAX_CR = 50_000_000          # ₹50 lakh crore ceiling (above the biggest Indian co)

# Per-ratio sane fences. A number outside these is a data error, not a bargain.
MIN_PRICE, MAX_PRICE = 1.0, 500_000.0     # ₹1 to ₹5 lakh per share
MAX_PE = 500.0                            # above this, earnings are ~zero: meaningless
MAX_PB = 100.0
MAX_EV_EBITDA = 200.0

PAUSE_SECONDS = 1.5          # be polite to the data source between requests
MAX_RETRIES = 3              # per company, on a transient hiccup / rate-limit
EARLY_ABORT_AFTER = 8        # if the FIRST 8 companies all fail in a row, assume
                             # the source is blocking us tonight and stop early.


def get_service_key():
    """Read the master key from the environment. Refuse to run without it."""
    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not key:
        sys.exit("FATAL: SUPABASE_SERVICE_KEY is not set. In GitHub it is "
                 "supplied from Settings > Secrets > Actions.")
    return key


def auth_headers(service_key):
    # The service_role key is BOTH the apikey and the Bearer token. It bypasses
    # Row-Level-Security on purpose — which is exactly why it lives only inside
    # GitHub Secrets and never in the website or in any committed file.
    return {"apikey": service_key, "Authorization": "Bearer " + service_key}


def fetch_company_list(service_key):
    """Read every ticker + its exchange from the database.
       IMPORTANT: this request is also the nightly keep-alive PING."""
    resp = requests.get(
        COMPANIES_ENDPOINT,
        headers=auth_headers(service_key),
        params={"select": "ticker,exchange"},
        timeout=30,
    )
    resp.raise_for_status()          # DB unreachable => fail LOUD (GitHub emails you)
    rows = resp.json()
    print("Ping OK — database returned %d companies." % len(rows))
    return rows


def fetch_valuation_inputs(service_key):
    """Read the per-company LENS and the human-verified denominators (v3).

       Returns { ticker: {...} }. If the table is missing or unreadable we do
       NOT crash the night: we log loudly and carry on with market cap + price
       only, so the core nightly job keeps working. A missing denominator table
       simply means no ratios tonight — which is the same honest silence we
       show for any company whose denominators are not yet verified."""
    try:
        resp = requests.get(
            VALINPUTS_ENDPOINT,
            headers=auth_headers(service_key),
            params={"select": "ticker,pe_applicable,pb_applicable,"
                              "ev_ebitda_applicable,ttm_eps,"
                              "book_value_per_share,ebitda_ttm_cr,net_debt_cr"},
            timeout=30,
        )
        resp.raise_for_status()
        rows = resp.json()
    except Exception as e:
        print("WARNING: could not read valuation_inputs (%s). "
              "Tonight writes market cap + price only, no ratios."
              % str(e)[:120])
        return {}

    vi = {r["ticker"]: r for r in rows}
    ready = sum(1 for r in rows
                if r.get("ttm_eps") is not None
                or r.get("book_value_per_share") is not None
                or r.get("ebitda_ttm_cr") is not None)
    print("Valuation inputs: %d rows, %d with at least one verified denominator."
          % (len(vi), ready))
    return vi


def yahoo_symbol(ticker, exchange):
    """Our tickers are bare NSE symbols (e.g. 'HDFCBANK'). Yahoo wants a suffix:
       NSE -> '.NS', BSE -> '.BO'. Default to NSE when unknown."""
    suffix = ".BO" if (exchange or "").upper() == "BSE" else ".NS"
    return ticker + suffix


def fetch_quote(symbol):
    """Return (market_cap_cr, price_inr) for today, either of which may be None
       if we could not get a number we trust. Prefers fast_info (the LIGHT
       endpoint), falls back to the heavier .info, and retries on a hiccup.

       v2 fetched only market cap; v3 reads the price from the SAME call, so
       this costs no extra requests to the data source.

       RETRY RULE (fixed in v3.1): keep retrying while EITHER number is still
       missing, remembering whatever we already obtained. v3.0 returned as soon
       as EITHER value arrived, so a company whose market cap was momentarily
       absent from fast_info never got a second attempt -- v2 always retried in
       that case. That cost 8 market caps on the first live run. We only accept
       a partial answer once the retries are genuinely exhausted."""
    best_cap = None
    best_price = None
    for attempt in range(1, MAX_RETRIES + 1):
        derived_cap = False
        try:
            t = yf.Ticker(symbol)
            raw_cap = None
            raw_price = None
            raw_shares = None

            # 1) fast_info: light + reliable (last_price x shares under the hood)
            fi = getattr(t, "fast_info", None)
            if fi is not None:
                for key in ("market_cap", "last_price", "shares"):
                    try:
                        val = fi.get(key)
                    except Exception:
                        val = getattr(fi, key, None)
                    if key == "market_cap":
                        raw_cap = val
                    elif key == "last_price":
                        raw_price = val
                    else:
                        raw_shares = val

            # 2) fall back to the heavier .info only if needed
            if not raw_cap or not raw_price:
                info = {}
                try:
                    info = t.info or {}
                except Exception:
                    info = {}
                raw_cap = raw_cap or info.get("marketCap")
                raw_price = (raw_price or info.get("currentPrice")
                             or info.get("regularMarketPrice"))
                raw_shares = raw_shares or info.get("sharesOutstanding")

            # DERIVE market cap when the source simply does not carry it.
            # Nine of the 107 (RELIANCE, TCS, JSWSTEEL, BOSCHLTD, RECLTD, IOC,
            # TVSMOTOR, SUZLON, LTIM) persistently return no market_cap from
            # fast_info -- three retries changed nothing, so it is a gap in the
            # source, not a hiccup. Market cap IS price x shares outstanding;
            # that is the same arithmetic the source performs internally, so
            # doing it ourselves adds no assumption. We only ever derive from
            # two numbers we actually fetched, never from a stored guess, and
            # the result still has to clear the sane fence below.
            if not raw_cap and raw_price and raw_shares:
                try:
                    raw_cap = float(raw_price) * float(raw_shares)
                    derived_cap = True
                except (TypeError, ValueError):
                    raw_cap = None

            cap_cr = None
            if raw_cap:
                cr = round(float(raw_cap) / 1e7)      # INR (absolute) -> ₹ crore
                if MIN_CR <= cr <= MAX_CR:
                    cap_cr = cr
                else:
                    print("  %s: market cap %d cr is outside the sane fence, rejecting."
                          % (symbol, cr))

            if cap_cr is not None and derived_cap:
                print("  %s: market cap not supplied by source; derived "
                      "price x shares = %s cr." % (symbol, format(cap_cr, ",")))

            price = None
            if raw_price:
                p = round(float(raw_price), 2)
                if MIN_PRICE <= p <= MAX_PRICE:
                    price = p
                else:
                    print("  %s: price %s is outside the sane fence, rejecting."
                          % (symbol, p))

            # Remember the best of what we have seen across attempts.
            if cap_cr is not None:
                best_cap = cap_cr
            if price is not None:
                best_price = price

            # Only stop early when we have BOTH. Otherwise try again -- this is
            # exactly what v2 did for market cap, and why v2 rarely missed one.
            if best_cap is not None and best_price is not None:
                return best_cap, best_price

            if attempt < MAX_RETRIES:
                missing = "market cap" if best_cap is None else "price"
                print("  %s: %s missing on attempt %d; retrying."
                      % (symbol, missing, attempt))
                time.sleep(attempt * 2)

        except Exception as e:
            wait = attempt * 5
            print("  %s: attempt %d failed (%s); retrying in %ds."
                  % (symbol, attempt, str(e)[:80], wait))
            time.sleep(wait)

    # Retries exhausted. Return whatever we managed to gather -- a price with no
    # market cap is still worth writing, and the company keeps its newest older
    # market-cap row on the site.
    return best_cap, best_price


def compute_ratios(ticker, price, cap_cr, vi_row):
    """Turn today's price into ratios, using ONLY human-verified denominators.

       Returns a dict {metric_key: value}. An absent key means 'we are not
       going to say' — the panel then prints an honest line instead of a
       number. This function is deliberately strict and boring: every guard
       below exists because the alternative is printing a figure that would
       mislead someone about a real business."""
    out = {}
    if not vi_row or price is None:
        return out

    def positive(x):
        """A denominator must exist AND be positive. A loss (or negative net
           worth) makes the ratio arithmetically valid but financially
           nonsense, so we refuse it."""
        try:
            return x is not None and float(x) > 0
        except (TypeError, ValueError):
            return False

    # P/E — price divided by what the company earned per share over 12 months.
    if vi_row.get("pe_applicable") and positive(vi_row.get("ttm_eps")):
        pe = round(price / float(vi_row["ttm_eps"]), 2)
        if 0 < pe <= MAX_PE:
            out[PE_KEY] = pe

    # P/B — price against the accounting net worth behind each share. This is
    # the primary lens for lenders, where the book IS the business.
    if vi_row.get("pb_applicable") and positive(vi_row.get("book_value_per_share")):
        pb = round(price / float(vi_row["book_value_per_share"]), 2)
        if 0 < pb <= MAX_PB:
            out[PB_KEY] = pb

    # EV/EBITDA — the whole business (equity plus net debt) against its
    # operating cash generation. Off for lenders by the lens; for everyone else
    # it needs BOTH a verified EBITDA and today's market cap.
    if (vi_row.get("ev_ebitda_applicable")
            and positive(vi_row.get("ebitda_ttm_cr"))
            and cap_cr is not None):
        net_debt = vi_row.get("net_debt_cr")
        try:
            net_debt = float(net_debt) if net_debt is not None else 0.0
        except (TypeError, ValueError):
            net_debt = 0.0
        ev = float(cap_cr) + net_debt          # net debt may be NEGATIVE (net cash)
        if ev > 0:
            ev_eb = round(ev / float(vi_row["ebitda_ttm_cr"]), 2)
            if 0 < ev_eb <= MAX_EV_EBITDA:
                out[EV_KEY] = ev_eb

    return out


def in_filter(values):
    """PostgREST's 'is the value in this list?' filter. Each value is wrapped
       in double quotes so names with special characters (M&M, BAJAJ-AUTO)
       travel safely inside the comma-separated list."""
    return "in.(" + ",".join('"%s"' % v for v in values) + ")"


def snapshot_row(ticker, today, key, value, unit, label, note):
    """One diary line. status='verified' because either the number is a pure
       market observation (price, market cap) or it is arithmetic on a
       human-verified denominator. higher_is_better is left off on purpose."""
    return {"ticker": ticker,
            "snapshot_date": today,
            "metric_key": key,
            "metric_value": value,
            "metric_unit": unit,
            "metric_label": label,
            "metric_note": note,
            "status": "verified"}


def write_snapshots(service_key, rows, today, keys_written, tickers):
    """Two bulk calls that make the night's diary entry.

       Call 1 (DELETE): remove TODAY's rows for exactly the keys and tickers we
         are about to write. On the normal 2 AM run this deletes nothing (today
         is a fresh page); on a same-day re-run it clears the rows we are about
         to replace, so the day never holds duplicates. Yesterday and earlier
         are never touched — that history is the whole point of the diary.
       Call 2 (POST): insert the fresh rows. Row ids are assigned by the
         database; none of these keys ever enters metric display order
         (js/data.js keeps them out of metric_order by design)."""
    if not rows:
        return

    resp = requests.delete(
        SNAPSHOTS_ENDPOINT,
        headers=auth_headers(service_key),
        params={"metric_key": in_filter(sorted(keys_written)),
                "snapshot_date": "eq." + today,
                "ticker": in_filter(sorted(tickers))},
        timeout=60,
    )
    resp.raise_for_status()

    resp = requests.post(
        SNAPSHOTS_ENDPOINT,
        headers={**auth_headers(service_key),
                 "Content-Type": "application/json",
                 "Prefer": "return=minimal"},
        json=rows,
        timeout=60,
    )
    resp.raise_for_status()


def stamp_fetched_at(service_key, tickers, today):
    """One bulk PATCH: companies.fetched_at = today, for the tickers whose
       number we just refreshed. 'Last machine touch', exactly as CONTRACT.md
       defines it."""
    resp = requests.patch(
        COMPANIES_ENDPOINT,
        headers={**auth_headers(service_key),
                 "Content-Type": "application/json",
                 "Prefer": "return=minimal"},
        params={"ticker": in_filter(sorted(tickers))},
        json={"fetched_at": today},
        timeout=60,
    )
    resp.raise_for_status()


def main():
    service_key = get_service_key()
    # GitHub runners live on UTC, so at the 02:00 IST run this is "yesterday's"
    # calendar date in India. That is fine: the label only needs to be
    # consistent night to night, and newest-date-wins keeps working.
    today = dt.date.today().isoformat()

    companies = fetch_company_list(service_key)       # <-- the keep-alive ping
    val_inputs = fetch_valuation_inputs(service_key)  # <-- verified denominators
    total = len(companies)

    rows = []                                        # every diary line tonight
    ok_tickers = set()                               # companies with any number
    keys_written = set()                             # which metric_keys we touch
    counts = {MCAP_KEY: 0, PRICE_KEY: 0, PE_KEY: 0, PB_KEY: 0, EV_KEY: 0}
    failed = []
    streak = 0                                       # consecutive failures

    for i, c in enumerate(companies, 1):
        ticker = c["ticker"]
        symbol = yahoo_symbol(ticker, c.get("exchange"))
        cap_cr, price = fetch_quote(symbol)

        if cap_cr is None and price is None:
            failed.append(ticker)
            streak += 1
            print("[%d/%d] %s: no fresh number (site keeps its newest older row)."
                  % (i, total, ticker))
            if not ok_tickers and streak >= EARLY_ABORT_AFTER:
                print("Early abort: first %d companies all failed — source is "
                      "blocking us tonight." % EARLY_ABORT_AFTER)
                break
            time.sleep(PAUSE_SECONDS)
            continue

        streak = 0
        ok_tickers.add(ticker)

        if cap_cr is not None:
            rows.append(snapshot_row(ticker, today, MCAP_KEY, cap_cr,
                                     MCAP_UNIT, MCAP_LABEL, MCAP_NOTE))
            keys_written.add(MCAP_KEY)
            counts[MCAP_KEY] += 1

        if price is not None:
            rows.append(snapshot_row(
                ticker, today, PRICE_KEY, price, "₹", "Share Price",
                "last traded price, auto-refreshed nightly by robot v3"))
            keys_written.add(PRICE_KEY)
            counts[PRICE_KEY] += 1

        ratios = compute_ratios(ticker, price, cap_cr, val_inputs.get(ticker))
        for key, value in ratios.items():
            label = {PE_KEY: "P/E (TTM)", PB_KEY: "P/B",
                     EV_KEY: "EV / EBITDA"}[key]
            rows.append(snapshot_row(
                ticker, today, key, value, "x", label,
                "today's price over a human-verified denominator (robot v3)"))
            keys_written.add(key)
            counts[key] += 1

        bits = ["mcap %s cr" % format(cap_cr, ",")] if cap_cr is not None else []
        if price is not None:
            bits.append("₹%s" % price)
        for key in (PE_KEY, PB_KEY, EV_KEY):
            if key in ratios:
                bits.append("%s %s" % (key, ratios[key]))
        print("[%d/%d] %s: %s" % (i, total, ticker, " · ".join(bits)))

        time.sleep(PAUSE_SECONDS)

    print("-" * 60)
    print("Fetched %d/%d companies. Failed: %d %s"
          % (len(ok_tickers), total, len(failed), failed if failed else ""))
    print("Rows by key: market_cap %d · price %d · P/E %d · P/B %d · EV/EBITDA %d"
          % (counts[MCAP_KEY], counts[PRICE_KEY], counts[PE_KEY],
             counts[PB_KEY], counts[EV_KEY]))
    if counts[PE_KEY] == 0 and counts[PB_KEY] == 0 and counts[EV_KEY] == 0:
        print("No ratios tonight — that is EXPECTED until verified denominators "
              "are filled in valuation_inputs. The panel says so honestly.")

    # The loud-vs-quiet rule (Plan v3 §9 "degrade gracefully, fail loudly"):
    #   * A FEW failures are normal (a source hiccups): those companies simply
    #     show their newest OLDER row, the site never breaks, and we exit 0.
    #   * ZERO successes means the whole source is down: write NOTHING (so any
    #     rows already written today survive untouched) and exit non-zero so
    #     GitHub EMAILS you. The ping already happened, so the DB stays awake.
    if not ok_tickers:
        sys.exit("FATAL: 0 companies fetched — the data source likely blocked "
                 "this run. Nothing was written or deleted; the site still "
                 "serves its newest stored numbers, and the database was "
                 "pinged — but tonight's refresh did not happen.")

    write_snapshots(service_key, rows, today, keys_written, ok_tickers)
    stamp_fetched_at(service_key, sorted(ok_tickers), today)
    print("Wrote %d dated rows into metric_snapshots for %s and stamped "
          "fetched_at." % (len(rows), today))
    print("Done. The website will show these fresh numbers on the next visit.")


if __name__ == "__main__":
    main()
