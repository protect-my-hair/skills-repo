import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./SkillsConsole.tsx", import.meta.url), "utf8");

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

function getFunctionBody(name: string): string {
  return source.match(new RegExp(`function ${name}[^}]+}`))?.[0] ?? "";
}
