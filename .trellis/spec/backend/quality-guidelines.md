# Quality Guidelines

> Backend maintainability and verification standards for this repository.

---

## Current Baseline

Backend code now exists in `src/app/api/`, `src/auth.ts`, `src/lib/`, and
`prisma/`. Quality rules apply to Auth.js session handling, route handlers,
read models, service logic, repository mapping, Prisma schema/migrations, and
the local JSON fallback.

---

## Required Patterns

Backend work should follow these project-wide rules:

- Prefer native APIs and avoid unnecessary dependencies.
- Keep implementations simple, clear, and maintainable.
- Avoid speculative abstractions and future-only features.
- Extract shared helpers only when duplication is real and already creating
  maintenance cost.
- Prefer immutable data patterns unless the existing code or performance
  requirement clearly calls for mutation.
- Use early returns when logic begins to nest deeply.
- Extract named constants for thresholds, limits, delays, and other meaningful
  values.
- Keep functions focused; split long functions by responsibility.

---

## Forbidden Patterns

- Adding a framework, ORM, queue, cache, or service layer without a task-backed
  requirement.
- Hardcoding secrets or credentials.
- Silently swallowing errors.
- Trusting external input without boundary validation.
- Returning internal paths, stack traces, or sensitive account-state details to
  users.
- Introducing shared utilities before there is a demonstrated repeated pattern.

---

## Testing Requirements

The backend uses Vitest for pure logic and contract tests. Current required
coverage includes:

- Auth/session actor parsing.
- Internal auth configuration defaults.
- API error envelopes.
- Permission-aware read models.
- Service behavior for create/import/edit/transition/bulk/track workflows.
- Prisma enum mapper round trips.

For future backend changes:

- Add tests for new features and high-risk changes before implementation.
- Cover behavior at the level supported by the stack: unit tests for pure
  logic, integration tests for persistence or external boundaries, and workflow
  tests for critical user paths.
- Run the smallest relevant test set before completion.
- Run `npm run lint`, `npm run test`, `npm run typecheck`, and `npm run build`
  before claiming the backend is complete.
- When a PostgreSQL test database exists, add migration and repository smoke
  tests for `src/lib/skill-repository.ts`.

---

## Code Review Checklist

Reviewers should check:

- The change matches the task PRD and does not add unrelated capabilities.
- Inputs are validated at boundaries.
- Errors are handled explicitly and safely.
- Sensitive data is not logged or exposed.
- Dependencies are justified.
- Tests or a clear verification note cover the changed behavior.
