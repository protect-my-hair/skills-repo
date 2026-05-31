# Hook Guidelines

> Hook and data-fetching boundaries for frontend work.

---

## Current Status

No frontend framework or hook system exists in this repository. There are no
custom hooks, data-fetching hooks, or hook tests.

---

## Introducing Hooks

Only introduce hooks after a frontend framework that supports them has been
selected. The task that introduces hooks must update this file with:

- The naming convention.
- Where hooks live.
- How hooks separate data access, UI state, and side effects.
- How hook behavior is tested.

---

## Naming

If React or a compatible framework is selected, hook names should use the
framework's conventional `use*` prefix. Until then, do not create `use*` helpers
that are not actual hooks.

Project-wide naming still follows `AGENTS.md`: functions and variables use
`camelCase`, while types and interfaces use `PascalCase`.

---

## Data Fetching

No data-fetching library has been selected. Do not add a data-fetching or cache
library by default. Choose one only when the task requires server state,
caching, invalidation, retries, or synchronization behavior that local code
cannot handle cleanly.

Update this file with concrete examples once the first data-fetching pattern
exists.
