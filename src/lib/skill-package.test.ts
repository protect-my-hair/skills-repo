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
  category: "Knowledge",
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
    },
  ],
};

describe("skill package helpers", () => {
  test("builds a current-version package descriptor with SKILL.md", () => {
    const descriptor = createSkillPackageDescriptor(publishedSkill);

    expect(descriptor.fileName).toBe("rag-helper-1.2.0.zip");
    expect(descriptor.files["SKILL.md"]).toContain("name: RAG Helper");
    expect(descriptor.files["SKILL.md"]).toContain(
      "Confirm intent, retrieve context, and cite sources.",
    );
    expect(descriptor.files["README.md"]).toContain("RAG Helper");
    expect(JSON.parse(descriptor.files["metadata.json"] ?? "{}")).toMatchObject({
      id: "rag-helper",
      version: "1.2.0",
      compatibleTools: ["Codex", "Claude"],
    });
    expect(descriptor.files["metadata.json"]).not.toContain("git.company.local");
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
