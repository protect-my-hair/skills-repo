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
  category: "DevOps",
  tags: ["ops"],
  compatibleTools: ["Codex"],
  status: "draft",
  visibility: "public",
  ownerId: "admin-1",
  ownerName: "Mira Admin",
  maintainingTeam: "Ops AI",
  source: "Manual",
  updatedAt: "2026-05-30T09:00:00.000Z",
  maintainers: ["Mira Admin"],
  installMethod: "Install from internal registry",
  dependencies: [],
  readme: "Draft instructions",
  references: [],
  scripts: [],
  currentVersionId: null,
  versions: [
    {
      id: "version-1",
      version: "0.1.0",
      content: "Draft instructions",
      changelog: "Initial draft",
      createdAt: "2026-05-30T09:00:00.000Z",
      author: "Mira Admin",
      references: [],
      scripts: [],
    },
  ],
};

describe("skill service", () => {
  test("hides restricted admin-governed Skills from employee transitions", () => {
    expect(() =>
      transitionSkill(draftSkill, "published", employee, {
        versionId: "version-1",
        now: "2026-05-30T10:00:00.000Z",
      }),
    ).toThrow("Skill not found");
  });

  test("maps restricted employee transitions to a not-found API error", () => {
    try {
      transitionSkill(draftSkill, "published", employee, {
        versionId: "version-1",
        now: "2026-05-30T10:00:00.000Z",
      });
      throw new Error("Expected transition to fail");
    } catch (error) {
      expect(toErrorPayload(error).status).toBe(404);
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
        category: "DevOps",
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

  test("creates a manual draft with optional references and scripts in the first version snapshot", () => {
    const result = createSkillDraft(
      {
        name: "Package Authoring",
        description: "Guide authors through Skill package structure",
        category: "Documentation",
        tags: ["authoring"],
        compatibleTools: ["Codex"],
        maintainingTeam: "Developer Experience",
        maintainers: ["Mira Admin"],
        installMethod: "Download package and expand it locally",
        dependencies: [],
        readme: "## Usage\nCreate SKILL.md first.",
        references: [
          {
            path: " templates/example.md ",
            content: "# Example",
            description: " Example template ",
          },
        ],
        scripts: [
          {
            path: "helpers/validate.js",
            content: "console.log('ok');",
            language: " javascript ",
          },
        ],
        version: "0.1.0",
        changelog: "Initial package structure",
      },
      admin,
      "2026-06-02T09:00:00.000Z",
    );

    expect(result.skill.references).toEqual([
      {
        path: "templates/example.md",
        content: "# Example",
        description: "Example template",
      },
    ]);
    expect(result.skill.scripts).toEqual([
      {
        path: "helpers/validate.js",
        content: "console.log('ok');",
        language: "javascript",
      },
    ]);
    expect(result.skill.versions[0]?.references).toEqual(result.skill.references);
    expect(result.skill.versions[0]?.scripts).toEqual(result.skill.scripts);
  });

  test("rejects unknown categories and invalid asset paths for new drafts", () => {
    expect(() =>
      createSkillDraft(
        {
          name: "Invalid Category",
          description: "Should fail validation",
          category: "Operations",
          tags: [],
          compatibleTools: ["Codex"],
          maintainingTeam: "SRE",
          maintainers: ["Mira Admin"],
          installMethod: "Install from internal registry",
          dependencies: [],
          readme: "## Usage\nNope.",
          version: "0.1.0",
          changelog: "Initial draft",
        },
        admin,
        "2026-06-02T09:00:00.000Z",
      ),
    ).toThrow("Category must be selected from the system directory");

    expect(() =>
      createSkillDraft(
        {
          name: "Invalid Asset",
          description: "Should fail validation",
          category: "Tools",
          tags: [],
          compatibleTools: ["Codex"],
          maintainingTeam: "SRE",
          maintainers: ["Mira Admin"],
          installMethod: "Install from internal registry",
          dependencies: [],
          readme: "## Usage\nNope.",
          references: [{ path: "../secret.md", content: "nope" }],
          version: "0.1.0",
          changelog: "Initial draft",
        },
        admin,
        "2026-06-02T09:00:00.000Z",
      ),
    ).toThrow("references path must be a safe relative path");
  });

  test("lets employees create personal Skill drafts with ownership metadata", () => {
    const result = createSkillDraft(
      {
        name: "Personal Runbook",
        description: "A personal workflow before public review",
        category: "Tools",
        tags: ["personal"],
        compatibleTools: ["Codex"],
        maintainingTeam: "SRE",
        maintainers: ["Eli Employee"],
        installMethod: "Install from personal workspace after publication",
        dependencies: [],
        readme: "## Usage\nUse this before submitting for review.",
        version: "0.1.0",
        changelog: "Initial personal draft",
      },
      employee,
      "2026-06-01T09:00:00.000Z",
    );

    expect(result.skill).toMatchObject({
      status: "draft",
      visibility: "personal",
      ownerId: "employee-1",
      ownerName: "Eli Employee",
    });
    expect(result.auditLog.action).toBe("create_draft");
  });

  test("lets employees publish, submit, and withdraw their own personal Skills", () => {
    const created = createSkillDraft(
      {
        name: "Personal Release",
        description: "Employee-owned Skill",
        category: "Tools",
        tags: ["personal"],
        compatibleTools: ["Codex"],
        maintainingTeam: "SRE",
        maintainers: ["Eli Employee"],
        installMethod: "Install from personal workspace after publication",
        dependencies: [],
        readme: "Personal instructions",
        version: "0.1.0",
        changelog: "Initial draft",
      },
      employee,
      "2026-06-01T09:00:00.000Z",
    ).skill;

    const published = transitionSkill(created, "published", employee, {
      versionId: "personal-release-0-1-0",
      now: "2026-06-01T09:05:00.000Z",
    }).skill;

    expect(published.status).toBe("published");
    expect(published.visibility).toBe("personal");
    expect(published.currentVersionId).toBe("personal-release-0-1-0");

    const submitted = transitionSkill(published, "pending_review", employee, {
      now: "2026-06-01T09:10:00.000Z",
    }).skill;

    expect(submitted.status).toBe("pending_review");
    expect(submitted.reviewSubmittedAt).toBe("2026-06-01T09:10:00.000Z");

    const withdrawn = transitionSkill(submitted, "deprecated", employee, {
      now: "2026-06-01T09:15:00.000Z",
    }).skill;

    expect(withdrawn.status).toBe("deprecated");
    expect(withdrawn.visibility).toBe("personal");
  });

  test("blocks employees from managing another employee's personal Skills", () => {
    const otherEmployeeSkill: Skill = {
      ...draftSkill,
      id: "other-personal-skill",
      ownerId: "employee-2",
      ownerName: "Other Employee",
      visibility: "personal",
    };

    expect(() =>
      transitionSkill(otherEmployeeSkill, "published", employee, {
        versionId: "version-1",
        now: "2026-06-01T09:30:00.000Z",
      }),
    ).toThrow("Skill not found");
  });

  test("lets admins approve or reject employee review submissions", () => {
    const submitted: Skill = {
      ...draftSkill,
      status: "pending_review",
      ownerId: "employee-1",
      ownerName: "Eli Employee",
      visibility: "personal",
      reviewSubmittedAt: "2026-06-01T09:00:00.000Z",
    };

    const approved = transitionSkill(submitted, "published", admin, {
      versionId: "version-1",
      now: "2026-06-01T10:00:00.000Z",
    });

    expect(approved.skill).toMatchObject({
      status: "published",
      visibility: "public",
      reviewReviewerName: "Mira Admin",
      reviewReviewedAt: "2026-06-01T10:00:00.000Z",
    });
    expect(approved.auditLog.action).toBe("approve_review");

    const rejected = transitionSkill(submitted, "draft", admin, {
      now: "2026-06-01T10:30:00.000Z",
      rejectionReason: "README needs clearer usage guidance",
    });

    expect(rejected.skill).toMatchObject({
      status: "draft",
      visibility: "personal",
      reviewRejectionReason: "README needs clearer usage guidance",
      reviewReviewerName: "Mira Admin",
      reviewReviewedAt: "2026-06-01T10:30:00.000Z",
    });
    expect(rejected.auditLog.action).toBe("reject_review");
  });

  test("imports from a controlled Git source as a pending draft", () => {
    const result = importSkillFromGit(
      {
        repositoryUrl: "https://git.company.local/skills/rag-helper",
        repositoryName: "rag-helper",
        name: "Imported RAG Helper",
        description: "Imported from trusted internal Git",
        category: "Data&AI",
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
        references: [{ path: "usage-guide.md", content: "Updated guide" }],
        scripts: [{ path: "helpers/check.js", content: "console.log('ok');" }],
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
    expect(result.skill.references).toEqual([
      { path: "usage-guide.md", content: "Updated guide" },
    ]);
    expect(result.skill.scripts).toEqual([
      { path: "helpers/check.js", content: "console.log('ok');" },
    ]);
    expect(result.skill.versions.at(-1)?.references).toEqual(result.skill.references);
    expect(result.skill.versions.at(-1)?.scripts).toEqual(result.skill.scripts);
  });

  test("applies bulk archive and category updates to selected Skills", () => {
    const result = applyBulkAction(
      [draftSkill, { ...draftSkill, id: "second-skill", category: "Tools" }],
      {
        type: "change_category",
        skillIds: ["draft-skill", "second-skill"],
        category: "Development",
      },
      admin,
      "2026-05-30T13:00:00.000Z",
    );

    expect(result.skills.map((skill) => skill.category)).toEqual([
      "Development",
      "Development",
    ]);
    expect(result.auditLogs).toHaveLength(2);
  });

  test("rejects bulk category changes outside the system directory", () => {
    expect(() =>
      applyBulkAction(
        [draftSkill],
        {
          type: "change_category",
          skillIds: ["draft-skill"],
          category: "Platform",
        },
        admin,
        "2026-05-30T13:00:00.000Z",
      ),
    ).toThrow("Category must be selected from the system directory");
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
