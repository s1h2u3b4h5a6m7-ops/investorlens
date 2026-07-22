-- ============================================================================
-- InvestorLens India — sql/2026-07-22_news_items.sql   (Session U — §10 News)
-- ----------------------------------------------------------------------------
-- WHAT THIS DOES, in one breath:
--   Creates `news_items`, the robot's OUTBOX of company headlines that feeds
--   the §10 News & Sentiment Pulse. It is the site's one openly NON-VERIFIED
--   surface: machines collect headlines and tag each one's TONE
--   (tailwind / headwind / neutral); nothing here ever enters the verified
--   record, and §10 never renders a buy/sell verdict — only a plain tally.
--
-- WHY ONE FILE DOES ALL THREE GATES (the Session-T lesson, CONTRACT "TWO GATES"):
--   A brand-new table grants anon NOTHING, so PostgREST answers 404 (not "empty"),
--   AND Supabase's project DEFAULT PRIVILEGES then silently hand anon ALL rights.
--   So every new table must ship, together: an RLS SELECT policy (gate 1),
--   an explicit GRANT SELECT (gate 2), and a REVOKE of the writes that were
--   handed out by default — plus NOTIFY pgrst so the API drops its cached list.
--
-- IDEMPOTENT: every statement is IF-NOT-EXISTS / drop-then-create / value-guarded.
--   Run 1 builds it; run 2 changes nothing. Proven twice on a from-scratch
--   PostgreSQL 16 parachute rebuild. Ends in a self-judging grid (the SQL Editor
--   shows only the LAST statement's result).
--
-- CHIP SAFETY: news_items is NOT a metric. js/data.js reads it into its own NEWS
--   pocket and never touches metric_order, so the home chip's 492 metric bindings
--   are invariant. There is nothing to add to VALUATION_KEYS here.
-- ============================================================================

-- ── Part A · the table ──────────────────────────────────────────────────────
create table if not exists public.news_items (
  id            bigint generated always as identity primary key,
  ticker        text        not null references public.companies(ticker) on delete cascade,
  headline      text        not null,
  url           text        not null,
  source        text,
  published_at  timestamptz,
  sentiment     text        not null default 'neutral',
  url_hash      text        not null,
  is_active     boolean     not null default true,
  fetched_at    timestamptz not null default now()
);

-- The sentiment vocabulary is fixed and DELIBERATELY separate from §3's
-- tech_geo_tags vocabulary (risk / tailwind / neutral). §10 tone is its own thing.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'news_items_sentiment_chk') then
    alter table public.news_items
      add constraint news_items_sentiment_chk
      check (sentiment in ('tailwind','headwind','neutral'));
  end if;
end $$;

-- Dedup key: one row per (ticker,url). The robot computes url_hash = md5(ticker||'|'||url)
-- and skips anything already present, so a re-run of the news robot inserts only the new.
create unique index if not exists news_items_url_hash_key on public.news_items (url_hash);
create index        if not exists news_items_ticker_pub_idx on public.news_items (ticker, published_at desc nulls last);

-- ── Part B · GATE 1 — RLS: the browser may read only ACTIVE rows ─────────────
alter table public.news_items enable row level security;
drop policy if exists news_items_read_active on public.news_items;
create policy news_items_read_active on public.news_items
  for select using (is_active = true);

-- ── Part C · GATE 2 — GRANT SELECT (without this, the browser gets 404) ──────
grant select on public.news_items to anon, authenticated, service_role;

-- ── Part D · LOCKDOWN — REVOKE the writes default-privileges silently grant ──
revoke insert, update, delete, truncate on public.news_items from anon;
revoke insert, update, delete, truncate on public.news_items from authenticated;

-- ── Part E · tell PostgREST its cached schema is stale ───────────────────────
notify pgrst, 'reload schema';

-- ── Part F · the judge (this last grid is the only one the Editor shows) ─────
select 'news_items'                                                                  as object,
       (select count(*) from public.news_items)                                      as rows_now,
       (select relrowsecurity from pg_class where oid = 'public.news_items'::regclass) as rls_on,
       (select count(*) from pg_policies where schemaname='public' and tablename='news_items') as policies,
       has_table_privilege('anon','public.news_items','SELECT')                       as anon_can_read,
       (has_table_privilege('anon','public.news_items','INSERT')
        or has_table_privilege('anon','public.news_items','UPDATE')
        or has_table_privilege('anon','public.news_items','DELETE'))                  as anon_can_write,
       (select count(*) from pg_constraint where conname='news_items_sentiment_chk')  as sentiment_guard;
