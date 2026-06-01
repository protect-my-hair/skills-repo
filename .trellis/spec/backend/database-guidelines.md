# Database Guidelines

> Persistence and database rules for this repository.

---

## Scenario: Skills Repo Production Persistence

### 1. Scope / Trigger

The backend now has a production persistence boundary. Use Prisma +
PostgreSQL for production storage, while keeping the local JSON store only as a
development fallback when `DATABASE_URL` is absent.

### 2. Signatures

- Schema: `prisma/schema.prisma`
- Prisma CLI config: `prisma.config.ts`
- Migrations: `prisma/migrations/`
- Seed script: `prisma/seed.ts`
- Database counts script: `prisma/counts.ts`
- Database smoke script: `prisma/smoke.ts`
- Client factory: `src/lib/prisma.ts`
- Repository boundary: `src/lib/skill-repository.ts`
- Generate command: `npm run prisma:generate`
- Migration command: `npm run prisma:migrate -- --name <migration-name>`
- Production migration command: `npm run prisma:deploy`
- Demo seed command: `npx prisma db seed` or `npm run prisma:seed-demo`
- Database smoke command: `npm run prisma:smoke`

`prisma/schema.prisma` uses the Prisma v7 client generator:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### 3. Contracts

Environment keys:

- `DATABASE_URL`: enables Prisma/PostgreSQL persistence. When absent, route
  handlers fall back to `data/skills-store.json` through `src/lib/store.ts`.
- `AUTH_SECRET`: required by Auth.js at runtime. Do not commit real values.
- `SKILLS_REPO_ENABLE_INTERNAL_AUTH`: enables the internal credential provider
  when `true`; in production, absence means disabled.

Production or production-like database verification must inject `DATABASE_URL`
and `AUTH_SECRET` through the shell/session environment. Do not write real
values to `.env.local`, Trellis task docs, logs, tests, snapshots, or examples.

Persisted domain models:

- `User`, `Account`, `Session`, `VerificationToken`
- `Skill`, `SkillVersion`, `TrackedVersion`
- `AuditLog`
- `GitImportSource`, `GitImportJob`

Generated Prisma client output under `src/generated/prisma/` is ignored by git.
Run `npm run prisma:generate` before type-checking if the schema changed.
Prisma v7 CLI datasource wiring lives in `prisma.config.ts`, not in
`prisma/schema.prisma`. Keep `schema.prisma` on `provider = "postgresql"` only,
and configure the CLI URL through `process.env.DATABASE_URL ?? <valid URL
placeholder>`. The placeholder must not contain credentials and should not point
at a real database; it exists only so local `prisma generate` / `npm run
typecheck` can parse the schema in shells that are not connected to a real
database.

### 4. Validation & Error Matrix

| Condition | Behavior |
|---|---|
| `DATABASE_URL` absent | Use local JSON fallback only |
| `DATABASE_URL` present but invalid | Prisma operations fail; do not hide the deployment issue |
| Missing `AUTH_SECRET` at auth runtime | Auth.js rejects the request; configure the secret instead of hardcoding one |
| Duplicate user email / repository URL / tracked user+skill | Database unique constraint protects the invariant |
| Version duplicated within a Skill | `SkillVersion_skillId_version_key` protects the invariant |
| Prisma `P1000` during deploy | Database authentication failed; fix credentials without logging them |
| Prisma `P1013` during deploy | `DATABASE_URL` is malformed; check scheme and URL-escape special characters |

### 5. Good/Base/Bad Cases

- Good: Add a new model in `prisma/schema.prisma`, create a migration under
  `prisma/migrations/`, update repository mapping tests, then run generate and
  type-check.
- Good: Keep Prisma CLI-only concerns in `prisma.config.ts`, and use
  `npx prisma db seed` to run `prisma/seed.ts` against a real `DATABASE_URL`.
- Good: Use `npm run prisma:deploy` for non-interactive production migration
  application, then run `npm run prisma:smoke` for database-path verification.
- Base: Local development without `DATABASE_URL` continues to use
  `data/skills-store.json` and the same service/read-model layer.
- Bad: Route handlers query Prisma directly and bypass
  `src/lib/skill-repository.ts`.
- Bad: Re-introduce `url = env("DATABASE_URL")` into `schema.prisma` on Prisma
  v7, or rely on ad hoc one-off seed scripts outside `prisma/`.
- Bad: Put a real production `DATABASE_URL` or `AUTH_SECRET` in a task doc,
  shell transcript, test fixture, or committed env file.

### 6. Tests Required

- Mapper tests for enum conversions in `src/lib/prisma-mappers.test.ts`.
- Service tests for persistence-facing domain outputs such as import jobs,
  tracked versions, and audit logs.
- `npm run typecheck` must run Prisma generate and prove generated types match
  repository code.
- `npx prisma db seed` should be able to populate the migrated database using
  the checked-in demo dataset when `DATABASE_URL` points at a writable local DB.
- `npm run prisma:deploy` should be used for production-like migration
  verification; do not use `prisma migrate dev` against production data.
- `npm run prisma:smoke` should verify PostgreSQL read/write, unique
  constraints, stable conflict/internal error shapes, and create/import/edit/
  transition/bulk/track consistency.
- When a PostgreSQL test database is available, add migration smoke coverage for
  `prisma/migrations/`.

### 7. Wrong vs Correct

#### Wrong

```typescript
// Route handler writes directly to a persistence implementation.
await prisma.skill.create({ data: input });
```

#### Correct

```typescript
const snapshot = await updateSkillsSnapshot((current) => ({
  ...current,
  skills: [nextSkill, ...current.skills],
}));
```

#### Wrong

```bash
DATABASE_URL=<real-production-url> npm run prisma:migrate
```

#### Correct

```bash
# Inject DATABASE_URL via the shell/session secret mechanism, then:
npm run prisma:deploy
npm run prisma:smoke
```

---

## Local JSON Fallback

`data/skills-store.json` is a local development fallback, not the production
database. It is ignored by git and can be deleted to reset demo state.

Do not create additional ad hoc JSON persistence files.

---

## Query Safety

When database queries are introduced or extended:

- Use Prisma's safe query API or parameterized queries.
- Validate data at system boundaries before persistence.
- Do not concatenate untrusted input into SQL or query strings.
- Do not log credentials, tokens, cookies, raw secrets, or sensitive user data.
