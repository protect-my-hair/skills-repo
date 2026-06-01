# Backend Development Guidelines

> Project-specific backend guidance for this repository.

---

## Current Scope

This repository now contains a self-contained Next.js production backend
foundation for the Skills Repo console.

The product backend boundary is:

- `src/app/api/**` for App Router route handlers.
- `src/auth.ts` and `src/app/api/auth/[...nextauth]/route.ts` for Auth.js.
- `src/lib/http.ts`, `src/lib/session-actor.ts`, `src/lib/read-model.ts`,
  `src/lib/skill-service.ts`, and `src/lib/skill-repository.ts` for shared
  backend logic.
- `prisma/schema.prisma` and `prisma/migrations/` for PostgreSQL schema and
  migrations.

Generated Trellis runtime and platform adapter files are still workflow
infrastructure, not product backend examples.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Current backend layout and boundaries | Active |
| [Database Guidelines](./database-guidelines.md) | Prisma/PostgreSQL persistence and migration rules | Active |
| [Error Handling](./error-handling.md) | API error envelope and safe failure behavior | Active |
| [Quality Guidelines](./quality-guidelines.md) | Maintainability, dependency, and testing expectations | Active |
| [Logging Guidelines](./logging-guidelines.md) | Logging and sensitive-data boundaries | Baseline established |
| [API Contracts](./api-contracts.md) | Session-aware Skills API route contracts | Active |

---

## How To Use These Specs

Before writing backend code, read this index plus the topic file that matches
the task. If a task introduces the first backend runtime, update these specs in
the same task with real file paths, examples, test commands, and any selected
framework conventions.

Do not leave new backend conventions only in chat. Persist them here when they
should guide future AI sessions.
