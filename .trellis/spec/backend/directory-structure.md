# Directory Structure

> Backend layout and ownership rules for this repository.

---

## Current Layout

The application backend is provided by Next.js App Router route handlers,
Auth.js, shared service modules, and Prisma schema/migrations. The current
product backend boundary is:

```text
src/app/api/auth/[...nextauth]/route.ts
src/app/api/skills/**/route.ts
src/app/api/tracked-versions/route.ts
src/auth.ts
src/lib/domain.ts
src/lib/api-errors.ts
src/lib/auth-config.ts
src/lib/http.ts
src/lib/internal-users.ts
src/lib/prisma.ts
src/lib/prisma-mappers.ts
src/lib/read-model.ts
src/lib/session-actor.ts
src/lib/skill-repository.ts
src/lib/skill-service.ts
src/lib/store.ts
prisma/schema.prisma
prisma/migrations/
data/skills-store.json   # generated local MVP data, ignored by git
```

Trellis and platform integration directories remain workflow infrastructure,
not application backend examples.

Evidence:

- `AGENTS.md` states that Trellis knowledge lives under `.trellis/`.
- `.trellis/workflow.md` defines the AI development workflow.
- Production backend foundation introduced Auth.js, Prisma/PostgreSQL schema,
  session-aware route handlers, permission-aware read models, and repository
  fallback from Prisma to the local JSON store when `DATABASE_URL` is absent.

---

## Backend Boundary

Do not add backend files directly at the project root. Route handlers live under
`src/app/api/`; reusable domain, auth/session, repository, read-model, error,
and mutation logic lives under `src/lib/`; database schema and migration files
live under `prisma/`.

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
- `src/app/api/auth/[...nextauth]/route.ts` delegates Auth.js handlers.
- `src/lib/http.ts` resolves the current session actor and converts API
  exceptions to JSON responses.
- `src/lib/read-model.ts` builds permission-aware API responses.
- `src/lib/skill-repository.ts` reads/writes either Prisma/PostgreSQL or the
  local JSON fallback.
- `src/lib/skill-service.ts` owns admin validation, state transitions, and
  audit-log creation.
- `src/lib/store.ts` owns MVP local JSON persistence.

Forbidden locations: do not place product backend logic under `.trellis/`,
`.agents/`, `.codex/`, `.claude/`, or `.cursor/`.
