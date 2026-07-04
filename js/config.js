/* ============================================================================
   InvestorLens India — config.js
   The one place for constants and connection settings. Nothing here touches the
   screen; it just holds values the rest of the app reads.
   Carved for Plan v3 §4 (Phase 1 — The Great Split).
   ============================================================================ */

var CONFIG = {
  // Which version of the app this is (bump when we ship a real change).
  version: 'v3.0 (Phase 1 — Great Split)',

  // WHERE THE DATA COMES FROM.
  // Phase 1 (now): the verified V2.6 data ships as local JSON seed files in /data.
  // Phase 2 (next): this flips to 'supabase' and only data.js changes — no other
  // file knows or cares where the data actually lives. That is the whole point of
  // the split: the dining room asks the waiter; it never touches the pantry.
  dataSource: 'local-json',

  // Folder (relative to index.html) holding the JSON seed. Relative on purpose, so
  // it works both at the site root and under a project path like
  // https://<user>.github.io/investorlens/.
  dataDir: './data',

  // ---- PHASE 2 PLACEHOLDERS (not used yet — here so the shape is agreed early) ----
  // Two-keys rule (Plan v3 §5): ONLY the anon key ever appears in this public file.
  // It is the front-door key — read-only, safe to ship. The service_role master key
  // NEVER goes here; it lives only in GitHub Secrets for the nightly robot.
  supabaseUrl: '',   // e.g. 'https://xxxx.supabase.co'  ← filled in Phase 2
  supabaseAnonKey: '' // the READ-ONLY anon key only    ← filled in Phase 2
};
