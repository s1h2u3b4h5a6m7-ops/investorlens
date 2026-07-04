# etl/ — the nightly robot (Phase 3, not built yet)

This folder is intentionally empty for now. In **Phase 3** it holds the free,
scheduled GitHub Actions that keep the site alive and fresh (Plan v3 §7):

- `refresh.py` — nightly: fetch market caps / delayed prices a machine can safely
  verify, write them with today's `snapshot_date`. **Never** touches the verified
  qualitative fields.
- `refresh.yml` — the ~2 AM IST schedule that runs the refresh **and** pings the
  Supabase database so the free project never pauses.
- `backup.yml` — weekly full database dump committed to a private repo (the free
  tier keeps no backups of its own).

Nothing here runs until Phase 2 (data in Supabase) is done.
