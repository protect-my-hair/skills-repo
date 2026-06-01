import { describe, expect, test } from "vitest";

import {
  hashPassword,
  normalizeEmail,
  validateRegistrationInput,
  verifyPassword,
} from "./auth-credentials";
import { ApiError } from "./api-errors";

describe("auth credentials", () => {
  test("normalizes emails before account lookup", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  test("validates registration input into a normalized shape", () => {
    expect(
      validateRegistrationInput({
        name: "  Dana Ops ",
        email: " DANA@Skills.Local ",
        password: "correct horse",
        confirmPassword: "correct horse",
      }),
    ).toEqual({
      name: "Dana Ops",
      email: "dana@skills.local",
      password: "correct horse",
    });
  });

  test("rejects unsafe registration input with public validation errors", () => {
    expect(() => validateRegistrationInput({})).toThrow(ApiError);
    expect(() =>
      validateRegistrationInput({
        name: "Dana",
        email: "dana@skills.local",
        password: "short",
        confirmPassword: "short",
      }),
    ).toThrow("Password must be at least 8 characters");
    expect(() =>
      validateRegistrationInput({
        name: "Dana",
        email: "dana@skills.local",
        password: "correct horse",
        confirmPassword: "different horse",
      }),
    ).toThrow("Passwords do not match");
  });

  test("hashes and verifies passwords without returning the raw password", async () => {
    const secret = await hashPassword("correct horse");

    expect(secret.passwordHash).not.toContain("correct horse");
    expect(secret.passwordSalt).not.toContain("correct horse");
    await expect(verifyPassword("correct horse", secret)).resolves.toBe(true);
    await expect(verifyPassword("wrong horse", secret)).resolves.toBe(false);
  });
});
