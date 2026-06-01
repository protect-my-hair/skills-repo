import { describe, expect, test } from "vitest";

import { collectSeedUsers } from "./seed-users";

describe("collectSeedUsers", () => {
  test("preserves internal admin details when the same person appears in seed content", () => {
    const users = collectSeedUsers({
      internalUsers: [
        {
          id: "admin-1",
          name: "Mira Admin",
          email: "admin@skills.local",
          role: "admin",
        },
        {
          id: "employee-1",
          name: "Eli Employee",
          email: "employee@skills.local",
          role: "employee",
        },
      ],
      versionActors: [
        { author: "Mira Admin", publisher: "Eli Employee" },
        { author: "Ada Chen" },
      ],
    });

    expect(users).toContainEqual({
      id: "admin-1",
      name: "Mira Admin",
      email: "admin@skills.local",
      role: "ADMIN",
    });
    expect(users).toContainEqual({
      id: "employee-1",
      name: "Eli Employee",
      email: "employee@skills.local",
      role: "EMPLOYEE",
    });
    expect(users).toContainEqual({
      id: "user-ada-chen",
      name: "Ada Chen",
      email: null,
      role: "EMPLOYEE",
    });
  });
});
