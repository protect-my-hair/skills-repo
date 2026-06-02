import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");

describe("skill package download route", () => {
  test("keeps package downloads session-aware and permission-safe", () => {
    expect(source).toContain("getActorFromSession()");
    expect(source).toContain("readSkillsSnapshot()");
    expect(source).toContain("canReadSkill(actor, skill)");
    expect(source).toContain('notFoundError("Skill")');
    expect(source).toContain("errorResponse(error)");
  });

  test("returns a zip attachment generated from the installable current version", () => {
    expect(source).toContain("createSkillPackageArchive(skill)");
    expect(source).toContain("application/zip");
    expect(source).toContain("Content-Disposition");
    expect(source).toContain("attachment; filename=");
    expect(source).toContain("await params");
  });
});
