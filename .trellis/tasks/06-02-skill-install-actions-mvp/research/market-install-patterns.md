# Skill marketplace installation patterns

## Summary

External AI tool marketplaces generally separate "discover/use" from "install/download".
For this product, "track current version" should stay a version-tracking action, while
employee installation needs explicit delivery actions.

## Reference Patterns

### Claude Skills

- Skills can be provided as built-in capabilities, organization-managed Skills, or custom user Skills.
- Custom Skills are commonly distributed as a package uploaded by the user, which makes a downloadable archive a practical internal marketplace pattern.
- Product implication: Skills Repo should be able to export a Skill package for manual import, especially for employees who use Claude as their target tool.

Reference: https://support.claude.com/en/articles/12512180-using-skills-in-claude

### Claude Code / local AI coding tools

- Local coding tools often consume Skills as directories containing a `SKILL.md` entrypoint.
- Installation is typically a filesystem operation: place or expand a Skill folder into the user's tool-specific skills directory.
- Product implication: copying an install command is a realistic MVP because it bridges a web marketplace and local tool configuration without requiring a browser to write to local disk.

Reference: https://docs.claude.com/en/docs/claude-code/skills

### Dify plugin marketplace

- Dify supports plugin installation through marketplace, GitHub, and local package flows.
- This shows a useful enterprise pattern: support both online source-based installs and offline/manual package installs.
- Product implication: Skills Repo can start with local package download and copied commands, then later add Git/source install or organization-managed distribution.

Reference: https://docs.dify.ai/en/plugins/quick-start/install-plugins

### GPT Store / shared online agents

- GPT-style marketplaces prioritize "open/use/share" instead of local download.
- Product implication: online "use now" can be a future mode for hosted internal agents, but it does not solve this task's employee local installation gap.

Reference: https://help.openai.com/en/articles/8554397-creating-a-gpt

### MCP marketplaces and tool connectors

- MCP directories and tool marketplaces commonly provide one-click setup or copyable commands/config snippets.
- Product implication: copyable install commands and tool-specific setup instructions should be treated as first-class install actions, not hidden as free-form install text.

References:
- https://docs.cursor.com/en/tools/mcp
- https://smithery.ai/docs

## Convergence For Skills Repo MVP

Recommended MVP:

1. Keep version tracking separate from installation.
2. Add explicit install actions in the Skill detail panel:
   - Download Skill package
   - Copy install command
   - View install instructions
3. Generate the package from the current published version and metadata already stored in Skills Repo.
4. Generate target-tool commands from a small set of supported destinations, starting with Codex and Claude Code style local directories.
5. Treat true one-click installation, organization push distribution, hosted "use now", bundles, and install telemetry as future work.
