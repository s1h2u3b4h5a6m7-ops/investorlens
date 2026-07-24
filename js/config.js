/* ============================================================================
   InvestorLens India — config.js
   The one place for constants and connection settings. Nothing here touches the
   screen; it just holds values the rest of the app reads.
   Carved for Plan v3 §4 (Phase 1) · wired to Supabase in Phase 2.
   ============================================================================ */

var CONFIG = {
  // Which version of the app this is (bump when we ship a real change).
  version: 'v3.0 (Phase 2 — Data in Supabase)',

  // ---- THE UI-2 SWITCH (Session AA) ----
  // false → the site you have today, unchanged. true → the UI-2 storytelling
  // layer. This is the rollback: if anything in UI-2 misbehaves, change the one
  // word below to false, commit, and the old site is back. Nothing else moves.
  //
  // It works because story.js adds ONE class to <body> when this is true, and
  // every single UI-2 style rule is written under `body.story`. A CSS rule that
  // needs `body.story` cannot match a page that never got the class — so with
  // the switch off, the new rules are inert text in the stylesheet. Think of it
  // as a light switch wired to its own circuit: the wiring can be in the wall
  // for months without a single bulb turning on.
  storyMode: true,

  // WHERE THE DATA COMES FROM.
  // 'supabase'   → data.js reads the five tables (the live filing cabinet).
  // 'local-json' → the Phase-1 fallback: data.js reads /data JSON instead.
  //   That is the emergency parachute: if Supabase ever misbehaves, flip this
  //   one word back, commit, and the site runs on the frozen seed again.
  dataSource: 'supabase',

  // Folder (relative to index.html) holding the JSON seed — only used when
  // dataSource is 'local-json'. Kept until the Phase-2 acid test passes.
  dataDir: './data',

  // ---- SUPABASE (Phase 2) ----
  // Two-keys rule (Plan v3 §5): ONLY the anon key ever appears in this public
  // file. It is the front-door key — read-only under RLS, safe to ship in the
  // website. The service_role master key NEVER goes here; it lives only in
  // GitHub Secrets for the nightly robot (Phase 3).
  supabaseUrl: 'https://uhqyhsniwlgivdlxbpoj.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocXloc25pd2xnaXZkbHhicG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIwNzgsImV4cCI6MjA5ODc0ODA3OH0.rPSGWKn2AkkV66bNhOm3COE6ojdl6lUhoe4spbI0xr0'
};
