# State Management

> State management rules for frontend work in this repository.

---

## Current Status

No global state library is used. The MVP keeps dashboard UI state in
`src/components/SkillsConsole.tsx` with React `useState`/`useMemo`.

---

## Adoption Rule

Continue to avoid global state libraries until the app has concrete repeated
state-sharing complexity.

This follows the project preference in `AGENTS.md`: keep implementations simple,
avoid unnecessary dependencies, and avoid speculative abstractions.

---

## State Categories

When frontend code exists, classify state before choosing a tool:

- Local UI state: keep near the component that owns it.
- Shared UI state: promote only when multiple distant consumers need it.
- Server state: use an explicit data-fetching/cache pattern when server
  synchronization is required.
- URL state: use when the state should be shareable, bookmarkable, or browser
  navigable.

Current examples:

- Local UI state: filters, selected Skill, editor mode, preview mode,
  dashboard current page, and admin selected ids.
- Server state: permission-aware `SkillsReadModel` fetched from `/api/skills`
  with session credentials.
- Derived state: filtered Skills and dashboard summary use `useMemo` and pure
  helpers from `src/lib/domain.ts`. Dashboard pagination derives page slices
  and visible page numbers through pure helpers in `src/lib/pagination.ts`.

Auth/session state is owned by Auth.js via `SessionProvider` and `useSession`.
Do not reintroduce local role switching as a source of truth.

---

## Common Mistakes To Avoid

- Adding a state library before repeated state-sharing complexity exists.
- Duplicating the same source of truth in local, global, and server caches.
- Hiding important workflow state in module-level mutable variables.
- Treating generated Trellis workflow state as a frontend app state pattern.
- Filtering restricted Skills or audit logs only in the browser. Visibility
  must come from the backend read model.
