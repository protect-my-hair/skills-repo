# Directory Structure

> Backend layout and ownership rules for this repository.

---

## Current Layout

The application backend is provided by Next.js App Router route handlers under
`src/app/api/`. The current product backend boundary is:

```text
src/app/api/
src/lib/domain.ts
src/lib/skill-service.ts
src/lib/store.ts
src/lib/http.ts
data/skills-store.json   # generated local MVP data, ignored by git
```

Trellis and platform integration directories remain workflow infrastructure,
not application backend examples.

Evidence:

- `AGENTS.md` states that Trellis knowledge lives under `.trellis/`.
- `.trellis/workflow.md` defines the AI development workflow.
- Internal Skills MVP introduced `src/app/api/skills/**/route.ts` route
  handlers and service logic under `src/lib/`.

---

## Backend Boundary

Do not add backend files directly at the project root. Route handlers live under
`src/app/api/`; reusable domain and mutation logic lives under `src/lib/`.

Generated Trellis files under `.trellis/scripts/` may contain Python runtime
code, but they are Trellis infrastructure. Do not copy their structure as the
application backend architecture.

---

## Naming Conventions

Use the project-wide naming rules from `AGENTS.md` when backend code is added:

- Functions and variables: `camelCase`.
- Types, interfaces, classes, and components: `PascalCase`.
- Constants with business meaning: `UPPER_SNAKE_CASE`.
- Boolean values should prefer prefixes such as `is`, `has`, `should`, or
  `can`.

---

## Current Backend File Examples

- `src/app/api/skills/route.ts` lists Skills and creates manual drafts.
- `src/app/api/skills/[skillId]/transition/route.ts` performs status changes.
- `src/lib/skill-service.ts` owns admin validation, state transitions, and
  audit-log creation.
- `src/lib/store.ts` owns MVP local JSON persistence.

Forbidden locations: do not place product backend logic under `.trellis/`,
`.agents/`, `.codex/`, `.claude/`, or `.cursor/`.
