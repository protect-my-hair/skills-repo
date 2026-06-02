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
| UI-created/edited category outside the system category directory | `400 { code: "validation", error: "Category must be selected from the system directory" }` |
| Unsafe, duplicate, or empty `references` / `scripts` file | `400 { code: "validation", error: "<group> ... " }` |
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

## Scenario: Skill Package Download API

### 1. Scope / Trigger

The Skill install-actions MVP adds a controlled package download API for
employees and admins who can read an installable Skill. This is a cross-layer
contract because the frontend renders install actions, the API enforces session
and RBAC, and the backend generates a zip package from the current Skill
version.

### 2. Signatures

Route handler:

- `GET /api/skills/[skillId]/package`
- File: `src/app/api/skills/[skillId]/package/route.ts`
- Dynamic route params are awaited:

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ skillId: string }> },
) {
  const { skillId } = await params;
}
```

Shared helpers:

- `getSkillInstallAvailability(skill)` in `src/lib/skill-install.ts`
- `createSkillPackageDescriptor(skill)` in `src/lib/skill-package.ts`
- `createSkillPackageArchive(skill)` in `src/lib/skill-package.ts`

### 3. Contracts

Successful response:

- HTTP `200`
- `Content-Type: application/zip`
- `Content-Disposition: attachment; filename="<skill-id>-<version>.zip"`
- `Cache-Control: no-store`
- Body is a zip archive generated in memory from the current published version.

Package contents:

- Required: `SKILL.md`
- Optional: `references/<path>` and `scripts/<path>` text files from the
  current version snapshot when authors provided valid resource files.
- `SKILL.md` must be generated from `SkillVersion.content` plus safe Skill
  metadata such as name, description, version, category, team, and compatible
  tools.
- `README.md` and `metadata.json` are not default MVP package contents. If a
  future task needs package-level metadata or instructions, add a separate
  product contract instead of silently reintroducing these files.
- Resource file paths must be safe relative paths inside their package group:
  no absolute paths, Windows drive prefixes, `..`, empty segments, control
  characters, top-level `references/` or `scripts/` prefixes, or duplicate
  case-insensitive paths within the same group.
- Resource file contents are text-only for MVP. Empty files and binary
  attachments are out of scope.

Installability:

- `skill.status === "published"`
- `skill.currentVersionId` resolves to an existing version
- Caller must pass `canReadSkill(actor, skill)`

### 4. Validation & Error Matrix

| Condition | Response |
|---|---|
| Missing/invalid session | `401 { code: "unauthorized", error: "Authentication required" }` |
| Unknown Skill id | `404 { code: "not_found", error: "Skill not found" }` |
| Employee targets restricted Skill | `404 { code: "not_found", error: "Skill not found" }` |
| Skill is not `published` | `400 { code: "validation", error: "Only published Skills can be installed" }` |
| Skill has no current published version | `400 { code: "validation", error: "No current published version is available" }` |
| Unknown zip generation failure | `500 { code: "internal", error: "Request failed" }` |

### 5. Good/Base/Bad Cases

- Good: Employee downloads a public published Skill and receives
  `rag-helper-1.2.0.zip` containing `SKILL.md`.
- Base: Admin targets a draft Skill and receives a validation error rather than
  draft content.
- Bad: Route handler trusts a frontend flag, bypasses `canReadSkill`, or
  returns a JSON snapshot instead of a zip attachment.

### 6. Tests Required

- `src/lib/skill-package.test.ts`: package file name, `SKILL.md`, optional
  `references/` / `scripts/` files, absence of default `README.md` /
  `metadata.json`, installability, and generated install commands.
- `src/app/api/skills/[skillId]/package/route.test.ts`: route source contract
  for session resolution, `canReadSkill`, awaited params, safe 404, zip
  response headers, and `createSkillPackageArchive`.
- API smoke should cover unauthenticated 401 and an authenticated employee
  download when local credentials are available.

### 7. Wrong vs Correct

#### Wrong

```typescript
const skill = snapshot.skills.find((item) => item.id === skillId);
return Response.json(skill);
```

#### Correct

```typescript
const actor = await getActorFromSession();
const skill = snapshot.skills.find((item) => item.id === skillId);

if (!skill || !canReadSkill(actor, skill)) {
  throw notFoundError("Skill");
}

const archive = await createSkillPackageArchive(skill);
return new Response(new Uint8Array(archive.buffer), {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${archive.fileName}"`,
  },
});
```
