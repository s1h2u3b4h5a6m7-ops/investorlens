#!/usr/bin/env python3
# ============================================================================
# InvestorLens India — etl/refresh.py   (Plan v3, Phase 3a: "the robot wakes up")
# ----------------------------------------------------------------------------
# WHAT THIS SCRIPT DOES, in one breath:
#   1. Ask the database for the list of companies.
#        (This one call also PINGS Supabase, so the free project never falls
#         asleep — Supabase pauses a project only after 7 quiet days.)
#   2. For each company, ask a free public source "how big are you today?"
#        (its market capitalisation — the current ₹-value of the whole company).
#   3. Write that fresh number back into  companies.market_cap_cr.
#
# WHAT THIS SCRIPT NEVER DOES  (the mission lock, Plan v3 §6/§7):
#   It never touches business_core, value_chain, moat_note, factors, or mgmt.
#   Those are the *understanding* of the business and are human-verified in
#   Claude sessions. A machine may refresh a NUMBER; only a human may change a
#   SENTENCE. Market cap here is "how big is this business," not a buy/sell call.
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
# the public website (js/config.js). It is not a secret.
SUPABASE_URL = "https://uhqyhsniwlgivdlxbpoj.supabase.co"
COMPANIES_ENDPOINT = SUPABASE_URL + "/rest/v1/companies"

# ---- Safety fences ---------------------------------------------------------
# A real Indian listed company sits comfortably inside this range (in ₹ crore).
# Anything outside is almost certainly a bad/garbled fetch, so we REFUSE it
# rather than let one junk number overwrite a good, verified one.
MIN_CR = 100                 # ₹100 crore floor
MAX_CR = 50_000_000          # ₹50 lakh crore ceiling (above the biggest Indian co)

PAUSE_SECONDS = 1.5          # be polite to the data source between requests
MAX_RETRIES = 3             # per company, on a transient hiccup / rate-limit
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
        params={"select": "ticker,exchange,market_cap_cr"},
        timeout=30,
    )
    resp.raise_for_status()          # DB unreachable => fail LOUD (GitHub emails you)
    rows = resp.json()
    print("Ping OK — database returned %d companies." % len(rows))
    return rows


def yahoo_symbol(ticker, exchange):
    """Our tickers are bare NSE symbols (e.g. 'HDFCBANK'). Yahoo wants a suffix:
       NSE -> '.NS', BSE -> '.BO'. Default to NSE when unknown."""
    suffix = ".BO" if (exchange or "").upper() == "BSE" else ".NS"
    return ticker + suffix


def fetch_market_cap_cr(symbol):
    """Return today's market cap in ₹ crore, or None if we could not get a
       number we trust. Prefers fast_info (the LIGHT endpoint), falls back to
       the heavier .info, and retries a few times on a hiccup."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            t = yf.Ticker(symbol)
            raw = None

            # 1) fast_info: light + reliable (last_price x shares under the hood)
            fi = getattr(t, "fast_info", None)
            if fi is not None:
                try:
                    raw = fi.get("market_cap")
                except Exception:
                    raw = getattr(fi, "market_cap", None)

            # 2) fall back to the heavier .info only if needed
            if not raw:
                info = {}
                try:
                    info = t.info or {}
                except Exception:
                    info = {}
                raw = info.get("marketCap")

            if raw:
                cr = round(float(raw) / 1e7)      # INR (absolute) -> ₹ crore
                if MIN_CR <= cr <= MAX_CR:
                    return cr
                print("  %s: value %d cr is outside the sane fence, rejecting." % (symbol, cr))
                return None

        except Exception as e:
            wait = attempt * 5
            print("  %s: attempt %d failed (%s); retrying in %ds."
                  % (symbol, attempt, str(e)[:80], wait))
            time.sleep(wait)

    return None


def write_market_cap(service_key, ticker, cr, today, now_iso):
    """PATCH one company's row. Prefer=return=minimal => no body echoed back."""
    resp = requests.patch(
        COMPANIES_ENDPOINT,
        headers={**auth_headers(service_key),
                 "Content-Type": "application/json",
                 "Prefer": "return=minimal"},
        params={"ticker": "eq." + ticker},
        json={"market_cap_cr": cr, "fetched_at": today, "updated_at": now_iso},
        timeout=30,
    )
    resp.raise_for_status()


def main():
    service_key = get_service_key()
    today = dt.date.today().isoformat()
    now_iso = dt.datetime.now(dt.timezone.utc).isoformat()

    companies = fetch_company_list(service_key)      # <-- the keep-alive ping
    total = len(companies)
    updated = 0
    failed = []
    streak = 0                                        # consecutive failures

    for i, c in enumerate(companies, 1):
        ticker = c["ticker"]
        symbol = yahoo_symbol(ticker, c.get("exchange"))
        cr = fetch_market_cap_cr(symbol)

        if cr is None:
            failed.append(ticker)
            streak += 1
            print("[%d/%d] %s: no update (kept yesterday's value)." % (i, total, ticker))
            if updated == 0 and streak >= EARLY_ABORT_AFTER:
                print("Early abort: first %d companies all failed — source is "
                      "blocking us tonight." % EARLY_ABORT_AFTER)
                break
        else:
            write_market_cap(service_key, ticker, cr, today, now_iso)
            updated += 1
            streak = 0
            print("[%d/%d] %s: market_cap_cr -> %s cr" % (i, total, ticker, format(cr, ",")))

        time.sleep(PAUSE_SECONDS)

    print("-" * 60)
    print("Refreshed %d/%d. Failed: %d %s"
          % (updated, total, len(failed), failed if failed else ""))

    # The loud-vs-quiet rule (Plan v3 §9 "degrade gracefully, fail loudly"):
    #   * A FEW failures are normal (a source hiccups): those companies simply
    #     keep yesterday's number, the site never breaks, and we exit 0 (calm).
    #   * ZERO successes means the whole source is down: exit non-zero so GitHub
    #     EMAILS you. The ping already happened above, so the DB still stays awake.
    if updated == 0:
        sys.exit("FATAL: 0 companies updated — the data source likely blocked "
                 "this run. The site still serves yesterday's data, and the "
                 "database was pinged, so nothing is broken — but tonight's "
                 "refresh did not happen.")

    print("Done. The website will show these fresh numbers on the next visit.")


if __name__ == "__main__":
    main()
