import { describe, expect, test } from "vitest";

import {
  auditActionFromDatabase,
  auditActionToDatabase,
  importJobStatusFromDatabase,
  importJobStatusToDatabase,
  skillVisibilityFromDatabase,
  skillVisibilityToDatabase,
  skillStatusFromDatabase,
  skillStatusToDatabase,
} from "./prisma-mappers";

describe("prisma mappers", () => {
  test("round-trips Skill status values between domain and database enums", () => {
    expect(skillStatusToDatabase("pending_review")).toBe("PENDING_REVIEW");
    expect(skillStatusFromDatabase("PENDING_REVIEW")).toBe("pending_review");
  });

  test("round-trips audit action values between domain and database enums", () => {
    expect(auditActionToDatabase("change_category")).toBe("CHANGE_CATEGORY");
    expect(auditActionFromDatabase("IMPORT_GIT")).toBe("import_git");
    expect(auditActionToDatabase("approve_review")).toBe("APPROVE_REVIEW");
    expect(auditActionFromDatabase("REJECT_REVIEW")).toBe("reject_review");
  });

  test("round-trips import job status values between domain and database enums", () => {
    expect(importJobStatusToDatabase("succeeded")).toBe("SUCCEEDED");
    expect(importJobStatusFromDatabase("FAILED")).toBe("failed");
  });

  test("round-trips Skill visibility values between domain and database enums", () => {
    expect(skillVisibilityToDatabase("personal")).toBe("PERSONAL");
    expect(skillVisibilityFromDatabase("PUBLIC")).toBe("public");
  });
});
