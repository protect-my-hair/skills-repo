# Internal Skills Management Platform MVP

## Goal

Build the first usable version of a company-internal Skills management platform.
The root page must be the actual Skills console, not a marketing landing page.
Employees should be able to browse, search, filter, and inspect Skills. Admins
should be able to create, edit, publish, unpublish, and batch-manage Skills.
The platform should expose Skill versions and make upgrade opportunities clear.

## What I Already Know

* The first-phase user goals are:
  * homepage is a usable Skills management console;
  * employees can browse, search, filter, and view Skills;
  * admins can publish, unpublish, edit, and bulk-manage Skills;
  * users can view Skill versions and see upgrade prompts.
* This repository currently contains Trellis workflow files and project specs,
  but no application frontend source, backend source, package manifest,
  database schema, routes, or tests.
* Frontend and backend specs both say not to infer app conventions from Trellis
  generated files. If this task introduces the first app runtime, the chosen
  conventions should be persisted back into `.trellis/spec/`.
* Prior research suggests borrowing the management-console shape from local
  Skills managers while replacing local filesystem behavior with enterprise
  concepts: status, versions, releases, permissions, and audit logs.

## MVP Breakdown

### Employee Experience

* The root route opens directly into a Skills console.
* Employees can see a searchable, filterable list of published Skills.
* Employees can filter by category, tag, owner/team, compatible tool, status,
  and version state.
* Employees can open a Skill detail page with:
  * name, description, category, tags, owner/team, compatible tools;
  * current published version;
  * content or README preview;
  * version history and changelog;
  * upgrade prompt when their tracked version is behind the latest release.
* Employees can mark a Skill as tracked or installed for MVP version comparison.

### Admin Experience

* Admins can access management controls from the same console.
* Admins can create a new Skill draft with metadata and content.
* Admins can edit Skill metadata and content.
* Admin edits to a published Skill create or update a draft version rather than
  silently mutating released history.
* Admins can publish a draft version as the current release.
* Admins can unpublish a Skill without deleting its history.
* Admins can batch-select Skills and perform supported bulk actions:
  * publish eligible drafts;
  * unpublish published Skills;
  * update category/tags when safe;
  * archive inactive Skills.
* Admin actions write audit log entries with actor, action, target, timestamp,
  and summary.

### Version And Upgrade Experience

* Each Skill can have multiple versions.
* Each version has a version number, changelog, content snapshot, author, and
  timestamp.
* Each Skill has at most one current published release.
* The UI distinguishes draft, published, unpublished, and archived states.
* Upgrade prompts compare an employee's tracked version with the current
  published release.
* Version history remains visible after unpublish/archive unless access is
  explicitly restricted later.

## Requirements

### Functional Requirements

* Provide a root dashboard as the first screen of the product. It should show
  summary cards for total Skills, published Skills, pending review Skills,
  category count, and recently updated Skills.
* Provide a list workspace that supports keyword search, category filtering,
  status filtering, team/source filtering, and Grid/Table view switching.
* Provide Skill cards in Grid view that show name, description, category,
  compatible Agents/tools, current version, status, maintaining team, and last
  updated time.
* Provide Table view with the same core fields optimized for scanning,
  sorting, selection, and admin batch operations.
* Provide a Skill detail page that shows:
  * basic metadata;
  * README or usage instructions;
  * version history;
  * changelog;
  * installation or usage method;
  * dependency notes;
  * maintainers;
  * approval/status information;
  * upgrade prompt when the current user's tracked version is behind the latest
    published release.
* Provide admin create/import flows with two MVP entry points:
  * manually create a Skill draft;
  * import from a controlled Git repository source and convert it into a draft.
* Keep arbitrary remote Git import, background scanning, and untrusted execution
  out of scope; the Git import entry should be constrained to metadata/content
  ingestion that can be validated before publishing.
* Provide a Markdown content editor for admin Skill editing with edit, preview,
  and split modes.
* Provide publish/unpublish/deprecate/archive state transitions with validation.
* Support the status labels `draft`, `pending_review`, `published`,
  `deprecated`, and `archived`.
* Treat `pending_review` as a visible governance state in phase one, while a
  full multi-person approval workflow remains out of scope unless added later.
* Provide admin batch operations for publishing eligible Skills, unpublishing,
  archiving, and changing category.
* Provide a version section that shows current online version, historical
  versions, release time, publisher, change summary, and a way to inspect
  version differences.
* Provide per-user tracked version state so upgrade prompts can be demonstrated
  without requiring a real client installer.
* Provide seed data sufficient to demonstrate employee and admin workflows.
* Validate required fields at system boundaries:
  * Skill name;
  * description;
  * owner/team;
  * category;
  * compatible tools;
  * version number;
  * content body;
  * status;
  * source/import metadata when a Skill is imported from Git.
* Surface user-friendly validation and operation errors.
* Avoid printing or storing secrets in code, logs, seed data, tests, or UI.

### Non-Functional Requirements

* Keep the implementation simple and maintainable for a first app in this repo.
* Prefer native APIs and avoid unnecessary dependencies.
* Keep files small and cohesive; update `.trellis/spec/` if the app introduces
  new conventions that future agents should follow.
* Preserve history for publish/unpublish/archive workflows.
* Treat permissions as a real product boundary even if MVP identity is simple.
* Use clear empty, loading, success, and error states for key workflows.

## Acceptance Criteria

* [ ] Opening the app root shows the Skills console, not a marketing page.
* [ ] An employee can search Skills by keyword.
* [ ] An employee can filter Skills by at least category, tag, compatible tool,
      and version state.
* [ ] An employee can open a Skill and inspect metadata, content preview,
      current version, changelog, and version history.
* [ ] An employee who tracks an older version sees an upgrade prompt.
* [ ] An admin can create a Skill draft.
* [ ] An admin can edit Skill metadata and content.
* [ ] An admin can publish a draft version as the current release.
* [ ] An admin can unpublish a Skill without deleting versions.
* [ ] An admin can select multiple Skills and perform at least one bulk status
      action.
* [ ] Admin-only actions are blocked for non-admin users at the UI and server
      boundary.
* [ ] Admin state changes create audit log records.
* [ ] Relevant tests cover search/filtering, state transitions, version
      comparison, and admin authorization boundaries.
* [ ] The project lint/type-check/build commands for the chosen stack pass.

## Proposed Technical Approach

### Recommended Approach: Full-Stack MVP With Real Domain Model

Build a small full-stack web application with a real domain model for Skills,
versions, releases, tracked user versions, and audit logs. The first
implementation can use local persistence or a lightweight database depending on
the selected stack, but the business model should already match the enterprise
operating model.

Pros:

* Proves the actual management workflow instead of only drawing screens.
* Keeps version and audit behavior honest from the first phase.
* Leaves room to replace MVP identity/persistence with SSO and production
  storage later.

Cons:

* Takes longer than a static prototype.
* Requires choosing and documenting the first app runtime for this repository.

### Alternative A: UI-Only Prototype

Build the console with static/mock data and no real mutation layer.

Pros:

* Fastest path to visual review.
* Useful if the immediate goal is only stakeholder feedback.

Cons:

* Does not truly validate publish/unpublish, admin controls, audit logs, or
  upgrade prompts.
* Risks rework when adding backend behavior.

### Alternative B: Filesystem-Backed Manager

Represent each Skill as files/directories and mutate them directly.

Pros:

* Familiar shape for local Skills tools.
* Easy to inspect generated content.

Cons:

* Weak fit for company-wide governance.
* Harder to enforce permissions, audit, release history, and safe imports.
* Prior research explicitly warns against copying this model as the enterprise
  backend.

## Decision (ADR-lite)

Context: The platform is intended for company-wide access and needs admin
governance, versioning, upgrade prompts, and future enterprise controls.

Decision: Prefer the full-stack MVP with a real domain model. Defer the exact
framework/runtime choice until implementation planning, then fetch current
official docs before coding.

Consequences: The MVP is slightly heavier than a static prototype, but it
validates the operating model and avoids building throwaway workflows.

## Assumptions To Confirm

* MVP identity can be simple but must still enforce employee/admin boundaries.
  Recommended default: seeded/demo users with server-side role checks, leaving
  SSO integration out of scope for phase one.
* MVP persistence can be local or lightweight, as long as the domain model is
  not just in-memory mock data.
* Approval workflow is not required in phase one; publish/unpublish can be an
  admin action without multi-person review.
* Real client installation/sync is not required in phase one; tracking a user's
  current version is enough to demonstrate upgrade prompts.


## Definition Of Done

* Requirements are confirmed by the user.
* Implementation follows the chosen stack's current documentation.
* Relevant frontend and backend specs are read before coding.
* Unit/integration tests cover core domain behavior and key UI workflows.
* Lint, type-check, tests, and build pass for the chosen stack.
* New app conventions are captured in `.trellis/spec/` if introduced.

## Research References

* [`research/prior-skills-platform-findings.md`](research/prior-skills-platform-findings.md)
  summarizes prior local research about reusable Skills manager patterns and
  enterprise-specific changes needed for this MVP.

## Technical Notes

* Repo inventory found only Trellis/project configuration at the root; no app
  source exists yet.
* Relevant spec indexes:
  * `.trellis/spec/frontend/index.md`
  * `.trellis/spec/backend/index.md`
  * `.trellis/spec/guides/index.md`
* When implementation begins, use Context7 for current framework/library/API
  docs before selecting or coding against a stack.
