import { describe, expect, test } from "vitest";

import {
  auditActionFromDatabase,
  auditActionToDatabase,
  importJobStatusFromDatabase,
  importJobStatusToDatabase,
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
  });

  test("round-trips import job status values between domain and database enums", () => {
    expect(importJobStatusToDatabase("succeeded")).toBe("SUCCEEDED");
    expect(importJobStatusFromDatabase("FAILED")).toBe("failed");
  });
});
