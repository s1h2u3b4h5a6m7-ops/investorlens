/* ============================================================================
   InvestorLens India — icons.js   (Session 2e, UI-2e: cards + icons)

   A single hand-drawn sprite of 37 marks — 23 sectors + 14 forces — in the
   exact visual language of the chapter/tab icons already in story.js:
   24×24 viewBox, fill:none, stroke:currentColor, stroke-width 1.7, no external
   assets, no library. Reused across three surfaces (company cards, the sector
   filter, the force grid), all scoped to body.story.

   THIS FILE ADDS NO BEHAVIOUR AND READS NO DATA. It defines:
     - IL_SPRITE   : the <svg> of <symbol>s, injected once by story.js on boot
     - SECTOR_ICON : the live `sector` string -> symbol-id map (all 23), with a
                     neutral fallback so a company with a blank sector still
                     gets a mark rather than an empty box.
     - forceIconId(): the force id -> symbol-id (ids already match forces.js).

   Because it is inert data, loading it with the flag OFF changes nothing: no
   rule references #il-* until body.story exists, and story.js only injects the
   sprite inside boot(), which returns immediately when the flag is off.

   NEAR-SIBLINGS were drawn to be told apart at 16px, which is the whole reason
   this is hand-work and not one generic "industry" glyph:
     Auto (whole car)          vs Auto Components (single cog)
     Banking (columned bank)   vs Financial Services (rupee + rising bars)
                               vs Insurance (shield)
     Capital Goods (gear)      vs Infra & Capital Goods (crane)
     Power (bolt in a tower)   vs Renewable Energy (leaf + sun)
     Pharma (capsule)          vs Healthcare (pulse cross)
   ============================================================================ */

var IL_SPRITE = '<svg id="il-sprite" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'

/* ---- the "All" filter mark (grid) ---- */
+ '<symbol id="il-all-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></symbol>'

/* ---- 23 SECTORS ---- */
+ '<symbol id="il-s-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 16v-3l2-5h12l2 5v3"/><path d="M4 16h2M18 16h2"/><circle cx="7.5" cy="16.5" r="1.9"/><circle cx="16.5" cy="16.5" r="1.9"/></symbol>'
+ '<symbol id="il-s-autocomp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19"/></symbol>'
+ '<symbol id="il-s-aviation" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 15.5 13.5 12V5.2a1.5 1.5 0 0 0-3 0V12L3 15.5V17l7.5-2v3.5L8 20.2V21.5l4-1 4 1V20.2l-2.5-1.7V15l7.5 2Z"/></symbol>'
+ '<symbol id="il-s-bank" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20.5h18M4.5 20.5V10M9.5 20.5V10M14.5 20.5V10M19.5 20.5V10M2.5 10 12 4l9.5 6Z"/></symbol>'
+ '<symbol id="il-s-capgoods" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="9" r="2.4"/><path d="M9 4.2v2M9 11.8v2M4.2 9h2M11.8 9h2M6 6l1.4 1.4M10.6 10.6 12 12M12 6l-1.4 1.4M7.4 10.6 6 12"/><circle cx="17" cy="17" r="2.4"/><path d="M17 13.5v1.2M17 19.3v1.2M13.5 17h1.2M19.3 17h1.2"/></symbol>'
+ '<symbol id="il-s-cement" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20.5V10l5.5-3.5V10L14 6.5V10l6-3.5v14Z"/><path d="M3 15.5h17"/></symbol>'
+ '<symbol id="il-s-chem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9.5 3v6L4.8 17.4A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 1.7-3.1L14.5 9V3"/><path d="M8.5 3h7M8 14h8"/></symbol>'
+ '<symbol id="il-s-conglom" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="8" height="8" rx="1.4"/><rect x="14" y="6" width="7" height="7" rx="1.4"/><rect x="6" y="14" width="7" height="7" rx="1.4"/></symbol>'
+ '<symbol id="il-s-durables" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4" width="17" height="13" rx="1.6"/><path d="M8 20.5h8M12 17v3.5M7 8h4"/></symbol>'
+ '<symbol id="il-s-services" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><path d="M12 11.4V14"/></symbol>'
+ '<symbol id="il-s-fmcg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4.5 8h15l-1.3 12.5H5.8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></symbol>'
+ '<symbol id="il-s-finserv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 20V13M10 20v-9M15 20v-6M20 20V7"/><path d="M4 8h5M6.5 5.5 9 8l-2.5 2.5"/></symbol>'
+ '<symbol id="il-s-health" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2.5 12h4l2-4 3.5 8 2.5-6 1.5 2h5.5"/></symbol>'
+ '<symbol id="il-s-it" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 8.5 5 12l4 3.5M15 8.5 19 12l-4 3.5M13.2 6l-2.4 12"/></symbol>'
+ '<symbol id="il-s-infra" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 20.5V3l11 3.4M5 6.5h11l-4 5H5"/><path d="M12 11.5v9M9 20.5h6"/></symbol>'
+ '<symbol id="il-s-insurance" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.8 4.5 6v6.2c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></symbol>'
+ '<symbol id="il-s-metal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20.5 8 9h8l4 11.5Z"/><path d="M8 9 12 3l4 6M9.5 15h5"/></symbol>'
+ '<symbol id="il-s-oil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M7 20.5V7l7-3v16.5"/><path d="M7 11h7M7 15h7"/><path d="M17 20.5V11l3-1.2v10.7"/></symbol>'
+ '<symbol id="il-s-pharma" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.8" y="8.5" width="18.4" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M8.8 8.8 15 15"/></symbol>'
+ '<symbol id="il-s-power" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 21 8 3h8l2 18M7 9h10M6.5 15h11"/><path d="M13 7.5 10.5 12H13l-1 4 3.5-5H13Z"/></symbol>'
+ '<symbol id="il-s-realty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20.5V9l8-5.5L20 9v11.5Z"/><path d="M9.5 20.5v-6h5v6"/></symbol>'
+ '<symbol id="il-s-renew" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8.5" r="3"/><path d="M12 2.5v1.6M17 8.5h-1.6M8 8.5H6.4M15.2 5.3l-1.1 1.1M9.9 11.7l-1.1 1.1M15.2 11.7l-1.1-1.1M9.9 5.3 8.8 6.4"/><path d="M12 14c-3 0-5 2-5 6.5 3.5 0 5-2 5-4 0 2 1.5 4 5 4 0-4.5-2-6.5-5-6.5Z"/></symbol>'
+ '<symbol id="il-s-telecom" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21V10M9.5 21h5"/><path d="M7.5 8a6 6 0 0 1 9 0M5 5.5a9.5 9.5 0 0 1 14 0"/><circle cx="12" cy="9" r="1"/></symbol>'

/* ---- 14 FORCES (ids match forces.js; glyphs carried from the approved prototype) ---- */
+ '<symbol id="il-f-crude" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3Z"/></symbol>'
+ '<symbol id="il-f-fx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 8h10M4 8l3-3M4 8l3 3M20 16H10M20 16l-3-3M20 16l-3 3"/></symbol>'
+ '<symbol id="il-f-rates" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/><path d="M19 5 5 19"/></symbol>'
+ '<symbol id="il-f-monsoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.5 12.5a4 4 0 0 1 .6-8 5.4 5.4 0 0 1 10.1 1.4 3.4 3.4 0 0 1-.7 6.6H6.5Z"/><path d="M8.5 16.5 7.5 20M12.5 16.5 11.5 20M16.5 16.5 15.5 20"/></symbol>'
+ '<symbol id="il-f-china" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="7" width="18" height="11" rx="1.6"/><path d="M8 7v11M13 7v11M18 7v11"/></symbol>'
+ '<symbol id="il-f-gst" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 3.5h14v17l-2.3-1.6-2.4 1.6-2.3-1.6-2.4 1.6L7.3 19 5 20.5Z"/><path d="M9 9h6M9 13h6"/></symbol>'
+ '<symbol id="il-f-ai" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/></symbol>'
+ '<symbol id="il-f-geo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.7 3.6 9S14.4 18.4 12 21c-2.4-2.6-3.6-5.7-3.6-9S9.6 5.6 12 3Z"/></symbol>'
+ '<symbol id="il-f-transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2 6.3 6.3M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8 6.3 17.7M17.7 6.3l2.1-2.1"/></symbol>'
+ '<symbol id="il-f-upi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="6" y="2.5" width="12" height="19" rx="2.4"/><path d="M9.5 8.5h5M12 8.5v7M9.5 15.5h5"/></symbol>'
+ '<symbol id="il-f-mfi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="8" cy="8" r="3.2"/><circle cx="16.5" cy="15.5" r="3.2"/><path d="M3 20a5 5 0 0 1 8-3.6"/></symbol>'
+ '<symbol id="il-f-fda" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2.8 4.5 6v6.2c0 4.4 3.2 7.9 7.5 9 4.3-1.1 7.5-4.6 7.5-9V6L12 2.8Z"/><path d="M9.5 12h5M12 9.5v5"/></symbol>'
+ '<symbol id="il-f-qcomm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2.5 5 13.5h5.5L10 21.5l8-11h-5.5Z"/></symbol>'
+ '<symbol id="il-f-psu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3.5 20.5h17M5 20.5V9.5M19 20.5V9.5M9 20.5v-6h6v6"/><path d="M2.5 9.5 12 3.5l9.5 6"/></symbol>'
+ '</defs></svg>';

/* live `sector` string -> symbol id. Every one of the 23 live sectors is here;
   a company with a null/blank sector falls back to the neutral services mark
   rather than rendering an empty tile. */
var SECTOR_ICON = {
  'Auto':'il-s-auto', 'Auto Components':'il-s-autocomp', 'Aviation':'il-s-aviation',
  'Banking':'il-s-bank', 'Capital Goods':'il-s-capgoods', 'Cement':'il-s-cement',
  'Chemicals':'il-s-chem', 'Conglomerate':'il-s-conglom', 'Consumer Durables':'il-s-durables',
  'Consumer Services':'il-s-services', 'FMCG':'il-s-fmcg', 'Financial Services':'il-s-finserv',
  'Healthcare':'il-s-health', 'IT Services':'il-s-it', 'Infra & Capital Goods':'il-s-infra',
  'Insurance':'il-s-insurance', 'Metals & Mining':'il-s-metal', 'Oil & Gas':'il-s-oil',
  'Pharma':'il-s-pharma', 'Power':'il-s-power', 'Realty':'il-s-realty',
  'Renewable Energy':'il-s-renew', 'Telecom':'il-s-telecom'
};
function sectorIconId(sector){ return SECTOR_ICON[sector] || 'il-s-services'; }
function forceIconId(id){ return 'il-f-' + id; }
