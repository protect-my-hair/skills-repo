# Quality Guidelines

> Backend maintainability and verification standards for this repository.

---

## Current Baseline

There is no backend application code yet. Backend quality rules therefore come
from `AGENTS.md` and should be made more specific when real backend source
exists.

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

No backend test runner exists yet. When backend code is introduced:

- Add tests for new features and high-risk changes before or alongside the
  implementation.
- Cover behavior at the level supported by the selected stack: unit tests for
  pure logic, integration tests for persistence or external boundaries, and
  workflow tests for critical user paths.
- Run the smallest relevant test set before completion.
- If tests cannot run because the project has no test system yet, document that
  limitation in the task result and update the spec once testing is added.

---

## Code Review Checklist

Reviewers should check:

- The change matches the task PRD and does not add unrelated capabilities.
- Inputs are validated at boundaries.
- Errors are handled explicitly and safely.
- Sensitive data is not logged or exposed.
- Dependencies are justified.
- Tests or a clear verification note cover the changed behavior.
