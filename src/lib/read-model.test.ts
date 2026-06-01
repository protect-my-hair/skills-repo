import { describe, expect, test } from "vitest";

import type { Actor } from "./domain";
import { buildSkillsReadModel, canReadSkill } from "./read-model";
import { seededStore } from "./seed-data";

const employee: Actor = {
  id: "employee-1",
  name: "Eli Employee",
  role: "employee",
};

const admin: Actor = {
  id: "admin-1",
  name: "Mira Admin",
  role: "admin",
};

describe("skills read model", () => {
  test("returns only employee-visible skills and personal tracking state for employees", () => {
    const model = buildSkillsReadModel(seededStore, employee);

    expect(model.currentUser).toEqual(employee);
    expect(model.capabilities.canManageSkills).toBe(false);
    expect(model.skills.map((skill) => skill.status)).toEqual([
      "published",
      "deprecated",
    ]);
    expect(model.trackedVersions.every((item) => item.userId === employee.id)).toBe(
      true,
    );
    expect(model.auditLogs).toEqual([]);
  });

  test("returns the full governance snapshot for admins", () => {
    const model = buildSkillsReadModel(seededStore, admin);

    expect(model.currentUser).toEqual(admin);
    expect(model.capabilities.canManageSkills).toBe(true);
    expect(model.skills).toHaveLength(seededStore.skills.length);
    expect(model.trackedVersions).toEqual(seededStore.trackedVersions);
    expect(model.auditLogs).toEqual(seededStore.auditLogs);
  });

  test("uses the same visibility rule for direct skill access checks", () => {
    const draftSkill = seededStore.skills.find((skill) => skill.status === "draft");
    const publishedSkill = seededStore.skills.find(
      (skill) => skill.status === "published",
    );

    expect(draftSkill).toBeDefined();
    expect(publishedSkill).toBeDefined();
    expect(canReadSkill(employee, draftSkill!)).toBe(false);
    expect(canReadSkill(employee, publishedSkill!)).toBe(true);
    expect(canReadSkill(admin, draftSkill!)).toBe(true);
  });
});
