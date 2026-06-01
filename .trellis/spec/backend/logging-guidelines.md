# Logging Guidelines

> Logging boundaries for backend work in this repository.

---

## Current Status

No backend logging library or structured log schema has been selected. The
backend currently relies on Next.js/Auth.js runtime logs plus explicit safe JSON
error responses.

---

## What To Log

When a backend runtime exists, logs should include enough context to diagnose
failures without exposing sensitive data. Useful context may include operation
name, non-sensitive identifiers, validation failure category, external service
name, and retry or fallback decisions.

Define concrete log fields after the first logger is introduced.

---

## What Not To Log

Never log:

- API keys, tokens, passwords, cookies, session secrets, or private keys.
- `AUTH_SECRET`, `DATABASE_URL`, OAuth/OIDC tokens, Auth.js cookies, session
  tokens, or credential provider inputs.
- Raw credentials or secret environment variable values.
- Sensitive user data unless the task explicitly defines a safe redaction
  policy.
- Full internal stack traces or filesystem paths in user-facing responses.

Do not place secrets in comments, tests, snapshots, or example output.

---

## Log Levels

No project-specific log levels exist yet. When a logging library is selected,
update this file with the project's concrete level meanings and examples.

Until then, keep logging decisions conservative:

- Use warnings for recoverable but suspicious conditions.
- Use errors for failed operations that need investigation.
- Avoid noisy debug logging unless it can be disabled and contains no secrets.

---

## Verification

Before completing backend work that adds logging or auth/database config:

- Search changed files for secret-like names and verify no sensitive value is
  printed.
- Keep missing-secret diagnostics in server logs only; user-facing API responses
  must use safe public messages from `src/lib/api-errors.ts`.
