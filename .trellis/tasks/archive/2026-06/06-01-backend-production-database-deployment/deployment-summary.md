# Database deployment summary

Date: 2026-06-01

## Result

PostgreSQL deployment verification passed with secrets supplied through interactive temporary environment variables.

No real `DATABASE_URL` or `AUTH_SECRET` values were written to task documents or logs.

## Commands verified

* `npm run prisma:generate` passed.
* `npm run prisma:deploy` passed and reported no pending migrations.
* `npx prisma db seed` passed and loaded the demo seed dataset.
* `npm run prisma:smoke` passed.

## Evidence

See `deployment-run.log` for redacted command output.

Key redacted evidence:

* Migration: one migration found, no pending migrations to apply.
* Pre-seed counts: users=6, skills=5, skillVersions=6, trackedVersions=2, auditLogs=1, gitImportSources=0, gitImportJobs=0.
* Seed: demo data loaded with users=6, skills=5, trackedVersions=2, auditLogs=1.
* Smoke: transient database workflow verification passed with users=6, skills=7, skillVersions=9, trackedVersions=2, auditLogs=8, gitImportSources=1, gitImportJobs=1.

## Scope Covered

The database smoke verified:

* PostgreSQL read/write path through `DATABASE_URL`.
* Prisma production migration deploy.
* Demo seed/bootstrap data initialization.
* Unique constraints for tracked versions, skill versions, and Git import sources.
* Stable conflict and internal error shapes.
* create / import / edit / transition / bulk / track consistency on the database path.

The smoke script restores the seed baseline after transient workflow writes.
