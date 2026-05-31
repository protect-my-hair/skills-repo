# Local Context And Prior Art

## Repository Facts

- The current app is a Next.js / React single-page management console.
- `src/app/page.tsx` renders `SkillsConsole` directly.
- `src/components/SkillsConsole.tsx` contains the primary UI and interaction state for role switching, filtering, grid/table views, admin bulk actions, detail panel, editor modal, markdown preview, version diff, and audit log display.
- `src/app/globals.css` contains the current visual system: dark command-center theme, green/blue/amber status palette, responsive breakpoints, cards, table, detail panel, and editor modal styles.
- `package.json` exposes `dev`, `build`, `lint`, `test`, and `typecheck` scripts.
- Existing root screenshots named `qa-*.png` suggest previous visual QA already covered home, mobile, card redesign, and header variants.

## Prior Art From Earlier Skills Platform Research

- The closest reference product pattern is a unified skills dashboard: search, filters, statistics, grid/table switching, detail pages, editor/preview flows, and bulk operations.
- For an enterprise skills repository, visual design should communicate governance and trust, not just local file management.
- Useful concepts to preserve in the UI: skill cards, clear state labels, admin operations, version tracking, markdown preview, audit visibility, source/repository metadata, and upgrade status.
- Product boundaries that should remain visible: employees discover/install/track skills, while admins publish/unpublish/import/edit/audit skills.

## Constraints For This Task

- Treat this as frontend polish unless the PRD explicitly expands scope into API or data-model changes.
- Preserve existing behavior and demo data semantics while improving hierarchy, readability, responsiveness, and perceived quality.
- Avoid new dependencies unless a later design decision makes one clearly worthwhile.
- The current frontend Trellis spec still says no frontend app existed at bootstrap time, so if implementation changes establish conventions, Phase 3 should update the frontend spec.
