import { describe, expect, test } from "vitest";

import { getInternalUserByEmail, INTERNAL_AUTH_USERS } from "./internal-users";

describe("internal auth users", () => {
  test("resolves seeded admin and employee users by email", () => {
    expect(getInternalUserByEmail("admin@skills.local")).toMatchObject({
      id: "admin-1",
      name: "Mira Admin",
      role: "admin",
    });
    expect(getInternalUserByEmail("employee@skills.local")).toMatchObject({
      id: "employee-1",
      name: "Eli Employee",
      role: "employee",
    });
  });

  test("does not expose plaintext password fields for seeded users", () => {
    expect(
      INTERNAL_AUTH_USERS.every((user) => !("password" in user)),
    ).toBe(true);
  });

  test("returns null for unknown emails", () => {
    expect(getInternalUserByEmail("unknown@skills.local")).toBeNull();
  });
});
