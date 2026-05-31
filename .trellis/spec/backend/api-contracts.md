# API Contracts

## Scenario: Internal Skills MVP API

### 1. Scope / Trigger

The Internal Skills MVP introduced Next.js App Router API routes for a
cross-layer dashboard. These contracts must stay aligned with the frontend,
domain tests, and local JSON store.

### 2. Signatures

Route handlers live under `src/app/api/`:

* `GET /api/skills`
* `POST /api/skills`
* `POST /api/skills/import`
* `PATCH /api/skills/[skillId]`
* `POST /api/skills/[skillId]/transition`
* `POST /api/skills/bulk`
* `POST /api/tracked-versions`

Dynamic route params are awaited because Next.js 16 route handler params are a
Promise.

### 3. Contracts

All successful route responses return the full `SkillStoreSnapshot`:

* `skills: Skill[]`
* `trackedVersions: TrackedVersion[]`
* `auditLogs: AuditLog[]`

Create/import responses may also include `selectedSkillId`.

Admin routes use the demo header `x-demo-role: admin`. Missing or non-admin
headers are treated as employee requests.

### 4. Validation & Error Matrix

| Condition | Response |
|---|---|
| Non-admin calls admin mutation | `403 { "error": "Admin role required" }` |
| Missing required text/list field | `400 { "error": "<Field> is required" }` |
| Unknown Skill id | `400 { "error": "Skill not found" }` |
| Git import outside `https://git.company.local/` | `400 { "error": "Only controlled internal Git repositories are supported" }` |
| Store shape is invalid | `400 { "error": "Skill store is corrupted" }` |

### 5. Good/Base/Bad Cases

Good: Admin publishes a draft via
`POST /api/skills/[skillId]/transition` with `{ "status": "published",
"versionId": "<version-id>" }`.

Base: Employee calls `GET /api/skills` and receives the same store snapshot;
the UI decides which statuses to display.

Bad: Employee calls a transition route and receives a 403 without mutating the
store.

### 6. Tests Required

Domain/service tests must cover:

* filtering and version-state calculation;
* dashboard summary counts;
* admin authorization failure;
* publish transition preserving version history;
* manual draft creation;
* controlled Git import;
* edit creating a new draft/pending-review version;
* bulk status/category operations.

### 7. Wrong vs Correct

#### Wrong

```typescript
// Reads and writes local files directly inside route handlers.
await writeFile("data/skills-store.json", JSON.stringify(next));
```

#### Correct

```typescript
const snapshot = await updateStore((current) => ({
  ...current,
  skills: nextSkills,
}));
```
