# Prisma production migration notes

Date: 2026-06-01

Source: Context7 query against `/websites/prisma_io`, covering Prisma production migration deployment, PostgreSQL, generated client, and CI/CD safety.

## Current documentation takeaways

* Production database changes should use committed migrations and `npx prisma migrate deploy`.
* `prisma migrate dev` is for development migration creation/application and can be interactive; it should not be used against production data.
* `prisma db push` is not the production migration path because it bypasses the migration history workflow and can be destructive in some flows.
* CI/CD examples inject `DATABASE_URL` from secrets when running `npx prisma migrate deploy`.
* Prisma docs recommend ensuring `prisma generate` runs before build/typecheck when deployment environments do not preserve generated client output.
* Seeding is a separate step after setting `DATABASE_URL` and generating Prisma client; only run it when the environment's data initialization policy calls for it.

## Repo mapping

* Current development script: `npm run prisma:migrate` -> `prisma migrate dev`.
* Production deployment should add or run an explicit deploy command, for example `npx prisma migrate deploy`, with `DATABASE_URL` supplied by the environment.
* Current schema already targets PostgreSQL and has one committed initial migration under `prisma/migrations/20260601011500_init/`.
* Current generated client output lives under `src/generated/prisma/`; deployment verification should include `npm run prisma:generate`.

## Source links

* https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
* https://www.prisma.io/docs/orm/more/best-practices
* https://www.prisma.io/docs/orm/more/troubleshooting/nextjs
* https://www.prisma.io/docs/guides/integrations/github-actions
