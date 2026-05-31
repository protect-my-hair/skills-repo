# Frontend Development Guidelines

> Project-specific frontend guidance for this repository.

---

## Current Scope

This repository now contains a Next.js App Router frontend for the internal
Skills Repo management console. The product frontend boundary is:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/`
- `src/lib/`

Do not infer frontend product conventions from generated Trellis platform files
under `.claude/`, `.codex/`, `.cursor/`, or `.agents/`.

Evidence:

- `src/app/page.tsx` renders the root Skills console.
- `src/components/SkillsConsole.tsx` owns the MVP dashboard interaction.
- `src/app/globals.css` owns the current global visual system.
- `package.json` defines the Next.js, React, TypeScript, Vitest, ESLint, and
  build scripts.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Current frontend layout and boundaries | Baseline established |
| [Component Guidelines](./component-guidelines.md) | Component rules before a framework exists | Baseline established |
| [Hook Guidelines](./hook-guidelines.md) | Hook and data-fetching boundaries | Baseline established |
| [State Management](./state-management.md) | State library status and adoption rules | Baseline established |
| [Quality Guidelines](./quality-guidelines.md) | Maintainability, testing, and review expectations | Baseline established |
| [Type Safety](./type-safety.md) | Type and runtime-validation expectations | Baseline established |

---

## How To Use These Specs

Before writing frontend code, read this index plus the topic file that matches
the task. If a task changes frontend architecture, styling conventions, or
verification strategy, update the relevant spec file in the same task with real
file paths, examples, commands, and selected framework conventions.
