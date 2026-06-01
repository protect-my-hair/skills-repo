import { describe, expect, test } from "vitest";

import { actorFromSessionUser } from "./session-actor";

describe("session actor mapping", () => {
  test("maps a valid session user into an application actor", () => {
    expect(
      actorFromSessionUser({
        id: "admin-1",
        name: "Mira Admin",
        role: "admin",
      }),
    ).toEqual({
      id: "admin-1",
      name: "Mira Admin",
      role: "admin",
    });
  });

  test("rejects missing or unsupported session users", () => {
    expect(actorFromSessionUser(null)).toBeNull();
    expect(
      actorFromSessionUser({
        id: "user-1",
        name: "No Role",
        role: "owner",
      }),
    ).toBeNull();
  });
});
