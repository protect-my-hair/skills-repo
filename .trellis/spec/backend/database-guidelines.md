# Database Guidelines

> Persistence and database rules for this repository.

---

## Current Status

The first MVP uses explicit local JSON persistence for demo/runtime state. This
is not a production database decision.

Evidence:

- `src/lib/store.ts` reads and writes `data/skills-store.json`.
- `src/lib/seed-data.ts` seeds the store when the JSON file is missing.
- `data/skills-store.json` is ignored by git and can be deleted to reset the
  demo state.

---

## Introducing Persistence

Do not introduce a production database, ORM, migration system, or persistent
storage schema without an explicit task requirement. The task must document:

- The selected storage technology.
- Where schema and migration files live.
- How migrations are created and run.
- How connection configuration is provided.
- How tests exercise persistence behavior.

For the current MVP, route handlers must call `readStore()` / `updateStore()`
instead of reading or writing JSON files directly.

---

## Query Safety

When database queries are introduced, follow the security requirements from
`AGENTS.md`:

- Use parameterized queries or the selected ORM's safe query API.
- Validate data at system boundaries before persistence.
- Do not concatenate untrusted input into SQL or query strings.
- Do not log credentials, tokens, cookies, raw secrets, or sensitive user data.

---

## Migrations

No migration convention exists yet. A task that adds migrations must define the
creation command, review expectations, rollback strategy, and test or smoke
check that proves migrations run.

---

## Forbidden Patterns

- Hardcoding database credentials in source, tests, docs, logs, or snapshots.
- Creating additional ad hoc JSON persistence files. The only allowed MVP store
  is `data/skills-store.json` through `src/lib/store.ts`.
- Adding schema-like constants in multiple places before a canonical persistence
  boundary exists.
