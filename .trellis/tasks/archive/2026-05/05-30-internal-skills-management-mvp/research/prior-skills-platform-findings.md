# Prior Skills Platform Findings

## Source

This note summarizes previously captured local research for an internal Skills
management platform. It is included here so the implementation phase does not
depend on chat history.

## Takeaways

* The product should be treated as a company-facing web management platform:
  dashboard, marketplace/registry, search, filters, detail pages, admin
  operations, and version governance.
* The closest prior reference was `agent-skills-manager`, but that project is
  closer to a local multi-agent skill manager than an enterprise shared
  registry.
* Useful interaction patterns to preserve:
  * unified dashboard as the first screen
  * searchable/filterable skill list
  * skill detail page with metadata and content preview
  * editor with edit/preview modes
  * bulk actions for admin workflows
  * import/create entry points
* Useful data concepts to preserve:
  * `Skill`
  * frontmatter-style metadata
  * markdown/content body
  * source/scope/tool compatibility
  * enabled/published state
* Enterprise-specific capabilities should be modeled explicitly instead of
  copied from local filesystem operations:
  * `skills`
  * `skill_versions`
  * `skill_releases`
  * `skill_reviews` if approval is added later
  * `audit_logs`
* Do not copy local-only implementation details into the company platform:
  direct filesystem mutation, direct `git clone` from arbitrary URLs,
  unauthenticated APIs, and embedded PTY terminal access.

## MVP Implication

The first MVP should prove the operating model:

* employees can discover, inspect, and track skill versions;
* admins can create/edit/publish/unpublish skills;
* versions and upgrade prompts are visible;
* destructive operations preserve history and write an audit trail.

