# API Contracts

## Scenario: Session-Aware Skills Repo API

### 1. Scope / Trigger

The backend no longer uses the MVP `x-demo-role` header or returns an unfiltered
`SkillStoreSnapshot` to the frontend. Route handlers must resolve the current
Auth.js session actor, enforce RBAC server-side, and return a permission-aware
read model.

### 2. Signatures

Route handlers live under `src/app/api/`:

- `GET /api/skills`
- `POST /api/skills`
- `POST /api/skills/import`
- `PATCH /api/skills/[skillId]`
- `POST /api/skills/[skillId]/transition`
- `POST /api/skills/bulk`
- `POST /api/tracked-versions`
- `GET|POST /api/auth/[...nextauth]`

Dynamic route params are awaited because current Next.js App Router route
handler params are a Promise.

### 3. Contracts

All Skills API calls require a valid session. The current actor comes from
`getActorFromSession()` in `src/lib/http.ts`.

Successful read/mutation responses return `SkillsReadModel`:

```typescript
interface SkillsReadModel {
  currentUser: Actor;
  capabilities: { canManageSkills: boolean };
  skills: Skill[];
  trackedVersions: TrackedVersion[];
  auditLogs: AuditLog[];
  summary: SkillSummary;
}
```

Admin mutation responses may also include `selectedSkillId`.

RBAC:

- `admin`: receives full governance data and may create/import/edit/transition
  Skills, bulk update Skills, and read audit logs.
- `employee`: receives only `published` and `deprecated` Skills, personal
  tracked-version state, no audit logs, and no admin mutation capability.

Auth.js:

- Internal credential provider is a bootstrap provider only.
- `SKILLS_REPO_ENABLE_INTERNAL_AUTH=false` disables it.
- In production, the internal provider requires explicit
  `SKILLS_REPO_ENABLE_INTERNAL_AUTH=true`.
- `AUTH_SECRET` is required at runtime and must come from the environment.

### 4. Validation & Error Matrix

API errors use:

```json
{ "code": "unauthorized", "error": "Authentication required" }
```

| Condition | Response |
|---|---|
| Missing/invalid session | `401 { code: "unauthorized", error: "Authentication required" }` |
| Non-admin calls admin mutation | `403 { code: "forbidden", error: "Permission denied" }` |
| Missing required text/list field | `400 { code: "validation", error: "<Field> is required" }` |
| Unknown Skill id | `404 { code: "not_found", error: "Skill not found" }` |
| Employee reads/tracks restricted Skill | `404 { code: "not_found", error: "Skill not found" }` |
| Git import outside `https://git.company.local/` | `400 { code: "validation", error: "Only controlled internal Git repositories are supported" }` |
| Unknown error | `500 { code: "internal", error: "Request failed" }` |

### 5. Good/Base/Bad Cases

- Good: Employee calls `GET /api/skills` and receives only visible Skills, only
  their own tracked versions, and an empty `auditLogs` array.
- Base: Admin publishes a draft via
  `POST /api/skills/[skillId]/transition` with
  `{ "status": "published", "versionId": "<version-id>" }`.
- Bad: Frontend sends `x-demo-role: admin` and expects the API to trust it.

### 6. Tests Required

- `src/lib/session-actor.test.ts`: invalid session users are rejected.
- `src/lib/read-model.test.ts`: employee/admin read models are filtered
  correctly.
- `src/lib/api-errors.test.ts`: status codes and public error envelopes remain
  stable.
- `src/lib/skill-service.test.ts`: admin-only mutations, controlled Git import,
  tracking, version transitions, and audit-log creation.
- Browser/API smoke: unauthenticated `GET /api/skills` returns 401; admin and
  employee credential sessions receive different read models.

### 7. Wrong vs Correct

#### Wrong

```typescript
const actor = actorFromHeader(request.headers.get("x-demo-role"));
return NextResponse.json(await readStore());
```

#### Correct

```typescript
const actor = await getActorFromSession();
return NextResponse.json(
  buildSkillsReadModel(await readSkillsSnapshot(), actor),
);
```
