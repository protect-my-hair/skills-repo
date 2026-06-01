import {
  hashPassword,
  normalizeEmail,
  validateRegistrationInput,
  verifyPassword,
  type PasswordCredentialSecret,
} from "./auth-credentials";
import { conflictError } from "./api-errors";
import type { ActorRole } from "./domain";
import { getPrismaClient } from "./prisma";

const EMPLOYEE_DATABASE_ROLE = "EMPLOYEE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ActorRole;
}

interface StoredUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  passwordCredential: PasswordCredentialSecret | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface UserAccountStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  createEmployee(input: CreateEmployeeInput): Promise<StoredUser>;
}

export async function registerUserAccount(
  value: unknown,
  store: UserAccountStore = createPrismaUserAccountStore(),
): Promise<AuthUser> {
  const input = validateRegistrationInput(value);
  const existingUser = await store.findByEmail(input.email);

  if (existingUser) {
    throw conflictError("Account already exists");
  }

  const secret = await hashPassword(input.password);
  const user = await store.createEmployee({
    name: input.name,
    email: input.email,
    passwordHash: secret.passwordHash,
    passwordSalt: secret.passwordSalt,
  });

  return toAuthUser(user);
}

export async function verifyUserCredentials(
  email: string,
  password: string,
  store: UserAccountStore = createPrismaUserAccountStore(),
): Promise<AuthUser | null> {
  const user = await store.findByEmail(normalizeEmail(email));

  if (!user?.passwordCredential) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordCredential);

  return isValidPassword ? toAuthUser(user) : null;
}

export function createPrismaUserAccountStore(): UserAccountStore {
  const prisma = getPrismaClient();

  return {
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
        include: { passwordCredential: true },
      });
    },
    async createEmployee(input) {
      return prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: EMPLOYEE_DATABASE_ROLE,
          passwordCredential: {
            create: {
              passwordHash: input.passwordHash,
              passwordSalt: input.passwordSalt,
            },
          },
        },
        include: { passwordCredential: true },
      });
    },
  };
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name ?? user.email ?? user.id,
    email: user.email ?? "",
    role: user.role === "ADMIN" ? "admin" : "employee",
  };
}
