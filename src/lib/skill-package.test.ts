import { describe, expect, test } from "vitest";

import type { Skill } from "./domain";
import {
  createInstallCommand,
  createSkillPackageDescriptor,
  getSkillInstallAvailability,
} from "./skill-package";

const publishedSkill: Skill = {
  id: "rag-helper",
  name: "RAG Helper",
  description: "Retrieval checklist and prompt structure for knowledge agents.",
  category: "Data&AI",
  tags: ["rag", "support"],
  compatibleTools: ["Codex", "Claude"],
  status: "published",
  visibility: "public",
  ownerId: "admin-1",
  ownerName: "Mira Admin",
  maintainingTeam: "AI Platform",
  source: "Controlled Git",
  sourceMetadata: {
    repositoryUrl: "https://git.company.local/skills/rag-helper",
    repositoryName: "rag-helper",
  },
  updatedAt: "2026-05-28T10:00:00.000Z",
  maintainers: ["Ada Chen"],
  installMethod: "Install from internal registry after approval.",
  dependencies: ["vector-index"],
  readme: "## Usage\nUse this Skill when answering support questions.",
  references: [],
  scripts: [],
  currentVersionId: "rag-v2",
  versions: [
    {
      id: "rag-v2",
      version: "1.2.0",
      content: "## Usage\nConfirm intent, retrieve context, and cite sources.",
      changelog: "Added source confidence checks.",
      createdAt: "2026-05-28T10:00:00.000Z",
      author: "Ada Chen",
      publishedAt: "2026-05-28T10:00:00.000Z",
      publisher: "Ada Chen",
      references: [],
      scripts: [],
    },
  ],
};

describe("skill package helpers", () => {
  test("builds a current-version package descriptor with only SKILL.md when no assets exist", () => {
    const descriptor = createSkillPackageDescriptor(publishedSkill);

    expect(descriptor.fileName).toBe("rag-helper-1.2.0.zip");
    expect(Object.keys(descriptor.files)).toEqual(["SKILL.md"]);
    expect(descriptor.files["SKILL.md"]).toContain("name: RAG Helper");
    expect(descriptor.files["SKILL.md"]).toContain(
      "Confirm intent, retrieve context, and cite sources.",
    );
    expect(descriptor.files["README.md"]).toBeUndefined();
    expect(descriptor.files["metadata.json"]).toBeUndefined();
  });

  test("includes optional reference and script files from the current version", () => {
    const descriptor = createSkillPackageDescriptor({
      ...publishedSkill,
      references: [
        {
          path: "stale.md",
          content: "This top-level draft file should not be packaged.",
        },
      ],
      versions: [
        {
          ...publishedSkill.versions[0]!,
          references: [
            {
              path: "usage-guide.md",
              content: "# Usage\nFollow the retrieval checklist.",
            },
            {
              path: "templates/prompt.md",
              content: "Use retrieved context before answering.",
            },
          ],
          scripts: [
            {
              path: "helpers/install.ps1",
              content: "Write-Output 'install'",
            },
          ],
        },
      ],
    });

    expect(Object.keys(descriptor.files).sort()).toEqual([
      "SKILL.md",
      "references/templates/prompt.md",
      "references/usage-guide.md",
      "scripts/helpers/install.ps1",
    ]);
    expect(descriptor.files["references/usage-guide.md"]).toContain(
      "retrieval checklist",
    );
    expect(descriptor.files["scripts/helpers/install.ps1"]).toBe(
      "Write-Output 'install'",
    );
    expect(descriptor.files["references/stale.md"]).toBeUndefined();
  });

  test("marks only published Skills with a current version as installable", () => {
    expect(getSkillInstallAvailability(publishedSkill)).toMatchObject({
      isInstallable: true,
      reason: null,
    });

    expect(
      getSkillInstallAvailability({
        ...publishedSkill,
        status: "deprecated",
      }),
    ).toMatchObject({
      isInstallable: false,
      reason: "not_published",
    });

    expect(
      getSkillInstallAvailability({
        ...publishedSkill,
        currentVersionId: null,
      }),
    ).toMatchObject({
      isInstallable: false,
      reason: "no_current_version",
    });
  });

  test("creates target-tool install commands without embedding secrets", () => {
    const command = createInstallCommand({
      skill: publishedSkill,
      target: "codex",
      origin: "https://skills.example.internal",
    });

    expect(command).toContain(
      "https://skills.example.internal/api/skills/rag-helper/package",
    );
    expect(command).toContain(".codex\\skills\\rag-helper");
    expect(command).not.toContain("git.company.local");
    expect(command).not.toContain("cookie");
    expect(command).not.toContain("token");
  });
});
