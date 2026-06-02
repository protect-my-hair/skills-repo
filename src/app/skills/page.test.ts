import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const skillsPagePath = path.join(process.cwd(), "src/app/skills/page.tsx");

describe("skills page route", () => {
  test("renders the authenticated skills console at /skills", () => {
    const hasSkillsPage = fs.existsSync(skillsPagePath);

    expect(hasSkillsPage).toBe(true);

    const source = hasSkillsPage ? fs.readFileSync(skillsPagePath, "utf8") : "";
    expect(source).toContain('redirect("/login")');
    expect(source).toContain("<SkillsConsole />");
  });
});
