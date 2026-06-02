import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./SkillsConsole.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("SkillsConsole pagination wiring", () => {
  test("uses shared pagination helpers before rendering Grid and Table views", () => {
    expect(source).toContain("paginateItems(filteredSkills");
    expect(source).toContain("paginatedSkills.map((skill)");
    expect(source).toContain("skills={paginatedSkills}");
  });

  test("keeps detail selection inside the filtered result set", () => {
    expect(source).toContain(
      "filteredSkills.find((skill) => skill.id === selectedSkillId) ?? filteredSkills[0] ?? null",
    );
  });

  test("resets page without clearing selection on view-mode changes", () => {
    const changeViewModeBody = getFunctionBody("changeViewMode");

    expect(changeViewModeBody).toContain("setCurrentPage(1);");
    expect(changeViewModeBody).not.toContain("setSelectedIds([]);");
  });

  test("resets page and clears admin selection when list scope changes", () => {
    const resetListScopeBody = getFunctionBody("resetListScope");

    expect(resetListScopeBody).toContain("setCurrentPage(1);");
    expect(resetListScopeBody).toContain("setSelectedIds([]);");
    expect(source).toMatch(/onChange=\{\(event\) => \{\s*setQuery\(event\.target\.value\);\s*resetListScope\(\);\s*\}\}/);
    expect(source).toMatch(/onChange=\{\(event\) => \{\s*setCategory\(event\.target\.value\);\s*resetListScope\(\);\s*\}\}/);
    expect(source).toMatch(/onChange=\{\(event\) => \{\s*setVersionState\(event\.target\.value as VersionFilter\);\s*resetListScope\(\);\s*\}\}/);
  });
});

describe("SkillsConsole install actions", () => {
  test("separates version tracking from real install actions in the detail panel", () => {
    expect(source).toContain("install-action-panel");
    expect(source).toContain("tracking-action-group");
    expect(source).toContain("packageDownloadHref");
    expect(source).toContain("UI_COPY.install.downloadPackage");
    expect(source).toContain("UI_COPY.install.copyCommand");
    expect(source).toContain("UI_COPY.install.viewInstructions");
  });

  test("copies a generated install command and shows install instructions locally", () => {
    expect(source).toContain("navigator.clipboard.writeText");
    expect(source).toContain("createInstallCommand");
    expect(source).toContain("showInstallInstructions");
    expect(source).toContain("install-instructions");
    expect(source).toContain("getSkillInstallAvailability(skill)");
  });

  test("keeps the install action controls responsive inside the detail panel", () => {
    expect(globalStyles).toContain(
      "repeat(auto-fit, minmax(min(100%, 172px), 1fr))",
    );
    expect(globalStyles).toContain(".install-actions-grid > *");
    expect(globalStyles).toContain("min-width: 0;");
    expect(source).toContain("install-download-button");
    expect(globalStyles).toContain(".install-download-button svg");
    expect(globalStyles).toContain("width: 20px;");
    expect(globalStyles).toContain("height: 20px;");
  });
});

function getFunctionBody(name: string): string {
  return source.match(new RegExp(`function ${name}[^}]+}`))?.[0] ?? "";
}
