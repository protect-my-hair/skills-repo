# Directory Structure

> Frontend layout and ownership rules for this repository.

---

## Current Layout

The application frontend is a Next.js App Router app. The current product
frontend boundary is:

```text
src/app/layout.tsx
src/app/page.tsx
src/app/globals.css
src/components/
src/lib/
```

Trellis and platform integration directories remain workflow infrastructure,
not frontend product modules.

Evidence:

- `AGENTS.md` points agents to Trellis workflow knowledge.
- Internal Skills MVP introduced Next.js 16, React 19, TypeScript, Vitest, and
  ESLint.

---

## Frontend Boundary

Do not add components, styles, assets, or routes directly at the project root.
Use the `src/app/`, `src/components/`, and `src/lib/` boundaries.

Generated platform files under `.claude/`, `.codex/`, `.cursor/`, and
`.agents/` are not examples for frontend application structure.

---

## Naming Conventions

Use the project-wide naming rules from `AGENTS.md` when frontend code is added:

- Components, types, and interfaces: `PascalCase`.
- Functions, variables, hooks, and props: `camelCase`.
- Constants with business meaning: `UPPER_SNAKE_CASE`.
- Boolean props and variables should prefer prefixes such as `is`, `has`,
  `should`, or `can`.

---

## Current Frontend File Examples

- `src/app/page.tsx` renders the Skills console as the root route.
- `src/components/SkillsConsole.tsx` owns the MVP dashboard interaction.
- `src/app/globals.css` owns current global styling.
- `src/lib/domain.ts` contains shared frontend/backend domain helpers.

Forbidden locations: do not place product frontend logic under `.trellis/`,
`.agents/`, `.codex/`, `.claude/`, or `.cursor/`.
