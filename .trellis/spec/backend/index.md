# Backend Development Guidelines

> Project-specific backend guidance for this repository.

---

## Current Scope

This repository currently contains Trellis workflow files and platform
integration files, but no application backend source code, package manifest,
API server, database schema, migrations, or tests.

Do not infer backend application conventions from generated Trellis runtime or
platform adapter files. Those files describe the AI workflow, not the product
backend.

Evidence:

- `AGENTS.md` defines the project entry point for AI assistants.
- `.trellis/tasks/00-bootstrap-guidelines/prd.md` defines this bootstrap task.
- Repository inventory on 2026-05-30 found no backend application source files.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Current backend layout and boundaries | Baseline established |
| [Database Guidelines](./database-guidelines.md) | Current persistence status and rules for introducing storage | Baseline established |
| [Error Handling](./error-handling.md) | Error handling rules inherited from project instructions | Baseline established |
| [Quality Guidelines](./quality-guidelines.md) | Maintainability, dependency, and testing expectations | Baseline established |
| [Logging Guidelines](./logging-guidelines.md) | Logging and sensitive-data boundaries | Baseline established |
| [API Contracts](./api-contracts.md) | Current Skills MVP API route contracts | Active |

---

## How To Use These Specs

Before writing backend code, read this index plus the topic file that matches
the task. If a task introduces the first backend runtime, update these specs in
the same task with real file paths, examples, test commands, and any selected
framework conventions.

Do not leave new backend conventions only in chat. Persist them here when they
should guide future AI sessions.
