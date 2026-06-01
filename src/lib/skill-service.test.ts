import { describe, expect, test } from "vitest";

import {
  applyBulkAction,
  createSkillDraft,
  importSkillFromGit,
  trackSkillVersion,
  transitionSkill,
  updateSkillContent,
} from "./skill-service";
import { toErrorPayload } from "./api-errors";
import type { Actor, Skill } from "./domain";

const admin: Actor = {
  id: "admin-1",
  name: "Mira Admin",
  role: "admin",
};

const employee: Actor = {
  id: "employee-1",
  name: "Eli Employee",
  role: "employee",
};

const draftSkill: Skill = {
  id: "draft-skill",
  name: "Draft Skill",
  description: "A useful draft",
  category: "Operations",
  tags: ["ops"],
  compatibleTools: ["Codex"],
  status: "draft",
  maintainingTeam: "Ops AI",
  source: "Manual",
  updatedAt: "2026-05-30T09:00:00.000Z",
  maintainers: ["Mira Admin"],
  installMethod: "Install from internal registry",
  dependencies: [],
  readme: "Draft instructions",
  currentVersionId: null,
  versions: [
    {
      id: "version-1",
      version: "0.1.0",
      content: "Draft instructions",
      changelog: "Initial draft",
      createdAt: "2026-05-30T09:00:00.000Z",
      author: "Mira Admin",
    },
  ],
};

describe("skill service", () => {
  test("blocks admin mutations for employee actors", () => {
    expect(() =>
      transitionSkill(draftSkill, "published", employee, {
        versionId: "version-1",
        now: "2026-05-30T10:00:00.000Z",
      }),
    ).toThrow("Permission denied");
  });

  test("maps admin authorization failures to a forbidden API error", () => {
    try {
      transitionSkill(draftSkill, "published", employee, {
        versionId: "version-1",
        now: "2026-05-30T10:00:00.000Z",
      });
      throw new Error("Expected transition to fail");
    } catch (error) {
      expect(toErrorPayload(error).status).toBe(403);
    }
  });

  test("publishes a draft without deleting version history and writes an audit log", () => {
    const result = transitionSkill(draftSkill, "published", admin, {
      versionId: "version-1",
      now: "2026-05-30T10:00:00.000Z",
    });

    expect(result.skill.status).toBe("published");
    expect(result.skill.currentVersionId).toBe("version-1");
    expect(result.skill.versions).toHaveLength(1);
    expect(result.auditLog).toMatchObject({
      actorId: "admin-1",
      action: "publish",
      targetId: "draft-skill",
    });
  });

  test("creates a manual draft with validated metadata and content", () => {
    const result = createSkillDraft(
      {
        name: "Incident Triage",
        description: "Guide incident responders through first checks",
        category: "Operations",
        tags: ["incident", "sre"],
        compatibleTools: ["Codex"],
        maintainingTeam: "SRE",
        maintainers: ["Mira Admin"],
        installMethod: "Install from internal registry",
        dependencies: ["pager-policy"],
        readme: "## Usage\nFollow the checklist.",
        version: "0.1.0",
        changelog: "Initial draft",
      },
      admin,
      "2026-05-30T11:00:00.000Z",
    );

    expect(result.skill.status).toBe("draft");
    expect(result.skill.source).toBe("Manual");
    expect(result.skill.versions[0]?.content).toContain("Follow the checklist");
  });

  test("imports from a controlled Git source as a pending draft", () => {
    const result = importSkillFromGit(
      {
        repositoryUrl: "https://git.company.local/skills/rag-helper",
        repositoryName: "rag-helper",
        name: "Imported RAG Helper",
        description: "Imported from trusted internal Git",
        category: "Knowledge",
        compatibleTools: ["Codex"],
        maintainingTeam: "AI Platform",
        readme: "Imported README",
        version: "0.1.0",
        changelog: "Imported from controlled Git source",
      },
      admin,
      "2026-05-30T12:00:00.000Z",
    );

    expect(result.skill.status).toBe("draft");
    expect(result.skill.source).toBe("Controlled Git");
    expect(result.skill.sourceMetadata?.repositoryUrl).toContain("git.company.local");
    expect(result.importSource).toMatchObject({
      repositoryUrl: "https://git.company.local/skills/rag-helper",
      repositoryName: "rag-helper",
      trustedHost: "git.company.local",
    });
    expect(result.importJob).toMatchObject({
      actorId: "admin-1",
      skillId: "imported-rag-helper",
      status: "succeeded",
      sourceId: result.importSource.id,
    });
  });

  test("updates published Skill content by creating a new draft version", () => {
    const published = transitionSkill(draftSkill, "published", admin, {
      versionId: "version-1",
      now: "2026-05-30T10:00:00.000Z",
    }).skill;

    const result = updateSkillContent(
      published,
      {
        readme: "Updated instructions",
        version: "0.2.0",
        changelog: "Clarified usage",
      },
      admin,
      "2026-05-30T12:30:00.000Z",
    );

    expect(result.skill.status).toBe("pending_review");
    expect(result.skill.currentVersionId).toBe("version-1");
    expect(result.skill.versions.map((version) => version.version)).toEqual([
      "0.1.0",
      "0.2.0",
    ]);
  });

  test("applies bulk archive and category updates to selected Skills", () => {
    const result = applyBulkAction(
      [draftSkill, { ...draftSkill, id: "second-skill", category: "Support" }],
      {
        type: "change_category",
        skillIds: ["draft-skill", "second-skill"],
        category: "Platform",
      },
      admin,
      "2026-05-30T13:00:00.000Z",
    );

    expect(result.skills.map((skill) => skill.category)).toEqual([
      "Platform",
      "Platform",
    ]);
    expect(result.auditLogs).toHaveLength(2);
  });

  test("tracks a visible version for the current actor and writes an audit log", () => {
    const published = transitionSkill(draftSkill, "published", admin, {
      versionId: "version-1",
      now: "2026-05-30T10:00:00.000Z",
    }).skill;

    const result = trackSkillVersion(
      [published],
      [
        {
          userId: "employee-1",
          skillId: "draft-skill",
          versionId: "old-version",
        },
      ],
      {
        skillId: "draft-skill",
        versionId: "version-1",
      },
      employee,
      "2026-05-30T14:00:00.000Z",
    );

    expect(result.trackedVersions).toEqual([
      {
        userId: "employee-1",
        skillId: "draft-skill",
        versionId: "version-1",
      },
    ]);
    expect(result.auditLog).toMatchObject({
      actorId: "employee-1",
      action: "track_version",
      targetId: "draft-skill",
    });
  });

  test("hides restricted skills when tracking versions", () => {
    expect(() =>
      trackSkillVersion(
        [draftSkill],
        [],
        {
          skillId: "draft-skill",
          versionId: "version-1",
        },
        employee,
        "2026-05-30T14:00:00.000Z",
      ),
    ).toThrow("Skill not found");
  });
});
