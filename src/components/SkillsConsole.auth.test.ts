import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync(new URL("./SkillsConsole.tsx", import.meta.url), "utf8");

describe("SkillsConsole auth state", () => {
  test("delegates login to the dedicated page and redirects logout to login", () => {
    expect(source).not.toContain("signIn");
    expect(source).not.toContain("INTERNAL_AUTH_USERS");
    expect(source).not.toContain('authStatus === "unauthenticated"');
    expect(source).toContain('signOut({ redirectTo: "/login" })');
  });
});
