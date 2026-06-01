import { describe, expect, test } from "vitest";

import { hashPassword } from "./auth-credentials";
import {
  registerUserAccount,
  verifyUserCredentials,
  type UserAccountStore,
} from "./user-accounts";

function createMemoryStore(): UserAccountStore {
  const users = new Map<
    string,
    Awaited<ReturnType<UserAccountStore["createEmployee"]>>
  >();

  return {
    async findByEmail(email) {
      return users.get(email) ?? null;
    },
    async createEmployee(input) {
      const user = {
        id: `user-${users.size + 1}`,
        name: input.name,
        email: input.email,
        role: "EMPLOYEE",
        passwordCredential: {
          passwordHash: input.passwordHash,
          passwordSalt: input.passwordSalt,
        },
      };
      users.set(input.email, user);
      return user;
    },
  };
}

describe("user accounts", () => {
  test("registers a normalized employee account", async () => {
    const store = createMemoryStore();

    await expect(
      registerUserAccount(
        {
          name: "  Dana Ops ",
          email: " DANA@Skills.Local ",
          password: "correct horse",
          confirmPassword: "correct horse",
        },
        store,
      ),
    ).resolves.toEqual({
      id: "user-1",
      name: "Dana Ops",
      email: "dana@skills.local",
      role: "employee",
    });
  });

  test("rejects duplicate emails without exposing account state detail", async () => {
    const store = createMemoryStore();
    const input = {
      name: "Dana Ops",
      email: "dana@skills.local",
      password: "correct horse",
      confirmPassword: "correct horse",
    };

    await registerUserAccount(input, store);
    await expect(registerUserAccount(input, store)).rejects.toThrow(
      "Account already exists",
    );
  });

  test("verifies stored credentials into a session-safe user", async () => {
    const secret = await hashPassword("correct horse");
    const store: UserAccountStore = {
      async findByEmail() {
        return {
          id: "admin-1",
          name: "Mira Admin",
          email: "admin@skills.local",
          role: "ADMIN",
          passwordCredential: secret,
        };
      },
      async createEmployee() {
        throw new Error("not used");
      },
    };

    await expect(
      verifyUserCredentials("ADMIN@skills.local", "correct horse", store),
    ).resolves.toEqual({
      id: "admin-1",
      name: "Mira Admin",
      email: "admin@skills.local",
      role: "admin",
    });
    await expect(
      verifyUserCredentials("admin@skills.local", "wrong horse", store),
    ).resolves.toBeNull();
  });
});
