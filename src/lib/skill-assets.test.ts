import { describe, expect, test } from "vitest";

import {
  SYSTEM_SKILL_CATEGORIES,
  normalizeSkillAssetGroups,
  validateSkillCategory,
} from "./skill-assets";

describe("skill asset helpers", () => {
  test("exposes the system category directory used by authoring flows", () => {
    expect(SYSTEM_SKILL_CATEGORIES).toEqual([
      "Tools",
      "Research",
      "DevOps",
      "Development",
      "Testing&Security",
      "Content&Media",
      "Documentation",
      "Databases",
      "Data&AI",
    ]);
    expect(validateSkillCategory(" Development ")).toBe("Development");
  });

  test("normalizes optional references and scripts as safe relative text files", () => {
    const groups = normalizeSkillAssetGroups({
      references: [
        {
          path: " templates/prompt.md ",
          content: "# Prompt\nUse the context.",
          description: " Prompt template ",
        },
      ],
      scripts: [
        {
          path: "helpers/install.ps1",
          content: "Write-Output 'install'",
          language: " powershell ",
        },
      ],
    });

    expect(groups.references).toEqual([
      {
        path: "templates/prompt.md",
        content: "# Prompt\nUse the context.",
        description: "Prompt template",
      },
    ]);
    expect(groups.scripts).toEqual([
      {
        path: "helpers/install.ps1",
        content: "Write-Output 'install'",
        language: "powershell",
      },
    ]);
  });

  test("rejects unsafe, empty, and duplicate asset files", () => {
    expect(() =>
      normalizeSkillAssetGroups({
        references: [{ path: "../secret.md", content: "nope" }],
      }),
    ).toThrow("references path must be a safe relative path");

    expect(() =>
      normalizeSkillAssetGroups({
        references: [{ path: "references/guide.md", content: "nope" }],
      }),
    ).toThrow("references path must not include the package directory");

    expect(() =>
      normalizeSkillAssetGroups({
        scripts: [{ path: "install.ps1", content: "   " }],
      }),
    ).toThrow("scripts content is required");

    expect(() =>
      normalizeSkillAssetGroups({
        scripts: [
          { path: "Install.ps1", content: "one" },
          { path: "install.ps1", content: "two" },
        ],
      }),
    ).toThrow("scripts path must be unique");
  });

  test("rejects categories outside the system directory for new writes", () => {
    expect(() => validateSkillCategory("Operations")).toThrow(
      "Category must be selected from the system directory",
    );
  });
});
