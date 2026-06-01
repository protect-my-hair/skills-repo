# Error Handling

> How backend errors should be handled in this repository.

---

## Scenario: API Error Envelope

### 1. Scope / Trigger

Route handlers now expose authenticated JSON APIs. User-facing errors must be
stable, permission-safe, and must not leak internal paths, stack traces, cookies,
tokens, database details, or account-state detail.

### 2. Signatures

- Error types: `src/lib/api-errors.ts`
- Route conversion helper: `errorResponse(error)` in `src/lib/http.ts`
- Known error class: `ApiError`

```typescript
type ApiErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict";
```

### 3. Contracts

Public JSON envelope:

```json
{
  "code": "validation",
  "error": "Skill name is required"
}
```

Unknown exceptions become:

```json
{
  "code": "internal",
  "error": "Request failed"
}
```

### 4. Validation & Error Matrix

| Error helper | HTTP status | Public code |
|---|---:|---|
| `validationError(message)` | 400 | `validation` |
| `unauthorizedError()` | 401 | `unauthorized` |
| `forbiddenError()` | 403 | `forbidden` |
| `notFoundError(resource)` | 404 | `not_found` |
| `conflictError(message)` | 409 | `conflict` |
| unknown exception | 500 | `internal` |

Use 404 instead of 403 when an employee targets a restricted Skill by id, so the
response does not disclose restricted resource existence.

### 5. Good/Base/Bad Cases

- Good: Route handlers wrap logic in `try/catch` and return
  `errorResponse(error)`.
- Base: Domain validation throws `validationError("Category is required")`.
- Bad: Returning `error.stack` or an internal filesystem path in JSON.

### 6. Tests Required

- `src/lib/api-errors.test.ts` must assert status, `code`, and public `error`.
- Authorization tests should assert the public message and status, not internal
  implementation details.
- Unknown-error tests must prove sensitive text is hidden.

### 7. Wrong vs Correct

#### Wrong

```typescript
return NextResponse.json({ error: String(error) }, { status: 500 });
```

#### Correct

```typescript
return errorResponse(error);
```

---

## General Rules

Backend code must:

- Handle errors explicitly instead of swallowing exceptions silently.
- Validate inputs at system boundaries, including user input, external API
  responses, file contents, and environment variables.
- Fail early when required configuration is missing.
- Return clear and friendly user-facing errors.
- Keep server-side diagnostic context in logs, not in user-facing messages.
- Avoid leaking internal paths, stack traces, credentials, tokens, cookies, or
  account-state details through error responses.
