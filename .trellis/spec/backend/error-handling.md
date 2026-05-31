# Error Handling

> How backend errors should be handled in this repository.

---

## Current Status

No backend runtime or API error model exists yet. There are no project-specific
application error classes, API response envelopes, or backend exception filters.

The current enforceable rules come from `AGENTS.md`.

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

---

## Error Types

No canonical application error types exist yet. When the first backend API or
service layer is added, define where reusable error types live and update this
file with examples.

Do not add a broad error abstraction before there is repeated behavior that
needs it.

---

## Error Handling Patterns

Prefer simple control flow:

- Validate early.
- Return early on invalid input or missing prerequisites.
- Keep nested error handling shallow.
- Add context at the boundary where an error can be understood.

Avoid catch blocks that only hide the problem or replace useful diagnostic
context with a vague message.

---

## API Error Responses

No API response format has been selected. A task that introduces public or
internal API endpoints must define the response format and update this file.

High-risk state-changing endpoints must also account for authentication,
authorization, CSRF, replay protection, and rate limiting where applicable.
