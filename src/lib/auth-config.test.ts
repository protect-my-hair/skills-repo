import { describe, expect, test } from "vitest";

import { isInternalAuthEnabled } from "./auth-config";

describe("auth config", () => {
  test("requires an explicit opt-in for internal credentials in production", () => {
    expect(
      isInternalAuthEnabled(
        { SKILLS_REPO_ENABLE_INTERNAL_AUTH: "true" },
        "production",
      ),
    ).toBe(true);

    expect(isInternalAuthEnabled({}, "production")).toBe(false);
  });

  test("allows local development by default and supports an explicit opt-out", () => {
    expect(isInternalAuthEnabled({}, "development")).toBe(true);
    expect(
      isInternalAuthEnabled(
        { SKILLS_REPO_ENABLE_INTERNAL_AUTH: "false" },
        "development",
      ),
    ).toBe(false);
  });
});
