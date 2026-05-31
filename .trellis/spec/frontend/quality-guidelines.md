# Quality Guidelines

> Frontend maintainability and verification standards for this repository.

---

## Current Baseline

The frontend is a Next.js 16 / React 19 / TypeScript app with Vitest and ESLint.

---

## Required Patterns

Frontend work should follow these project-wide rules:

- Prefer native APIs and avoid unnecessary dependencies.
- Keep implementations simple, clear, and maintainable.
- Avoid speculative abstractions and future-only features.
- Extract shared utilities or components only when duplication is real and
  already creating maintenance cost.
- Prefer immutable data patterns unless the existing code or performance
  requirement clearly calls for mutation.
- Avoid deep nesting by using clear boundaries and early returns.
- Extract named constants for meaningful thresholds, limits, delays, and
  dimensions.

---

## Forbidden Patterns

- Adding a frontend framework, state library, CSS framework, charting library,
  or data-fetching library without a task-backed requirement.
- Creating a landing page when the task asks for an actual usable app or tool.
- Hardcoding secrets, tokens, cookies, or private URLs.
- Rendering untrusted HTML or user content without the stack's appropriate
  escaping or sanitization.
- Letting user-facing errors expose internal paths, stack traces, secrets, or
  account-state details.

---

## Testing Requirements

No frontend test runner exists yet. When frontend code is introduced:

- Add tests for new features and high-risk behavior according to the selected
  stack.
- Cover important user flows with the narrowest reliable test type available.
- Include accessibility checks for interactive controls once a UI exists.
- Run the smallest relevant verification command before completion.
Current verification commands:

- `npm.cmd run test`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`

Keep pure domain behavior in `src/lib/*.test.ts` where possible before adding
heavier browser tests.

---

## Code Review Checklist

Reviewers should check:

- The UI matches the task PRD and avoids unrelated product scope.
- State ownership is clear and not duplicated.
- User input and API responses are validated at boundaries.
- Sensitive data is not logged or exposed.
- Dependencies are justified.
- Tests or verification notes cover the changed behavior.
