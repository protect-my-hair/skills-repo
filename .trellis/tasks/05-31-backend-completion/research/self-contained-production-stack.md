# Self-contained production backend stack research

## Context

User selected Direction 1: keep the production backend foundation inside the current Next.js application instead of adding a separate backend service.

This research used Context7 current documentation lookups for:

* Next.js App Router route handlers, cookies, authentication, and middleware.
* Auth.js with Next.js App Router, session management, logout, providers, and Prisma adapter.
* Prisma with Next.js, PostgreSQL, schema, migrations, transactions, and relations.

## Findings

### Next.js App Router

* Current Next.js documentation supports protecting route handlers by verifying session state and returning unauthorized responses.
* App Router route handlers can remain the application API boundary for this task.
* The production backend should move from demo headers to a session-aware data access layer used by route handlers.

### Auth.js

* Auth.js supports a Next.js setup that exports `auth`, `handlers`, `signIn`, and `signOut` from a central auth module.
* Auth.js has a Prisma adapter path, which aligns well with the production database requirement.
* Auth.js supports App Router client session usage via `SessionProvider` and `useSession`, which maps directly to replacing the current local role switch.
* Logout can be wired through Auth.js `signOut` rather than a no-op frontend button.

### Prisma

* Prisma supports relational schemas with PostgreSQL and model relations suitable for users, skills, skill versions, tracked versions, audit logs, and Git import jobs.
* Current Prisma v7-oriented documentation uses `provider = "prisma-client"` with an explicit output path and a PostgreSQL adapter import path ending in `/client`.
* Migration flow remains Prisma-driven, for example `prisma migrate dev --name <migration>`.
* A reusable Prisma client singleton remains the recommended Next.js pattern, but v7 generator/output details must be followed carefully during implementation.

## Recommended stack direction

Use a self-contained Next.js production backend with:

* Next.js App Router route handlers as the API layer.
* Auth.js for session/auth provider integration and logout.
* Prisma + PostgreSQL for schema, migrations, relational persistence, and auth adapter integration.
* Server-side RBAC helpers shared by route handlers.
* A typed API/read-model layer so the frontend no longer depends on full `SkillStoreSnapshot`.

## Remaining decision

Resolved: start with an internal credential/dev provider while preserving the Auth.js provider boundary for later SSO.

## Credentials provider note

Auth.js supports a Credentials provider for Next.js with an `authorize` callback and exported `signIn`, `signOut`, and `auth` helpers. Auth.js documentation also warns that credentials-based authentication is intentionally limited and password-based authentication carries security risks. For this task, treat Credentials as a development/internal bootstrap provider, not the long-term enterprise SSO decision.

Implementation implications:

* Use seeded internal users to prove session, logout, and RBAC behavior.
* Do not store plaintext passwords.
* Keep the provider boundary isolated so OAuth/OIDC/SSO can replace the bootstrap provider later.
* Avoid leaking credential validation detail in user-facing errors.
