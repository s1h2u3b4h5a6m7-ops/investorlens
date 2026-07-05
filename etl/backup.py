#!/usr/bin/env python3
# ============================================================================
# InvestorLens India — etl/backup.py   (Plan v3, Phase 3b: the weekly photocopy)
# ----------------------------------------------------------------------------
# WHAT THIS DOES, in one breath:
#   Read every row of all FIVE tables from Supabase and save them as five JSON
#   files (plus a little manifest), into a folder the workflow then commits into
#   a PRIVATE backup repo.
#
# WHY IT EXISTS:
#   Supabase's free tier keeps NO backups of its own. If the project were ever
#   lost, these JSON files are the photocopy we rebuild from. The MOST precious
#   rows are the human-verified UNDERSTANDING — business_core, value_chain*,
#   moat_note, mgmt, factors. A machine can re-fetch a market cap tomorrow; it
#   can never re-derive a hand-written moat note. This protects the mission.
#
# THE ONE SECRET IT NEEDS:
#   SUPABASE_SERVICE_KEY (from GitHub Secrets). Reads work with any key, but the
#   robot already carries the master key, so we reuse it. Never written in code.
# ============================================================================

import os
import sys
import json
import datetime as dt

import requests

SUPABASE_URL = "https://uhqyhsniwlgivdlxbpoj.supabase.co"

# The five drawers of the filing cabinet, and the column we sort each by. Sorting
# gives STABLE output, so next week's git diff shows only what truly changed.
TABLES = {
    "companies": "ticker",
    "metrics":   "id",
    "factors":   "id",
    "chains":    "id",
    "mgmt":      "ticker",
}

PAGE = 1000                                   # PostgREST returns <= 1000 rows/call
OUT_DIR = os.environ.get("OUT_DIR", "backups-repo")


def service_key():
    k = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
    if not k:
        sys.exit("FATAL: SUPABASE_SERVICE_KEY is not set. In GitHub it comes "
                 "from Settings > Secrets > Actions.")
    return k


def headers(k):
    return {"apikey": k, "Authorization": "Bearer " + k}


def dump_table(table, order_col, k):
    """Read EVERY row, 1,000 at a time. We MUST page because `metrics` grows
       forever (one row per metric PER snapshot_date) and will pass 1,000 someday."""
    rows = []
    start = 0
    while True:
        r = requests.get(
            SUPABASE_URL + "/rest/v1/" + table,
            headers={**headers(k), "Range": "%d-%d" % (start, start + PAGE - 1)},
            params={"select": "*", "order": order_col + ".asc"},
            timeout=60,
        )
        if r.status_code not in (200, 206):
            r.raise_for_status()               # a real read error => fail LOUD
        batch = r.json()
        rows.extend(batch)
        if len(batch) < PAGE:                  # short page => that was the last one
            break
        start += PAGE
    return rows


def main():
    k = service_key()
    os.makedirs(OUT_DIR, exist_ok=True)

    manifest = {
        "backed_up_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": SUPABASE_URL,
        "counts": {},
    }

    for table, order_col in TABLES.items():
        rows = dump_table(table, order_col, k)
        path = os.path.join(OUT_DIR, table + ".json")
        with open(path, "w", encoding="utf-8") as f:
            # ensure_ascii=False keeps ₹ and — readable; sort_keys + indent make
            # the file diff-friendly week to week.
            json.dump(rows, f, ensure_ascii=False, indent=2, sort_keys=True)
        manifest["counts"][table] = len(rows)
        print("  %-10s %6d rows -> %s" % (table, len(rows), path))

    with open(os.path.join(OUT_DIR, "backup_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2, sort_keys=True)

    # Safety: never let a broken read save an EMPTY backup over a good one.
    # (Git history would still hold the old copy, but failing loud is clearer.)
    if manifest["counts"].get("companies", 0) == 0:
        sys.exit("FATAL: 0 companies dumped — refusing to write an empty backup.")

    print("-" * 60)
    print("Backup complete:", manifest["counts"])


if __name__ == "__main__":
    main()
