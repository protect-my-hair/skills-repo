import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { validationError } from "./api-errors";

const scryptAsync = promisify(scrypt);
const PASSWORD_MIN_LENGTH = 8;
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface NormalizedRegistrationInput {
  name: string;
  email: string;
  password: string;
}

export interface PasswordCredentialSecret {
  passwordHash: string;
  passwordSalt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegistrationInput(
  value: unknown,
): NormalizedRegistrationInput {
  if (!isRegistrationInput(value)) {
    throw validationError("Name, email, password, and confirmation are required");
  }

  const name = value.name.trim();
  const email = normalizeEmail(value.email);
  const password = value.password;
  const confirmPassword = value.confirmPassword;

  if (!name) {
    throw validationError("Name is required");
  }

  if (!email || !email.includes("@")) {
    throw validationError("A valid email is required");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw validationError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  }

  if (password !== confirmPassword) {
    throw validationError("Passwords do not match");
  }

  return { name, email, password };
}

export async function hashPassword(
  password: string,
): Promise<PasswordCredentialSecret> {
  const passwordSalt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = (await scryptAsync(
    password,
    passwordSalt,
    KEY_LENGTH,
  )) as Buffer;

  return {
    passwordHash: derivedKey.toString("hex"),
    passwordSalt,
  };
}

export async function verifyPassword(
  password: string,
  secret: PasswordCredentialSecret,
): Promise<boolean> {
  const expected = Buffer.from(secret.passwordHash, "hex");
  const actual = (await scryptAsync(
    password,
    secret.passwordSalt,
    KEY_LENGTH,
  )) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function isRegistrationInput(value: unknown): value is RegistrationInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value &&
    "password" in value &&
    "confirmPassword" in value &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.password === "string" &&
    typeof value.confirmPassword === "string"
  );
}
