# Type Safety

> Type and validation expectations for frontend work.

---

## Current Status

TypeScript is configured in `tsconfig.json`. Shared domain contracts live in
`src/lib/domain.ts`.

---

## Project-Wide Rules

When frontend code is introduced, follow the project-wide rules from
`AGENTS.md`:

- Types, interfaces, and components use `PascalCase`.
- Variables and functions use `camelCase`.
- Boundary inputs are not trusted by default.
- Use the project's existing schema validation approach if one exists.
- If no validation library exists, use the simplest reliable native validation
  until a task justifies a library.

---

## Runtime Validation

Validate data at system boundaries, especially user input, API responses, file
contents, and environment variables. Do not rely only on compile-time types for
data that crosses a runtime boundary.

No validation library has been selected. MVP boundary validation is native and
lives in `src/lib/skill-service.ts`.

---

## Forbidden Patterns

- Treating external API responses as trusted application data.
- Using broad type assertions to hide uncertainty instead of validating it.
- Hardcoding secret values in types, examples, tests, or snapshots.
- Creating shared type files before there is a real cross-module contract.

## Current Contract Examples

- `Skill`, `SkillVersion`, `TrackedVersion`, and `AuditLog` are shared between
  the API and UI via `src/lib/domain.ts`.
- `SkillDraftInput`, `GitImportInput`, and `UpdateSkillInput` are mutation
  inputs in `src/lib/skill-service.ts`.
- `SkillsReadModel` in `src/lib/read-model.ts` is the frontend API response
  contract for `/api/skills` and mutation refresh responses.
- API error responses include `{ code, error }`; the UI may display `error`,
  but backend tests own the stable `code` contract.
