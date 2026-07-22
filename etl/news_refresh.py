#!/usr/bin/env python3
# ============================================================================
# InvestorLens India — etl/news_refresh.py   (robot: NEWS, Session U — §10)
# ----------------------------------------------------------------------------
# WHAT THIS SCRIPT DOES, in one breath:
#   1. Ask the database for every company (ticker + name).
#   2. For each company, ask a free public source — Google News' RSS search —
#        "what has been written about this company in the last few days?"
#   3. Tag each headline's TONE with a FIXED, re-checkable word list:
#        tailwind / headwind / neutral. This is a reading of LANGUAGE, never a
#        judgement of the business and never a buy/sell signal.
#   4. Write the new headlines into `news_items` (skipping any it already has,
#        by url_hash) and prune anything older than the retention window.
#
# WHY THIS IS A SEPARATE ROBOT (not folded into refresh.py):
#   refresh.py writes NUMBERS into the VERIFIED record (metric_snapshots) and is
#   proven and load-bearing. News is the site's one openly NON-VERIFIED surface.
#   Keeping it in its own script + its own workflow means a flaky news feed can
#   never endanger the nightly market-cap/price run, and vice versa.
#
# CHIP SAFETY: news_items is NOT a metric. js/data.js reads it into its own NEWS
#   pocket and never touches metric_order, so the home chip's 492 metric bindings
#   cannot move. Nothing to add to VALUATION_KEYS for this robot.
#
# THE KEY: writes use the service_role master key, read from the environment
#   variable SUPABASE_SERVICE_KEY (filled by GitHub from Settings > Secrets).
#   It bypasses RLS on purpose — which is why it lives only in GitHub Secrets and
#   never in the website or any committed file.
# ============================================================================

import os
import sys
import time
import hashlib
import datetime as dt
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus
import xml.etree.ElementTree as ET

import requests

# ---------------------------------------------------------------------------
# CONNECTION
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "https://uhqyhsniwlgivdlxbpoj.supabase.co")
COMPANIES_ENDPOINT = SUPABASE_URL + "/rest/v1/companies"
NEWS_ENDPOINT      = SUPABASE_URL + "/rest/v1/news_items"

RETENTION_DAYS = 30           # the panel is a PULSE, not an archive
LOOKBACK = "when:3d"          # how far back to ask the feed each run
MAX_PER_COMPANY = 12          # cap so one noisy name cannot flood the table
PAUSE_SECONDS = 1.5           # be polite to the feed between companies
FEED_TIMEOUT = 30

# ---------------------------------------------------------------------------
# THE TONE WORD LISTS  (fixed, deterministic, re-checkable)
# ---------------------------------------------------------------------------
# A headline's tone is decided by counting whole-word matches in each list and
# taking the larger count; a tie (including zero-zero) is 'neutral'. Because the
# lists are fixed and the rule is arithmetic, the SAME headline always yields the
# SAME tone — which is what lets js/company.js assert the panel is verdict-free
# and lets a human re-check any tag by eye. These describe the DIRECTION of news,
# never a valuation verdict (no cheap/expensive/buy/sell here either).
TAILWIND_WORDS = [
    "rises", "rise", "jumps", "jump", "surge", "surges", "gains", "gain",
    "soars", "soar", "record", "profit", "profits", "beats", "beat",
    "upgrade", "upgraded", "wins", "win", "bags", "order", "orders",
    "launch", "launches", "expansion", "expands", "expand", "approval",
    "approved", "deal", "partnership", "growth", "grows", "grow", "rally",
    "rallies", "high", "highs", "boost", "boosts", "strong", "outperform",
    "dividend", "buyback", "acquires", "acquire", "acquisition",
]
HEADWIND_WORDS = [
    "falls", "fall", "drops", "drop", "slumps", "slump", "declines",
    "decline", "loss", "losses", "probe", "fraud", "downgrade", "downgraded",
    "cut", "cuts", "ban", "banned", "penalty", "fine", "fined", "lawsuit",
    "sued", "recall", "recalls", "resigns", "resign", "resignation",
    "default", "defaults", "weak", "weakens", "miss", "misses", "warning",
    "warns", "strike", "raid", "raids", "layoff", "layoffs", "scam",
    "plunge", "plunges", "crash", "crashes", "delay", "delays", "hit",
]
_TW = set(w.lower() for w in TAILWIND_WORDS)
_HW = set(w.lower() for w in HEADWIND_WORDS)


def classify(headline):
    """Return 'tailwind' / 'headwind' / 'neutral' by counting whole-word matches.
       Larger count wins; a tie (or no matches) is 'neutral' — silence, honestly."""
    words = "".join(ch.lower() if (ch.isalnum() or ch.isspace()) else " "
                     for ch in (headline or "")).split()
    tw = sum(1 for w in words if w in _TW)
    hw = sum(1 for w in words if w in _HW)
    if tw > hw:
        return "tailwind"
    if hw > tw:
        return "headwind"
    return "neutral"


def url_hash(ticker, url):
    """One row per (ticker, url). Stable md5 so re-runs skip what we already hold."""
    return hashlib.md5((ticker + "|" + (url or "")).encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# SUPABASE (service_role — writes bypass RLS)
# ---------------------------------------------------------------------------
def get_service_key():
    key = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not key:
        sys.exit("FATAL: SUPABASE_SERVICE_KEY is not set. In GitHub it is "
                 "supplied from Settings > Secrets > Actions.")
    return key


def auth_headers(service_key):
    return {"apikey": service_key, "Authorization": "Bearer " + service_key}


def fetch_company_list(service_key):
    """Read every ticker + name. This request is also the keep-alive PING."""
    resp = requests.get(
        COMPANIES_ENDPOINT,
        headers=auth_headers(service_key),
        params={"select": "ticker,name"},
        timeout=30,
    )
    resp.raise_for_status()
    rows = resp.json()
    print("Ping OK — database returned %d companies." % len(rows))
    return rows


def write_news(service_key, rows):
    """Bulk upsert. on_conflict=url_hash + resolution=ignore-duplicates means a
       headline we already hold is silently skipped, so re-runs only add the new."""
    if not rows:
        return 0
    resp = requests.post(
        NEWS_ENDPOINT,
        headers={**auth_headers(service_key),
                 "Content-Type": "application/json",
                 "Prefer": "resolution=ignore-duplicates,return=minimal"},
        params={"on_conflict": "url_hash"},
        json=rows,
        timeout=60,
    )
    resp.raise_for_status()
    return len(rows)


def prune_old(service_key, cutoff_iso):
    """DELETE headlines older than the retention window. Keeps the pulse a pulse."""
    resp = requests.delete(
        NEWS_ENDPOINT,
        headers=auth_headers(service_key),
        params={"published_at": "lt." + cutoff_iso},
        timeout=60,
    )
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# THE FEED  (Google News RSS search — free, no key, per company)
# ---------------------------------------------------------------------------
def feed_url(name):
    q = quote_plus('"%s" %s' % (name, LOOKBACK))
    return ("https://news.google.com/rss/search?q=%s"
            "&hl=en-IN&gl=IN&ceid=IN:en" % q)


def fetch_feed(url):
    resp = requests.get(url, timeout=FEED_TIMEOUT,
                        headers={"User-Agent": "InvestorLens-news/1.0"})
    resp.raise_for_status()
    return resp.text


def parse_feed(xml_text):
    """Turn the RSS XML into a list of {headline, url, source, published_at}.
       Tolerant: a malformed item is skipped, never fatal."""
    items = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return items
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        if not title or not link:
            continue
        src_el = it.find("source")
        source = (src_el.text.strip() if src_el is not None and src_el.text else None)
        pub = it.findtext("pubDate")
        published_at = None
        if pub:
            try:
                published_at = parsedate_to_datetime(pub).astimezone(
                    dt.timezone.utc).isoformat()
            except (TypeError, ValueError):
                published_at = None
        items.append({"headline": title, "url": link,
                      "source": source, "published_at": published_at})
    return items


def news_rows_for(ticker, name):
    """Fetch + parse + tag one company's headlines into news_items rows."""
    try:
        raw = parse_feed(fetch_feed(feed_url(name)))
    except requests.RequestException as e:
        print("  ! feed failed for %s: %s" % (ticker, e))
        return []
    seen, rows = set(), []
    for it in raw[:MAX_PER_COMPANY]:
        h = url_hash(ticker, it["url"])
        if h in seen:
            continue
        seen.add(h)
        rows.append({
            "ticker": ticker,
            "headline": it["headline"][:400],
            "url": it["url"],
            "source": it["source"],
            "published_at": it["published_at"],
            "sentiment": classify(it["headline"]),
            "url_hash": h,
            "is_active": True,
        })
    return rows


def main():
    service_key = get_service_key()
    companies = fetch_company_list(service_key)          # keep-alive ping
    total = len(companies)

    all_rows = []
    tally = {"tailwind": 0, "headwind": 0, "neutral": 0}
    failed = []
    for i, c in enumerate(companies, 1):
        ticker, name = c["ticker"], (c.get("name") or c["ticker"])
        rows = news_rows_for(ticker, name)
        if not rows:
            failed.append(ticker)
        for r in rows:
            tally[r["sentiment"]] += 1
        all_rows.extend(rows)
        print("[%3d/%d] %-12s %d headlines" % (i, total, ticker, len(rows)))
        time.sleep(PAUSE_SECONDS)

    written = write_news(service_key, all_rows)

    cutoff = (dt.datetime.now(dt.timezone.utc)
              - dt.timedelta(days=RETENTION_DAYS)).isoformat()
    prune_old(service_key, cutoff)

    print("\n----- news run complete -----")
    print("companies with headlines : %d / %d" % (total - len(failed), total))
    print("rows sent (dupes ignored) : %d" % written)
    print("tone tally               : %d tailwind * %d headwind * %d neutral"
          % (tally["tailwind"], tally["headwind"], tally["neutral"]))
    if failed:
        print("no headlines this run    : %s" % ", ".join(failed))


if __name__ == "__main__":
    main()
